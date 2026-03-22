/**
 * TokaChess - Main JavaScript
 */

// --- Variables Globales ---
let map;
let markersLayer;
let torneosData = [];

// --- 1. Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);

    const filtros = document.querySelectorAll('#nombreFilter, #dateInitFilter, #dateEndFilter');
    filtros.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                aplicarFiltros();
            }
        });
    });
    initMap();
    cargarTorneos();
});

// Funciones para el Menú Móvil
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

// --- 3. Configuración del Mapa ---
function initMap() {
    map = L.map('map', { zoomControl: false }).setView([40.41, -3.70], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    markersLayer = L.markerClusterGroup({
        maxClusterRadius: 40,
        disableClusteringAtZoom: 15,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        animate: true,
        animateAddingMarkers: true
    });

    map.addLayer(markersLayer);
}

// --- 6. Manejo de Marcadores ---
async function cargarTorneos() {
    try {
        const response = await fetch('torneos.json');
        if (!response.ok) throw new Error("Error cargando torneos.json");
        torneosData = await response.json();
        dibujarMarcadores(torneosData);
    } catch (e) {
        console.error("Error:", e);
    }
}

function crearIconoAjedrez() {
    const pinColor = "#2c3e50";
    const svgHtml = `
        <svg viewBox="0 0 365 560" xmlns="http://www.w3.org/2000/svg">
            <path d="M182.9 559.2C182.9 559.2 0 341.1 0 182.9 0 81.9 81.9 0 182.9 0s182.9 81.9 182.9 182.9c0 158.2-182.9 376.3-182.9 376.3z" fill="rgba(0,0,0,0.2)"/>
            <path d="M182.9 519.2C182.9 519.2 20 311.1 20 162.9 20 71.9 91.9 0 182.9 0s162.9 71.9 162.9 162.9c0 148.2-162.9 356.3-162.9 356.3z" fill="${pinColor}"/>
            <circle cx="182.9" cy="162.9" r="120" fill="white"/>
            <path d="M183 70c-22.1 0-40 17.9-40 40 0 11.2 4.6 21.3 12.1 28.6-8.3 5.4-13.8 14.7-13.8 25.2v26.2H120v20h126v-20h-21.3v-26.2c0-10.5-5.5-19.8-13.8-25.2 7.5-7.3 12.1-17.4 12.1-28.6 0-22.1-17.9-40-40-40zm0 20c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20zm0 60c9.1 0 16.5 7.4 16.5 16.5v27.7h-33v-27.7c0-9.1 7.4-16.5 16.5-16.5z" fill="${pinColor}"/>
        </svg>`;
    return L.divIcon({ className: 'custom-chess-pin', iconSize: [32, 49], iconAnchor: [16, 49], popupAnchor: [0, -49], html: svgHtml });
}

function dibujarMarcadores(datos) {
    markersLayer.clearLayers();
    const chessIcon = crearIconoAjedrez();
    const marcadoresNuevos = [];
    const tableBody = document.getElementById('tableBody');

    tableBody.innerHTML = '';

    datos.forEach(t => {
        // Renderizado de Tabla
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-secondary">${t.origin || 'N/A'}</span></td>
            <td>${t.fechaini || '-'}</td>
            <td>${t.fechafin || '-'}</td>
            <td>${t.link ? `<a href="${t.link}" target="_blank" class="small text-decoration-none">${t.nombre}</a>` : t.nombre}</td>
            <td><small>${t.ritmo || '-'}</small></td>
            <td><small>${t.organizador || '-'}</small></td>
            <td><i class="bi bi-geo-alt-fill text-danger"></i> <a target="_blank" href="https://www.google.com/maps?q=${t.lat},${t.lon}">${t.ciudad || '-'}</a></td>
        `;
        tableBody.appendChild(row);

        // Renderizado de Popup
        // Renderizado de Popup con bloques condicionales
        let popupContent = `
    <div style="font-family: 'Segoe UI', sans-serif; width: 260px; padding: 5px;">
        <h6 style="margin: 0; color: #1a202c; font-weight: 800;">${t.nombre}</h6>`;

        // Organizador
        if (t.organizador && t.organizador !== '-') {
            popupContent += `<div style="font-size: 0.8rem; color: #718096; margin-bottom: 3px; margin-top: 3px;">${t.organizador}</div>`;
        }

        // Bloque de Ciudad y Ritmo (Solo se renderiza si hay al menos uno de los dos)
        if ((t.ciudad && t.ciudad !== '-') || (t.ritmo && t.ritmo !== '-')) {
            popupContent += `<div style="display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; margin-top: 5px;">`;

            if (t.ciudad && t.ciudad !== '-') {
                popupContent += `<span>📍 <strong>${t.ciudad}</strong></span>`;
            }
            if (t.ritmo && t.ritmo !== '-') {
                popupContent += `<span>⏱️ Ritmo: ${t.ritmo}</span>`;
            }

            popupContent += `</div>`;
        }

        // Sección de fechas
        if (t.fechaini || t.fechafin) {
            popupContent += `
    <div style="display: flex; gap: 8px; margin-top: 12px; background: #f7fafc; padding: 8px; border-radius: 8px; border: 1px solid #edf2f7;">
        ${t.fechaini ? `
            <div style="flex:1; text-align:center;">
                <small style="display:block; font-size:0.6rem; font-weight: bold; color: #696d72;">INICIO</small>
                <strong>${t.fechaini}</strong>
            </div>` : ''}
        ${t.fechafin ? `
            <div style="flex:1; text-align:center;">
                <small style="display:block; font-size:0.6rem; font-weight: bold; color: #696d72;">FIN</small>
                <strong>${t.fechafin}</strong>
            </div>` : ''}
    </div>`;
        }

        // Botón de link
        if (t.link) {
            popupContent += `<a href="${t.link}" target="_blank" style="display: block; width: 100%; margin-top: 12px; padding: 10px; background: #1a202c; color: #fff; text-align: center; border-radius: 8px; text-decoration: none; font-size: 0.8rem; font-weight: 600;">Ver detalles</a>`;
        }

        popupContent += `</div>`;

        const marker = L.marker([t.lat, t.lon], { icon: chessIcon }).bindPopup(popupContent, { maxWidth: 300 });
        marcadoresNuevos.push(marker);
    });

    markersLayer.addLayers(marcadoresNuevos);
}

function aplicarFiltros() {
    const mapDiv = document.getElementById('map');

    // --- EFECTO VISUAL: ACTIVAR CARGA ---
    mapDiv.classList.add('map-updating');
    const loader = document.createElement('div');
    loader.id = "map-loader-overlay";
    loader.innerHTML = `<div class="chess-spinner"></div><span style="color:white; font-weight:bold; margin-top:10px; text-shadow: 1px 1px 2px black;">Actualizando...</span>`;
    mapDiv.parentElement.appendChild(loader);

    // Pequeño retardo para que el usuario vea la transición
    setTimeout(() => {
        const nombreBusqueda = document.getElementById("nombreFilter").value.toLowerCase().trim();
        const inicioStr = document.getElementById("dateInitFilter").value;
        const finStr = document.getElementById("dateEndFilter").value;

        const filtrados = torneosData.filter(t => {
            const cumpleNombre = t.nombre.toLowerCase().includes(nombreBusqueda);

            // Parsing de fechas DD-MM-YYYY a Date Object
            const parseFecha = (str) => {
                if (!str) return null;
                const [d, m, y] = str.split('-');
                return new Date(`${y}-${m}-${d}`);
            };

            const fechaTorneoInicio = parseFecha(t.fechaini);
            const fechaTorneoFin = parseFecha(t.fechafin);

            const filtroInicio = inicioStr ? new Date(inicioStr) : null;
            const filtroFin = finStr ? new Date(finStr) : null;

            const cumpleInicio = filtroInicio && fechaTorneoInicio ? (fechaTorneoInicio >= filtroInicio) : true;
            const cumpleFin = filtroFin && fechaTorneoFin ? (fechaTorneoFin <= filtroFin) : true;

            return cumpleNombre && cumpleInicio && cumpleFin;
        });

        dibujarMarcadores(filtrados);

        // --- EFECTO VISUAL: FINALIZAR ---
        mapDiv.classList.remove('map-updating');
        document.getElementById('map-loader-overlay')?.remove();

        // Si hay resultados, ajustar vista suavemente
        if (filtrados.length > 0) {
            const bounds = L.featureGroup(markersLayer.getLayers()).getBounds();
            map.flyToBounds(bounds, { padding: [30, 30], duration: 1.2 });
        }

        if (window.innerWidth <= 768) {
            toggleSidebar();
        }
    }, 500);
}
/**
 * Actualiza la fecha mínima permitida en el filtro 'Hasta' 
 * basándose en lo seleccionado en 'Desde'.
 */
function actualizarRestriccionFecha() {
    const fechaInicioInput = document.getElementById('dateInitFilter');
    const fechaFinInput = document.getElementById('dateEndFilter');

    // Obtenemos el valor seleccionado (YYYY-MM-DD)
    const fechaSeleccionada = fechaInicioInput.value;

    if (fechaSeleccionada) {
        // Establecemos que la fecha mínima del segundo input sea la elegida en el primero
        fechaFinInput.min = fechaSeleccionada;

        // Si la fecha que ya estaba puesta en 'Hasta' es anterior a la nueva fecha de inicio, 
        // la reseteamos para evitar filtros imposibles
        if (fechaFinInput.value && fechaFinInput.value < fechaSeleccionada) {
            fechaFinInput.value = fechaSeleccionada;
        }
    } else {
        // Si borran la fecha de inicio, quitamos la restricción
        fechaFinInput.removeAttribute('min');
    }
}
function switchView(type) {
    const mapDiv = document.getElementById('map');
    const tableDiv = document.getElementById('table-view');
    const btnMap = document.getElementById('btn-view-map');
    const btnTable = document.getElementById('btn-view-table');

    if (type === 'map') {
        tableDiv.classList.add('d-none');
        mapDiv.style.visibility = 'visible';
        btnMap.classList.replace('btn-light', 'btn-primary');
        btnTable.classList.replace('btn-primary', 'btn-light');
        setTimeout(() => { map.invalidateSize(); }, 200);
    } else {
        tableDiv.classList.remove('d-none');
        mapDiv.style.visibility = 'hidden';
        btnTable.classList.replace('btn-light', 'btn-primary');
        btnMap.classList.replace('btn-primary', 'btn-light');
    }
}

function limpiarFiltros() {
    document.getElementById("nombreFilter").value = "";
    document.getElementById("dateInitFilter").value = "";
    document.getElementById("dateEndFilter").value = "";
    aplicarFiltros();
}