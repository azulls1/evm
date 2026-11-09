# -*- coding: utf-8 -*-
"""Contenido único de la Actividad 2 individual (MDGP). De aquí salen el .docx, el .pdf y el portal.
Las cifras NO se escriben a mano: vienen de calculos.py. Editar este archivo y correr construir.py."""
from calculos import A, B, P45, VEL, burnup, BAC, PV_MES, PV_ACUM, AC_MES, AC_ACUM, AVANCE_MES, AVANCE_ACUM, mx, r

PORTADA = {
    "universidad": "Universidad Internacional de La Rioja (UNIR) México",
    "programa": "Maestría en Inteligencia Artificial",
    "asignatura": "Metodología de Diseño y Gestión de Proyectos",
    "actividad": "Actividad 2 individual: Ejercicios de aplicación del método de gestión del valor ganado (EVM)",
    "alumno": "Adonai Samael Hernández Mata",
    "profesora": "Adriana Cervantes Castillo",
    "fecha": "Noviembre de 2026",
}

INTRODUCCION = (
    f"El proyecto es un desarrollo de software de seis meses con un presupuesto total (BAC) de {mx(BAC)}. "
    "Se aplica el método de gestión del valor ganado del Tema 5 (apartado 5.9), que compara al corte el valor "
    "planificado (PV), el coste real (AC) y el valor ganado (EV = BAC × % de avance real acumulado). "
    "Los costes se juzgan comparando EV con AC, y los plazos, comparando EV con PV."
)

# Fórmulas usadas (Tema 5, Tablas 9 a 12)
FORMULAS = [
    ("EV (valor ganado)", "BAC × % de avance real acumulado"),
    ("CV / CPI (coste)", "CV = EV − AC  ·  CPI = EV ÷ AC  (CPI < 1: por encima del presupuesto)"),
    ("SV / SPI (plazo)", "SV = EV − PV  ·  SPI = EV ÷ PV  (SPI < 1: retrasado)"),
    ("EAC según presupuesto original", "EAC = AC + (BAC − EV)"),
    ("Duración estimada", "Duración prevista ÷ SPI = 6 meses ÷ SPI"),
]

NOTA_AVANCE = (
    "El avance real del enunciado viene mes a mes; para el EV se usa el acumulado "
    f"({AVANCE_ACUM[2]} % al mes 3 y {AVANCE_ACUM[4]} % al mes 5), y PV y AC se toman también acumulados al mismo corte."
)


def tabla_indicadores(c):
    return [
        ("PV acumulado", mx(c["pv"])),
        ("AC acumulado", mx(c["ac"])),
        ("EV = " + mx(BAC) + f" × {c['avance']} %", mx(c["ev"])),
        ("CV = EV − AC", mx(c["cv"])),
        ("CPI = EV ÷ AC", r(c["cpi"])),
        ("SV = EV − PV", mx(c["sv"])),
        ("SPI = EV ÷ PV", r(c["spi"])),
        ("EAC = AC + (BAC − EV)", mx(c["eac_a"])),
        ("Duración estimada = 6 ÷ SPI", f"{r(c['duracion'], 2)} meses"),
    ]


PARTE_A = [
    ("1. ¿Va por encima o por debajo del presupuesto?",
     f"Por encima. CPI = {mx(A['ev'])} ÷ {mx(A['ac'])} = {r(A['cpi'])}, menor que 1: por cada peso gastado solo se ha "
     f"producido trabajo por valor de {r(A['cpi'], 2)} pesos. La variación de coste es CV = {mx(A['cv'])}: se ha gastado "
     f"{mx(-A['cv'])} más de lo que vale el trabajo hecho."),
    ("2. ¿Va retrasado o adelantado?",
     f"Retrasado. SPI = {mx(A['ev'])} ÷ {mx(A['pv'])} = {r(A['spi'])}, menor que 1: se ha completado el "
     f"{r(A['spi'] * 100, 1)} % del trabajo que el plan preveía para el mes 3. SV = {mx(A['sv'])}, que es el valor "
     "del trabajo programado que todavía no se ha hecho."),
    ("3. ¿Cuál será el coste estimado a la finalización (según el presupuesto original)?",
     f"EAC = AC + (BAC − EV) = {mx(A['ac'])} + ({mx(BAC)} − {mx(A['ev'])}) = {mx(A['eac_a'])}. Es la variante a) del "
     "Tema 5, que supone que el trabajo restante costará lo presupuestado; el sobrecoste esperado es "
     f"{mx(A['eac_a'] - BAC)} ({r((A['eac_a'] / BAC - 1) * 100, 1)} % sobre el BAC). Si la ineficiencia actual se "
     f"mantuviera (EAC = BAC ÷ CPI), el coste subiría a {mx(A['eac_b'])}: el escenario original es el optimista."),
    ("4. ¿Terminará con retraso o adelanto respecto a los seis meses?",
     f"Con retraso. Proyectando la duración con el SPI, 6 ÷ {r(A['spi'])} = {r(A['duracion'], 2)} meses: unos "
     f"{r(A['duracion'] - 6, 1)} meses (cerca de siete semanas) más de lo previsto si se mantiene el ritmo actual. "
     "Es una estimación, porque el Tema 5 no da una fórmula de plazo."),
    ("5. ¿Qué se podría hacer para controlar el proyecto?",
     None),  # se desarrolla en ESTRATEGIAS_A
]

