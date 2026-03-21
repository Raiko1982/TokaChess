import json
from datetime import datetime

# Configuración de archivos
archivo_entrada1 = 'torneosInfo64.json'
archivo_entrada2 = 'torneosChessResult.json'
archivo_salida = 'torneos.json'

try:
    # 1. Leer y combinar los datos de ambos archivos
    datos_totales = []
    
    for nombre_archivo in [archivo_entrada1, archivo_entrada2]:
        try:
            with open(nombre_archivo, 'r', encoding='utf-8') as f:
                contenido = json.load(f)
                # Si el archivo es una lista, la extendemos; si es un objeto único, lo añadimos
                if isinstance(contenido, list):
                    datos_totales.extend(contenido)
                else:
                    datos_totales.append(contenido)
        except FileNotFoundError:
            print(f"⚠️ Advertencia: No se encontró '{nombre_archivo}', se omitirá.")

    # 2. Ordenar la lista combinada por 'fechaini'
    # Usamos .strip() por si hay espacios y manejamos el valor por defecto
    datos_ordenados = sorted(
        datos_totales, 
        key=lambda x: datetime.strptime(x.get('fechaini', '31-12-9999').strip(), "%d-%m-%Y")
    )

    # 3. Guardar (esto sobrescribe/limpia el archivo torneos.json automáticamente)
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(datos_ordenados, f, indent=4, ensure_ascii=False)

    print(f"✅ ¡Éxito! Se han unido y ordenado {len(datos_ordenados)} torneos en '{archivo_salida}'.")

except ValueError as e:
    print(f"❌ Error de formato en alguna fecha: {e}")
except Exception as e:
    print(f"❌ Error inesperado: {e}")