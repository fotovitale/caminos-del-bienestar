import json
from decimal import Decimal, InvalidOperation
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.http import require_POST
from .models import Categoria, Emprendimiento, ItemCatalogo
from .forms import SumateEmprendimientoForm


def _serialize_emprendimiento(emp):
    items = [
        {
            'id': item.id,
            'nombre': item.nombre,
            'categoria_item': item.categoria_item or 'Servicios',
            'detalle': item.detalle_duracion,
            'precio': float(item.precio),
            'precio_formateado': f"${item.precio:,.0f}".replace(',', '.'),
            'permite_turno': item.permite_turno,
            'disponible': item.disponible,
        }
        for item in emp.items_catalogo.all()
    ]
    items_disponibles = [i for i in items if i['disponible']]
    return {
        'id': emp.id,
        'nombre': emp.nombre,
        'titular': emp.titular,
        'categoria_id': emp.categoria.id,
        'categoria_nombre': emp.categoria.nombre,
        'categoria_slug': emp.categoria.slug,
        'categoria_icono': emp.categoria.icono_svg,
        'subcategoria': emp.subcategoria,
        'descripcion': emp.descripcion_corta,
        'direccion': emp.direccion,
        'latitud': emp.latitud if emp.latitud is not None else -33.081,
        'longitud': emp.longitud if emp.longitud is not None else -68.468,
        'link_google_maps': emp.link_google_maps,
        'maps_url': emp.get_maps_url(),
        'telefono': emp.telefono_whatsapp,
        'whatsapp_num': emp.whatsapp_clean(),
        'email': emp.email,
        'imagen_url': emp.imagen_url,
        'notas_servicios_iniciales': emp.notas_servicios_iniciales,
        'token_edicion': emp.token_edicion,
        'autogestion_path': emp.get_autogestion_path(),
        'aprobado': emp.aprobado,
        'fecha_creacion': emp.fecha_creacion.strftime('%d/%m/%Y %H:%M') if emp.fecha_creacion else '',
        'items': items_disponibles,
        'todos_items': items,
        'cantidad_items': len(items_disponibles),
    }


def index(request):
    categorias = Categoria.objects.annotate(
        aprobados_count=Count('emprendimientos', filter=Q(emprendimientos__aprobado=True))
    ).order_by('orden', 'id')

    emprendimientos_qs = (
        Emprendimiento.objects.filter(aprobado=True)
        .select_related('categoria')
        .prefetch_related('items_catalogo')
        .order_by('categoria__orden', 'id')
    )

    emprendimientos_data = [_serialize_emprendimiento(emp) for emp in emprendimientos_qs]
    form = SumateEmprendimientoForm()

    context = {
        'categorias': categorias,
        'emprendimientos': emprendimientos_qs,
        'emprendimientos_json': emprendimientos_data,
        'form': form,
        'total_emprendimientos': len(emprendimientos_data),
    }
    return render(request, 'catalogo/index.html', context)


@require_POST
def sumar_emprendimiento(request):
    """Recibe el formulario '¡Sumate al Camino del Bienestar!' via AJAX o POST tradicional."""
    form = SumateEmprendimientoForm(request.POST)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if form.is_valid():
        nuevo_emp = form.save(commit=False)
        nuevo_emp.aprobado = False  # Queda pendiente de revisión en el Panel de Gestión
        nuevo_emp.latitud = -33.0812
        nuevo_emp.longitud = -68.4685
        nuevo_emp.save()

        if is_ajax:
            return JsonResponse({
                'ok': True,
                'mensaje': (
                    f"¡Gracias por sumarte! Recibimos los datos de «{nuevo_emp.nombre}». "
                    "Nuestro equipo de General San Martín revisará tu solicitud para publicarla en el circuito."
                )
            })
        return redirect('catalogo:index')

    if is_ajax:
        return JsonResponse({
            'ok': False,
            'errores': form.errors,
            'mensaje': 'Por favor verificá los campos ingresados.'
        }, status=400)

    return redirect('catalogo:index')


# ==============================================================================
# 1. PANEL DE GESTIÓN GENERAL (BACKOFFICE OCULTO EN /gestion/)
# ==============================================================================

def gestion_login(request):
    if request.user.is_authenticated:
        return redirect('catalogo:panel_gestion')

    error_msg = None
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next') or 'catalogo:panel_gestion'
            return redirect(next_url)
        else:
            error_msg = "Usuario o contraseña incorrectos. Verificá tus credenciales."

    return render(request, 'catalogo/login.html', {'error_msg': error_msg})


def gestion_logout(request):
    logout(request)
    return redirect('catalogo:index')


