# Plan del proyecto — Tablero local de gastos

## Visión

**Qué es.** Una página web **local**, construida con Node, que carga CSVs de transacciones con el formato del generador de este repo (`generador/`, en Python) y los convierte en un **dashboard con filtros** para que las métricas de gasto sean fáciles de digerir.

**Qué problema resuelve.** Hoy el CSV es una tabla de ~20 000 filas imposible de leer a ojo. El tablero sirve para entender los hábitos de gasto propios o para analizar patrones de gasto de otra persona. Es el primer intento: no hay nada previo descartado.

**Para quién.** Para mí solo, en laptop, una vez al mes (al cerrar el mes o al recibir un CSV nuevo).

**Datos.**
- CSV con el formato del generador, un mes por archivo (~20 000 filas, ~2.5 MB).
- Para datos reales se toleran columnas opcionales (por ejemplo, sin coordenadas o sin zona).
- Los datos **nunca salen de la máquina**.
- Se guarda un **historial de meses en disco** para compararlos.

**Restricciones innegociables.**
- Cero red en ejecución.
- La interfaz se abre en el navegador.
- Arranca con un solo comando.
- La página web está hecha con Node.

**Preferencias.** Interfaz en español de México (MXN, fechas dd/mm/aaaa). $0 de presupuesto. Sin fecha límite.

**Éxito a tres meses.** Un reporte presentable que funciona con el CSV sintético y con datos reales en el mismo formato.

**Demostración.** Al cerrar cada fase se genera un CSV con semilla fija, se carga y el tablero deja ver los patrones que el generador imprime con `-v`.

## Alcance del MVP

Los ocho flujos son MVP; el orden lo fija la tabla de fases.

1. **Cargar y validar un CSV:** columnas obligatorias y opcionales, filas inválidas reportadas, y guardado como un mes del historial.
2. **Dashboard del mes:**
   - KPIs: gasto total, número de transacciones, ticket promedio, mediana y promedio diario.
   - Gráficas por categoría, día, hora, día de la semana, zona y cuenta.
3. **Filtros** por rango de fechas, categoría, cuenta, zona y monto. Todo el dashboard se recalcula.
4. **Comparar meses** del historial: diferencias por categoría y totales.
5. **Detalle de transacciones:** tabla filtrable y ordenable.
6. **Mapa de gasto** por latitud y longitud, dibujado localmente sin teselas en línea.
7. **Hallazgos automáticos:** categoría dominante, zona favorita, quincena, fin de semana, viaje y atípicos.
8. **Exportar reporte:** HTML autocontenido que se abre sin conexión y se imprime a PDF desde el navegador.

## Fuera de alcance

- Importar exportaciones de bancos con otros formatos.
- Editar o recategorizar transacciones dentro de la herramienta.
- Presupuestos, metas, alertas y proyecciones.
- Multiusuario, cuentas y login.
- Cambiar el generador de Python (sigue siendo una herramienta aparte; solo se mueve de carpeta).

## Fases

| Fase | Objetivo | Entregable demostrable | Fuera de alcance | Decisiones cerradas |
|---|---|---|---|---|
| 0 | Andamiaje y mecánica | Generador movido a `generador/` sin cambios de lógica, con el README actualizado, `generador/fixtures.sh` y fixtures con semilla commiteados. Proyecto Node/TS/Vite/React con una página vacía. Gate verde: `.claude/da/da verify` y `.claude/da/da doctor`. `/da-init` hecho. | Cualquier funcionalidad | Stack, capas, gate, fixtures |
| 1 | Cargar y ver el mes | `npm start` abre el navegador. Al subir el fixture de semilla se ven la validación con las filas inválidas, los KPIs y el gasto por categoría (la dominante salta a la vista). | Filtros, historial, el resto de las gráficas | DOMINIO R-01 a R-08, R-11, R-12, R-17 |
| 2 | Dashboard completo, filtros y tabla | Gráficas por día, hora, día de la semana, zona y cuenta. Filtros (R-10). Tabla ordenable. En la demo se ven la quincena y el fin de semana. | Historial, mapa, hallazgos | R-10, R-13, R-14 |
| 3 | Historial y comparación | Se guardan 2 o 3 meses (semillas distintas), se reinicia y siguen ahí. Comparación por categoría y totales. Reemplazar un mes pide confirmación (409). | Mapa, hallazgos, exportar | R-09, R-15, API y almacenamiento |
| 4 | Mapa y hallazgos | Mapa local por latitud y longitud con color por zona. Panel de hallazgos. El test de semillas pasa contra `esperado.json`. | Exportar | Umbrales de R-16 |
| 5 | Exportar reporte | Un botón genera un HTML autocontenido sin URLs externas, que se abre sin conexión y se imprime a PDF. | Importar bancos, edición, presupuestos | Formato de exportación |

## Pendientes

- [PENDIENTE] ¿El mapa dibuja un contorno de CDMX/México con un GeoJSON local incluido en el repo, o solo puntos coloreados por zona? Se decide en la fase 4.
- [PENDIENTE] ¿Los umbrales de los hallazgos (R-16) se ajustan desde la interfaz o solo desde la configuración? Se decide en la fase 4.
- Decidido el 2026-10-15: se commitean 3 fixtures del generador de ~2 000 filas cada uno (~250 KB), con semillas distintas y de meses distintos. Sirven a los tests y a la demo del historial de la fase 3.
