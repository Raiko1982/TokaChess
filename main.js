/**
 * TokaChess - Main JavaScript
 */

// --- Variables Globales ---
let map;
let markersLayer; 
let torneosData = []; 
let translations = {}; 
let currentLang = 'es'; 

// --- 1. Inicialización ---
document.addEventListener('DOMContentLoaded', async () => {
    await cargarTraducciones();
    initMap();
    initForm();
    setupEventListeners();
    actualizarTextosInterfaz();
});

async function initForm(){
    document.getElementById("fechaInicio").value = new Date();
    document.body.classList.toggle("dark");
}

// --- 2. Carga de Idiomas ---
async function cargarTraducciones() {
    try {
        const response = await fetch(`translations.json?v=${new Date().getTime()}`);
        if (!response.ok) throw new Error("No se pudo cargar el archivo de traducciones");
        translations = await response.json();
    } catch (e) { 
        console.error("Error cargando translations.json:", e);
        // Fallback manual en caso de error de red
        translations = { 
            es: { 
                details: "Detalles del torneo", 
                not_found: "Ciudad no encontrada", 
                start_label: "FECHA INICIO", 
                end_label: "FECHA FIN" 
            }, 
            en: { 
                details: "Tournament details", 
                not_found: "City not found", 
                start_label: "START DATE", 
                end_label: "END DATE" 
            } 
        };
    }
}

// --- 3. Configuración del Mapa ---
function initMap() {
    map = L.map('map', { 
        zoomControl: false,
        minZoom: 2 
    }).setView([40.4637, -3.7492], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    markersLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 16 
    });

    map.addLayer(markersLayer);
    L.control.zoom({ position: 'topright' }).addTo(map);

    cargarTorneos();
}

// --- 4. Gestión de Eventos ---
function setupEventListeners() {
    document.getElementById('toggleSidebar').addEventListener('click', toggleSidebar);
    document.getElementById('btnBuscar')?.addEventListener('click', buscarCiudad);
    document.getElementById('btnLocate')?.addEventListener('click', filtrarPorPosicion);
    document.getElementById('btnFiltrar')?.addEventListener('click', aplicarFiltros);
    document.getElementById('btnReset')?.addEventListener('click', resetearFiltros);
    
    document.getElementById('langSelect')?.addEventListener('change', (e) => {
        currentLang = e.target.value;
        actualizarTextosInterfaz();
        dibujarMarcadores(torneosData); 
    });

    document.getElementById('buscarCiudad')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') buscarCiudad();
    });
}

// --- 5. Motor de Traducción ---
function actualizarTextosInterfaz() {
    const texts = translations[currentLang];
    if (!texts) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (texts[key]) {
            if (el.tagName === 'INPUT') el.placeholder = texts[key];
            else el.innerText = texts[key];
        }
    });
}

/**
 * Formatea la fecha para el diseño de calendario.
 * Soporta YYYY-MM-DD y DD/MM/YYYY
 */
function formatearFechaVisual(fechaStr) {
    if (!fechaStr) return { dia: '??', resto: '??/??' };
    const sep = fechaStr.includes('-') ? '-' : '/';
    const partes = fechaStr.split(sep);
    if (partes.length < 3) return { dia: fechaStr, resto: '' };

    if (partes[0].length === 4) { // ISO
        return { dia: partes[2], resto: `${partes[1]}/${partes[0].substring(2)}` };
    } 
    return { dia: partes[0], resto: `${partes[1]}/${partes[2].substring(2)}` };
}

