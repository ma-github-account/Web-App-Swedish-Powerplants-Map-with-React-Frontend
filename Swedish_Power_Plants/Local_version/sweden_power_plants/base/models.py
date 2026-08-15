from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Category(models.Model):
    """A power plant type - Fossil Fuel, Nuclear, Hydroelectric, Wind Farm.

    The GeoDjango original hardcoded one marker icon per category *id* in
    main.js, which is why its README insists the four types be created in an
    exact order. Here the icon is a field on the row, so types can be added,
    renamed or reordered freely.
    """

    _id = models.AutoField(primary_key=True, editable=False)
    category_name = models.CharField('Power plant type', max_length=50, unique=True)
    description = models.TextField(blank=True, help_text='What this kind of power plant is, and its role in Sweden')
    icon = models.ImageField(upload_to='category_icons/', blank=True)
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Power plant type'
        verbose_name_plural = 'Power plant types'
        ordering = ['category_name']

    def __str__(self):
        return self.category_name


class Place(models.Model):
    """A single Swedish power plant belonging to one Category.

    Location is two plain floats rather than a PostGIS PointField. The app runs
    no spatial queries - the coordinates are only ever read back out to place a
    Leaflet marker - so GeoDjango bought nothing here while forcing GEOS/GDAL
    native libraries onto every machine that runs the project. The REST API is
    unchanged: it always exposed flat `latitude`/`longitude` numbers.
    """

    _id = models.AutoField(primary_key=True, editable=False)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='places')
    place_name = models.CharField(max_length=100)
    site = models.CharField(max_length=254, blank=True)
    coordinates = models.CharField(max_length=254, blank=True)
    info = models.TextField(blank=True)
    image = models.ImageField(upload_to='place_images/', blank=True, null=True)
    active = models.BooleanField(default=True)
    latitude = models.FloatField(
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    createdAt = models.DateTimeField(auto_now_add=True)
    updatedAt = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Power plant'
        verbose_name_plural = 'Power plants'
        ordering = ['place_name']

    def __str__(self):
        return self.place_name
