"""Push the local media tree into whatever storage backend is configured.

Uploads through Django's `default_storage` rather than `aws s3 cp`, so every
object lands on exactly the key the app will later ask for: the value stored in
`Place.image` / `Category.icon` is the storage key, and `.url` is built from it.
Copying by hand invites an off-by-one-prefix mistake that only shows up as
broken images.

    python manage.py upload_media_to_s3
    python manage.py upload_media_to_s3 --dry-run
    python manage.py upload_media_to_s3 --force     # re-upload existing keys
"""

from pathlib import Path

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand

from base.models import Category, Place


class Command(BaseCommand):
    help = 'Upload local media files to the configured storage backend (S3)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true')
        parser.add_argument('--force', action='store_true',
                            help='upload even if the key already exists')

    def handle(self, *args, **options):
        backend = settings.STORAGES['default']['BACKEND']
        self.stdout.write(f'Storage backend: {backend}')
        if 's3' not in backend.lower():
            self.stdout.write(self.style.WARNING(
                'Not an S3 backend - set AWS_STORAGE_BUCKET_NAME first. Nothing to do.'
            ))
            return

        media_root = Path(settings.MEDIA_ROOT)
        if not media_root.is_dir():
            self.stderr.write(f'MEDIA_ROOT does not exist: {media_root}')
            return

        # Only ship files the database actually references, plus the fallbacks
        # the UI falls back to. Anything else in the folder is local clutter.
        referenced = set()
        referenced.update(p.image.name for p in Place.objects.exclude(image='') if p.image)
        referenced.update(c.icon.name for c in Category.objects.exclude(icon='') if c.icon)
        for fallback in ('place_images/no_image_available.jpg', 'place_images/Sweden.png'):
            if (media_root / fallback).is_file():
                referenced.add(fallback)

        uploaded, skipped, missing = 0, 0, []

        for key in sorted(referenced):
            local = media_root / key
            if not local.is_file():
                missing.append(key)
                continue

            if not options['force'] and default_storage.exists(key):
                self.stdout.write(f'  exists  {key}')
                skipped += 1
                continue

            if options['dry_run']:
                self.stdout.write(f'  would upload  {key}  ({local.stat().st_size:,} bytes)')
                uploaded += 1
                continue

            with local.open('rb') as fh:
                # save() would suffix a random string if the key were taken;
                # delete-then-save keeps the key stable, which matters because
                # the key is what the database already points at.
                if default_storage.exists(key):
                    default_storage.delete(key)
                default_storage.save(key, ContentFile(fh.read()))

            self.stdout.write(self.style.SUCCESS(f'  uploaded {key}'))
            uploaded += 1

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f'{"Would upload" if options["dry_run"] else "Uploaded"} {uploaded}, '
            f'skipped {skipped}, missing locally {len(missing)}'
        ))
        for key in missing:
            self.stderr.write(f'  MISSING locally: {key}')
