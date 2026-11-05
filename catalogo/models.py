import uuid
from django.db import models
from django.utils.text import slugify


def generar_token_edicion():
    return uuid.uuid4().hex[:16]


class Categoria(models.Model):
    nombre = models.CharField("Nombre de Categoría", max_length=100)
    slug = models.SlugField("Slug", max_length=120, unique=True)
    icono_svg = models.TextField(
        "Código de Ícono / SVG o Nombre Lucide",
        help_text="Nombre de ícono Lucide (ej. scissors, sparkles, flower-2, wine, bed-double, shopping-bag) o código SVG."
    )
    descripcion_breve = models.CharField("Descripción Breve", max_length=255)
    orden = models.PositiveIntegerField("Orden de visualización", default=1)

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['orden', 'nombre']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.nombre)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.nombre


class Emprendimiento(models.Model):
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.CASCADE,
        related_name='emprendimientos',
        verbose_name="Categoría"
    )
    nombre = models.CharField("Nombre del Emprendimiento", max_length=150)
    titular = models.CharField(
        "Nombre del Profesional / Titular",
        max_length=120,
        blank=True,
        default="",
        help_text="Ej: Romina"
    )
    subcategoria = models.CharField(
        "Subcategoría / Especialidad",
        max_length=120,
        help_text="Ej: Peluquería ySalud Capilar, Cosmetología, Psicología, Coaching, Bodega, Hotel"
    )
    descripcion_corta = models.TextField("Descripción Corta", blank=True)
    direccion = models.CharField("Dirección en Gral. San Martín", max_length=250)
    latitud = models.FloatField("Latitud", null=True, blank=True, default=-33.081)
    longitud = models.FloatField("Longitud", null=True, blank=True, default=-68.468)
    link_google_maps = models.URLField("Link de Google Maps", max_length=500, blank=True)
    telefono_whatsapp = models.CharField(
        "Teléfono / WhatsApp",
        max_length=40,
        help_text="Ej: +54 9 263 455-1234"
    )
    email = models.EmailField(
        "Correo Electrónico",
        blank=True,
        default="",
        help_text="Correo para contacto y recepción de turnos"
    )
    imagen_url = models.URLField(
        "Imagen / Logo (URL opcional)",
        max_length=500,
        blank=True,
        help_text="URL de foto representativa o logo del emprendimiento"
    )
    notas_servicios_iniciales = models.TextField(
        "Notas de Servicios y Precios Iniciales (Formulario Público)",
        blank=True,
        help_text="Servicios y precios declarados al postularse desde la web pública."
    )
    token_edicion = models.CharField(
        "Token Único de Autogestión",
        max_length=40,
        unique=True,
        default=generar_token_edicion,
        editable=False
    )
    aprobado = models.BooleanField(
        "Aprobado (Visible en la web)",
        default=True,
        help_text="Si está tildado, el emprendimiento aparece en el catálogo y mapa público."
    )
    fecha_creacion = models.DateTimeField("Fecha de Registro", auto_now_add=True)

    class Meta:
        verbose_name = "Emprendimiento"
        verbose_name_plural = "Emprendimientos"
        ordering = ['categoria__orden', 'nombre']

    def save(self, *args, **kwargs):
        if not self.token_edicion:
            self.token_edicion = generar_token_edicion()
        super().save(*args, **kwargs)

    def whatsapp_clean(self):
        """Devuelve solo dígitos para armar el enlace wa.me."""
        digits = ''.join(ch for ch in self.telefono_whatsapp if ch.isdigit())
        if not digits.startswith('54'):
            digits = '549' + digits
        return digits

    def get_maps_url(self):
        if self.link_google_maps:
            return self.link_google_maps
        if self.latitud and self.longitud:
            return f"https://www.google.com/maps/search/?api=1&query={self.latitud},{self.longitud}"
        return f"https://www.google.com/maps/search/?api=1&query={self.direccion},+General+San+Martin,+Mendoza"

    def get_autogestion_path(self):
        return f"/mi-catalogo/{self.token_edicion}/"

    def __str__(self):
        estado = "✓ Aprobado" if self.aprobado else "⏳ Pendiente"
        titular_str = f" · {self.titular}" if self.titular else ""
        return f"{self.nombre}{titular_str} ({self.subcategoria}) [{estado}]"


class ItemCatalogo(models.Model):
    emprendimiento = models.ForeignKey(
        Emprendimiento,
        on_delete=models.CASCADE,
        related_name='items_catalogo',
        verbose_name="Emprendimiento"
    )
    nombre = models.CharField("Servicio o Producto", max_length=150)
    categoria_item = models.CharField(
        "Rubro del Ítem",
        max_length=80,
        blank=True,
        default="Servicios",
        help_text="Ej: Tratamientos, Cortes, Colorimetría, Productos, Estadías"
    )
    detalle_duracion = models.CharField(
        "Detalle / Duración",
        max_length=200,
        blank=True,
        help_text="Ej: 60 min · Incluye diagnóstico capilar / Botella 750ml"
    )
    precio = models.DecimalField("Precio ($ ARS)", max_digits=12, decimal_places=2)
    permite_turno = models.BooleanField(
        "Permite Reservar Turno",
        default=True,
        help_text="Si está activo muestra 'Sacar Turno'; de lo contrario 'Consultar / Comprar'."
    )
    disponible = models.BooleanField("Disponible / En Stock", default=True)

    class Meta:
        verbose_name = "Servicio / Producto del Catálogo"
        verbose_name_plural = "Servicios y Productos del Catálogo"
        ordering = ['id']

    def __str__(self):
        return f"{self.nombre} - ${self.precio:,.0f}"
