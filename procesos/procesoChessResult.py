import requests
import re
import time
import json
from datetime import datetime
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
from dateutil.relativedelta import relativedelta

# Configuración inicial
URL_BASE = "https://s3.chess-results.com/turniersuche.aspx?lan=2"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8,eu;q=0.7,fr;q=0.6"
}

def extraer_campo(html, field_id):
    """Equivalente al método extraerCampo en Java usando Regex"""
    pattern = f'id="{field_id}" value="([^"]*)"'
    match = re.search(pattern, html)
    return match.group(1) if match else ""

def limpiar_fecha(fecha_str):    
    try:
        return datetime.strptime(fecha_str.strip(), "%Y/%m/%d").strftime("%d-%m-%Y")
    except:
        return fecha_str

def main():
    # Creamos una sesión para que gestione las cookies automáticamente
    session = requests.Session()    
    session.headers.update(HEADERS)
    geolocator = Nominatim(user_agent="TokaChessApp_CR")
    hoy_dt = datetime.now() 
    try:
        # --- PASO 1: GET para obtener tokens ---
        print("Obteniendo tokens de sesión...")
        response_get = session.get(URL_BASE)
        response_get.raise_for_status() # Verifica si hubo error HTTP
        
        html = response_get.text
        view_state = extraer_campo(html, "__VIEWSTATE")
        view_state_gen = extraer_campo(html, "__VIEWSTATEGENERATOR")
        event_validation = extraer_campo(html, "__EVENTVALIDATION")

        print("Tokens obtenidos con éxito.")
        time.sleep(1) # Pausa para parecer humano

        # --- PASO 2: POST con los datos reales ---
        # Fechas
        hoy = datetime.now()
        un_anio_despues = hoy + relativedelta(years=1)
        formato = "%Y-%m-%d"

        # Organización de parámetros (el orden no suele importar en Python dict, 
        # pero requests lo maneja correctamente)
        payload = {
            "__EVENTTARGET": "",
            "__EVENTARGUMENT": "",
            "__LASTFOCUS": "",
            "__VIEWSTATE": view_state,
            "__VIEWSTATEGENERATOR": view_state_gen,
            "__EVENTVALIDATION": event_validation,
            "ctl00$P1$txt_leiter": "",
            "ctl00$P1$cb_suchen": "Buscar",
            "ctl00$P1$combo_art": "5",
            "ctl00$P1$combo_sort": "3",
            "ctl00$P1$combo_land": "ESP",
            "ctl00$P1$combo_bedenkzeit": "0",
            "ctl00$P1$combo_anzahl_zeilen": "5",
            "ctl00$P1$txt_tnr": "",
            "ctl00$P1$txt_bez": "",
            "ctl00$P1$txt_veranstalter": "",
            "ctl00$P1$txt_Hauptschiedsrichter": "",
            "ctl00$P1$txt_Schiedsrichter": "",
            "ctl00$P1$txt_ort": "",
            "ctl00$P1$txt_von_tag": hoy.strftime(formato),
            "ctl00$P1$txt_bis_tag": un_anio_despues.strftime(formato),
            "ctl00$P1$txt_eventid": ""
        }

        print(f"Realizando búsqueda para el periodo: {payload['ctl00$P1$txt_von_tag']} a {payload['ctl00$P1$txt_bis_tag']}")
        
        # Requests se encarga de codificar el diccionario como application/x-www-form-urlencoded
        response_post = session.post(URL_BASE, data=payload)       
        print(f"Código HTTP: {response_post.status_code}")
        # Imprimir el HTML resultante
        print(response_post.text)

        soup = BeautifulSoup(response_post.text, 'html.parser')
        tabla = soup.find('table', {'class': 'CRs2'})
        if not tabla:
            print("No se encontró la tabla de resultados.")
            return
        hoy = datetime.now().date()
        filas = tabla.find_all('tr')[1:] # Saltamos cabecera
        torneos_limpios = []
        for fila in filas:
            cols = fila.find_all('td')
            if len(cols) >= 8:
                # Mapeo de columnas en Chess-Results (ajustar si varían)
                # Col 2: Nombre, Col 3: Ciudad/Org, Col 4: Fecha Ini, Col 5: Fecha Fin
                #id = cols[0].text.strip()
                nombre = cols[1].text.strip()
                lugar_raw = cols[12].text.strip()
                fecha_ini_raw = cols[5].text.strip()                 
                if datetime.strptime(fecha_ini_raw, "%Y/%m/%d").date() < hoy: continue
                fecha_fin_raw = cols[6].text.strip()
                organizador = cols[8].text.strip()
                ritmo = cols[13].text.strip()
                # Intentar sacar el link (suele estar en el nombre)
                link_tag = cols[1].find('a')
                link = "https://chess-results.com/" + link_tag['href'] if link_tag else URL_BASE

                # Geocodificación
                print(f"Procesando: {nombre} en {lugar_raw}...")
                try:
                    location = geolocator.geocode(f"{lugar_raw}, Spain", timeout=10)
                    lat, lon = (location.latitude, location.longitude) if location else (40.4167, -3.7033)
                except:
                    lat, lon = 40.4167, -3.7033

                torneos_limpios.append({
                    "origin": "chess-results",
                    #"id": "CR-" + re.findall(r'tnr=(\d+)', link)[0] if "tnr=" in link else "N/A",
                    "nombre": nombre,
                    "ciudad": lugar_raw,
                    "fechaini": limpiar_fecha(fecha_ini_raw),
                    "fechafin": limpiar_fecha(fecha_fin_raw),
                    "organizador": organizador,
                    "ritmo": ritmo,
                    "lat": lat,
                    "lon": lon,
                    "link": link
                })
                
                time.sleep(1.3) # Respetar Nominatim

        # --- PASO 3: Guardar JSON ---
        with open('torneosChessResult.json', 'w', encoding='utf-8') as f:
            json.dump(torneos_limpios, f, ensure_ascii=False, indent=4)
      
    except Exception as e:
        print(f"Ocurrió un error: {e}")

if __name__ == "__main__":
    main()
