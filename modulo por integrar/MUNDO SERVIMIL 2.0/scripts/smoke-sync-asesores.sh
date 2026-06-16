#!/bin/bash
set -e
BASE="https://mundo-servimil.pages.dev/api/data"
TS=$(date +%s)
NOMBRE="ZZZ SYNC TEST ${TS}"
CEDULA="7777${TS}"

echo "=== 1) CREAR empleado ==="
CREATE=$(curl -s -X POST "${BASE}?ns=gestion&action=empleado-crear" \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"SERVIMIL\",\"nombre\":\"${NOMBRE}\",\"cedula\":\"${CEDULA}\",\"cargo\":\"TEST\",\"tipo_pago\":\"QUINCENAL\",\"sueldo_basico\":1500000,\"banco\":\"BANCOLOMBIA\",\"eps\":\"SURA\",\"pension\":\"PORVENIR\",\"celular\":\"3001112233\",\"correo\":\"test@x.co\",\"ciudad\":\"BOGOTA\",\"direccion\":\"CL 1 2-3\",\"periodo\":\"2026-06\"}")
echo "$CREATE"
ID_EMP=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['ID_Empleado'])")
ID_AS=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('ID_Asesor',''))")
echo "→ EMP=${ID_EMP}  ASESOR=${ID_AS}"

sleep 3
echo
echo "=== 2) Verificar en Asesores (Estado=ACTIVA) ==="
curl -s "${BASE}?ns=asesores&action=lista&fresh=1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
a=[x for x in d['asesores'] if x['Cedula']=='${CEDULA}']
if a: print(f'  ✓ Asesor: {a[0][\"Nombre\"]}  Estado: {a[0][\"Estado\"]}  Empresa: {a[0][\"Empresa\"]}  EPS: {a[0][\"EPS\"]}  Ciudad: {a[0][\"Ciudad\"]}')
else: print('  ❌ NO encontrado en Asesores')
"

sleep 3
echo
echo "=== 3) RETIRAR ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-retirar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\"}"
echo

sleep 3
echo
echo "=== 4) Verificar en Asesores → RETIRADA ==="
curl -s "${BASE}?ns=asesores&action=lista&fresh=1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
a=[x for x in d['asesores'] if x['Cedula']=='${CEDULA}']
if a: print(f'  ✓ Estado: {a[0][\"Estado\"]}  Fecha_Retiro: {a[0][\"Fecha_Retiro\"]}')
else: print('  ❌ NO encontrado')
"

sleep 3
echo
echo "=== 5) BORRAR (cleanup) ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-borrar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\"}"
echo

sleep 3
echo
echo "=== 6) Verificar limpieza total ==="
curl -s "${BASE}?ns=asesores&action=lista&fresh=1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
a=[x for x in d['asesores'] if x['Cedula']=='${CEDULA}']
print(f'  Asesores con cédula prueba: {len(a)} (esperado 0)')
print(f'  Total asesores en sheet: {len(d[\"asesores\"])} (esperado 18 original)')
"