// --- 6. Manejo de Marcadores ---
async function cargarTorneos() {
    try {
        const response = await fetch('torneos.json');
        if (!response.ok) throw new Error("Error cargando torneos.json");
        torneosData = await response.json();
        console.log(JSON.stringify(torneosData, null, 2));
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
    const texts = translations[currentLang] || {};
    const chessIcon = crearIconoAjedrez();
    const marcadoresNuevos = [];

    datos.forEach(t => {
        // Obtenemos los labels del JSON de traducción o usamos fallback
        const txtBoton = texts['details'] || "Detalles";
        const labelInicio = texts['start_label'] || "INICIO";
        const labelFin = texts['end_label'] || "FIN";

        const fIni = formatearFechaVisual(t.fechaini);
        const fFin = formatearFechaVisual(t.fechafin);

        const popupContent = `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 280px; border-radius: 12px; overflow: hidden;">
                <div style="padding: 18px 18px 5px 18px;">
                    <h6 style="margin: 0; font-size: 1.15rem; font-weight: 800; color: #1a1a1a; line-height: 1.2;">${t.nombre}</h6>
                    <div style="margin-top: 6px; font-size: 0.85rem; color: #777; display: flex; align-items: center; font-weight: 500;">
                        <span style="margin-right: 6px; filter: grayscale(1);">📍</span> ${t.ciudad}
                    </div>
                </div>
                <div style="padding: 15px 18px 18px 18px;">
                    <div style="display: flex; gap: 12px; margin-bottom: 18px;">
                        <div style="flex: 1; background: #f9fafb; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #edf2f7;">
                            <div style="font-size: 0.6rem; color: #a0aec0; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase;">${labelInicio}</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #2d3748; line-height: 1;">${fIni.dia}</div>
                            <div style="font-size: 0.75rem; color: #718096; font-weight: 600; margin-top: 2px;">${fIni.resto}</div>
                        </div>
                        <div style="flex: 1; background: #f9fafb; padding: 10px; border-radius: 10px; text-align: center; border: 1px solid #edf2f7;">
                            <div style="font-size: 0.6rem; color: #a0aec0; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 4px; text-transform: uppercase;">${labelFin}</div>
                            <div style="font-size: 1.3rem; font-weight: 800; color: #2d3748; line-height: 1;">${fFin.dia}</div>
                            <div style="font-size: 0.75rem; color: #718096; font-weight: 600; margin-top: 2px;">${fFin.resto}</div>
                        </div>
                    </div>
                    <a href="${t.link}" target="_blank" style="display: block; width: 100%; padding: 12px 0; background: #2c3e50; color: white; text-align: center; text-decoration: none; border-radius: 10px; font-size: 0.9rem; font-weight: 700; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                        ${txtBoton}
                    </a>
                </div>
            </div>`;
            
        const marker = L.marker([t.lat, t.lon], { icon: chessIcon }).bindPopup(popupContent, { maxWidth: 300 });
        marcadoresNuevos.push(marker);
    });

    markersLayer.addLayers(marcadoresNuevos);
}

// --- 7. Lógica de Interacción ---
function buscarCiudad() {
    const ciudad = document.getElementById("buscarCiudad").value;
    if (!ciudad) return;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${ciudad}`)
        .then(r => r.json()).then(data => {
            if (data.length > 0) map.setView([data[0].lat, data[0].lon], 13);
            else alert(translations[currentLang]?.['not_found'] || "Error");
        });
}

function filtrarPorPosicion() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 14);
    });
}

function aplicarFiltros() {
    const inicio = document.getElementById("fechaInicio").value;
    const fin = document.getElementById("fechaFin").value;
    const filtrados = torneosData.filter(t => {
        // Si no hay filtros puestos, mostramos todo
        if (!inicio && !fin) return true;

        // Si hay 'inicio', el torneo debe empezar después o ese mismo día
        const cumpleInicio = inicio ? (t.fechaini >= inicio) : true;

        // Si hay 'fin', el torneo debe terminar antes o ese mismo día
        const cumpleFin = fin ? (t.fechafin <= fin) : true;

        return cumpleInicio && cumpleFin;
    });
    console.log("filtrando");
    dibujarMarcadores(filtrados);
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const btn = document.getElementById("toggleSidebar");
    sidebar.classList.toggle("collapsed");
    btn.innerText = sidebar.classList.contains("collapsed") ? "▶" : "◀";
    setTimeout(() => map.invalidateSize(), 400);
}

function resetearFiltros() {
    document.getElementById("fechaInicio").value = "";
    document.getElementById("fechaFin").value = "";
    document.getElementById("buscarCiudad").value = "";
    dibujarMarcadores(torneosData);
}