ESTRATEGIAS_A_INTRO = (
    f"El proyecto tiene a la vez sobrecoste y retraso, y los dos superan con holgura un umbral típico del 10 %. "
    "Con base en los apartados 5.7 y 5.8 del Tema 5, la asignación de recursos del Tema 4 y la adaptación de "
    "metodologías del Tema 2, propongo tres estrategias:"
)
ESTRATEGIAS_A = [
    ("Acciones correctivas con umbrales de escalada (5.8).",
     "Al superar el umbral de tolerancia, el problema deja de ser solo del equipo y se informa a la dirección. Se "
     "analiza la causa de la desviación por paquete de trabajo, se acuerdan acciones correctivas y se revisan en "
     "reuniones periódicas de estado con un informe de valor ganado mensual y con hitos de control."),
    ("Control de cambios de alcance (5.7).",
     "Como el 80 % de los cambios viene del alcance, se congela el alcance comprometido, toda solicitud nueva pasa por "
     "evaluación de impacto en coste y plazo, se establecen cierres de aceptación formales de cada entregable y se "
     "evita el efecto gold plating, es decir, añadir trabajo que nadie pidió."),
    ("Recursos y paquetes pequeños en un enfoque híbrido (Temas 2 y 4, 5.8).",
     "Se mantiene el marco clásico (línea base, valor ganado y control de cambios) y el trabajo restante se ejecuta "
     "en iteraciones ágiles de dos semanas, con paquetes pequeños priorizados con el cliente y aceptados al cierre de "
     "cada una: así el avance real es verificable y el EV, fiable. Los perfiles más productivos pasan a la ruta "
     "crítica; añadir personas tiene un límite (ley de Brooks)."),
]

PARTE_B = [
    ("1. ¿Va por encima o por debajo del presupuesto?",
     f"Sigue por encima, pero mucho menos. CPI = {mx(B['ev'])} ÷ {mx(B['ac'])} = {r(B['cpi'])}, todavía menor que 1. "
     f"La variación de coste es CV = {mx(B['cv'])}, menos de la mitad de los {mx(-A['cv'])} del mes 3."),
    ("2. ¿Va retrasado o adelantado?",
     f"Sigue ligeramente retrasado. SPI = {mx(B['ev'])} ÷ {mx(B['pv'])} = {r(B['spi'])}, muy cerca de 1, con "
     f"SV = {mx(B['sv'])}: el retraso es ya de poco más del 1 % del trabajo planificado, frente al 21 % del mes 3."),
    ("3. ¿Cuál será el coste estimado a la finalización (según el presupuesto original)?",
     f"EAC = AC + (BAC − EV) = {mx(B['ac'])} + ({mx(BAC)} − {mx(B['ev'])}) = {mx(B['eac_a'])}: un sobrecoste previsto de "
     f"{mx(B['eac_a'] - BAC)} ({r((B['eac_a'] / BAC - 1) * 100, 1)} % sobre el BAC), frente a los "
     f"{mx(A['eac_a'] - BAC)} previstos en el mes 3. Con EAC = BAC ÷ CPI daría {mx(B['eac_b'])}: las dos variantes ya "
     "casi coinciden, señal de que la eficiencia se ha estabilizado."),
    ("4. ¿Terminará con retraso o adelanto respecto a los seis meses?",
     f"Con un retraso mínimo. 6 ÷ {r(B['spi'])} = {r(B['duracion'], 2)} meses, unos dos días más de lo previsto: "
     "en la práctica, terminaría en plazo si se mantiene el ritmo del último bimestre."),
    ("5. ¿Las medidas del mes 3 tuvieron un efecto positivo o negativo?",
     f"Positivo. Los dos índices mejoraron: el CPI pasó de {r(A['cpi'])} a {r(B['cpi'])} y el SPI de {r(A['spi'])} a "
     f"{r(B['spi'])}. Midiendo solo los meses 4 y 5, que es cuando actúan las medidas, se ganó trabajo por "
     f"{mx(P45['ev'])} gastando {mx(P45['ac'])} con un plan de {mx(P45['pv'])}: CPI del periodo = {r(P45['cpi'])} y "
     f"SPI del periodo = {r(P45['spi'])}, ambos por encima de 1. Eso redujo el sobrecoste previsto de {mx(A['eac_a'] - BAC)} a {mx(B['eac_a'] - BAC)} y casi "
     "eliminó el retraso. Aun así, el proyecto no se ha recuperado del todo: para cerrar dentro del BAC haría falta un "
     f"rendimiento de TCPI = {r(B['tcpi'], 2)} en el último mes, poco realista, por lo que conviene mantener las "
     "medidas y comunicar al cliente un coste final cercano a " + mx(B['eac_a']) + "."),
]

