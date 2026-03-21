import json
from datetime import datetime

# Nombre del archivo
archivo_entrada = 'torneos.json'
archivo_salida = 'torneos.json'

try:
    # 1. Leer el archivo JSON
    with open(archivo_entrada, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    # 2. Ordenar por 'fechaini' convirtiendo a objeto datetime
    # Si la fecha no existe, usamos una fecha muy lejana para mandarlo al final
    datos_ordenados = sorted(
        datos, 
        key=lambda x: datetime.strptime(x.get('fechaini', '31-12-9999'), "%d-%m-%Y")
    )

    # 3. Guardar el resultado
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(datos_ordenados, f, indent=4, ensure_ascii=False)

    print(f"✅ ¡Éxito! Se han ordenado {len(datos_ordenados)} torneos.")

except FileNotFoundError:
    print(f"❌ Error: No se encontró el archivo '{archivo_entrada}'.")
except ValueError as e:
    print(f"❌ Error de formato: Asegúrate de que las fechas sean DD-MM-YYYY. Detalle: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")