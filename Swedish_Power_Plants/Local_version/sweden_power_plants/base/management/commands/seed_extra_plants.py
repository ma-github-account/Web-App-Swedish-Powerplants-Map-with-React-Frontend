"""Add power plants and plant types beyond the original project's 13 rows.

Everything here was taken from the plant's own Wikipedia article or operator
page; the coordinates are the ones those sources publish, not estimates. Safe
to re-run - rows are matched on name and updated in place.

    python manage.py seed_extra_plants
"""

from django.core.management.base import BaseCommand

from base.models import Category, Place

# Three types the original project did not cover. Sweden runs a lot of biomass
# CHP and waste-to-energy, and solar has grown quickly since 2022.
NEW_CATEGORIES = [
    ('Biomass CHP Power Plant', 'category_icons/biomass.svg'),
    ('Waste-to-Energy Plant', 'category_icons/waste_to_energy.svg'),
    ('Solar Power Plant', 'category_icons/solar.svg'),
]

# (name, type, lat, lng, site, coordinates, info, image)
NEW_PLANTS = [
    (
        'Harsprånget', 'Hydroelectric Power Plant', 66.88444, 19.82417,
        'Location: Lule River, Jokkmokk Municipality',
        'Coordinates: 66°53′04″N 19°49′27″E',
        "Info: Sweden's largest hydroelectric power station, on the Lule River about "
        '30 km north of Jokkmokk. Commissioned in 1951 and operated by Vattenfall; '
        'installed capacity is around 977 MW after later upgrades.',
        '',
    ),
    (
        'Messaure', 'Hydroelectric Power Plant', 66.68333, 20.33333,
        'Location: Lule River, Jokkmokk Municipality',
        'Coordinates: 66°41′00″N 20°20′00″E',
        'Info: Hydroelectric station on the Greater Lule River with an installed '
        'capacity of 446 MW. Built between 1957 and 1962 and inaugurated by Prime '
        'Minister Tage Erlander in 1963.',
        '',
    ),
    (
        'Krångede', 'Hydroelectric Power Plant', 63.14663, 16.07033,
        'Location: Indalsälven, near Hammarstrand, Jämtland',
        'Coordinates: 63°08′48″N 16°04′13″E',
        'Info: Hydroelectric station on the Indalsälven river in eastern Jämtland, '
        'commissioned in 1936 for the newly formed Krångede AB. Installed capacity '
        'is 248.4 MW.',
        '',
    ),
    (
        'Lillgrund', 'Wind Farm Power Plant', 55.52, 12.78,
        'Location: Öresund, south of the Öresund Bridge',
        'Coordinates: 55°31′12″N 12°46′48″E',
        "Info: Sweden's first large offshore wind farm, commissioned in 2008 and "
        'operated by Vattenfall. 48 turbines totalling 110.4 MW, standing in 4-8 m '
        'of water roughly 7 km off the Skåne coast.',
        '',
    ),
    (
        'Markbygden', 'Wind Farm Power Plant', 65.417, 20.667,
        'Location: West of Piteå, Norrbotten County',
        'Coordinates: 65°25′01″N 20°40′01″E',
        'Info: The largest onshore wind farm in Europe by combined capacity. Around '
        '498 turbines totalling roughly 2,000 MW were operational as of 2022, with '
        'the full build-out planned at up to 4,000 MW.',
        'place_images/Markbygden.jpg',
    ),
    (
        'Värtaverket', 'Biomass CHP Power Plant', 59.3525694, 18.105694,
        'Location: Hjorthagen, Stockholm',
        'Coordinates: 59°21′09″N 18°06′20″E',
        'Info: Combined heat and power plant in central Stockholm, owned by Stockholm '
        'Exergi and first opened in 1903. Its KVV8 biomass block, inaugurated in 2016, '
        'delivers 130 MW of electricity and 345 MW of heat from forestry residues and '
        'is one of the largest urban biomass CHP units in the world.',
        '',
    ),
    (
        'Högdalenverket', 'Waste-to-Energy Plant', 59.2565194, 18.0613833,
        'Location: Högdalen, Stockholm',
        'Coordinates: 59°15′23″N 18°03′41″E',
        'Info: Waste-fired combined heat and power plant run by Stockholm Exergi, in '
        'operation since 1970 and supplying district heating since 1979. It burns '
        'household waste, industrial waste and wood chips for 504 MW thermal, of '
        'which 118 MW is electricity and 386 MW district heating.',
        '',
    ),
    (
        'Skurup Solar PV Park', 'Solar Power Plant', 55.486833, 13.4435,
        'Location: Näsbyholm Castle estate, Skurup, Skåne County',
        'Coordinates: 55°29′13″N 13°26′37″E',
        'Info: Photovoltaic power station commissioned in 2022 on the grounds of '
        'Näsbyholm Castle. Around 35,000 modules give 18 MW of capacity and roughly '
        '19 GWh a year, making it the largest solar park in Sweden at the time it '
        'was built.',
        '',
    ),
]


class Command(BaseCommand):
    help = 'Add extra Swedish power plants and the three additional plant types'

    def handle(self, *args, **options):
        for name, icon in NEW_CATEGORIES:
            category, created = Category.objects.update_or_create(
                category_name=name,
                defaults={'icon': icon},
            )
            self.stdout.write(f"  {'created' if created else 'updated'} type: {name}")

        for (name, type_name, lat, lng, site, coords, info, image) in NEW_PLANTS:
            try:
                category = Category.objects.get(category_name=type_name)
            except Category.DoesNotExist:
                self.stderr.write(f'  skipped {name}: type "{type_name}" not found')
                continue

            defaults = {
                'category': category,
                'site': site,
                'coordinates': coords,
                'info': info,
                'active': True,
                'latitude': float(lat),
                'longitude': float(lng),
            }
            # Only set the image when we actually have one, so re-running does not
            # wipe a photo someone uploaded through the UI afterwards.
            if image:
                defaults['image'] = image

            _, created = Place.objects.update_or_create(
                place_name=name,
                defaults=defaults,
            )
            self.stdout.write(f"  {'created' if created else 'updated'} plant: {name}")

        self.stdout.write(self.style.SUCCESS(
            f'Done - {Category.objects.count()} types, {Place.objects.count()} power plants.'
        ))