@login_required(login_url='/gestion/login/')
def panel_gestion(request):
    categorias = Categoria.objects.all().order_by('orden', 'id')
    todos_qs = (
        Emprendimiento.objects.all()
        .select_related('categoria')
        .prefetch_related('items_catalogo')
        .order_by('categoria__orden', 'id')
    )

    emprendimientos_list = [_serialize_emprendimiento(emp) for emp in todos_qs]
    pendientes_list = [e for e in emprendimientos_list if not e['aprobado']]
    activos_list = [e for e in emprendimientos_list if e['aprobado']]
    total_servicios = ItemCatalogo.objects.count()

    context = {
        'categorias': categorias,
        'emprendimientos_json': emprendimientos_list,
        'pendientes': pendientes_list,
        'kpi_activos': len(activos_list),
        'kpi_pendientes': len(pendientes_list),
        'kpi_servicios': total_servicios,
    }
    return render(request, 'catalogo/panel_gestion.html', context)


@login_required(login_url='/gestion/login/')
@require_POST
def api_toggle_aprobado(request, emp_id):
    emp = get_object_or_404(Emprendimiento, pk=emp_id)
    try:
        body = json.loads(request.body.decode('utf-8')) if request.body else {}
    except json.JSONDecodeError:
        body = {}

    if 'aprobado' in body:
        emp.aprobado = bool(body['aprobado'])
    else:
        emp.aprobado = not emp.aprobado
    emp.save()

    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': (
            f"«{emp.nombre}» fue aprobado y ya está publicado en la web."
            if emp.aprobado else f"«{emp.nombre}» fue pausado y ocultado de la web pública."
        ),
    })


@login_required(login_url='/gestion/login/')
@require_POST
def api_guardar_emprendimiento(request):
    """Crea o edita un Emprendimiento desde el Modal del Panel de Gestión."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'mensaje': 'Datos JSON inválidos.'}, status=400)

    emp_id = data.get('id')
    categoria_id = data.get('categoria_id')
    nombre = (data.get('nombre') or '').strip()
    titular = (data.get('titular') or '').strip()
    subcategoria = (data.get('subcategoria') or '').strip()
    direccion = (data.get('direccion') or '').strip()
    telefono = (data.get('telefono') or '').strip()
    email = (data.get('email') or '').strip()

    if not (categoria_id and nombre and subcategoria and direccion and telefono):
        return JsonResponse({
            'ok': False,
            'mensaje': 'Completá los campos obligatorios: Nombre, Categoría, Especialidad, Dirección y WhatsApp.'
        }, status=400)

    categoria = get_object_or_404(Categoria, pk=categoria_id)

    try:
        lat = float(data.get('latitud')) if data.get('latitud') not in (None, '') else -33.081
    except (ValueError, TypeError):
        lat = -33.081

    try:
        lng = float(data.get('longitud')) if data.get('longitud') not in (None, '') else -68.468
    except (ValueError, TypeError):
        lng = -68.468

    if emp_id:
        emp = get_object_or_404(Emprendimiento, pk=emp_id)
        es_nuevo = False
    else:
        emp = Emprendimiento()
        es_nuevo = True

    emp.categoria = categoria
    emp.nombre = nombre
    emp.titular = titular
    emp.subcategoria = subcategoria
    emp.descripcion_corta = (data.get('descripcion') or '').strip()
    emp.direccion = direccion
    emp.telefono_whatsapp = telefono
    emp.email = email
    emp.latitud = lat
    emp.longitud = lng
    emp.link_google_maps = (data.get('link_google_maps') or '').strip()
    emp.imagen_url = (data.get('imagen_url') or '').strip()
    if 'notas_servicios_iniciales' in data:
        emp.notas_servicios_iniciales = (data.get('notas_servicios_iniciales') or '').strip()
    if 'aprobado' in data:
        emp.aprobado = bool(data.get('aprobado'))
    elif es_nuevo:
        emp.aprobado = True

    emp.save()

    return JsonResponse({
        'ok': True,
        'es_nuevo': es_nuevo,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': (
            f"Emprendimiento «{emp.nombre}» creado exitosamente."
            if es_nuevo else f"Cambios guardados en «{emp.nombre}»."
        ),
    })


@login_required(login_url='/gestion/login/')
@require_POST
def api_eliminar_emprendimiento(request, emp_id):
    emp = get_object_or_404(Emprendimiento, pk=emp_id)
    nombre = emp.nombre
    emp.delete()
    return JsonResponse({
        'ok': True,
        'id': emp_id,
        'mensaje': f"El emprendimiento «{nombre}» fue eliminado permanentemente."
    })


@login_required(login_url='/gestion/login/')
@require_POST
def api_guardar_item(request):
    """Agrega o edita un servicio/producto (ItemCatalogo) desde el Panel General."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'mensaje': 'Datos JSON inválidos.'}, status=400)

    item_id = data.get('id')
    emp_id = data.get('emprendimiento_id')
    nombre = (data.get('nombre') or '').strip()
    categoria_item = (data.get('categoria_item') or 'Servicios').strip()
    detalle = (data.get('detalle') or '').strip()
    precio_raw = data.get('precio')
    permite_turno = bool(data.get('permite_turno', True))
    disponible = bool(data.get('disponible', True))

    if not nombre or precio_raw in (None, ''):
        return JsonResponse({'ok': False, 'mensaje': 'Indicá el nombre del servicio y su precio.'}, status=400)

    try:
        precio = Decimal(str(precio_raw))
    except (InvalidOperation, ValueError):
        return JsonResponse({'ok': False, 'mensaje': 'El precio ingresado no es válido.'}, status=400)

    if item_id:
        item = get_object_or_404(ItemCatalogo, pk=item_id)
        emp = item.emprendimiento
    else:
        emp = get_object_or_404(Emprendimiento, pk=emp_id)
        item = ItemCatalogo(emprendimiento=emp)

    item.nombre = nombre
    item.categoria_item = categoria_item
    item.detalle_duracion = detalle
    item.precio = precio
    item.permite_turno = permite_turno
    item.disponible = disponible
    item.save()

    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': f"Servicio «{item.nombre}» guardado correctamente."
    })


