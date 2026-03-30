import requests
from bs4 import BeautifulSoup
import json
import time
from geopy.geocoders import Nominatim
from datetime import datetime

def limpiar_fecha(fecha_str):    
    try:
        return datetime.strptime(fecha_str.strip(), "%Y-%m-%d").strftime("%d-%m-%Y")
    except:
        return fecha_str

def scrape_toka_chess():
    base = "https://info64.org"
    url = base + "/search?name=&city=&arbiter=&ttype=1&status=1"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TokaChessBot/1.0'}
    hoy = datetime.now().date()

    # Configuramos el geolocalizador
    geolocator = Nominatim(user_agent="TokaChessApp")
    
    try:
        print(f"Buscando torneos en {url}...")
        response = requests.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # En Info64 los torneos suelen estar en tablas estándar
        table = soup.find('table')
        if not table:
            print("No se encontró la tabla. Info64 podría estar caído o haber cambiado el diseño.")
            return

        filas = table.find_all('tr') # Cogemos los primeros 14 para no tardar mucho
        torneos_limpios = []

        for fila in filas:
            cols = fila.find_all('td')
            if len(cols) >= 2:
                # 1. Extraer datos básicos
                #id = cols[0].text.strip()
                nombre = cols[1].text.strip()
                link = base + cols[1].find("a")['href']
                # La ciudad suele venir con el país, ej: "Madrid (ESP)"
                lugar_raw = cols[2].text.strip().split('(')[0].strip()
                # Intentar sacar la fecha si existe en la columna 3
                fechaini = cols[5].text.strip() if len(cols) > 2 else "Fecha no disponible"
                fechafin = cols[6].text.strip() if len(cols) > 2 else "Fecha no disponible"
                #print(f"Fechaini: {fechaini} Fechafin: {fechafin}")
                #fecha_torneo_ini = datetime.strptime(fechaini, "%Y-%m-%d").date()
                fecha_torneo_fin = datetime.strptime(fechafin, "%Y-%m-%d").date()
                if fecha_torneo_fin < hoy: continue
                # 2. Geocodificación (Obtener Lat/Lon)
                try:
                    # Añadimos ", Spain" para ayudar al buscador a no irse a otro país
                    location = geolocator.geocode(f"{lugar_raw}, Spain", timeout=10)
                    if location:
                        lat, lon = location.latitude, location.longitude
                    else:
                        # Coordenadas por defecto (Centro de España) si no encuentra la ciudad
                        lat, lon = 40.4167, -3.7033 
                except:
                    lat, lon = 40.4167, -3.7033

                print(f"Procesando: {nombre} en {lugar_raw} lat {lat} y lon {lon}")

                torneos_limpios.append({
                    "origin": "info64",
                    "nombre": nombre,
                    "ciudad": lugar_raw,
                    "fechaini": limpiar_fecha(fechaini),
                    "fechafin": limpiar_fecha(fechafin),
                    "organizador": "-",
                    "ritmo": "-",
                    "lat": lat,
                    "lon": lon,
                    "link": link
                })
                
                # Muy importante: esperar 1 seg entre peticiones de mapas (norma de Nominatim)
                time.sleep(1.3)

        # 3. Guardar el resultado para el mapa
        with open('torneosInfo64.json', 'w', encoding='utf-8') as f:
            json.dump(torneos_limpios, f, ensure_ascii=False, indent=4)
        
        #print(f"\n✅ ¡Éxito! {len(torneos_limpios)} torneos listos en torneos.json")

    except Exception as e:
        print(f"Error fatal en el scraper: {e}")

if __name__ == "__main__":
    scrape_toka_chess()
