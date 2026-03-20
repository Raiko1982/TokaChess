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
    initMap();
    cargarTorneos();
});

// Funciones para el Menú Móvil
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}

function filterAndClose() {
    // Si estamos en móvil (pantalla <= 768px), cerramos el menú al filtrar
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
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

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Marcador de ejemplo con Popup Premium
    const popupContent = `
        <div style="padding: 8px;">
            <strong style="color: var(--accent); font-size: 1rem;">Torneo Élite Madrid</strong><br>
            <span style="color: #8b949e; font-size: 0.85rem;">Próxima fecha: 12 de Abril</span>
        </div>
    `;

    markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16
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

    datos.forEach(t => {
   
const popupContent = `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; width: 280px; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
        
        <div style="padding: 20px 20px 10px 20px; background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);">
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
                    <div style="font-size: 0.55rem; color: #a0aec0; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Inicio</div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #2d3748;">${t.fechaini || 'TBD'}</div>
                </div>
                <div style="flex: 1; background: #f7fafc; padding: 12px 8px; border-radius: 12px; text-align: center; border: 1px solid #edf2f7;">
                    <div style="font-size: 0.55rem; color: #a0aec0; font-weight: 800; text-transform: uppercase; margin-bottom: 4px;">Fin</div>
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
    const inicio = document.getElementById("dateInitFilter").value;
    const fin = document.getElementById("dateEndFilter").value;
    const filtrados = torneosData.filter(t => {
        // Si no hay filtros puestos, mostramos todo
        if (!inicio && !fin) return true;
        // Si hay 'inicio', el torneo debe empezar después o ese mismo día
        const cumpleInicio = inicio ? (t.fechaini >= inicio) : true;
        // Si hay 'fin', el torneo debe terminar antes o ese mismo día
        const cumpleFin = fin ? (t.fechafin <= fin) : true;
        return cumpleInicio && cumpleFin;
    });
    dibujarMarcadores(filtrados);
}
