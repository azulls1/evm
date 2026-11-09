# Requisitos Checklist: Portal ValorGanado · Control EVM

**Purpose**: validar la calidad de los requisitos de `spec.md` (completos, claros, medibles y coherentes con la constitución) antes de planear e implementar.
**Created**: 2026-10-26
**Feature**: [spec.md](../spec.md)

**Note**: `[x]` significa que el criterio de calidad del requisito se revisó y se cumple; no significa que la implementación esté terminada.

## Calidad del contenido

- [x] CHK001 La spec se centra en el valor para la profesora, el alumno y el visitante, no en la tecnología
- [x] CHK002 Todas las secciones obligatorias de la plantilla están completas
- [x] CHK003 La separación capa A (el caso del enunciado) / capa B (el portal) es explícita [spec §Input, FR-007]
- [x] CHK004 Laboratorio, contrafactual y simulación están marcados como ampliación y no sustituyen a las respuestas [US4, US5, FR-007]
- [x] CHK005 El stack queda fuera de la spec y vive en `plan.md` (excepciones: dominio provisional, fuente de contenido y lectura del .pdf, que son requisitos del encargo)

## Completitud de requisitos

- [x] CHK006 Los criterios C1 y C2 tienen página, tabla de cálculo y cinco respuestas [FR-003, FR-004, US1]
- [x] CHK007 El criterio C3 (extensión, formato, redacción) se comprueba contra el documento entregado [FR-010, FR-011]
- [x] CHK008 El origen único del contenido está definido (`fuente/calculos.py` y `fuente/contenido.py`) [FR-001]
- [x] CHK009 La regla del avance acumulado está escrita y comprobada [FR-005, D.1]
- [x] CHK010 La EAC exigida (variante a) y la duración (6 ÷ SPI, como estimación) están fijadas [FR-006, Assumptions]
- [x] CHK011 Los rangos del escenario y de la simulación están cerrados y su error definido [FR-012, FR-014]
- [x] CHK012 Las reglas del modelo de simulación (ritmo observado, ventana, dispersión mínima, salidas) están escritas [FR-016, research R5]
- [x] CHK013 Requisitos de seguridad (cabecera anti-CSRF, límite por IP) y salud presentes [FR-021, FR-024]
- [x] CHK014 Accesibilidad, movimiento reducido e idioma con norma medible (WCAG 2.1 AA, 360 px, español MX) [FR-020, FR-023]

## Claridad y medibilidad

- [x] CHK015 Cada historia tiene prioridad, justificación y prueba independiente
- [x] CHK016 Los escenarios de aceptación citan cifras verificables (CPI 0,734 y 0,929; SPI 0,788 y 0,989; EAC $130 450 y $122 000; 7,61 y 6,07 meses; meses 4–5 CPI 1,206 y SPI 1,268)
- [x] CHK017 Los criterios de éxito son medibles y no dependen de la implementación [SC-001–SC-009]
- [x] CHK018 No quedan marcadores [NEEDS CLARIFICATION]

## Casos límite

- [x] CHK019 Fallo de base, de Redis y del worker cubiertos con comportamiento definido
- [x] CHK020 Escenarios incoherentes (422) e índices sin definir (`null`, «—») definidos
- [x] CHK021 Ráfagas (429), escrituras sin cabecera (403), rutas fuera del catálogo (404) y paquetes expirados (404/410) definidos

## Coherencia con la constitución

- [x] CHK022 Regla de las dos capas: ningún requisito presenta la simulación como respuesta del documento
- [x] CHK023 Principio I: ningún requisito pide escribir texto académico en el código
- [x] CHK024 Principio II: indicadores y cumplimiento se piden recalculados; la base guarda datos, no resultados [FR-008–FR-010]
- [x] CHK025 Principio III: RLS y secretos verificables por un criterio de éxito [SC-007]
- [x] CHK026 Principio V: despliegue reproducible con criterio de éxito [SC-008]

## Notes

- Iteración 1: todos los puntos pasan. El enunciado (`../enunciado/`), su desglose (`../README.md`), `docs/DISENO.md` y la fuente resuelven alcance, datos y destino.
- Pendiente de operación (no de requisitos): el dominio definitivo; mientras tanto se usa `evm.iagentek.com.mx`.