@login_required(login_url='/gestion/login/')
@require_POST
def api_eliminar_item(request, item_id):
    item = get_object_or_404(ItemCatalogo, pk=item_id)
    emp = item.emprendimiento
    nombre = item.nombre
    item.delete()
    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': f"Servicio «{nombre}» eliminado del catálogo."
    })


# ==============================================================================
# 2. PORTAL EXCLUSIVO DE AUTOGESTIÓN POR EMPRENDEDORA (/mi-catalogo/<token>/)
# ==============================================================================

def portal_emprendedora(request, token):
    """
    Vista exclusiva para que cada emprendedora (ej. Romina de RA Peluquerías)
    administre únicamente sus propios datos de contacto, servicios y precios.
    """
    emp = get_object_or_404(
        Emprendimiento.objects.select_related('categoria').prefetch_related('items_catalogo'),
        token_edicion=token
    )
    emp_data = _serialize_emprendimiento(emp)

    context = {
        'emp': emp,
        'emp_json': emp_data,
    }
    return render(request, 'catalogo/mi_catalogo.html', context)


@require_POST
def api_mi_catalogo_actualizar_perfil(request, token):
    emp = get_object_or_404(Emprendimiento, token_edicion=token)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'mensaje': 'Datos inválidos.'}, status=400)

    nombre = (data.get('nombre') or '').strip()
    titular = (data.get('titular') or '').strip()
    subcategoria = (data.get('subcategoria') or '').strip()
    direccion = (data.get('direccion') or '').strip()
    telefono = (data.get('telefono') or '').strip()
    email = (data.get('email') or '').strip()
    descripcion = (data.get('descripcion') or '').strip()

    if not (nombre and direccion and telefono):
        return JsonResponse({
            'ok': False,
            'mensaje': 'El nombre del negocio, dirección y WhatsApp son obligatorios.'
        }, status=400)

    emp.nombre = nombre
    emp.titular = titular
    if subcategoria:
        emp.subcategoria = subcategoria
    emp.direccion = direccion
    emp.telefono_whatsapp = telefono
    emp.email = email
    emp.descripcion_corta = descripcion
    emp.save()

    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': 'Tus datos de contacto fueron actualizados en el circuito.'
    })


@require_POST
def api_mi_catalogo_guardar_item(request, token):
    emp = get_object_or_404(Emprendimiento, token_edicion=token)
    try:
        data = json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return JsonResponse({'ok': False, 'mensaje': 'Datos inválidos.'}, status=400)

    item_id = data.get('id')
    nombre = (data.get('nombre') or '').strip()
    categoria_item = (data.get('categoria_item') or 'Servicios').strip()
    detalle = (data.get('detalle') or '').strip()
    precio_raw = data.get('precio')
    permite_turno = bool(data.get('permite_turno', True))
    disponible = bool(data.get('disponible', True))

    if not nombre or precio_raw in (None, ''):
        return JsonResponse({'ok': False, 'mensaje': 'Completá el nombre del servicio/producto y su precio.'}, status=400)

    try:
        precio = Decimal(str(precio_raw))
    except (InvalidOperation, ValueError):
        return JsonResponse({'ok': False, 'mensaje': 'El precio ingresado no es válido.'}, status=400)

    if item_id:
        # Seguridad estricta: el ítem debe pertenecer a este emprendimiento
        item = get_object_or_404(ItemCatalogo, pk=item_id, emprendimiento=emp)
    else:
        item = ItemCatalogo(emprendimiento=emp)

    item.nombre = nombre
    item.categoria_item = categoria_item
    item.detalle_duracion = detalle
    item.precio = precio
    item.permite_turno = permite_turno
    item.disponible = disponible
    item.save()

    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': f"«{item.nombre}» (${item.precio:,.0f}) guardado en tu catálogo.".replace(',', '.')
    })


@require_POST
def api_mi_catalogo_eliminar_item(request, token, item_id):
    emp = get_object_or_404(Emprendimiento, token_edicion=token)
    item = get_object_or_404(ItemCatalogo, pk=item_id, emprendimiento=emp)
    nombre = item.nombre
    item.delete()

    return JsonResponse({
        'ok': True,
        'emprendimiento': _serialize_emprendimiento(emp),
        'mensaje': f"«{nombre}» fue eliminado de tu catálogo."
    })