CONCLUSION = (
    "El valor ganado permitió detectar en el mes 3 un proyecto con sobrecoste y retraso importantes y proyectar sus "
    "consecuencias; en el mes 5, los mismos indicadores muestran que las acciones correctivas funcionaron. La lección "
    "es combinar enfoques: el marco clásico (línea base y valor ganado) mide con objetividad, y las iteraciones ágiles "
    "dan avances verificables y permiten reaccionar a tiempo."
)

REFERENCIAS = [
    "Project Management Institute. (2021). El estándar para la dirección de proyectos y Guía de los fundamentos "
    "para la dirección de proyectos (Guía del PMBOK®) (7.ª ed.). Project Management Institute.",
    "Universidad Internacional de La Rioja. (2026). Temas 2, 4 y 5: Metodologías y estándares de diseño y gestión de "
    "proyectos; Planificación del proyecto tecnológico; Ejecución, control y cierre del proyecto [Material de la "
    "asignatura Metodología de Diseño y Gestión de Proyectos]. UNIR México.",
]

# Tablas de datos del enunciado (para el portal y el anexo de datos)
DATOS = {"PV_MES": PV_MES, "PV_ACUM": PV_ACUM, "AC_MES": AC_MES, "AC_ACUM": AC_ACUM,
         "AVANCE_MES": AVANCE_MES, "AVANCE_ACUM": AVANCE_ACUM}


# ── Enfoque híbrido (ampliación del portal; en el documento: estrategia 3 de A5 y conclusión) ──
# Tema 2: no hay una metodología única; se toma de cada enfoque lo que el proyecto necesita («pick-and-choose»).
HIBRIDO = {
    "idea": (
        "No hay una metodología única: el Tema 2 pide adaptarla al proyecto y tomar de cada enfoque solo lo que hace "
        "falta. En este caso, el marco clásico del PMBOK® da la línea base contra la que se mide (el valor ganado no "
        "existe sin ella) y la ejecución ágil hace que el avance real sea trabajo terminado y aceptado, no una "
        "estimación de porcentaje. Las dos cosas juntas son las que permitieron corregir el proyecto entre el mes 3 y el 5."
    ),
    "clasico": [
        ("Línea base de coste y alcance", "BAC de $115 000 repartido en seis meses: la referencia del PV."),
        ("Valor ganado mensual con umbrales", "CPI y SPI en cada corte; por debajo de 0,90 se escala a la dirección (5.8)."),
        ("Control formal de cambios", "Toda petición nueva se evalúa en coste y plazo antes de entrar (5.7)."),
        ("Hitos e informes de estado", "Cortes de control en los meses 3 y 5 con informe a la dirección y al cliente."),
    ],
    "agil": [
        ("Iteraciones de dos semanas", "Doce iteraciones en seis meses; cada una cierra con un incremento utilizable."),
        ("Backlog priorizado con el cliente", "Los paquetes pequeños se ordenan por valor y riesgo antes de cada iteración."),
        ("Revisión y criterios de aceptación", "Solo cuenta como avance lo terminado y aceptado: el EV deja de ser una opinión."),
        ("Retrospectiva y reunión diaria", "Las acciones correctivas salen del propio equipo y se revisan cada dos semanas."),
    ],
    "encaje": [
        ("Plan", "La línea base fija BAC, plazo y alcance comprometido (clásico)."),
        ("Iterar", "El equipo ejecuta paquetes pequeños en iteraciones de dos semanas (ágil)."),
        ("Medir", "Lo aceptado en cada revisión es el avance real con el que se calcula el EV (puente)."),
        ("Controlar", "Al corte mensual, CPI y SPI deciden si se escala y qué se corrige (clásico)."),
        ("Adaptar", "La retrospectiva convierte la corrección en cambios concretos para la siguiente iteración (ágil)."),
    ],
    "iteraciones": {"semanas": 2, "por_mes": 2, "total": 12},
    "nota": (
        "Ampliación del portal: el pronóstico por velocidad y el burn-up no forman parte de las respuestas del documento, "
        "que siguen exactamente las fórmulas del Tema 5. La velocidad se mide en % del alcance terminado por mes (dos "
        "iteraciones)."
    ),
}
HIBRIDO_PRONOSTICOS = [
    {"mes": m, "desde": d, "ventana": "desde el inicio" if d == 1 else "últimos dos meses",
     "velocidad": float(v["velocidad"]), "falta": v["falta"], "duracion": float(v["duracion"])}
    for (m, d), v in VEL.items()
]
HIBRIDO_BURNUP = [{"mes": x["mes"], "plan": float(x["plan"]), "terminado": x["terminado"]} for x in burnup()]
