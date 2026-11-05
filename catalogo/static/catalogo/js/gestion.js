/**
 * CAMINOS DEL BIENESTAR · PANEL GENERAL DE ADMINISTRACIÓN (/gestion/)
 * Gestión de Solicitudes Pendientes, Emprendimientos, Precios y Links de Autogestión.
 */

document.addEventListener('DOMContentLoaded', () => {
    const dataEl = document.getElementById('admin-emprendimientos-data');
    let emprendimientos = dataEl ? JSON.parse(dataEl.textContent) : [];

    let currentCategoryFilter = 'todos';
    let currentSearch = '';
    let activeEmpForPrices = null;

    const kpiActivosEl = document.getElementById('kpi-activos');
    const kpiPendientesEl = document.getElementById('kpi-pendientes');
    const kpiServiciosEl = document.getElementById('kpi-servicios');
    const kpiCardPendientes = document.getElementById('kpi-card-pendientes');
    const badgeAlertaPendientes = document.getElementById('badge-alerta-pendientes');

    const contenedorPendientes = document.getElementById('contenedor-pendientes');
    const contenedorAdminList = document.getElementById('contenedor-emprendimientos-admin');
    const searchInput = document.getElementById('admin-search-input');
    const filterButtons = document.querySelectorAll('#filtros-categorias-admin .filter-chip-btn');

    const modalEmpEl = document.getElementById('modalEditarEmprendimiento');
    const modalPreciosEl = document.getElementById('modalGestionPrecios');

    function getCsrfToken() {
        const input = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (input) return input.value;
        const match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : '';
    }

    function showToast(title, icon = 'success') {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon,
                title,
                showConfirmButton: false,
                timer: 2800,
                timerProgressBar: true,
                background: '#F6FBF9',
                color: '#2C3E50',
            });
        }
    }

    function refreshAll() {
        const activos = emprendimientos.filter(e => e.aprobado);
        const pendientes = emprendimientos.filter(e => !e.aprobado);
        const totalServicios = emprendimientos.reduce(
            (acc, e) => acc + (e.todos_items ? e.todos_items.length : 0),
            0
        );

        if (kpiActivosEl) kpiActivosEl.textContent = activos.length;
        if (kpiPendientesEl) kpiPendientesEl.textContent = pendientes.length;
        if (kpiServiciosEl) kpiServiciosEl.textContent = totalServicios;

        if (kpiCardPendientes && badgeAlertaPendientes) {
            if (pendientes.length > 0) {
                kpiCardPendientes.classList.add('kpi-alert');
                badgeAlertaPendientes.classList.remove('d-none');
            } else {
                kpiCardPendientes.classList.remove('kpi-alert');
                badgeAlertaPendientes.classList.add('d-none');
            }
        }

        renderPendientes(pendientes);
        renderDirectorio();
    }

    // -------------------------------------------------------------------------
    // 1. BANDEJA DE SOLICITUDES PENDIENTES
    // -------------------------------------------------------------------------
    function renderPendientes(pendientes) {
        if (!contenedorPendientes) return;

        if (pendientes.length === 0) {
            contenedorPendientes.innerHTML = `
                <div class="col-12">
                    <div class="d-flex align-items-center gap-3 p-3 rounded-4" style="background: rgba(255,255,255,0.75); border: 1px dashed rgba(118,184,157,0.45);">
                        <i data-lucide="check-circle" style="width:24px;height:24px;color:#4A8F74;flex-shrink:0;"></i>
                        <div class="small text-secondary">
                            <strong>Todo al día:</strong> No hay solicitudes pendientes de revisión en este momento.
                        </div>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        contenedorPendientes.innerHTML = pendientes.map(emp => `
            <div class="col-12 col-lg-6">
                <div class="pending-item-card h-100 d-flex flex-column justify-content-between">
                    <div>
                        <div class="d-flex align-items-center justify-content-between gap-2 mb-2">
                            <span class="badge rounded-pill" style="background: rgba(168,230,207,0.5); color:#2C3E50; font-weight:600;">
                                ${escapeHtml(emp.categoria_nombre)} · ${escapeHtml(emp.subcategoria)}
                            </span>
                            <small class="text-secondary" style="font-size:0.75rem;">${escapeHtml(emp.fecha_creacion)}</small>
                        </div>
                        <h5 class="fw-bold mb-1" style="font-size:1.08rem;">
                            ${escapeHtml(emp.nombre)}
                            ${emp.titular ? `<span class="text-secondary fw-normal">(${escapeHtml(emp.titular)})</span>` : ''}
                        </h5>
                        <p class="small text-secondary mb-2">
                            📍 ${escapeHtml(emp.direccion)} &bull; 📱 ${escapeHtml(emp.telefono)}
                            ${emp.email ? ` &bull; ✉️ ${escapeHtml(emp.email)}` : ''}
                        </p>
                        ${emp.notas_servicios_iniciales ? `
                            <div class="p-2 rounded-3 small mb-3" style="background: rgba(254, 243, 199, 0.45); border: 1px solid rgba(245, 158, 11, 0.3);">
                                <strong class="d-block text-dark" style="font-size:0.76rem;">Servicios y precios declarados:</strong>
                                <span class="text-secondary">${escapeHtml(emp.notas_servicios_iniciales)}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="d-flex flex-wrap gap-2 pt-2 border-top">
                        <button type="button"
                                class="btn-sumate-nav py-1 px-3 js-aprobar-rapido"
                                data-emp-id="${emp.id}"
                                style="font-size: 0.82rem;">
                            <i data-lucide="check-circle-2" style="width:15px;height:15px;"></i>
                            Aprobar y Publicar en 1 Clic
                        </button>
                        <button type="button"
                                class="btn-action-outline py-1 px-2 js-abrir-precios"
                                data-emp-id="${emp.id}">
                            <i data-lucide="tags" style="width:14px;height:14px;"></i>
                            Cargar Precios (${emp.todos_items ? emp.todos_items.length : 0})
                        </button>
                        <button type="button"
                                class="btn-action-outline py-1 px-2 js-copiar-link"
                                data-emp-id="${emp.id}"
                                title="Copiar link de autogestión para enviarle a la emprendedora">
                            <i data-lucide="link" style="width:14px;height:14px;"></i>
                            Copiar Link
                        </button>
                        <button type="button"
                                class="btn-action-outline text-danger border-danger-subtle py-1 px-2 ms-auto js-eliminar-emp"
                                data-emp-id="${emp.id}">
                            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            Rechazar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    // -------------------------------------------------------------------------
    // 2. DIRECTORIO DE PRESTADORES + COPIAR LINK DE AUTOGESTIÓN
    // -------------------------------------------------------------------------
    function renderDirectorio() {
        if (!contenedorAdminList) return;

        const term = currentSearch.trim().toLowerCase();
        const filtrados = emprendimientos.filter(emp => {
            const matchCat =
                currentCategoryFilter === 'todos' || emp.categoria_slug === currentCategoryFilter;
            if (!term) return matchCat;

            const inNombre = emp.nombre.toLowerCase().includes(term);
            const inTitular = (emp.titular || '').toLowerCase().includes(term);
            const inSub = emp.subcategoria.toLowerCase().includes(term);
            const inDir = emp.direccion.toLowerCase().includes(term);
            const inItems = (emp.todos_items || []).some(i => i.nombre.toLowerCase().includes(term));
            return matchCat && (inNombre || inTitular || inSub || inDir || inItems);
        });

        if (filtrados.length === 0) {
            contenedorAdminList.innerHTML = `
                <div class="text-center py-5 rounded-4" style="background: rgba(255,255,255,0.8); border: 1px dashed rgba(118,184,157,0.45);">
                    <p class="text-secondary mb-0">No se encontraron emprendimientos con ese criterio de búsqueda.</p>
                </div>
            `;
            return;
        }

        contenedorAdminList.innerHTML = filtrados.map(emp => {
            const totalItems = emp.todos_items ? emp.todos_items.length : 0;
            const previewItems = (emp.todos_items || []).slice(0, 3).map(
                i => `<span class="badge rounded-pill text-bg-light border me-1 mb-1">${escapeHtml(i.nombre)}: <strong>${escapeHtml(i.precio_formateado)}</strong></span>`
            ).join('');

            return `
                <div class="admin-emp-row">
                    <div class="row align-items-center g-3">
                        <div class="col-12 col-lg-4">
                            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                                <span class="${emp.aprobado ? 'status-pill-active' : 'status-pill-paused'}">
                                    ${emp.aprobado ? '✓ Activo' : '⏳ Pausado'}
                                </span>
                                <span class="badge rounded-pill" style="background: rgba(137,207,240,0.35); color:#2C3E50; font-weight:600;">
                                    ${escapeHtml(emp.categoria_nombre)}
                                </span>
                                ${emp.titular ? `<span class="small fw-bold" style="color:#4A8F74;">👤 ${escapeHtml(emp.titular)}</span>` : ''}
                            </div>
                            <h5 class="fw-bold mb-1" style="font-size:1.12rem;">${escapeHtml(emp.nombre)}</h5>
                            <div class="small text-secondary">
                                📍 ${escapeHtml(emp.direccion)} &bull; 📱 ${escapeHtml(emp.telefono)}
                                ${emp.email ? `<br>✉️ ${escapeHtml(emp.email)}` : ''}
                            </div>
                        </div>

                        <div class="col-12 col-lg-3">
                            <div class="small text-secondary fw-semibold mb-1">
                                Catálogo (${totalItems} ${totalItems === 1 ? 'ítem' : 'ítems'}):
                            </div>
                            <div>
                                ${previewItems || '<span class="small text-muted">Sin servicios cargados aún</span>'}
                                ${totalItems > 3 ? `<span class="small text-secondary">+${totalItems - 3} más</span>` : ''}
                            </div>
                        </div>

                        <div class="col-12 col-lg-5 d-flex flex-wrap justify-content-lg-end gap-2">
                            <button type="button"
                                    class="btn-action-outline py-1 px-2 js-copiar-link"
                                    data-emp-id="${emp.id}"
                                    style="background: rgba(168,230,207,0.3); border-color: rgba(74,143,116,0.5);"
                                    title="Copiar el link exclusivo de autogestión de esta emprendedora">
                                <i data-lucide="link" style="width:14px;height:14px;color:#1E6B4E;"></i>
                                Copiar Link de Autogestión
                            </button>

                            <a href="${escapeHtml(emp.autogestion_path)}"
                               target="_blank"
                               class="btn-action-outline py-1 px-2"
                               title="Abrir el portal individual de esta emprendedora">
                                <i data-lucide="external-link" style="width:14px;height:14px;"></i>
                                Abrir Portal
                            </a>

                            <button type="button"
                                    class="btn-sumate-nav py-1 px-3 js-abrir-precios"
                                    data-emp-id="${emp.id}"
                                    style="font-size: 0.82rem;">
                                <i data-lucide="tags" style="width:14px;height:14px;"></i>
                                Precios (${totalItems})
                            </button>

                            <button type="button"
                                    class="btn-action-outline py-1 px-2 js-editar-emp"
                                    data-emp-id="${emp.id}"
                                    title="Editar datos del negocio">
                                <i data-lucide="edit-3" style="width:14px;height:14px;"></i>
                            </button>

                            <button type="button"
                                    class="btn-action-outline py-1 px-2 js-toggle-estado"
                                    data-emp-id="${emp.id}"
                                    title="${emp.aprobado ? 'Pausar / Ocultar' : 'Publicar'}">
                                <i data-lucide="${emp.aprobado ? 'eye-off' : 'eye'}" style="width:14px;height:14px;"></i>
                            </button>

                            <button type="button"
                                    class="btn-action-outline text-danger border-danger-subtle py-1 px-2 js-eliminar-emp"
                                    data-emp-id="${emp.id}"
                                    title="Eliminar emprendimiento">
                                <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryFilter = btn.getAttribute('data-cat-slug');
            renderDirectorio();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearch = e.target.value;
            renderDirectorio();
        });
    }

    // Copiar Link Exclusivo de Autogestión al Portapapeles
    async function copiarLinkAutogestion(empId) {
        const emp = emprendimientos.find(e => e.id === empId);
        if (!emp) return;

        const fullUrl = `${window.location.origin}${emp.autogestion_path}`;
        try {
            await navigator.clipboard.writeText(fullUrl);
        } catch (err) {
            // Fallback si clipboard API requiere foco
            const temp = document.createElement('input');
            temp.value = fullUrl;
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
        }

        const waShareUrl = `https://wa.me/${emp.whatsapp_num}?text=${encodeURIComponent(
            `¡Hola ${emp.titular || emp.nombre}! Te compartimos tu link exclusivo de autogestión en Caminos del Bienestar (Gral. San Martín) para que puedas actualizar tus servicios y precios cuando quieras:\n${fullUrl}`
        )}`;

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: '¡Link de Autogestión Copiado!',
                html: `
                    <p class="small text-secondary mb-2">
                        Ya podés pegarlo y enviárselo a <strong>${escapeHtml(emp.titular || emp.nombre)}</strong>. Con este enlace solo podrá editar su propio catálogo:
                    </p>
                    <div class="p-2 rounded-3 small fw-semibold mb-3" style="background:#EBF8F4; border:1px solid #76B89D; word-break:break-all;">
                        ${escapeHtml(fullUrl)}
                    </div>
                    <a href="${waShareUrl}" target="_blank" rel="noopener" class="btn btn-sm rounded-pill px-3 py-2 text-white fw-semibold" style="background:#25D366; text-decoration:none;">
                        📲 Enviárselo ahora por WhatsApp
                    </a>
                `,
                confirmButtonText: 'Listo',
                confirmButtonColor: '#5BC0BE',
            });
        }
    }

    async function toggleAprobado(empId, forceApprove = null) {
        const payload = forceApprove !== null ? { aprobado: forceApprove } : {};
        const resp = await fetch(`/gestion/api/emprendimiento/${empId}/toggle-aprobado/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(payload),
        });
        const res = await resp.json();
        if (resp.ok && res.ok) {
            const idx = emprendimientos.findIndex(e => e.id === empId);
            if (idx !== -1) emprendimientos[idx] = res.emprendimiento;
            refreshAll();
            showToast(res.mensaje);
        }
    }

    async function eliminarEmprendimiento(empId) {
        const emp = emprendimientos.find(e => e.id === empId);
        if (!emp) return;

        const confirm = await Swal.fire({
            icon: 'warning',
            title: `¿Eliminar «${emp.nombre}»?`,
            text: 'Se eliminarán también todos sus servicios y precios asociados.',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#DC2626',
        });

        if (!confirm.isConfirmed) return;

        const resp = await fetch(`/gestion/api/emprendimiento/${empId}/eliminar/`, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCsrfToken() },
        });
        const res = await resp.json();
        if (resp.ok && res.ok) {
            emprendimientos = emprendimientos.filter(e => e.id !== empId);
            refreshAll();
            showToast(res.mensaje, 'info');
        }
    }

    // -------------------------------------------------------------------------
    // MODAL 1: CREAR / EDITAR EMPRENDIMIENTO
    // -------------------------------------------------------------------------
    function openEmpModal(emp = null) {
        document.getElementById('modalEmpTitulo').textContent =
            emp ? `Editar: ${emp.nombre}` : 'Crear Nuevo Emprendimiento';
        document.getElementById('emp_id').value = emp ? emp.id : '';
        document.getElementById('emp_nombre').value = emp ? emp.nombre : '';
        document.getElementById('emp_titular').value = emp ? (emp.titular || '') : '';
        if (emp) {
            document.getElementById('emp_categoria').value = emp.categoria_id;
        }
        document.getElementById('emp_subcategoria').value = emp ? emp.subcategoria : '';
        document.getElementById('emp_telefono').value = emp ? emp.telefono : '';
        document.getElementById('emp_email').value = emp ? (emp.email || '') : '';
        document.getElementById('emp_direccion').value = emp ? emp.direccion : '';
        document.getElementById('emp_latitud').value = emp ? emp.latitud : -33.0810;
        document.getElementById('emp_longitud').value = emp ? emp.longitud : -68.4680;
        document.getElementById('emp_aprobado').checked = emp ? emp.aprobado : true;
        document.getElementById('emp_descripcion').value = emp ? emp.descripcion : '';
        document.getElementById('emp_imagen_url').value = emp ? emp.imagen_url : '';
        document.getElementById('emp_maps_url').value = emp ? (emp.link_google_maps || '') : '';

        const bloqueNotas = document.getElementById('bloque-notas-solicitud');
        const inputNotas = document.getElementById('emp_notas_iniciales');
        if (emp && emp.notas_servicios_iniciales) {
            bloqueNotas.style.display = 'block';
            inputNotas.value = emp.notas_servicios_iniciales;
        } else {
            bloqueNotas.style.display = 'none';
            inputNotas.value = '';
        }

        bootstrap.Modal.getOrCreateInstance(modalEmpEl).show();
    }

    document.getElementById('btn-nuevo-emprendimiento')?.addEventListener('click', () => openEmpModal(null));
    document.getElementById('btn-nuevo-emprendimiento-2')?.addEventListener('click', () => openEmpModal(null));

    document.getElementById('form-admin-emprendimiento')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('emp_id').value || null,
            nombre: document.getElementById('emp_nombre').value,
            titular: document.getElementById('emp_titular').value,
            categoria_id: document.getElementById('emp_categoria').value,
            subcategoria: document.getElementById('emp_subcategoria').value,
            telefono: document.getElementById('emp_telefono').value,
            email: document.getElementById('emp_email').value,
            direccion: document.getElementById('emp_direccion').value,
            latitud: document.getElementById('emp_latitud').value,
            longitud: document.getElementById('emp_longitud').value,
            aprobado: document.getElementById('emp_aprobado').checked,
            descripcion: document.getElementById('emp_descripcion').value,
            imagen_url: document.getElementById('emp_imagen_url').value,
            link_google_maps: document.getElementById('emp_maps_url').value,
            notas_servicios_iniciales: document.getElementById('emp_notas_iniciales').value,
        };

        const resp = await fetch('/gestion/api/emprendimiento/guardar/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(payload),
        });
        const res = await resp.json();

        if (resp.ok && res.ok) {
            if (res.es_nuevo) {
                emprendimientos.unshift(res.emprendimiento);
            } else {
                const idx = emprendimientos.findIndex(item => item.id === res.emprendimiento.id);
                if (idx !== -1) emprendimientos[idx] = res.emprendimiento;
            }
            refreshAll();
            bootstrap.Modal.getOrCreateInstance(modalEmpEl).hide();
            showToast(res.mensaje);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: res.mensaje || 'Verificá los datos ingresados.',
            });
        }
    });

    // -------------------------------------------------------------------------
    // MODAL 2: GESTOR DE CATÁLOGO DE PRECIOS
    // -------------------------------------------------------------------------
    function resetItemForm() {
        document.getElementById('item_id').value = '';
        document.getElementById('item_nombre').value = '';
        document.getElementById('item_categoria_item').value = 'Tratamientos';
        document.getElementById('item_detalle').value = '';
        document.getElementById('item_precio').value = '';
        document.getElementById('item_permite_turno').checked = true;
        document.getElementById('item_disponible').checked = true;
        document.getElementById('form-item-titulo').textContent =
            '➕ Agregar Nuevo Servicio o Producto al Catálogo';
        document.getElementById('btn-item-submit-text').textContent = 'Guardar Servicio';
        document.getElementById('btn-cancelar-edicion-item').classList.add('d-none');
    }

    function renderItemsModal(emp) {
        activeEmpForPrices = emp;
        document.getElementById('preciosModalNombreEmp').textContent =
            `${emp.nombre}${emp.titular ? ' · ' + emp.titular : ''}`;
        document.getElementById('item_emp_id').value = emp.id;

        const notaDiv = document.getElementById('preciosNotaInicial');
        if (emp.notas_servicios_iniciales) {
            notaDiv.classList.remove('d-none');
            notaDiv.innerHTML = `<strong>Nota enviada en el formulario público:</strong> ${escapeHtml(emp.notas_servicios_iniciales)}`;
        } else {
            notaDiv.classList.add('d-none');
        }

        const items = emp.todos_items || [];
        document.getElementById('contador-items-modal').textContent = items.length;
        const listaEl = document.getElementById('lista-items-admin');

        if (items.length === 0) {
            listaEl.innerHTML = `
                <div class="text-center py-4 rounded-3" style="background: rgba(246,251,249,0.9); border: 1px dashed rgba(118,184,157,0.4);">
                    <p class="small text-secondary mb-0">Aún no hay servicios ni precios cargados para este emprendimiento.</p>
                </div>
            `;
            return;
        }

        listaEl.innerHTML = items.map(item => `
            <div class="service-item-row">
                <div>
                    <div class="fw-bold d-flex align-items-center gap-2 flex-wrap" style="color:#2C3E50;">
                        <span class="badge rounded-pill text-bg-light border" style="font-size:0.7rem;">
                            ${escapeHtml(item.categoria_item || 'Servicio')}
                        </span>
                        <span>${escapeHtml(item.nombre)}</span>
                        ${!item.disponible ? '<span class="badge bg-secondary-subtle text-secondary">Pausado</span>' : ''}
                    </div>
                    <div class="small text-secondary">${escapeHtml(item.detalle || 'Sin detalle adicional')}</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="service-price-tag">${escapeHtml(item.precio_formateado)}</span>
                    <button type="button"
                            class="btn-action-outline py-1 px-2 js-editar-item"
                            data-item-id="${item.id}"
                            title="Editar precio o nombre">
                        <i data-lucide="edit-2" style="width:14px;height:14px;"></i>
                    </button>
                    <button type="button"
                            class="btn-action-outline text-danger border-danger-subtle py-1 px-2 js-eliminar-item"
                            data-item-id="${item.id}"
                            title="Eliminar servicio">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                    </button>
                </div>
            </div>
        `).join('');

        if (window.lucide) window.lucide.createIcons();
    }

    function openPreciosModal(empId) {
        const emp = emprendimientos.find(e => e.id === empId);
        if (!emp) return;
        resetItemForm();
        renderItemsModal(emp);
        bootstrap.Modal.getOrCreateInstance(modalPreciosEl).show();
    }

    document.getElementById('btn-cancelar-edicion-item')?.addEventListener('click', resetItemForm);

    document.getElementById('form-admin-item')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            id: document.getElementById('item_id').value || null,
            emprendimiento_id: document.getElementById('item_emp_id').value,
            nombre: document.getElementById('item_nombre').value,
            categoria_item: document.getElementById('item_categoria_item').value,
            detalle: document.getElementById('item_detalle').value,
            precio: document.getElementById('item_precio').value,
            permite_turno: document.getElementById('item_permite_turno').checked,
            disponible: document.getElementById('item_disponible').checked,
        };

        const resp = await fetch('/gestion/api/item/guardar/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            body: JSON.stringify(payload),
        });
        const res = await resp.json();

        if (resp.ok && res.ok) {
            const idx = emprendimientos.findIndex(item => item.id === res.emprendimiento.id);
            if (idx !== -1) emprendimientos[idx] = res.emprendimiento;
            resetItemForm();
            renderItemsModal(res.emprendimiento);
            refreshAll();
            showToast(res.mensaje);
        } else {
            Swal.fire({ icon: 'warning', title: 'Error', text: res.mensaje || 'Verificá el precio.' });
        }
    });

    document.getElementById('lista-items-admin')?.addEventListener('click', async (e) => {
        const btnEdit = e.target.closest('.js-editar-item');
        if (btnEdit && activeEmpForPrices) {
            const itemId = parseInt(btnEdit.getAttribute('data-item-id'), 10);
            const item = (activeEmpForPrices.todos_items || []).find(i => i.id === itemId);
            if (!item) return;

            document.getElementById('item_id').value = item.id;
            document.getElementById('item_nombre').value = item.nombre;
            document.getElementById('item_categoria_item').value = item.categoria_item || 'Servicios';
            document.getElementById('item_detalle').value = item.detalle;
            document.getElementById('item_precio').value = item.precio;
            document.getElementById('item_permite_turno').checked = item.permite_turno;
            document.getElementById('item_disponible').checked = item.disponible;
            document.getElementById('form-item-titulo').textContent = `✏️ Editando: ${item.nombre}`;
            document.getElementById('btn-item-submit-text').textContent = 'Actualizar Precio';
            document.getElementById('btn-cancelar-edicion-item').classList.remove('d-none');
            document.getElementById('item_precio').focus();
            return;
        }

        const btnDel = e.target.closest('.js-eliminar-item');
        if (btnDel) {
            const itemId = parseInt(btnDel.getAttribute('data-item-id'), 10);
            const resp = await fetch(`/gestion/api/item/${itemId}/eliminar/`, {
                method: 'POST',
                headers: { 'X-CSRFToken': getCsrfToken() },
            });
            const res = await resp.json();
            if (resp.ok && res.ok) {
                const idx = emprendimientos.findIndex(item => item.id === res.emprendimiento.id);
                if (idx !== -1) emprendimientos[idx] = res.emprendimiento;
                renderItemsModal(res.emprendimiento);
                refreshAll();
                showToast(res.mensaje, 'info');
            }
        }
    });

    document.addEventListener('click', (e) => {
        const btnCopy = e.target.closest('.js-copiar-link');
        if (btnCopy) {
            const empId = parseInt(btnCopy.getAttribute('data-emp-id'), 10);
            copiarLinkAutogestion(empId);
            return;
        }

        const btnApprove = e.target.closest('.js-aprobar-rapido');
        if (btnApprove) {
            const empId = parseInt(btnApprove.getAttribute('data-emp-id'), 10);
            toggleAprobado(empId, true);
            return;
        }

        const btnToggle = e.target.closest('.js-toggle-estado');
        if (btnToggle) {
            const empId = parseInt(btnToggle.getAttribute('data-emp-id'), 10);
            toggleAprobado(empId);
            return;
        }

        const btnEditEmp = e.target.closest('.js-editar-emp');
        if (btnEditEmp) {
            const empId = parseInt(btnEditEmp.getAttribute('data-emp-id'), 10);
            const emp = emprendimientos.find(item => item.id === empId);
            if (emp) openEmpModal(emp);
            return;
        }

        const btnPrecios = e.target.closest('.js-abrir-precios');
        if (btnPrecios) {
            const empId = parseInt(btnPrecios.getAttribute('data-emp-id'), 10);
            openPreciosModal(empId);
            return;
        }

        const btnDelEmp = e.target.closest('.js-eliminar-emp');
        if (btnDelEmp) {
            const empId = parseInt(btnDelEmp.getAttribute('data-emp-id'), 10);
            eliminarEmprendimiento(empId);
        }
    });

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    refreshAll();
});
