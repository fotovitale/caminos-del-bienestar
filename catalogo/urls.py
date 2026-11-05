from django.urls import path
from . import views

app_name = 'catalogo'

urlpatterns = [
    path('', views.index, name='index'),
    path('sumar-emprendimiento/', views.sumar_emprendimiento, name='sumar_emprendimiento'),

    # 1. Panel de Gestión General (Backoffice Oculto)
    path('gestion/', views.panel_gestion, name='panel_gestion'),
    path('gestion/login/', views.gestion_login, name='gestion_login'),
    path('gestion/logout/', views.gestion_logout, name='gestion_logout'),

    # Endpoints API para CRUD reactivo del Backoffice General
    path('gestion/api/emprendimiento/guardar/', views.api_guardar_emprendimiento, name='api_guardar_emprendimiento'),
    path('gestion/api/emprendimiento/<int:emp_id>/toggle-aprobado/', views.api_toggle_aprobado, name='api_toggle_aprobado'),
    path('gestion/api/emprendimiento/<int:emp_id>/eliminar/', views.api_eliminar_emprendimiento, name='api_eliminar_emprendimiento'),
    path('gestion/api/item/guardar/', views.api_guardar_item, name='api_guardar_item'),
    path('gestion/api/item/<int:item_id>/eliminar/', views.api_eliminar_item, name='api_eliminar_item'),

    # 2. Portal Individual de Autogestión por Emprendedora (Link Único)
    path('mi-catalogo/<str:token>/', views.portal_emprendedora, name='portal_emprendedora'),
    path('mi-catalogo/<str:token>/api/perfil/', views.api_mi_catalogo_actualizar_perfil, name='api_mi_catalogo_actualizar_perfil'),
    path('mi-catalogo/<str:token>/api/item/guardar/', views.api_mi_catalogo_guardar_item, name='api_mi_catalogo_guardar_item'),
    path('mi-catalogo/<str:token>/api/item/<int:item_id>/eliminar/', views.api_mi_catalogo_eliminar_item, name='api_mi_catalogo_eliminar_item'),
]
