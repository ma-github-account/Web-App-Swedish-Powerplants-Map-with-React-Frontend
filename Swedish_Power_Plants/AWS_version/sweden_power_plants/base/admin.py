from django.contrib import admin

from .models import Category, Place


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('category_name', 'placeCount')
    search_fields = ('category_name',)

    @admin.display(description='Power plants')
    def placeCount(self, obj):
        return obj.places.count()


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    """Plain ModelAdmin - the GIS map widget went with the PointField.

    Latitude and longitude are ordinary number inputs here; the React
    create/edit form still offers a click-to-place map for anyone who would
    rather pick the spot visually.
    """

    list_display = ('place_name', 'category', 'latitude', 'longitude', 'active')
    list_filter = ('category', 'active')
    search_fields = ('place_name', 'site', 'info')
