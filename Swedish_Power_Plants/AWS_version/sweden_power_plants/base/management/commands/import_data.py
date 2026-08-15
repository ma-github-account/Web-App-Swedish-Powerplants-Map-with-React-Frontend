"""Load the JSON written by the GeoDjango-era `export_data` into a fresh database.

Restores categories, power plants and users. Timestamps are re-applied with a
queryset `update()` after each row is created, because `auto_now_add` and
`auto_now` overwrite anything passed to `create()` - without that the API's
createdAt/updatedAt would all shift to the import date.

Safe to re-run: rows are matched on their natural key (category name, plant
name, username) and updated in place.

    python manage.py import_data
    python manage.py import_data --input data_export.json
"""

import json

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.dateparse import parse_datetime

from base.models import Category, Place

DEFAULT_INPUT = 'data_export.json'


def _dt(value):
    return parse_datetime(value) if value else None


class Command(BaseCommand):
    help = 'Import categories, places and users from a JSON export'

    def add_arguments(self, parser):
        parser.add_argument('--input', default=DEFAULT_INPUT)

    @transaction.atomic
    def handle(self, *args, **options):
        with open(options['input'], encoding='utf-8') as fh:
            payload = json.load(fh)

        for row in payload['categories']:
            category, _ = Category.objects.update_or_create(
                category_name=row['category_name'],
                defaults={
                    'description': row.get('description', ''),
                    'icon': row.get('icon', ''),
                },
            )
            Category.objects.filter(pk=category.pk).update(
                createdAt=_dt(row.get('createdAt')) or category.createdAt,
                updatedAt=_dt(row.get('updatedAt')) or category.updatedAt,
            )
        self.stdout.write(f"  categories: {len(payload['categories'])}")

        missing = []
        for row in payload['places']:
            try:
                category = Category.objects.get(category_name=row['category_name'])
            except Category.DoesNotExist:
                missing.append(row['place_name'])
                continue

            place, _ = Place.objects.update_or_create(
                place_name=row['place_name'],
                defaults={
                    'category': category,
                    'site': row.get('site', ''),
                    'coordinates': row.get('coordinates', ''),
                    'info': row.get('info', ''),
                    'image': row.get('image', ''),
                    'active': row.get('active', True),
                    'latitude': row['latitude'],
                    'longitude': row['longitude'],
                },
            )
            Place.objects.filter(pk=place.pk).update(
                createdAt=_dt(row.get('createdAt')) or place.createdAt,
                updatedAt=_dt(row.get('updatedAt')) or place.updatedAt,
            )
        self.stdout.write(f"  places: {len(payload['places']) - len(missing)}")

        for row in payload.get('users', []):
            user, _ = User.objects.update_or_create(
                username=row['username'],
                defaults={
                    'email': row.get('email', ''),
                    'first_name': row.get('first_name', ''),
                    'last_name': row.get('last_name', ''),
                    'password': row['password'],       # already hashed
                    'is_staff': row.get('is_staff', False),
                    'is_superuser': row.get('is_superuser', False),
                    'is_active': row.get('is_active', True),
                },
            )
            joined = _dt(row.get('date_joined'))
            if joined:
                User.objects.filter(pk=user.pk).update(date_joined=joined)
        self.stdout.write(f"  users: {len(payload.get('users', []))}")

        for name in missing:
            self.stderr.write(f'  SKIPPED {name}: its category is not in the export')

        self.stdout.write(self.style.SUCCESS(
            f'Done - {Category.objects.count()} types, {Place.objects.count()} power plants, '
            f'{User.objects.count()} users.'
        ))
