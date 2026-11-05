from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

admin.site.site_header = "Caminos del Bienestar · General San Martín"
admin.site.site_title = "Admin Caminos del Bienestar"
admin.site.index_title = "Gestión del Circuito de Emprendimientos, Precios y Mapa"

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('catalogo.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
