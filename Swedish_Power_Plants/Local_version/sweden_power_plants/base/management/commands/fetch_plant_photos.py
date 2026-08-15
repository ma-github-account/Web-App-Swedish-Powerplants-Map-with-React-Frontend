"""Download a lead photo from Wikipedia/Wikimedia Commons for plants that have none.

Only touches rows whose `image` is empty, so it will not overwrite a photo that
came with the original project or that someone uploaded through the UI. The
licence and author reported by Commons are appended to the plant's info text as
a credit line.

    python manage.py fetch_plant_photos
    python manage.py fetch_plant_photos --force   # re-fetch even if an image is set
"""

import io
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

from django.conf import settings
from django.core.management.base import BaseCommand
from PIL import Image

from base.models import Place

USER_AGENT = 'SwedishPowerplantsMap/1.0 (local training project; contact: local)'

# plant name -> (wikipedia language, article title)
ARTICLES = {
    'Harsprånget': ('en', 'Harsprånget hydroelectric power station'),
    'Messaure': ('sv', 'Messaure kraftverk'),
    'Krångede': ('sv', 'Krångede kraftverk'),
    'Lillgrund': ('en', 'Lillgrund Wind Farm'),
    'Värtaverket': ('sv', 'Värtaverket'),
    'Högdalenverket': ('sv', 'Högdalenverket'),
    'Skurup Solar PV Park': ('en', 'Skurup Solar PV Park'),
}

MAX_WIDTH = 1200
CREDIT_MARKER = 'Photo:'


def _fetch(url, timeout=45, attempts=5):
    """GET with backoff. Wikimedia answers 429 readily when several article,
    licence and file requests arrive back to back."""
    delay = 2.0
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.read()
        except urllib.error.HTTPError as exc:
            if exc.code == 429 and attempt < attempts - 1:
                time.sleep(delay)
                delay *= 2
                continue
            raise
    raise RuntimeError('unreachable')


def _get_json(url):
    return json.loads(_fetch(url).decode('utf-8'))


def _strip_html(value):
    return re.sub(r'<[^>]+>', '', value or '').strip()


class Command(BaseCommand):
    help = 'Download Wikipedia lead photos for power plants that have no image'

    def add_arguments(self, parser):
        parser.add_argument('--force', action='store_true',
                            help='re-fetch even for plants that already have an image')

    def handle(self, *args, **options):
        target_dir = settings.MEDIA_ROOT / 'place_images'
        target_dir.mkdir(parents=True, exist_ok=True)

        fetched, skipped, failed = 0, 0, []

        for plant_name, (lang, title) in ARTICLES.items():
            try:
                place = Place.objects.get(place_name=plant_name)
            except Place.DoesNotExist:
                failed.append(f'{plant_name}: not in the database')
                continue

            if place.image and not options['force']:
                self.stdout.write(f'  skip    {plant_name} (already has {place.image})')
                skipped += 1
                continue

            try:
                image_url, file_title = self._lead_image(lang, title)
                if not image_url:
                    failed.append(f'{plant_name}: article has no lead image')
                    continue

                credit = self._credit(lang, file_title)
                filename = self._download(image_url, target_dir, plant_name)

                place.image = f'place_images/{filename}'
                if credit and CREDIT_MARKER not in place.info:
                    place.info = f'{place.info}\n\n{credit}'.strip()
                place.save()

                self.stdout.write(self.style.SUCCESS(
                    f'  ok      {plant_name} -> {filename}  ({credit or "no credit data"})'
                ))
                fetched += 1

            except Exception as exc:                       # noqa: BLE001 - report and continue
                failed.append(f'{plant_name}: {exc.__class__.__name__}: {exc}')

            # Be a good citizen between plants (3 requests each).
            time.sleep(1.5)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Fetched {fetched}, skipped {skipped}, failed {len(failed)}'))
        for line in failed:
            self.stderr.write(f'  FAILED  {line}')

        remaining = Place.objects.filter(image='').count() + Place.objects.filter(image=None).count()
        self.stdout.write(f'Power plants still without a photo: {remaining}')

    def _lead_image(self, lang, title):
        """Return (image url, 'File:...' title) for an article.

        Prefers the pre-rendered thumbnail over the full-resolution original:
        Wikimedia's 429 response explicitly asks clients to pull thumbnails
        rather than hammering the originals, and MAX_WIDTH is all we keep anyway.
        """
        api = (
            f'https://{lang}.wikipedia.org/w/api.php?action=query&format=json'
            f'&prop=pageimages&piprop=thumbnail|original|name&pithumbsize={MAX_WIDTH}'
            f'&titles={urllib.parse.quote(title)}'
        )
        pages = _get_json(api).get('query', {}).get('pages', {})
        for page in pages.values():
            source = (page.get('thumbnail') or {}).get('source') \
                or (page.get('original') or {}).get('source')
            if source:
                name = page.get('pageimage')
                return source, f'File:{name}' if name else None
        return None, None

    def _credit(self, lang, file_title):
        """Author + licence as reported by Commons, for the credit line."""
        if not file_title:
            return ''
        api = (
            f'https://{lang}.wikipedia.org/w/api.php?action=query&format=json'
            f'&prop=imageinfo&iiprop=extmetadata&titles={urllib.parse.quote(file_title)}'
        )
        try:
            pages = _get_json(api).get('query', {}).get('pages', {})
        except Exception:                                   # noqa: BLE001
            return ''

        for page in pages.values():
            meta = (page.get('imageinfo') or [{}])[0].get('extmetadata', {})
            artist = _strip_html(meta.get('Artist', {}).get('value', ''))
            licence = _strip_html(meta.get('LicenseShortName', {}).get('value', ''))
            parts = [p for p in (artist, licence) if p]
            if parts:
                return f'{CREDIT_MARKER} {" / ".join(parts)} via Wikimedia Commons.'
        return f'{CREDIT_MARKER} Wikimedia Commons.'

    def _download(self, url, target_dir, plant_name):
        raw = _fetch(url, timeout=90)

        image = Image.open(io.BytesIO(raw))
        if image.mode not in ('RGB', 'L'):
            image = image.convert('RGB')
        if image.width > MAX_WIDTH:
            height = round(image.height * MAX_WIDTH / image.width)
            image = image.resize((MAX_WIDTH, height), Image.LANCZOS)

        slug = re.sub(r'[^A-Za-z0-9]+', '_', plant_name).strip('_') or 'plant'
        filename = f'{slug}_wiki.jpg'
        image.save(target_dir / filename, 'JPEG', quality=85, optimize=True)
        return filename
