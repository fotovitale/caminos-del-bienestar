import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from catalogo.models import Categoria, Emprendimiento, ItemCatalogo


def run_seed():
    print("🌱 Inicializando Multi-Catálogo 'Caminos del Bienestar' (General San Martín, Mendoza)...")

    # Limpiar datos previos
    ItemCatalogo.objects.all().delete()
    Emprendimiento.objects.all().delete()
    Categoria.objects.all().delete()

    # 1. Crear las 6 Categorías Principales Oficiales
    categorias_info = [
        {
            'nombre': 'Peluquería / Cabello',
            'slug': 'peluqueria-cabello',
            'icono_svg': 'scissors',
            'descripcion_breve': 'Estilismo profesional, nutrición capilar y colorimetría en San Martín.',
            'orden': 1,
        },
        {
            'nombre': 'Cosmetología',
            'slug': 'cosmetologia',
            'icono_svg': 'sparkles',
            'descripcion_breve': 'Cuidado facial, dermoestética y rituales botánicos para tu piel.',
            'orden': 2,
        },
        {
            'nombre': 'Crecimiento Personal',
            'slug': 'crecimiento-personal',
            'icono_svg': 'flower-2',
            'descripcion_breve': 'Psicología, coaching ontológico, mindfulness y bienestar integral.',
            'orden': 3,
        },
        {
            'nombre': 'Vinos',
            'slug': 'vinos',
            'icono_svg': 'wine',
            'descripcion_breve': 'Bodegas locales, degustaciones del Bonarda y enoturismo del Este.',
            'orden': 4,
        },
        {
            'nombre': 'Alojamiento',
            'slug': 'alojamiento',
            'icono_svg': 'bed-double',
            'descripcion_breve': 'Hoteles, posadas entre viñedos y estadías de descanso reparador.',
            'orden': 5,
        },
        {
            'nombre': 'Otros Productos',
            'slug': 'otros-productos',
            'icono_svg': 'shopping-bag',
            'descripcion_breve': 'Cosmética natural, aromaterapia, infusiones y productos regionales.',
            'orden': 6,
        },
    ]

    cat_map = {}
    for c in categorias_info:
        cat_obj = Categoria.objects.create(**c)
        cat_map[c['slug']] = cat_obj
        print(f"  ✓ Categoría creada ({cat_obj.orden}/6): {cat_obj.nombre}")

    # 2. Crear Emprendimientos con Direcciones y Coordenadas reales de Gral. San Martín, Mendoza
    # Formato de items: (nombre, categoria_item, detalle_duracion, precio, permite_turno)
    emprendimientos_info = [
        # --- CATEGORÍA 1: PELUQUERÍA / CABELLO (Caso Real Obligatorio: RA Peluquerías - Romina) ---
        {
            'categoria': cat_map['peluqueria-cabello'],
            'nombre': 'RA Peluquerías',
            'titular': 'Romina',
            'subcategoria': 'Estilismo Profesional & Salud Capilar',
            'descripcion_corta': 'Espacio liderado por Romina en General San Martín, especializado en nutrición capilar profunda, recuperación de fibra, corte y colorimetría personalizada.',
            'direccion': 'Av. Alem 245, General San Martín, Mendoza',
            'latitud': -33.0804,
            'longitud': -68.4692,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0804,-68.4692',
            'telefono_whatsapp': '+54 9 263 452-1890',
            'email': 'contacto@rapeluquerias.com.ar',
            'token_edicion': 'ra-peluquerias-romina-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Nutrición Capilar', 'Tratamientos Capilares', '50 min · Hidratación intensiva, sellado cuticular y brillo espejo', 25000, True),
                ('Corte Femenino & Diagnóstico Capilar', 'Cortes y Peinados', '60 min · Incluye lavado relajante con masaje craneal y brushing', 16500, True),
                ('Balayage & Iluminación Personalizada', 'Colorimetría', '150 min · Técnica cuidada + ampolla post-color', 56000, True),
                ('Botox Capilar Reestructurante', 'Tratamientos Capilares', '75 min · Reparación profunda anti-frizz libre de formol', 32000, True),
                ('Brushing & Modelado Social', 'Cortes y Peinados', '40 min · Finalización con protector térmico y sérum de argán', 13500, True),
            ],
        },
        {
            'categoria': cat_map['peluqueria-cabello'],
            'nombre': 'Brisa Estudio Capilar',
            'titular': 'Camila Morales',
            'subcategoria': 'Peluquería Integral & Colorimetría Orgánica',
            'descripcion_corta': 'Estudio luminoso en el corazón de San Martín dedicado a realzar la belleza natural del cabello con técnicas saludables.',
            'direccion': 'Calle 9 de Julio 418, General San Martín, Mendoza',
            'latitud': -33.0823,
            'longitud': -68.4664,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0823,-68.4664',
            'telefono_whatsapp': '+54 9 263 461-3402',
            'email': 'camila@brisaestudio.com.ar',
            'token_edicion': 'brisa-estudio-camila-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Corte de Diseño + Baño de Brillo', 'Cortes', '60 min · Asesoramiento visagista personalizado', 16000, True),
                ('Alisado Orgánico Libre de Formol', 'Tratamientos', '120 min · Reducción de frizz y suavidad duradera', 46000, True),
                ('Terapia Detox de Cuero Cabelludo', 'Tratamientos', '45 min · Exfoliación suave con activos herbales y ozono', 19500, True),
                ('Peinado Social & Ondas al Agua', 'Peinados', '50 min · Ideal para eventos y degustaciones', 18000, True),
            ],
        },

        # --- CATEGORÍA 2: COSMETOLOGÍA ---
        {
            'categoria': cat_map['cosmetologia'],
            'nombre': 'Piel de Olivo · Gabinete Cosmetológico',
            'titular': 'Lic. Lucía Fernández',
            'subcategoria': 'Cosmetología & Dermoestética Natural',
            'descripcion_corta': 'Tratamientos faciales antioxidantes basados en polifenoles de vid, agua termal y aparatología no invasiva.',
            'direccion': 'Calle Albuera 182, General San Martín, Mendoza',
            'latitud': -33.0789,
            'longitud': -68.4718,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0789,-68.4718',
            'telefono_whatsapp': '+54 9 263 448-7712',
            'email': 'lucia@pieldeolivo.com.ar',
            'token_edicion': 'piel-de-olivo-lucia-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Higiene Facial Profunda + Punta de Diamante', 'Tratamientos Faciales', '60 min · Extracción suave, máscara descongestiva y FPS', 22500, True),
                ('Ritual Facial Vinoterapia Antioxidante', 'Rituales Botánicos', '70 min · Con resveratrol del Este mendocino y masaje Kobido', 26000, True),
                ('Dermaplaning & Shock de Ácido Hialurónico', 'Tratamientos Faciales', '60 min · Piel luminosa y renovación celular inmediata', 25000, True),
                ('Bruma Tónica de Agua de Rosas y Malbec (125ml)', 'Productos de Gabinete', 'Envase con atomizador para rutina diaria en casa', 11500, False),
            ],
        },
        {
            'categoria': cat_map['cosmetologia'],
            'nombre': 'Lumiere · Cosmiatría & Bienestar Cutáneo',
            'titular': 'Paula Giménez',
            'subcategoria': 'Cosmiatría Clínica y Masaje Facial',
            'descripcion_corta': 'Cuidado integral de la piel con enfoque relajante, drenaje linfático facial y protocolos para pieles sensibles.',
            'direccion': 'Av. Boulogne Sur Mer 610, General San Martín, Mendoza',
            'latitud': -33.0765,
            'longitud': -68.4680,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0765,-68.4680',
            'telefono_whatsapp': '+54 9 263 473-9021',
            'email': 'paula@lumierecosmiatria.com.ar',
            'token_edicion': 'lumiere-paula-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Peeling Botánico Renovador + Máscara Hydrojelly', 'Cosmiatría', '60 min · Unifica el tono y atenúa líneas finas', 24000, True),
                ('Drenaje Linfático Facial & Gua Sha de Cuarzo Verde', 'Masaje Facial', '50 min · Desinflamante, relajante y tonificante', 19800, True),
                ('Tratamiento Específico Rosácea / Piel Sensible', 'Cosmiatría', '55 min · Activos calmantes de caléndula, avena y niacinamida', 22000, True),
                ('Sérum Concentrado Vitamina C + Niacinamida (30ml)', 'Productos', 'Fórmula hipoalergénica de gabinete', 16500, False),
            ],
        },

        # --- CATEGORÍA 3: CRECIMIENTO PERSONAL ---
        {
            'categoria': cat_map['crecimiento-personal'],
            'nombre': 'Espacio Calma · Psicología Integrativa',
            'titular': 'Lic. Sofía Lucero',
            'subcategoria': 'Psicología Clínica & Mindfulness',
            'descripcion_corta': 'Psicóloga clínica (Mat. 4182). Acompañamiento terapéutico en gestión de ansiedad, autoconocimiento y regulación emocional.',
            'direccion': 'Calle Las Heras 315, General San Martín, Mendoza',
            'latitud': -33.0835,
            'longitud': -68.4705,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0835,-68.4705',
            'telefono_whatsapp': '+54 9 263 439-5501',
            'email': 'sofialucero.psi@espaciocalma.com.ar',
            'token_edicion': 'espacio-calma-sofia-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Sesión Individual de Psicoterapia Integrativa', 'Sesiones Terapéuticas', '50 min · Modalidad presencial en consultorio u online', 24000, True),
                ('Entrevista Inicial de Orientación y Diagnóstico', 'Sesiones Terapéuticas', '60 min · Diseño de plan terapéutico personalizado', 22000, True),
                ('Taller Grupal de Mindfulness y Reducción de Estrés', 'Talleres', 'Encuentro de 2 hs · Incluye material de prácticas guiadas', 16000, True),
                ('Programa de 4 Sesiones: Gestión Emocional Consciente', 'Programas', 'Pack mensual con seguimiento continuo', 86000, True),
            ],
        },
        {
            'categoria': cat_map['crecimiento-personal'],
            'nombre': 'Senda Interior · Coaching & Propósito',
            'titular': 'Lic. Natalia Sosa',
            'subcategoria': 'Coaching Ontológico & Liderazgo Femenino',
            'descripcion_corta': 'Coach Ontológica Profesional certificada. Procesos de transformación personal, propósito de vida y mentoría para emprendedoras.',
            'direccion': 'Calle 25 de Mayo 530, General San Martín, Mendoza',
            'latitud': -33.0848,
            'longitud': -68.4649,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0848,-68.4649',
            'telefono_whatsapp': '+54 9 263 458-6634',
            'email': 'natalia@sendainterior.com.ar',
            'token_edicion': 'senda-interior-natalia-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Sesión 1 a 1 de Coaching Ontológico y Propósito', 'Sesiones de Coaching', '60 min · Claridad de objetivos y plan de acción', 23000, True),
                ('Mentoría para Emprendedoras del Circuito', 'Mentorías', '75 min · Organización consciente, comunicación y liderazgo', 28000, True),
                ('Círculo de Bienestar y Diseño de Metas', 'Encuentros Grupales', 'Encuentro mensual en jardín · Incluye coffee break saludable', 15000, True),
                ('Bitácora Impresa "Mi Camino de Bienestar" (Agenda anual)', 'Editorial', 'Ejercicios de gratitud y planificación consciente', 18500, False),
            ],
        },

        # --- CATEGORÍA 4: VINOS ---
        {
            'categoria': cat_map['vinos'],
            'nombre': 'Bodega Familia Del Carril · Tierra del Bonarda',
            'titular': 'Ing. Agr. Elena Del Carril',
            'subcategoria': 'Bodega Boutique & Enoturismo Consciente',
            'descripcion_corta': 'Tradición vitivinícola en General San Martín. Cuna del Bonarda Argentino con caminatas entre viñedos y degustaciones al atardecer.',
            'direccion': 'Carril Costa Canal Montecaseros s/n, General San Martín, Mendoza',
            'latitud': -33.0695,
            'longitud': -68.4562,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0695,-68.4562',
            'telefono_whatsapp': '+54 9 263 442-8100',
            'email': 'turismo@bodegadelcarril.com.ar',
            'token_edicion': 'bodega-del-carril-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Visita Guiada + Degustación "Alma de Bonarda" (3 pasos)', 'Experiencias Enoturísticas', '75 min · Recorrido por viñedos históricos, cava y maridaje regional', 19000, True),
                ('Experiencia Sunset & Yoga entre Viñedos + Copa', 'Experiencias Enoturísticas', '120 min · Sábados a la tarde con picada de productores locales', 27500, True),
                ('Vino Bonarda Reserva "Caminos del Este" (Botella 750ml)', 'Vinos en Stock', 'Añada 2023 · 12 meses en roble francés', 14800, False),
                ('Estuche Regalo Dúo Bonarda + Tempranillo Orgánico', 'Vinos en Stock', 'Presentación artesanal ideal para obsequio turístico', 26500, False),
            ],
        },
        {
            'categoria': cat_map['vinos'],
            'nombre': 'Finca & Cava Los Álamos del Este',
            'titular': 'Clara & Martín Orozco',
            'subcategoria': 'Vinos Orgánicos & Degustación Sensorial',
            'descripcion_corta': 'Pequeña cava familiar en San Martín dedicada a vinos de baja intervención, espumantes naturales y gastronomía de estación.',
            'direccion': 'Carril Chimbas 1450, General San Martín, Mendoza',
            'latitud': -33.0890,
            'longitud': -68.4785,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0890,-68.4785',
            'telefono_whatsapp': '+54 9 263 466-1940',
            'email': 'reservas@cavalosalamos.com.ar',
            'token_edicion': 'finca-los-alamos-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Cata Sensorial a Ciegas + Tabla de Quesos y Olivas', 'Degustaciones', '90 min · Descubrí los aromas del terroir de San Martín', 22000, True),
                ('Almuerzo Armónico de 3 Pasos en los Jardines', 'Gastronomía', 'Incluye maridaje con línea orgánica de la finca', 39000, True),
                ('Espumante Extra Brut Rosé de Bonarda (Botella 750ml)', 'Vinos en Stock', 'Método Charmat lungo · Producción limitada', 16200, False),
            ],
        },

        # --- CATEGORÍA 5: ALOJAMIENTO ---
        {
            'categoria': cat_map['alojamiento'],
            'nombre': 'Posada del Olivar & Spa Botánico',
            'titular': 'Verónica Mansilla',
            'subcategoria': 'Boutique Hotel & Descanso en Naturaleza',
            'descripcion_corta': 'Alojamiento rodeado de olivos centenarios y jardines serenos a minutos del centro de General San Martín. Piscina climatizada y desayuno casero.',
            'direccion': 'Ruta Provincial 50 Km 1034, General San Martín, Mendoza',
            'latitud': -33.0742,
            'longitud': -68.4810,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0742,-68.4810',
            'telefono_whatsapp': '+54 9 263 444-9200',
            'email': 'reservas@posadadelolivar.com.ar',
            'token_edicion': 'posada-del-olivar-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Estadía Habitación Doble Deluxe Vista al Olivar (por noche)', 'Alojamiento', 'Incluye desayuno saludable regional, acceso a piscina y jardines', 78000, True),
                ('Day Spa "Pausa en el Camino" (Sin alojamiento)', 'Day Spa', 'Jornada de 10 a 18 hs · Masaje descontracturante + infusiones + piscina', 45000, True),
                ('Pack Escapada Bienestar (2 Noches para 2 personas)', 'Paquetes', 'Incluye 2 noches + degustación en bodega del circuito + late check-out', 148000, True),
            ],
        },
        {
            'categoria': cat_map['alojamiento'],
            'nombre': 'Hotel San Pedro del Este · Confort Urbano',
            'titular': 'Familia Pereyra',
            'subcategoria': 'Hotel Céntrico & Estadías Turísticas',
            'descripcion_corta': 'Ubicación privilegiada en el corazón comercial e histórico de General San Martín. Habitaciones luminosas, cochera privada y terraza verde.',
            'direccion': 'Av. Pirovano 190, General San Martín, Mendoza',
            'latitud': -33.0818,
            'longitud': -68.4632,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0818,-68.4632',
            'telefono_whatsapp': '+54 9 263 442-3050',
            'email': 'recepcion@hotelsanpedroeste.com.ar',
            'token_edicion': 'hotel-san-pedro-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Habitación Doble Superior Matrimonial o Twin (por noche)', 'Habitaciones', 'Desayuno buffet mendocino, Wi-Fi de alta velocidad y cochera', 64000, True),
                ('Habitación Single Confort (por noche)', 'Habitaciones', 'Ideal para profesionales o viajeros del circuito del Este', 49000, True),
                ('Departamento Familiar (hasta 4 personas, por noche)', 'Habitaciones', 'Dos ambientes equipados con vista al Paseo de la Patria', 89000, True),
            ],
        },

        # --- CATEGORÍA 6: OTROS PRODUCTOS ---
        {
            'categoria': cat_map['otros-productos'],
            'nombre': 'Alquimia del Este · Botánica & Aromas',
            'titular': 'Julieta Barrionuevo',
            'subcategoria': 'Cosmética Natural, Velas de Soja & Aromaterapia',
            'descripcion_corta': 'Elaboración artesanal en General San Martín de aceites esenciales puros, velas botánicas de cera de soja, jabones saponificados e infusiones.',
            'direccion': 'Calle Belgrano 284, General San Martín, Mendoza',
            'latitud': -33.0809,
            'longitud': -68.4655,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0809,-68.4655',
            'telefono_whatsapp': '+54 9 263 459-4410',
            'email': 'hola@alquimiadeleste.com.ar',
            'token_edicion': 'alquimia-del-este-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Vela Botánica de Cera de Soja · Lavanda & Verbena (250g)', 'Aromaterapia', 'Pabilo de algodón ecológico · Duración 45 horas', 14500, False),
                ('Kit Ritual de Calma (Óleo Roll-on + Bruma de Almohada + Vela)', 'Cajas de Regalo', 'Presentación en caja kraft con flores secas de San Martín', 28900, False),
                ('Aceite Corporal Nutritivo de Almendras y Pepita de Uva (200ml)', 'Cosmética Natural', 'Prensado en frío · Ideal para masajes y piel seca', 17200, False),
                ('Asesoramiento Olfativo & Armado de Blend Personalizado', 'Experiencias en Showroom', '30 min en showroom con cita previa', 12000, True),
            ],
        },
        {
            'categoria': cat_map['otros-productos'],
            'nombre': 'Raíces de San Martín · Almacén Saludable',
            'titular': 'Mónica & Valeria Castro',
            'subcategoria': 'Infusiones en Hebras, Mieles & Sabores del Este',
            'descripcion_corta': 'Productos regionales saludables del departamento de San Martín: blends de té en hebras con hierbas serranas, aceite de oliva virgen extra y frutos secos.',
            'direccion': 'Av. España 142, General San Martín, Mendoza',
            'latitud': -33.0830,
            'longitud': -68.4678,
            'link_google_maps': 'https://www.google.com/maps/search/?api=1&query=-33.0830,-68.4678',
            'telefono_whatsapp': '+54 9 263 463-7120',
            'email': 'raices@almacensanmartin.com.ar',
            'token_edicion': 'raices-san-martin-2026',
            'imagen_url': 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
            'items': [
                ('Blend en Hebras "Tardes de Otoño en el Este" (Lata 100g)', 'Infusiones', 'Té verde, cascarilla de rosa mosqueta, cedrón y pétalos', 11800, False),
                ('Miel Pura de Azahar y Flora Mendocina (Frasco 500g)', 'Regionales', 'Sin TACC · Cosecha agroecológica local', 9500, False),
                ('Canasta Bienestar Gourmet (Oliva Extra Virgen + Miel + Blend)', 'Regalería', 'Selección de productores de General San Martín', 31000, False),
            ],
        },
    ]

    for emp_data in emprendimientos_info:
        items = emp_data.pop('items')
        emp_obj = Emprendimiento.objects.create(aprobado=True, **emp_data)
        for nombre_item, cat_item, detalle, precio, permite_turno in items:
            ItemCatalogo.objects.create(
                emprendimiento=emp_obj,
                nombre=nombre_item,
                categoria_item=cat_item,
                detalle_duracion=detalle,
                precio=precio,
                permite_turno=permite_turno,
                disponible=True,
            )
        print(f"  ✓ Emprendimiento cargado: {emp_obj.nombre} ({emp_obj.titular}) -> Link: /mi-catalogo/{emp_obj.token_edicion}/")

    # Superusuario por defecto (asegura siempre usuario 'admin' / clave 'bienestar2026')
    User = get_user_model()
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={'email': 'admin@sanmartin.gob.ar', 'is_staff': True, 'is_superuser': True, 'is_active': True}
    )
    admin_user.email = 'admin@sanmartin.gob.ar'
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.is_active = True
    admin_user.set_password('bienestar2026')
    admin_user.save()
    print("  ✓ Superusuario configurado: usuario 'admin' / contraseña 'bienestar2026'")

    print("\n✨ Seed completado con éxito: 6 categorías y 12 emprendimientos locales activos.")


if __name__ == '__main__':
    run_seed()
