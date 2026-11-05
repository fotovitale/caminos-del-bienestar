from django.contrib import admin
from .models import Categoria, Emprendimiento, ItemCatalogo


class ItemCatalogoInline(admin.TabularInline):
    model = ItemCatalogo
    extra = 2
    fields = ('nombre', 'categoria_item', 'detalle_duracion', 'precio', 'permite_turno', 'disponible')


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ('orden', 'nombre', 'slug', 'descripcion_breve')
    list_display_links = ('nombre',)
    list_editable = ('orden',)
    prepopulated_fields = {'slug': ('nombre',)}
    search_fields = ('nombre', 'descripcion_breve')


@admin.action(description="✅ Aprobar emprendimientos seleccionados (publicar en la web)")
def aprobar_emprendimientos(modeladmin, request, queryset):
    actualizados = queryset.update(aprobado=True)
    modeladmin.message_user(
        request,
        f"Se aprobaron {actualizados} emprendimiento(s) y ya están visibles en el catálogo y mapa público."
    )


@admin.action(description="⏸️ Pausar / Ocultar emprendimientos seleccionados")
def ocultar_emprendimientos(modeladmin, request, queryset):
    actualizados = queryset.update(aprobado=False)
    modeladmin.message_user(
        request,
        f"Se ocultaron {actualizados} emprendimiento(s) de la vista pública."
    )


@admin.register(Emprendimiento)
class EmprendimientoAdmin(admin.ModelAdmin):
    list_display = (
        'nombre',
        'titular',
        'categoria',
        'subcategoria',
        'direccion',
        'telefono_whatsapp',
        'email',
        'aprobado',
        'token_edicion',
    )
    list_filter = ('aprobado', 'categoria')
    search_fields = ('nombre', 'titular', 'subcategoria', 'direccion', 'telefono_whatsapp', 'email')
    list_editable = ('aprobado',)
    readonly_fields = ('token_edicion',)
    inlines = [ItemCatalogoInline]
    actions = [aprobar_emprendimientos, ocultar_emprendimientos]
    fieldsets = (
        ('Información Principal', {
            'fields': ('categoria', 'nombre', 'titular', 'subcategoria', 'descripcion_corta', 'imagen_url', 'aprobado', 'token_edicion')
        }),
        ('Ubicación y Contacto (General San Martín)', {
            'fields': ('direccion', ('latitud', 'longitud'), 'link_google_maps', 'telefono_whatsapp', 'email')
        }),
        ('Solicitud de Ingreso Web', {
            'fields': ('notas_servicios_iniciales',),
            'classes': ('collapse',),
        }),
    )


@admin.register(ItemCatalogo)
class ItemCatalogoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'emprendimiento', 'categoria_item', 'detalle_duracion', 'precio', 'permite_turno', 'disponible')
    list_filter = ('disponible', 'permite_turno', 'emprendimiento__categoria')
    search_fields = ('nombre', 'emprendimiento__nombre')
    list_editable = ('precio', 'permite_turno', 'disponible')
