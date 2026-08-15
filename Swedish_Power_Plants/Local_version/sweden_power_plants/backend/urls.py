from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.decorators.cache import never_cache

urlpatterns = [
    path('admin/', admin.site.urls),
    # never_cache: the SPA shell must never be cached by the browser, otherwise
    # a stale index.html keeps loading old markup after a rebuild.
    path('', never_cache(TemplateView.as_view(template_name='index.html'))),
    path('api/users/', include('base.urls.user_urls')),
    path('api/places/', include('base.urls.place_urls')),
    path('api/categories/', include('base.urls.category_urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
