from django.urls import path
from base.views import place_views as views

urlpatterns = [
    path('', views.getPlaces, name='places'),
    path('geojson/', views.getPlacesGeoJson, name='places-geojson'),
    path('create/', views.createPlace, name='place-create'),
    path('update/<str:pk>/', views.updatePlace, name='place-update'),
    path('delete/<str:pk>/', views.deletePlace, name='place-delete'),
    path('<str:pk>/', views.getPlaceById, name='place'),
]
