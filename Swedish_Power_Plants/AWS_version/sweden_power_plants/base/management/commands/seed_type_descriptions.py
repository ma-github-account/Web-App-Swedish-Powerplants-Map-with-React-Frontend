"""Fill in the description shown when a power plant type is unfolded.

Each entry says what the technology is and what part it plays in the Swedish
grid, drawn from the Wikipedia articles on the technology and on energy in
Sweden. Safe to re-run.

    python manage.py seed_type_descriptions
"""

from django.core.management.base import BaseCommand

from base.models import Category

DESCRIPTIONS = {
    'Fossil Fuel Power Plant': (
        'Burns coal, oil or natural gas to raise steam that drives a turbine and '
        'generator. Fossil fuels play only a marginal part in Swedish electricity '
        'generation - a few per cent at most - and the plants that remain are mostly '
        'held for reserve and peak demand during cold spells rather than run '
        'continuously. Karlshamn, for example, is an oil-fired station kept as part '
        'of the national strategic reserve.'
    ),
    'Nuclear Power Plant': (
        'Uses controlled nuclear fission, in Sweden always in light-water reactors, to '
        'heat water into steam that drives a turbine. Nuclear power supplies roughly a '
        'third of Swedish electricity from six reactors at three sites: Forsmark, '
        'Oskarshamn and Ringhals. A fourth station, Barsebäck near Malmö, was shut '
        'down in 1999 and 2005 and is being decommissioned.'
    ),
    'Hydroelectric Power Plant': (
        'Converts the energy of falling or flowing water into electricity by directing '
        'it through turbines, usually at a dam. Hydropower is the backbone of the '
        'Swedish grid, supplying around 40 per cent of the country\'s electricity, most '
        'of it from the large northern rivers - the Lule, Ume, Ångerman and Indals. '
        'Because output can be raised or lowered within minutes, it also balances the '
        'growing amount of wind power on the system.'
    ),
    'Wind Farm Power Plant': (
        'A group of wind turbines that convert the kinetic energy of moving air into '
        'electricity. Wind has grown faster than any other source in Sweden and now '
        'provides roughly a fifth of its electricity. Most capacity is onshore in the '
        'windy north and along the coasts: Markbygden near Piteå is the largest onshore '
        'wind farm in Europe, while Lillgrund in the Öresund was the first large '
        'offshore farm in the country.'
    ),
    'Biomass CHP Power Plant': (
        'A combined heat and power station burning biomass - wood chips, bark, branches '
        'and other residues from forestry - so that one fuel yields both electricity and '
        'district heating, pushing total efficiency far above a power-only plant. '
        'Sweden\'s large forestry sector makes biomass the dominant fuel in its district '
        'heating networks. The KVV8 block at Värtaverket in central Stockholm is among '
        'the largest urban biomass CHP units in the world.'
    ),
    'Waste-to-Energy Plant': (
        'Incinerates household and industrial waste and recovers the heat as district '
        'heating and electricity. Sweden adopted the technology early and now sends very '
        'little household waste to landfill - so little that its plants import waste from '
        'other countries to stay supplied. Flue gases are cleaned extensively and the '
        'residual ash is processed to recover metals.'
    ),
    'Solar Power Plant': (
        'Photovoltaic modules that convert sunlight directly into electricity, with no '
        'moving parts and no fuel. Solar is the newest and smallest part of the Swedish '
        'mix but by far the fastest growing, with several hundred megawatts added every '
        'year since the early 2020s. Output is strongly seasonal at these latitudes: very '
        'long summer days offset winter months with only a few hours of weak daylight.'
    ),
}


class Command(BaseCommand):
    help = 'Write the descriptive text shown for each power plant type'

    def handle(self, *args, **options):
        updated, unknown = 0, []

        for name, text in DESCRIPTIONS.items():
            rows = Category.objects.filter(category_name=name).update(description=text)
            if rows:
                self.stdout.write(f'  set description: {name}')
                updated += rows
            else:
                unknown.append(name)

        missing = Category.objects.filter(description='').values_list('category_name', flat=True)

        self.stdout.write(self.style.SUCCESS(f'Done - {updated} type(s) described.'))
        for name in unknown:
            self.stderr.write(f'  no such type in the database: {name}')
        for name in missing:
            self.stderr.write(f'  still without a description: {name}')
