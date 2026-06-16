#!/bin/bash
# Smoke test ciclo completo: crear → editar → retirar → borrar.
set -e
BASE="https://mundo-servimil.pages.dev/api/data"
PERIODO="2026-06"
TS=$(date +%s)
NOMBRE="ZZZ TEST AGENT ${TS}"
CEDULA="9999${TS}"

echo "=== 1) CREAR empleado ==="
CREATE=$(curl -s -X POST "${BASE}?ns=gestion&action=empleado-crear" \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"SERVIMIL\",\"nombre\":\"${NOMBRE}\",\"cedula\":\"${CEDULA}\",\"cargo\":\"TEST CARGO\",\"tipo_pago\":\"QUINCENAL\",\"sueldo_basico\":1500000,\"periodo\":\"${PERIODO}\"}")
echo "$CREATE"
ID_EMP=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['ID_Empleado'])")
ID_NOM=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['ID_Nomina'])")
echo "→ ID_Empleado=${ID_EMP}  ID_Nomina=${ID_NOM}"

sleep 3
echo
echo "=== 2) VERIFICAR aparece en gestion-mes ==="
curl -s "${BASE}?ns=gestion&action=mes&periodo=${PERIODO}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
found = [f for f in d['filas'] if f['ID_Empleado'] == '${ID_EMP}']
print('Filas con nuevo empleado:', len(found))
if found: print('  Nombre:', found[0]['Nombre'], 'Sueldo:', found[0]['Sueldo_Basico'])
"

echo
echo "=== 3) EDITAR (cambiar cargo) ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-actualizar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\",\"patch\":{\"Cargo/Campaña\":\"TEST CARGO EDITADO\"}}"
echo

sleep 3
echo
echo "=== 4) RETIRAR ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-retirar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\"}"
echo

sleep 3
echo
echo "=== 5) BORRAR (cleanup completo) ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-borrar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\"}"
echo

sleep 3
echo
echo "=== 6) VERIFICAR limpieza (no debe aparecer) ==="
curl -s "${BASE}?ns=gestion&action=mes&periodo=${PERIODO}" | python3 -c "
import sys, json
d = json.load(sys.stdin)
found = [f for f in d['filas'] if f['ID_Empleado'] == '${ID_EMP}']
emp_found = [e for e in d['empleados'] if e['ID_Empleado'] == '${ID_EMP}']
print('Filas Nomina_Periodo restantes:', len(found))
print('Empleado en tabla Empleados:', len(emp_found))
print('Total filas mes ahora:', len(d['filas']))
"
