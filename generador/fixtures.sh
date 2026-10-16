#!/usr/bin/env bash
# Regenera los fixtures con semilla de tests/fixtures/generador/ (CSV y *.esperado.json).
# Uso, desde la raíz del repositorio:  PYTHON="/ruta/a/python" generador/fixtures.sh
# Es el único lugar del repositorio que ejecuta el generador.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RAIZ="$(dirname "$AQUI")"
DESTINO="$RAIZ/tests/fixtures/generador"
PYTHON="${PYTHON:-$RAIZ/.venv/bin/python}"
REGISTROS=2000
# "mes semilla": el mes siempre es explícito porque el valor por defecto depende de la fecha de hoy.
FIXTURES=("2026-07 1" "2026-08 2" "2026-09 3")

# Convierte el texto que imprime `-v` (ruta del archivo en $1, mes AAAA-MM en $2) en el JSON esperado.
CONVERSOR='
import json, re, sys

texto = open(sys.argv[1], encoding="utf-8").read()
mes = sys.argv[2]


def campo(patron):
    coincidencia = re.search(patron, texto, re.MULTILINE)
    if coincidencia is None:
        sys.exit(f"la salida de -v no tiene el formato esperado: falta {patron!r}")
    return coincidencia


def fecha(dia_mes):
    dia, mes_del_dia = dia_mes.split("/")
    return f"{mes[:4]}-{mes_del_dia}-{dia}"


casa, trabajo = campo(r"^\s*Casa / trabajo\s*:\s*(.+?) / (.+?)\s*$").groups()
destino, desde, hasta = campo(r"^\s*Viaje\s*:\s*(.+?) \((\d\d/\d\d) al (\d\d/\d\d)\)\s*$").groups()
esperado = {
    "semilla": int(campo(r"^Semilla: (\d+)").group(1)),
    "mes": mes,
    "registros": int(campo(r"^([\d,]+) transacciones").group(1).replace(",", "")),
    "categoriaDominante": campo(r"^\s*Categoría dominante\s*:\s*(.+?)\s*$").group(1),
    "zonaFavorita": campo(r"^\s*Zona favorita\s*:\s*(.+?)\s*$").group(1),
    "casa": casa,
    "trabajo": trabajo,
    "viaje": {"destino": destino, "desde": fecha(desde), "hasta": fecha(hasta)},
    "quincenas": [int(dia) for dia in campo(r"^\s*Quincenas\s*:\s*días (\d+) y (\d+)").groups()],
}
print(json.dumps(esperado, ensure_ascii=False, indent=2))
'

if ! "$PYTHON" -c 'import faker' 2>/dev/null; then
  echo "error: el intérprete '$PYTHON' no existe o no puede importar Faker." >&2
  echo "Indica uno que lo tenga: PYTHON=/ruta/a/python generador/fixtures.sh" >&2
  echo "(para crearlo: python3 -m venv .venv && .venv/bin/pip install -r generador/requirements.txt)" >&2
  exit 1
fi

TEMPORAL="$(mktemp -d)"
trap 'rm -rf "$TEMPORAL"' EXIT
export PYTHONDONTWRITEBYTECODE=1

for fixture in "${FIXTURES[@]}"; do
  read -r mes semilla <<<"$fixture"
  nombre="$mes-semilla-$semilla"
  "$PYTHON" "$AQUI/generar_transacciones.py" \
    -n "$REGISTROS" --mes "$mes" --semilla "$semilla" -o "$TEMPORAL/$nombre.csv" -v >"$TEMPORAL/$nombre.txt"
  "$PYTHON" -c "$CONVERSOR" "$TEMPORAL/$nombre.txt" "$mes" >"$TEMPORAL/$nombre.esperado.json"
done

mkdir -p "$DESTINO"
rm -f "$DESTINO"/*.csv "$DESTINO"/*.esperado.json
mv "$TEMPORAL"/*.csv "$TEMPORAL"/*.esperado.json "$DESTINO"/
echo "Fixtures regenerados en $DESTINO"
