from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Category, Place


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField(read_only=True)
    _id = serializers.SerializerMethodField(read_only=True)
    isAdmin = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'name', 'isAdmin']

    def get__id(self, obj):
        return obj.id

    def get_isAdmin(self, obj):
        return obj.is_staff

    def get_name(self, obj):
        name = obj.first_name
        if name == '':
            name = obj.email
        return name


class UserSerializerWithToken(UserSerializer):
    token = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', '_id', 'username', 'email', 'name', 'isAdmin', 'token']

    def get_token(self, obj):
        token = RefreshToken.for_user(obj)
        return str(token.access_token)


class CategorySerializer(serializers.ModelSerializer):
    icon = serializers.SerializerMethodField(read_only=True)
    placeCount = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Category
        fields = ['_id', 'category_name', 'description', 'icon', 'placeCount',
                  'createdAt', 'updatedAt']

    def get_icon(self, obj):
        return obj.icon.url if obj.icon else ''

    def get_placeCount(self, obj):
        return obj.places.filter(active=True).count()


class PlaceSerializer(serializers.ModelSerializer):
    """Flat representation used by the map, the table and the CRUD forms.

    `latitude`/`longitude` are ordinary model fields now, so ModelSerializer
    handles create and update on its own - no coordinate marshalling left.
    """

    category_name = serializers.CharField(source='category.category_name', read_only=True)
    category_icon = serializers.SerializerMethodField(read_only=True)
    image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Place
        fields = [
            '_id', 'category', 'category_name', 'category_icon',
            'place_name', 'site', 'coordinates', 'info',
            'image', 'active', 'latitude', 'longitude',
            'createdAt', 'updatedAt',
        ]

    def get_category_icon(self, obj):
        return obj.category.icon.url if obj.category and obj.category.icon else ''

    def get_image(self, obj):
        return obj.image.url if obj.image else ''

    def validate_latitude(self, value):
        if not -90 <= value <= 90:
            raise serializers.ValidationError('Latitude must be between -90 and 90.')
        return value

    def validate_longitude(self, value):
        if not -180 <= value <= 180:
            raise serializers.ValidationError('Longitude must be between -180 and 180.')
        return value


class PlaceGeoSerializer(serializers.ModelSerializer):
    """One GeoJSON Feature per power plant.

    Hand-rolled rather than using rest_framework_gis' GeoFeatureModelSerializer:
    the geometry is two floats, so building the Feature is a few lines and it
    drops the last dependency that needed GDAL. The wire format is unchanged, so
    QGIS and any other GeoJSON client keep working.
    """

    category_name = serializers.CharField(source='category.category_name', read_only=True)
    image = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Place
        fields = [
            '_id', 'category_name', 'place_name', 'site',
            'coordinates', 'info', 'image', 'createdAt', 'updatedAt',
        ]

    def get_image(self, obj):
        return obj.image.url if obj.image else ''

    def to_representation(self, instance):
        properties = super().to_representation(instance)
        # GeoFeatureModelSerializer hoisted the primary key to a top-level "id"
        # and left it out of properties; keep that shape so existing clients see
        # no change at all.
        properties.pop('_id', None)
        return {
            'id': instance.pk,
            'type': 'Feature',
            'geometry': {
                'type': 'Point',
                'coordinates': [instance.longitude, instance.latitude],
            },
            'properties': properties,
        }


def as_feature_collection(places, context=None):
    """Wrap a queryset of places in a GeoJSON FeatureCollection."""
    serializer = PlaceGeoSerializer(places, many=True, context=context or {})
    return {'type': 'FeatureCollection', 'features': serializer.data}
