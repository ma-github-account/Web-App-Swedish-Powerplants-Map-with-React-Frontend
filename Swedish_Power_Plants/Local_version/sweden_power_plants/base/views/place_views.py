from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from base.models import Place
from base.serializers import PlaceSerializer, as_feature_collection


@api_view(['GET'])
@permission_classes([AllowAny])
def getPlaces(request):
    """Every active place, flat JSON. Public - the map is a public page."""
    places = Place.objects.filter(active=True).select_related('category')
    serializer = PlaceSerializer(places, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getPlacesGeoJson(request):
    """Same rows as getPlaces, but as a GeoJSON FeatureCollection.

    Optional ?category=<name> filter replaces the four fixed /placescatN/
    endpoints the GeoDjango original had to hardcode.
    """
    places = Place.objects.filter(active=True).select_related('category')

    category = request.query_params.get('category')
    if category:
        places = places.filter(category__category_name__iexact=category)

    return Response(as_feature_collection(places))


@api_view(['GET'])
@permission_classes([AllowAny])
def getPlaceById(request, pk):
    try:
        place = Place.objects.select_related('category').get(_id=pk)
    except Place.DoesNotExist:
        return Response({'detail': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = PlaceSerializer(place, many=False)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createPlace(request):
    # request.data may be multipart (an image came along), so normalise to a
    # plain dict and handle the file separately - the same split the employees
    # project uses, and it keeps ImageField out of serializer validation.
    data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
    data.pop('image', None)

    serializer = PlaceSerializer(data=data)
    if serializer.is_valid():
        place = serializer.save()
        if 'image' in request.FILES:
            place.image = request.FILES['image']
            place.save()
        return Response(PlaceSerializer(place).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updatePlace(request, pk):
    try:
        place = Place.objects.get(_id=pk)
    except Place.DoesNotExist:
        return Response({'detail': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
    data.pop('image', None)

    serializer = PlaceSerializer(place, data=data, partial=True)
    if serializer.is_valid():
        place = serializer.save()
        if 'image' in request.FILES:
            place.image = request.FILES['image']
            place.save()
        return Response(PlaceSerializer(place).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deletePlace(request, pk):
    try:
        place = Place.objects.get(_id=pk)
    except Place.DoesNotExist:
        return Response({'detail': 'Place not found'}, status=status.HTTP_404_NOT_FOUND)

    place.delete()
    return Response({'detail': 'Place deleted successfully'})
