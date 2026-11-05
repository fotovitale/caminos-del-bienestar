/**
 * CAMINOS DEL BIENESTAR · GENERAL SAN MARTÍN, MENDOZA
 * Multi-Catálogo Interactivo (6 Categorías), Vista E-Commerce por Prestador,
 * Turnero Directo Integrado (WhatsApp + Email) y Mapa de Leaflet.
 */

document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('emprendimientos-data');
    const emprendimientos = dataElement ? JSON.parse(dataElement.textContent) : [];

    let currentCategorySlug = 'todos';
    let currentSearchTerm = '';

    // Estado del Turnero Directo
    let currentSelectedEmp = null;
    let currentSelectedItem = null;

    // Referencias DOM
    const gridContainer = document.getElementById('emprendimientos-grid');
    const counterBadge = document.getElementById('resultados-contador');
    const activeCategoryLabel = document.getElementById('categoria-activa-titulo');
    const categoryButtons = document.querySelectorAll('.category-card-btn');
    const btnVerTodos = document.getElementById('btn-ver-todos');
    const searchInput = document.getElementById('input-busqueda');

    // Mapa y marcadores
    let map = null;
    let markersLayer = null;
    const markersById = {};

    const categoryColors = {
        'peluqueria-cabello': 'linear-gradient(135deg, #76B89D, #5BC0BE)',
        'cosmetologia': 'linear-gradient(135deg, #89CFF0, #5BC0BE)',
        'crecimiento-personal': 'linear-gradient(135deg, #68B2A0, #4A8F74)',
        'vinos': 'linear-gradient(135deg, #5BC0BE, #3B9EC9)',
        'alojamiento': 'linear-gradient(135deg, #76B89D, #4B9CD3)',
        'otros-productos': 'linear-gradient(135deg, #5BC0BE, #76B89D)',
    };

    // Fecha mínima por defecto hoy en el selector de turnos
    const fechaInput = document.getElementById('turnoFecha');
    if (fechaInput) {
        const hoy = new Date().toISOString().split('T')[0];
        fechaInput.min = hoy;
        fechaInput.value = hoy;
    }

    // -------------------------------------------------------------------------
    // INICIALIZACIÓN DEL MAPA INTERACTIVO (LEAFLET + OPENSTREETMAP)
    // -------------------------------------------------------------------------
    function initMap() {
        const mapContainer = document.getElementById('mapa-san-martin');
        if (!mapContainer || typeof L === 'undefined') return;

        map = L.map('mapa-san-martin', {
            scrollWheelZoom: false,
        }).setView([-33.081, -68.468], 14);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &bull; General San Martín, Mendoza',
            maxZoom: 19,
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        updateMapMarkers(emprendimientos);
    }

    function createCustomIcon(catSlug) {
        const gradient = categoryColors[catSlug] || 'linear-gradient(135deg, #76B89D, #5BC0BE)';
        return L.divIcon({
            className: 'custom-map-pin',
            html: `
                <div class="pin-bubble" style="background: ${gradient};">
                    <div class="pin-bubble-inner">✦</div>
                </div>
            `,
            iconSize: [38, 38],
            iconAnchor: [19, 38],
            popupAnchor: [0, -36],
        });
    }

    function updateMapMarkers(filteredList) {
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();
        Object.keys(markersById).forEach(k => delete markersById[k]);

        const bounds = [];

        filteredList.forEach(emp => {
            if (!emp.latitud || !emp.longitud) return;

            const marker = L.marker([emp.latitud, emp.longitud], {
                icon: createCustomIcon(emp.categoria_slug),
            });

            const titularLabel = emp.titular ? ` · ${emp.titular}` : '';
            const whatsappUrl = `https://wa.me/${emp.whatsapp_num}?text=${encodeURIComponent(
                `¡Hola ${emp.titular || emp.nombre}! Te contacto desde el circuito Caminos del Bienestar de General San Martín.`
            )}`;

            const popupHtml = `
                <div class="map-popup-card p-1">
                    <span class="badge rounded-pill mb-1" style="background: rgba(168,230,207,0.45); color:#2C3E50; font-weight:600;">
                        ${escapeHtml(emp.categoria_nombre)}
                    </span>
                    <h6 class="fw-bold mb-0" style="color:#2C3E50;">${escapeHtml(emp.nombre)}${escapeHtml(titularLabel)}</h6>
                    <p class="small text-secondary mb-2">📍 ${escapeHtml(emp.direccion)}</p>
                    <div class="d-flex gap-1 mt-2">
                        <button type="button"
                                class="btn btn-sm flex-grow-1 text-white fw-semibold btn-popup-precios"
                                data-emp-id="${emp.id}"
                                style="background: linear-gradient(135deg, #76B89D, #5BC0BE); border:none; border-radius:8px; font-size:0.76rem;">
                            Abrir Catálogo (${emp.cantidad_items})
                        </button>
                        <a href="${whatsappUrl}" target="_blank" rel="noopener"
                           class="btn btn-sm fw-semibold"
                           style="background: rgba(37,211,102,0.15); color:#1B7F43; border:1px solid rgba(37,211,102,0.4); border-radius:8px; font-size:0.76rem;">
                            WhatsApp
                        </a>
                    </div>
                </div>
            `;

            marker.bindPopup(popupHtml);
            marker.addTo(markersLayer);
            markersById[emp.id] = marker;
            bounds.push([emp.latitud, emp.longitud]);
        });

        if (bounds.length > 1) {
            map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
        } else if (bounds.length === 1) {
            map.setView(bounds[0], 15);
        } else {
            map.setView([-33.081, -68.468], 14);
        }
    }

    document.addEventListener('click', (e) => {
        const popupBtn = e.target.closest('.btn-popup-precios');
        if (popupBtn) {
            const empId = parseInt(popupBtn.getAttribute('data-emp-id'), 10);
            openCatalogModal(empId);
        }
    });

    // -------------------------------------------------------------------------
    // RENDERIZADO DINÁMICO DE TARJETAS DE PRESTADORES
    // -------------------------------------------------------------------------
    function renderCards(filteredList) {
        if (!gridContainer) return;

        if (counterBadge) {
            counterBadge.textContent = `${filteredList.length} ${
                filteredList.length === 1 ? 'espacio disponible' : 'espacios disponibles'
            }`;
        }

        if (filteredList.length === 0) {
            gridContainer.innerHTML = `
                <div class="col-12">
                    <div class="text-center py-5 px-3 rounded-4" style="background: rgba(255,255,255,0.82); border: 1px dashed rgba(118,184,157,0.5);">
                        <i data-lucide="compass" class="mb-2" style="width:42px;height:42px;color:#5BC0BE;"></i>
                        <h5 class="fw-bold mb-1">No encontramos emprendimientos con ese filtro</h5>
                        <p class="text-secondary small mb-3">Probá seleccionando otra categoría o presioná "Ver todos" para explorar el circuito completo de San Martín.</p>
                        <button type="button" class="btn-ver-todos" id="btn-reset-empty">
                            Ver todos los espacios
                        </button>
                    </div>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            document.getElementById('btn-reset-empty')?.addEventListener('click', () => {
                filterByCategory('todos', 'Todos los Espacios del Circuito');
            });
            return;
        }

        gridContainer.innerHTML = filteredList.map((emp, idx) => {
            const whatsappUrl = `https://wa.me/${emp.whatsapp_num}?text=${encodeURIComponent(
                `¡Hola ${emp.titular || emp.nombre}! Vi tu catálogo en Caminos del Bienestar (Gral. San Martín) y me gustaría hacer una consulta.`
            )}`;

            const imgSrc = emp.imagen_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80';

            // Vista previa rápida de los primeros 2 servicios con precios en la tarjeta
            const previewServices = (emp.items || []).slice(0, 2).map(it => `
                <div class="d-flex justify-content-between align-items-center small py-1 border-bottom border-light-subtle">
                    <span class="text-truncate me-2" style="color:#2C3E50;">• ${escapeHtml(it.nombre)}</span>
                    <strong class="text-nowrap" style="color:#3A9694;">${escapeHtml(it.precio_formateado)}</strong>
                </div>
            `).join('');

            return `
                <div class="col-12 col-md-6 col-lg-4 card-animate" style="animation-delay: ${idx * 45}ms;">
                    <article class="business-card">
                        <div class="business-card-media" style="cursor:pointer;" data-emp-id="${emp.id}">
                            <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(emp.nombre)}" loading="lazy">
                            <span class="badge-categoria-top">
                                <i data-lucide="${escapeHtml(emp.categoria_icono)}" style="width:14px;height:14px;color:#4A8F74;"></i>
                                ${escapeHtml(emp.categoria_nombre)}
                            </span>
                        </div>
                        <div class="business-card-body">
                            <div class="d-flex align-items-center justify-content-between gap-2 flex-wrap mb-1">
                                <span class="badge-subcategoria mb-0">${escapeHtml(emp.subcategoria)}</span>
                                ${emp.titular ? `
                                    <span class="small fw-semibold" style="color:#4A8F74; font-size:0.8rem;">
                                        👤 ${escapeHtml(emp.titular)}
                                    </span>
                                ` : ''}
                            </div>
                            <h3 class="business-title mt-1">${escapeHtml(emp.nombre)}</h3>
                            <p class="business-desc mb-2">${escapeHtml(emp.descripcion)}</p>

                            ${previewServices ? `
                                <div class="p-2 rounded-3 mb-3" style="background: rgba(168,230,207,0.16); border: 1px solid rgba(118,184,157,0.25);">
                                    <div class="small fw-bold mb-1" style="font-size:0.74rem; color:#4A8F74; text-transform:uppercase; letter-spacing:0.04em;">
                                        Servicios Destacados:
                                    </div>
                                    ${previewServices}
                                </div>
                            ` : ''}

                            <ul class="business-meta-list">
                                <li>
                                    <i data-lucide="map-pin" style="width:16px;height:16px;"></i>
                                    <span>${escapeHtml(emp.direccion)}</span>
                                </li>
                                <li>
                                    <i data-lucide="phone" style="width:16px;height:16px;"></i>
                                    <span>${escapeHtml(emp.telefono)}</span>
                                </li>
                                ${emp.email ? `
                                <li>
                                    <i data-lucide="mail" style="width:16px;height:16px;"></i>
                                    <span class="text-truncate">${escapeHtml(emp.email)}</span>
                                </li>
                                ` : ''}
                            </ul>

                            <button type="button"
                                    class="btn-catalogo-precios js-open-modal"
                                    data-emp-id="${emp.id}">
                                <i data-lucide="calendar-check" style="width:17px;height:17px;"></i>
                                Ver Catálogo, Precios y Sacar Turno (${emp.cantidad_items})
                            </button>

                            <div class="card-secondary-actions">
                                <button type="button"
                                        class="btn-action-outline js-focus-map"
                                        data-emp-id="${emp.id}"
                                        title="Ubicar en el mapa interactivo de la página">
                                    <i data-lucide="locate-fixed" style="width:14px;height:14px;"></i>
                                    En Mapa
                                </button>
                                <a href="${escapeHtml(emp.maps_url)}"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   class="btn-action-outline"
                                   title="Abrir ubicación en Google Maps">
                                    <i data-lucide="external-link" style="width:14px;height:14px;"></i>
                                    Maps
                                </a>
                                <a href="${whatsappUrl}"
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   class="btn-action-outline btn-action-whatsapp"
                                   title="Enviar mensaje directo por WhatsApp">
                                    <i data-lucide="message-circle" style="width:14px;height:14px;"></i>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </article>
                </div>
            `;
        }).join('');

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    // -------------------------------------------------------------------------
    // LÓGICA DE FILTRADO COMBINADO (CATEGORÍA + BÚSQUEDA)
    // -------------------------------------------------------------------------
    function applyFilters() {
        const filtered = emprendimientos.filter(emp => {
            const matchesCategory =
                currentCategorySlug === 'todos' || emp.categoria_slug === currentCategorySlug;

            const term = currentSearchTerm.trim().toLowerCase();
            if (!term) return matchesCategory;

            const inName = emp.nombre.toLowerCase().includes(term);
            const inTitular = (emp.titular || '').toLowerCase().includes(term);
            const inSub = emp.subcategoria.toLowerCase().includes(term);
            const inAddr = emp.direccion.toLowerCase().includes(term);
            const inItems = emp.items.some(i => i.nombre.toLowerCase().includes(term));

            return matchesCategory && (inName || inTitular || inSub || inAddr || inItems);
        });

        renderCards(filtered);
        updateMapMarkers(filtered);
    }

    function filterByCategory(slug, labelText) {
        currentCategorySlug = slug;

        categoryButtons.forEach(btn => {
            if (btn.getAttribute('data-cat-slug') === slug) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (btnVerTodos) {
            if (slug === 'todos') {
                btnVerTodos.classList.add('active');
            } else {
                btnVerTodos.classList.remove('active');
            }
        }

        if (activeCategoryLabel && labelText) {
            activeCategoryLabel.textContent = labelText;
        }

        applyFilters();
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const slug = btn.getAttribute('data-cat-slug');
            const nombre = btn.getAttribute('data-cat-nombre');
            if (currentCategorySlug === slug) {
                filterByCategory('todos', 'Todos los Espacios del Circuito');
            } else {
                filterByCategory(slug, `Rubro: ${nombre}`);
            }
        });
    });

    if (btnVerTodos) {
        btnVerTodos.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentSearchTerm = '';
            filterByCategory('todos', 'Todos los Espacios del Circuito');
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            applyFilters();
        });
    }

    // -------------------------------------------------------------------------
    // VISTA DE CATÁLOGO E-COMMERCE POR PRESTADOR + TURNERO DIRECTO
    // -------------------------------------------------------------------------
    const turneroBox = document.getElementById('turneroDirectoBox');
    const formTurnero = document.getElementById('formTurneroDirecto');
    const btnCerrarTurnero = document.getElementById('btnCerrarTurnero');
    const btnEnviarTurnoEmail = document.getElementById('btnEnviarTurnoEmail');

    function closeTurneroPanel() {
        if (turneroBox) turneroBox.classList.add('d-none');
        currentSelectedItem = null;
    }

    if (btnCerrarTurnero) {
        btnCerrarTurnero.addEventListener('click', closeTurneroPanel);
    }

    function openTurneroForItem(emp, item) {
        currentSelectedEmp = emp;
        currentSelectedItem = item;

        const tituloEl = document.getElementById('turneroServicioTitulo');
        const subEl = document.getElementById('turneroPrestadorSubtitulo');

        if (tituloEl) {
            tituloEl.textContent = `${item.nombre} — ${item.precio_formateado}`;
        }
        if (subEl) {
            const titularTxt = emp.titular ? `con ${emp.titular} (${emp.nombre})` : `en ${emp.nombre}`;
            subEl.textContent = `Completá tus datos para reservar turno ${titularTxt} · ${emp.direccion}`;
        }

        if (btnEnviarTurnoEmail) {
            if (emp.email) {
                btnEnviarTurnoEmail.classList.remove('d-none');
            } else {
                btnEnviarTurnoEmail.classList.add('d-none');
            }
        }

        if (turneroBox) {
            turneroBox.classList.remove('d-none');
            turneroBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            document.getElementById('turnoClienteNombre')?.focus();
        }
    }

    function buildBookingMessage(emp, item, cliente, fechaRaw, franja, nota) {
        // Formatear fecha YYYY-MM-DD a DD/MM/YYYY
        let fechaFormateada = fechaRaw;
        if (fechaRaw && fechaRaw.includes('-')) {
            const parts = fechaRaw.split('-');
            if (parts.length === 3) {
                fechaFormateada = `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        }

        const destinatario = emp.titular
            ? `${emp.titular} de ${emp.nombre}`
            : emp.nombre;

        let msg = `¡Hola ${destinatario}! Quería solicitar un turno desde Caminos del Bienestar:\n`;
        msg += `• Servicio: ${item.nombre} (${item.precio_formateado})\n`;
        msg += `• Cliente: ${cliente}\n`;
        msg += `• Fecha solicitada: ${fechaFormateada} (${franja})\n`;
        if (nota) {
            msg += `• Nota: ${nota}\n`;
        }
        msg += `¡Muchas gracias!`;
        return msg;
    }

    if (formTurnero) {
        formTurnero.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!currentSelectedEmp || !currentSelectedItem) return;

            const cliente = document.getElementById('turnoClienteNombre').value.trim();
            const fecha = document.getElementById('turnoFecha').value;
            const franja = document.getElementById('turnoFranja').value;
            const nota = document.getElementById('turnoNota').value.trim();

            if (!cliente || !fecha) return;

            const texto = buildBookingMessage(
                currentSelectedEmp,
                currentSelectedItem,
                cliente,
                fecha,
                franja,
                nota
            );
            const waUrl = `https://wa.me/${currentSelectedEmp.whatsapp_num}?text=${encodeURIComponent(texto)}`;
            window.open(waUrl, '_blank', 'noopener,noreferrer');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Turno listo para enviar!',
                    text: `Abremos WhatsApp para enviar tu solicitud de "${currentSelectedItem.nombre}" a ${currentSelectedEmp.titular || currentSelectedEmp.nombre}.`,
                    confirmButtonColor: '#5BC0BE',
                    timer: 3500,
                });
            }
        });
    }

    if (btnEnviarTurnoEmail) {
        btnEnviarTurnoEmail.addEventListener('click', () => {
            if (!currentSelectedEmp || !currentSelectedItem || !currentSelectedEmp.email) return;

            const cliente = document.getElementById('turnoClienteNombre').value.trim() || 'Cliente';
            const fecha = document.getElementById('turnoFecha').value || 'A coordinar';
            const franja = document.getElementById('turnoFranja').value;
            const nota = document.getElementById('turnoNota').value.trim();

            const texto = buildBookingMessage(
                currentSelectedEmp,
                currentSelectedItem,
                cliente,
                fecha,
                franja,
                nota
            );
            const subject = `Solicitud de Turno: ${currentSelectedItem.nombre} - ${cliente}`;
            const mailtoUrl = `mailto:${currentSelectedEmp.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(texto)}`;
            window.location.href = mailtoUrl;
        });
    }

    function openCatalogModal(empId) {
        const emp = emprendimientos.find(item => item.id === empId);
        if (!emp) return;

        currentSelectedEmp = emp;
        closeTurneroPanel();

        document.getElementById('modalCatalogoNombre').textContent = emp.nombre;
        document.getElementById('modalCatalogoSubcategoria').textContent =
            `${emp.categoria_nombre} · ${emp.subcategoria}`;
        document.getElementById('modalCatalogoDescripcion').textContent = emp.descripcion || '';

        // Píldoras de contacto de la cabecera
        const pillTitular = document.getElementById('pillCatalogoTitular');
        if (emp.titular) {
            pillTitular.classList.remove('d-none');
            document.getElementById('modalCatalogoTitular').textContent = `Atendido por: ${emp.titular}`;
        } else {
            pillTitular.classList.add('d-none');
        }

        document.getElementById('modalCatalogoDireccion').textContent = emp.direccion;
        document.getElementById('modalCatalogoMaps').href = emp.maps_url;

        document.getElementById('modalCatalogoTelefono').textContent = emp.telefono;
        document.getElementById('pillCatalogoTelefono').href = `https://wa.me/${emp.whatsapp_num}`;

        const pillEmail = document.getElementById('pillCatalogoEmail');
        if (emp.email) {
            pillEmail.classList.remove('d-none');
            document.getElementById('modalCatalogoEmail').textContent = emp.email;
            pillEmail.href = `mailto:${emp.email}`;
        } else {
            pillEmail.classList.add('d-none');
        }

        const modalItemsList = document.getElementById('modalCatalogoLista');
        if (modalItemsList) {
            if (emp.items && emp.items.length > 0) {
                modalItemsList.innerHTML = emp.items.map(item => `
                    <div class="col-12 col-md-6">
                        <div class="ecommerce-item-card">
                            <div>
                                <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
                                    <span class="badge rounded-pill" style="background: rgba(137,207,240,0.3); color:#2C3E50; font-weight:600; font-size:0.74rem;">
                                        ${escapeHtml(item.categoria_item || 'Servicio')}
                                    </span>
                                    <span class="ecommerce-price-badge">${escapeHtml(item.precio_formateado)}</span>
                                </div>
                                <h5 class="fw-bold mb-1" style="color:#2C3E50; font-size:1.06rem;">
                                    ${escapeHtml(item.nombre)}
                                </h5>
                                <p class="small text-secondary mb-3">
                                    ${escapeHtml(item.detalle || 'Disponible en el circuito de General San Martín')}
                                </p>
                            </div>

                            <div class="d-flex align-items-center justify-content-between gap-2 pt-2 border-top border-light-subtle">
                                <span class="small fw-semibold" style="color:#4A8F74; font-size:0.78rem;">
                                    ✓ Disponible
                                </span>
                                <button type="button"
                                        class="btn-sacar-turno js-trigger-turnero"
                                        data-item-id="${item.id}">
                                    <i data-lucide="${item.permite_turno ? 'calendar-plus' : 'shopping-bag'}" style="width:16px;height:16px;"></i>
                                    ${item.permite_turno ? 'Sacar Turno' : 'Encargar / Consultar'}
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                modalItemsList.innerHTML = `
                    <div class="col-12">
                        <p class="text-secondary text-center py-4 mb-0">
                            Consultá directamente por WhatsApp las tarifas y disponibilidad vigentes.
                        </p>
                    </div>
                `;
            }
        }

        const modalWhatsappBtn = document.getElementById('modalCatalogoWhatsapp');
        if (modalWhatsappBtn) {
            modalWhatsappBtn.href = `https://wa.me/${emp.whatsapp_num}?text=${encodeURIComponent(
                `¡Hola ${emp.titular || emp.nombre}! Vi tu catálogo en Caminos del Bienestar y quiero realizar una consulta.`
            )}`;
        }

        if (window.lucide) window.lucide.createIcons();

        const modalEl = document.getElementById('modalServiciosPrecios');
        if (modalEl && typeof bootstrap !== 'undefined') {
            bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

    // Clic en "Sacar Turno" dentro de las tarjetas del catálogo del prestador
    document.getElementById('modalCatalogoLista')?.addEventListener('click', (e) => {
        const btnTurno = e.target.closest('.js-trigger-turnero');
        if (btnTurno && currentSelectedEmp) {
            const itemId = parseInt(btnTurno.getAttribute('data-item-id'), 10);
            const item = (currentSelectedEmp.items || []).find(i => i.id === itemId);
            if (item) {
                openTurneroForItem(currentSelectedEmp, item);
            }
        }
    });

    function focusOnMap(empId) {
        const emp = emprendimientos.find(item => item.id === empId);
        if (!emp || !map) return;

        const mapSection = document.getElementById('seccion-mapa');
        if (mapSection) {
            mapSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        setTimeout(() => {
            map.setView([emp.latitud, emp.longitud], 16, { animate: true });
            const marker = markersById[emp.id];
            if (marker) {
                marker.openPopup();
            }
        }, 450);
    }

    if (gridContainer) {
        gridContainer.addEventListener('click', (e) => {
            const btnModal = e.target.closest('.js-open-modal') || e.target.closest('.business-card-media');
            if (btnModal) {
                const empId = parseInt(btnModal.getAttribute('data-emp-id'), 10);
                openCatalogModal(empId);
                return;
            }

            const btnMap = e.target.closest('.js-focus-map');
            if (btnMap) {
                const empId = parseInt(btnMap.getAttribute('data-emp-id'), 10);
                focusOnMap(empId);
            }
        });
    }

    // -------------------------------------------------------------------------
    // ENVÍO DEL FORMULARIO "¡SUMATE AL CAMINO DEL BIENESTAR!"
    // -------------------------------------------------------------------------
    const formSumate = document.getElementById('form-sumate');
    if (formSumate) {
        formSumate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formSumate.querySelector('button[type="submit"]');
            const originalText = submitBtn ? submitBtn.innerHTML : '';

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Enviando solicitud...';
            }

            try {
                const formData = new FormData(formSumate);
                const response = await fetch(formSumate.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
                const result = await response.json();

                if (response.ok && result.ok) {
                    formSumate.reset();
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Solicitud recibida!',
                            text: result.mensaje,
                            confirmButtonText: 'Excelente',
                            confirmButtonColor: '#5BC0BE',
                            background: '#F6FBF9',
                            color: '#2C3E50',
                        });
                    }
                } else {
                    if (typeof Swal !== 'undefined') {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Revisá los datos',
                            text: result.mensaje || 'Verificá que todos los campos obligatorios estén completos.',
                            confirmButtonColor: '#5BC0BE',
                        });
                    }
                }
            } catch (error) {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No pudimos enviar el formulario en este momento. Intentá nuevamente.',
                        confirmButtonColor: '#5BC0BE',
                    });
                }
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            }
        });
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    renderCards(emprendimientos);
    initMap();
});
