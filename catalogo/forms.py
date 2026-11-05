from django import forms
from .models import Emprendimiento


class SumateEmprendimientoForm(forms.ModelForm):
    class Meta:
        model = Emprendimiento
        fields = [
            'nombre',
            'titular',
            'categoria',
            'subcategoria',
            'direccion',
            'telefono_whatsapp',
            'email',
            'descripcion_corta',
            'notas_servicios_iniciales',
        ]
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: RA Peluquerías / Espacio Aura',
                'required': True,
            }),
            'titular': forms.TextInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: Romina / Lic. Mariana Gómez',
                'required': True,
            }),
            'categoria': forms.Select(attrs={
                'class': 'form-select custom-input',
                'required': True,
            }),
            'subcategoria': forms.TextInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: Peluquería y Salud Capilar, Psicología, Bodega...',
                'required': True,
            }),
            'direccion': forms.TextInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: Av. Boulogne Sur Mer 450, Gral. San Martín',
                'required': True,
            }),
            'telefono_whatsapp': forms.TextInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: +54 9 263 455-8899',
                'required': True,
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control custom-input',
                'placeholder': 'Ej: contacto@miemprendimiento.com.ar',
            }),
            'descripcion_corta': forms.Textarea(attrs={
                'class': 'form-control custom-input',
                'rows': 2,
                'placeholder': 'Contanos brevemente la propuesta de valor de tu espacio o servicio...',
            }),
            'notas_servicios_iniciales': forms.Textarea(attrs={
                'class': 'form-control custom-input',
                'rows': 3,
                'placeholder': 'Detallá tus principales servicios/productos y precios orientativos (ej: Nutrición Capilar $25.000, Corte $15.000)...',
                'required': True,
            }),
        }
        labels = {
            'nombre': 'Nombre del Emprendimiento',
            'titular': 'Nombre de la Profesional o Titular',
            'categoria': 'Categoría del Circuito',
            'subcategoria': 'Especialidad / Subcategoría',
            'direccion': 'Dirección Física en General San Martín',
            'telefono_whatsapp': 'Teléfono / WhatsApp de Contacto',
            'email': 'Correo Electrónico',
            'descripcion_corta': 'Presentación Breve',
            'notas_servicios_iniciales': 'Catálogo de Servicios / Stock y Precios Iniciales',
        }
