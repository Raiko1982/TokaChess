/**
 * TokaChess - Gestión de Torneos de Ajedrez con Leaflet
 * @author TuNombre/Equipo
 * @version 1.1.0
 */
const hoy = new Date().toISOString().split('T')[0];
const TokaChess = {
    // --- Estado de la Aplicación ---
    state: {
        map: null,
        markersLayer: null,
        torneosData: [],
        cityCoords: { lat: null, lon: null },
        radioMaxKm: 100,
        config: {
            tileLayer: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            mapCenter: [40.41, -2.70],
            defaultZoom: 6.8
        }
    },

    /**
     * Inicializa la aplicación cargando eventos y componentes.
     */
    async init() {
        this.initEventListeners();
        this.initMap();
        this.initCityAutocomplete();
        await this.fetchTorneos();
    },

    /**
     * Configura todos los escuchadores de eventos del DOM.
     */
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Filtros principales
            const btnFiltrar = document.getElementById('btnFiltrar');
            btnFiltrar?.addEventListener('click', () => this.aplicarFiltros());
            const btnLimpiar = document.getElementById('btnLimpiar');
            btnLimpiar?.addEventListener('click', () => this.limpiarFiltros());

            // Filtros rápidos con tecla Enter
            const inputs = ['#nombreFilter', '#dateInitFilter', '#dateEndFilter'];
            inputs.forEach(selector => {
                document.querySelector(selector)?.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.aplicarFiltros();
                    }
                });
            });

            // Restricciones de fechas
            document.getElementById('dateInitFilter').setAttribute('min', hoy);
            document.getElementById('dateEndFilter').setAttribute('min', hoy);
            document.getElementById('dateInitFilter')?.addEventListener('change', () => this.syncDateConstraints());
            document.getElementById('dateEndFilter')?.addEventListener('change', () => this.syncDateConstraints());
        });
    },

    // --- Core: Mapa y Datos ---

    /**
     * Inicializa el mapa de Leaflet y la capa de clusters.
     */
    initMap() {
        const { config } = this.state;
        this.state.map = L.map('map', {
            zoomControl: false
        }).setView(config.mapCenter, config.defaultZoom);

        L.tileLayer(config.tileLayer, {
            attribution: '© CartoDB',
            maxZoom: 20
        }).addTo(this.state.map);

        L.control.zoom({ position: 'bottomright' }).addTo(this.state.map);

        this.state.markersLayer = L.markerClusterGroup({
            maxClusterRadius: 40,
            disableClusteringAtZoom: 15,
            showCoverageOnHover: false
        });

        this.state.map.addLayer(this.state.markersLayer);
    },

    /**
     * Carga los datos de torneos desde el origen JSON.
     */
    async fetchTorneos() {
        try {
            const response = await fetch('torneos.json');
            if (!response.ok) throw new Error("No se pudo cargar el archivo de torneos.");
            this.state.torneosData = await response.json();
            this.renderizar(this.state.torneosData);
        } catch (error) {
            console.error("Error TokaChess:", error);
        }
    },

    // --- UI: Renderizado ---

    /**
     * Dibuja los marcadores en el mapa y actualiza la tabla de resultados.
     * @param {Array} datos Lista de torneos filtrada o completa.
     */
    renderizar(datos) {
        this.state.markersLayer.clearLayers();
        const tableBody = document.getElementById('tableBody');
        if (tableBody) tableBody.innerHTML = '';

        const chessIcon = this.createChessIcon();

        const markers = datos.map(t => {
            this.appendTableRow(t, tableBody);

            // 1. Creamos el marcador
            const marker = L.marker([t.lat, t.lon], { icon: chessIcon });

            // 2. Vinculamos el popup con una configuración más cómoda
            marker.bindPopup(this.createPopupContent(t), {
                maxWidth: 300,
                closeButton: true, // Opcional: queda más limpio para hover
                offset: L.point(0, 10) // Evita que el popup tape el marcador
            });

            // 3. Añadimos el evento para abrir al pasar el ratón
            /*marker.on('mouseover', function (e) {
                this.openPopup();
            });

            // NOTA: Si quieres que se cierre al quitar el ratón, añade esto:
            
            marker.on('mouseout', function (e) {
                this.closePopup();
            });
            */

            return marker;
        });

        this.state.markersLayer.addLayers(markers);
    },

    /**
     * Crea el SVG personalizado para el marcador.
     * @returns {L.DivIcon}
     */
    createChessIcon() {
        const pinColor = "#2c3e50";
        const svg = `
            <svg viewBox="0 0 365 560" xmlns="http://www.w3.org/2000/svg">
                <path d="M182.9 559.2C182.9 559.2 0 341.1 0 182.9 0 81.9 81.9 0 182.9 0s182.9 81.9 182.9 182.9c0 158.2-182.9 376.3-182.9 376.3z" fill="rgba(0,0,0,0.2)"/>
                <path d="M182.9 519.2C182.9 519.2 20 311.1 20 162.9 20 71.9 91.9 0 182.9 0s162.9 71.9 162.9 162.9c0 148.2-162.9 356.3-162.9 356.3z" fill="${pinColor}"/>
                <circle cx="182.9" cy="162.9" r="120" fill="white"/>
                <path d="M183 70c-22.1 0-40 17.9-40 40 0 11.2 4.6 21.3 12.1 28.6-8.3 5.4-13.8 14.7-13.8 25.2v26.2H120v20h126v-20h-21.3v-26.2c0-10.5-5.5-19.8-13.8-25.2 7.5-7.3 12.1-17.4 12.1-28.6 0-22.1-17.9-40-40-40zm0 20c11 0 20 9 20 20s-9 20-20 20-20-9-20-20 9-20 20-20zm0 60c9.1 0 16.5 7.4 16.5 16.5v27.7h-33v-27.7c0-9.1 7.4-16.5 16.5-16.5z" fill="${pinColor}"/>
            </svg>`;
        return L.divIcon({
            className: 'custom-chess-pin',
            iconSize: [32, 49],
            iconAnchor: [16, 49],
            popupAnchor: [0, -49],
            html: svg
        });
    },

    /**
     * Construye el HTML del Popup de forma limpia.
     */
    createPopupContent(t) {
        // Función para verificar que el campo no sea nulo, vacío o un guion
        const isValid = (val) => val && val !== "" && val !== "-";
        const formatDate = (dateStr) => isValid(dateStr) ? dateStr : '-';

        // Estilo común para alinear iconos de Bootstrap inline con texto
        const iconStyle = "margin-right: 4px; vertical-align: -0.125em; color: #718096;";

        return `
        <div class="tc-popup" style="font-family: system-ui, -apple-system, sans-serif; width: 260px; line-height: 1.4;">
            <h6 style="margin:0; font-size: 1rem; font-weight:800; color: #1a202c;">${t.nombre}</h6>
            
            ${isValid(t.organizador) ? `<div style="color:#718096; font-size:0.75rem; margin-bottom: 4px;">${t.organizador}</div>` : ''}
            
            ${isValid(t.ciudad) || isValid(t.ritmo) ? `
                <div style="margin-top:8px; font-size:0.85rem; color: #2d3748;">
                    ${isValid(t.ciudad) ? `<div style="margin-bottom: 3px;"><i class="bi bi-geo-alt-fill" style="${iconStyle}"></i><strong>${t.ciudad}</strong></div>` : ''}
                    
                    ${isValid(t.ritmo) ? `<div><i class="bi bi-stopwatch" style="${iconStyle}"></i><span style="color: #4a5568;">Ritmo:</span> ${t.ritmo}</div>` : ''}
                </div>
            ` : ''}

            <div style="display:flex; gap:8px; margin-top:12px; background:#f7fafc; padding:10px; border-radius:8px; border:1px solid #edf2f7; text-align:center;">
                <div style="flex:1;">
                    <small style="display:block; font-size:0.65rem; font-weight: 700; color:#a0aec0; text-transform: uppercase;">Inicio</small>
                    <strong style="font-size: 0.8rem; color: #2d3748;">${formatDate(t.fechaini)}</strong>
                </div>
                <div style="width: 1px; background: #edf2f7;"></div>
                <div style="flex:1;">
                    <small style="display:block; font-size:0.65rem; font-weight: 700; color:#a0aec0; text-transform: uppercase;">Fin</small>
                    <strong style="font-size: 0.8rem; color: #2d3748;">${formatDate(t.fechafin)}</strong>
                </div>
            </div>

            ${isValid(t.link) ? `
                <a href="${t.link}" target="_blank" rel="noopener" 
                   style="display:block; margin-top:12px; padding:10px; background:#1a202c; color:#fff; text-align:center; border-radius:8px; text-decoration:none; font-size:0.8rem; font-weight:600; transition: opacity 0.2s;">
                   Ver detalles
                </a>` : ''}
        </div>`;
    },

    /**
     * Inserta una fila en la tabla de torneos.
     */
    appendTableRow(t, tableBody) {
        if (!tableBody) return;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="badge bg-secondary">${t.origin || 'N/A'}</span></td>
            <td>${t.fechaini || '-'}</td>
            <td>${t.fechafin || '-'}</td>
            <td>${t.link ? `<a href="${t.link}" target="_blank" class="text-decoration-none">${t.nombre}</a>` : t.nombre}</td>
            <td><small>${t.ritmo || '-'}</small></td>
            <td><small>${t.organizador || '-'}</small></td>
            <td><i class="bi bi-geo-alt-fill text-danger"></i> <a target="_blank" href="https://www.google.com/maps?q=${t.lat},${t.lon}">${t.ciudad || '-'}</a></td>
        `;
        tableBody.appendChild(row);
    },

    // --- Lógica de Negocio: Filtros y Cálculos ---

    /**
     * Aplica la lógica de filtrado por nombre, fecha y proximidad.
     */
    aplicarFiltros() {
        this.toggleLoader(true);

        setTimeout(() => {
            const query = document.getElementById("nombreFilter").value.toLowerCase().trim();
            const startLimit = document.getElementById("dateInitFilter").value;
            const endLimit = document.getElementById("dateEndFilter").value;

            const filtrados = this.state.torneosData.filter(t => {
                const matchesName = t.nombre.toLowerCase().includes(query);

                // Fechas
                const tStart = this.parseFecha(t.fechaini);
                const tEnd = this.parseFecha(t.fechafin);
                const fStart = startLimit ? new Date(startLimit) : null;
                const fEnd = endLimit ? new Date(endLimit) : null;

                const matchesStart = fStart && tStart ? tStart >= fStart : true;
                const matchesEnd = fEnd && tEnd ? tEnd <= fEnd : true;

                // Distancia
                let matchesDist = true;
                if (this.state.cityCoords.lat && t.lat) {
                    const d = this.getHaversineDistance(
                        this.state.cityCoords.lat, this.state.cityCoords.lon,
                        parseFloat(t.lat), parseFloat(t.lon)
                    );
                    matchesDist = d <= this.state.radioMaxKm;
                }

                return matchesName && matchesStart && matchesEnd && matchesDist;
            });

            this.renderizar(filtrados);
            this.toggleLoader(false);

            //if (filtrados.length > 0) {
            //    const group = L.featureGroup(this.state.markersLayer.getLayers());
            //    this.state.map.flyToBounds(group.getBounds(), { padding: [5, 5], duration: 0.5 });
            //}

            if (window.innerWidth <= 768) this.toggleSidebar(false);
        }, 400);
    },

    limpiarFiltros() {
        document.getElementById("nombreFilter").value = "";
        document.getElementById("dateInitFilter").type = "text";
        document.getElementById("dateEndFilter").type = "text";
        document.getElementById("dateInitFilter").value = "";
        document.getElementById("dateEndFilter").value = "";
        document.getElementById("cityFilter").value = "";
        this.state.cityCoords = { lat: null, lon: null };
        this.syncDateConstraints();
        this.aplicarFiltros();
    },

    /**
     * Calcula distancia entre dos puntos (Haversine).
     */
    getHaversineDistance(lat1, lon1, lat2, lon2) {
        const toRad = x => (x * Math.PI) / 180;
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    /**
     * Convierte string DD-MM-YYYY a objeto Date.
     */
    parseFecha(str) {
        if (!str || str === '-') return null;
        const [d, m, y] = str.split('-');
        return new Date(`${y}-${m}-${d}`);
    },

    // --- Helpers de UI ---

    toggleLoader(show) {
        const mapDiv = document.getElementById('map');
        if (show) {
            mapDiv.classList.add('map-updating');
            const loader = document.createElement('div');
            loader.id = "map-loader-overlay";
            loader.innerHTML = `<div class="chess-spinner"></div><span class="loader-text">Actualizando...</span>`;
            mapDiv.parentElement.appendChild(loader);
        } else {
            mapDiv.classList.remove('map-updating');
            document.getElementById('map-loader-overlay')?.remove();
        }
    },

    syncDateConstraints() {
        const startInput = document.getElementById('dateInitFilter');
        const endInput = document.getElementById('dateEndFilter');
        if (startInput.value) {          
            endInput.min = startInput.value;
        } else {
            startInput.min = hoy;
            endInput.min = hoy;
        }
        if (endInput.value) {
            startInput.max = endInput.value;
        } else {
            if(!startInput.value) endInput.min = hoy;
            startInput.max = "";
        }
    },

    initCityAutocomplete() {
        const input = document.getElementById('cityFilter');
        const suggestions = document.getElementById('citySuggestions');
        let timer;

        input?.addEventListener('input', () => {
            clearTimeout(timer);
            const query = input.value.trim();
            if (query.length < 3) return suggestions.classList.add('d-none');

            timer = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&featuretype=settlement&q=${query}&limit=5`);
                    const data = await res.json();
                    this.renderCitySuggestions(data, suggestions, input);
                } catch (err) { console.error("Error Nominatim", err); }
            }, 400);
        });
    },

    renderCitySuggestions(data, container, input) {
        container.innerHTML = '';

        if (!data.length) return container.classList.add('d-none');

        container.classList.remove('d-none');

        // Usamos un Set para rastrear los nombres que ya hemos procesado
        const seenNames = new Set();

        data.forEach(place => {
            const cityName = place.display_name.split(',')[0];

            // Si ya añadimos esta ciudad, saltamos a la siguiente iteración
            if (seenNames.has(cityName)) return;

            // Si es nueva, la registramos en el Set
            seenNames.add(cityName);

            const btn = document.createElement('button');
            btn.className = 'list-group-item list-group-item-action small bg-dark text-white border-secondary';
            btn.textContent = cityName;

            btn.onclick = () => {
                input.value = cityName;
                this.state.cityCoords = { lat: parseFloat(place.lat), lon: parseFloat(place.lon) };
                this.state.map.panTo([place.lat, place.lon]);
                container.classList.add('d-none');
                this.aplicarFiltros();
            };

            container.appendChild(btn);
        });
    }
};

// Iniciar app
TokaChess.init();

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
    } else {
        tableDiv.classList.remove('d-none');
        mapDiv.style.visibility = 'hidden';
        btnTable.classList.replace('btn-light', 'btn-primary');
        btnMap.classList.replace('btn-primary', 'btn-light');
    }
}

// Funciones para el Menú Móvil
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('sidebar-overlay').classList.toggle('active');
}