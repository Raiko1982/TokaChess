# Un pequeño buscador para TokaChess
torneos = ["Madrid Open", "Torneo de Invierno", "Copa del Rey", "Blitz Nocturno"]

print("--- Bienvenido al buscador de TokaChess ---")
busqueda = input("Introduce el nombre del torneo: ")

if busqueda in torneos:
    print(f"¡Genial! El torneo '{busqueda}' está disponible.")
else:
    print("Lo siento, no hemos encontrado ese torneo.")
