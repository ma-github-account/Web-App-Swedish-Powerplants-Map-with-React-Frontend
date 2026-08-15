from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from base.models import Category
from base.serializers import CategorySerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def getCategories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def getCategoryById(request, pk):
    try:
        category = Category.objects.get(_id=pk)
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = CategorySerializer(category, many=False)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def createCategory(request):
    data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
    data.pop('icon', None)

    serializer = CategorySerializer(data=data)
    if serializer.is_valid():
        category = serializer.save()
        if 'icon' in request.FILES:
            category.icon = request.FILES['icon']
            category.save()
        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def updateCategory(request, pk):
    try:
        category = Category.objects.get(_id=pk)
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)
    data.pop('icon', None)

    serializer = CategorySerializer(category, data=data, partial=True)
    if serializer.is_valid():
        category = serializer.save()
        if 'icon' in request.FILES:
            category.icon = request.FILES['icon']
            category.save()
        return Response(CategorySerializer(category).data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def deleteCategory(request, pk):
    try:
        category = Category.objects.get(_id=pk)
    except Category.DoesNotExist:
        return Response({'detail': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    # Place has on_delete=CASCADE, so warn instead of silently wiping the map.
    place_count = category.places.count()
    if place_count:
        return Response(
            {'detail': f'Cannot delete "{category.category_name}" - {place_count} place(s) still use it.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    category.delete()
    return Response({'detail': 'Category deleted successfully'})
