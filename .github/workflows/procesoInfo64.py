import json

# 1. Definimos la lista de torneos (datos de origen)
lista_torneos = [
    {
        "nombre": "Open Madrid",
        "ciudad": "Madrid",
        "lat": 40.4168,
        "lon": -3.7038,
        "fecha": "2026-04-20"
    },
    {
        "nombre": "Barcelona Masters",
        "ciudad": "Barcelona",
        "lat": 41.3851,
        "lon": 2.1734,
        "fecha": "2026-05-15"
    },
    {
        "nombre": "Valencia Rapid",
        "ciudad": "Valencia",
        "lat": 39.4699,
        "lon": -0.3763,
        "fecha": "2026-06-10"
    },
    {
        "nombre": "Bilbao Open",
        "ciudad": "Bilbao",
        "lat": 43.2630,
        "lon": -2.9350,
        "fecha": "2026-07-05"
    }
]

# 2. Especificamos el nombre del archivo de salida
nombre_archivo = "torneos.json"

# 3. Abrimos el archivo en modo escritura ('w' de write) y volcamos los datos
with open(nombre_archivo, "w", encoding="utf-8") as archivo:
    # ensure_ascii=False permite que se guarden bien las tildes
    # indent=4 hace que el archivo sea fácil de leer para humanos
    json.dump(lista_torneos, archivo, ensure_ascii=False, indent=4)

print(f"¡Éxito! El archivo {nombre_archivo} ha sido creado correctamente.")
