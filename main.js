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
    // Seleccionamos todos los inputs dentro de tu panel de filtros
    const filtros = document.querySelectorAll('#nombreFilter, #dateInitFilter, #dateEndFilter');
    filtros.forEach(input => {
        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                // Evitamos que el formulario haga un "submit" real (recarga de página)
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

    // Inicializar Mapa centrado en España
    map = L.map('map', { zoomControl: false }).setView([40.41, -3.70], 6);

    // Capa base oscura (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB',
        maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Marcador de ejemplo con Popup Premium
    const popupContent = `
        <div style="padding: 8px;">
            <strong style="color: var(--accent); font-size: 1rem;">Torneo Élite Madrid</strong><br>
            <span style="color: #8b949e; font-size: 0.85rem;">Próxima fecha: 12 de Abril</span>
        </div>
    `;

    markersLayer = L.markerClusterGroup({
// 1. Radio de agrupación más pequeño (por defecto es 80)
    // Esto hace que solo se agrupen si están MUY pegados.
    maxClusterRadius: 40, 

    // 2. Desactivar clusters a partir de un zoom cercano
    // Al llegar a nivel 15 (barrio/calle), se rompen todos los clusters automáticamente
    disableClusteringAtZoom: 35, 

    // 3. Animaciones y efectos visuales
    showCoverageOnHover: false, // Quita el área azul fea al pasar el ratón
    zoomToBoundsOnClick: true,  // Al hacer clic, te lleva al grupo
    spiderfyOnMaxZoom: true,    // Si están en el mismo edificio, se abren en abanico
    
    // 4. Estética de los círculos (opcional)
    // Esto hace que los clusters se vean más suaves
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
    // Limpiamos la tabla antes de pintar
    tableBody.innerHTML = '';
    datos.forEach(t => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><span class="badge bg-secondary">${t.origin || 'N/A'}</span></td>
            <td class="">${t.fechaini || '-'}</td>
            <td>${t.fechafin || '-'}</td>
            <td>              
               ${t.link ? `<a href="${t.link}" target="_blank" class="small text-decoration-none">${t.nombre}</a>` : t.nombre}
            </td>
             <td><small>${t.ritmo || '-'}</small></td>
            <td><small>${t.organizador || '-'}</small></td>
            <td><i class="bi bi-geo-alt-fill text-danger"></i> <a target="_blank" href="https://www.google.com/maps/search/?api=1&query=${t.lat},${t.lon}">${t.ciudad || '-'}</a></td>
        `;

        // Opcional: Que al hacer clic en la fila te lleve al mapa
       // row.style.cursor = 'pointer';
       // row.onclick = () => {
       //     switchView('map'); // Cambia a vista mapa
       //     map.setView([t.lat, t.lon], 13); // Centra el mapa
       // };

        tableBody.appendChild(row);

        const popupContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 280px;  overflow: hidden;">
        
        <div style="padding: 10px 10px 5px 10px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
            <h6 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: #1a202c; line-height: 1.3; letter-spacing: -0.02em;">
                ${t.nombre || 'Torneo de Ajedrez'}
            </h6>
            
            ${t.organizador ? `
                <div style="margin-top: 6px; font-size: 0.7rem; color: #718096; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 8px; height: 8px; background: #4a5568; border-radius: 50%; margin-right: 6px;"></span>
                    ${t.organizador}
                </div>
            ` : ''}
        </div>

        <div style="padding: 0 20px 15px 20px;">
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 5px;">
                
                ${t.ciudad ? `
                    <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1rem; opacity: 0.8;">📍</span> 
                        <span style="font-weight: 500;">${t.ciudad}</span>
                    </div>
                ` : ''}

                ${t.ritmo ? `
                    <div style="font-size: 0.85rem; color: #4a5568; display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 1.1rem; opacity: 0.8;">⏱️</span> 
                        <span>Ritmo: <strong style="color: #2d3748;">${t.ritmo}</strong></span>
                    </div>
                ` : ''}

            </div>

            <div style="display: flex; gap: 10px; margin-top: 20px; margin-bottom: 20px;">
                <div style="flex: 1; background: #f7fafc; padding: 12px 8px; border-radius: 12px; text-align: center; border: 1px solid #edf2f7;">
                    <div style="font-size: 0.55rem; color: #7b8694; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Inicio</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #2d3748;">${t.fechaini || 'TBD'}</div>
                </div>
                <div style="flex: 1; background: #f7fafc; padding: 12px 8px; border-radius: 12px; text-align: center; border: 1px solid #edf2f7;">
                    <div style="font-size: 0.55rem; color: #7b8694; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Fin</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #2d3748;">${t.fechafin || 'TBD'}</div>
                </div>
            </div>

            ${t.link ? `
                <a href="${t.link}" target="_blank" style="display: block; width: 100%; padding: 14px 0; background: #1a202c; color: #ffffff; text-align: center; text-decoration: none; border-radius: 12px; font-size: 0.9rem; font-weight: 600; transition: transform 0.2s ease, background 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                    Ver detalles del torneo
                </a>
            ` : ''}
        </div>
    </div>`;

        const marker = L.marker([t.lat, t.lon], { icon: chessIcon }).bindPopup(popupContent, { maxWidth: 300 });
        marcadoresNuevos.push(marker);
    });

    markersLayer.addLayers(marcadoresNuevos);
}

function aplicarFiltros() {
// 1. Capturamos los valores de todos los filtros
    const nombreBusqueda = document.getElementById("nombreFilter").value.toLowerCase().trim();
    const inicioStr = document.getElementById("dateInitFilter").value;
    const finStr = document.getElementById("dateEndFilter").value;

    const filtrados = torneosData.filter(t => {
        // --- FILTRO DE NOMBRE ---
        // Si el nombre del torneo NO incluye lo que escribió el usuario, descartamos
        const cumpleNombre = t.nombre.toLowerCase().includes(nombreBusqueda);
        
        // --- FILTRO DE FECHAS ---
        // Convertimos las fechas del JSON (DD-MM-YYYY) a objetos Date
        const [diaI, mesI, anioI] = t.fechaini.split('-');
        const fechaTorneoInicio = new Date(`${anioI}-${mesI}-${diaI}`);

        const [diaF, mesF, anioF] = t.fechafin.split('-');
        const fechaTorneoFin = new Date(`${anioF}-${mesF}-${diaF}`);

        // Fechas de los inputs (vienen como YYYY-MM-DD)
        const filtroInicio = inicioStr ? new Date(inicioStr) : null;
        const filtroFin = finStr ? new Date(finStr) : null;

        const cumpleInicio = filtroInicio ? (fechaTorneoInicio >= filtroInicio) : true;
        const cumpleFin = filtroFin ? (fechaTorneoFin <= filtroFin) : true;

        // --- RETORNO FINAL ---
        // Solo sobrevive el torneo si cumple con el nombre Y con las fechas
        return cumpleNombre && cumpleInicio && cumpleFin;
    });
    dibujarMarcadores(filtrados);
    // Si estamos en móvil (pantalla <= 768px), cerramos el menú al filtrar
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}
function switchView(type) {
    const mapDiv = document.getElementById('map');
    const tableDiv = document.getElementById('table-view');
    const btnMap = document.getElementById('btn-view-map');
    const btnTable = document.getElementById('btn-view-table');

    if (type === 'map') {
        // Mostrar Mapa
        tableDiv.classList.add('d-none');
        mapDiv.style.visibility = 'visible';

        // Cambiar colores de botones
        btnMap.classList.replace('btn-light', 'btn-primary');
        btnTable.classList.replace('btn-primary', 'btn-light');

        // Refrescar Leaflet
        if (typeof map !== 'undefined') {
            setTimeout(() => { map.invalidateSize(); }, 200);
        }
    } else {
        // Mostrar Tabla
        tableDiv.classList.remove('d-none');
        mapDiv.style.visibility = 'hidden';

        // Cambiar colores de botones
        btnTable.classList.replace('btn-light', 'btn-primary');
        btnMap.classList.replace('btn-primary', 'btn-light');
    }
}

function limpiarFiltros() {
    // 1. Limpiamos los valores de los inputs
    document.getElementById("nombreFilter").value = "";
    document.getElementById("dateInitFilter").value = "";
    document.getElementById("dateEndFilter").value = "";

    // 2. Si estás usando Flatpickr (el del paso anterior), usa esto:
    // fp.clear(); 

    // 3. Ejecutamos el filtro para que se refresque la vista/mapa con TODO
    aplicarFiltros();
}