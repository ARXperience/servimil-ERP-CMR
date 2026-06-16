#!/bin/bash
set -e
BASE="https://mundo-servimil.pages.dev/api/data"
PERIODO="2026-06"
TS=$(date +%s)
NOMBRE="ZZZ RECALC TEST ${TS}"
CEDULA="8888${TS}"

echo "=== 1) CREAR empleado QUINCENAL en ${PERIODO} ==="
CREATE=$(curl -s -X POST "${BASE}?ns=gestion&action=empleado-crear" \
  -H "Content-Type: application/json" \
  -d "{\"empresa\":\"SERVIMIL\",\"nombre\":\"${NOMBRE}\",\"cedula\":\"${CEDULA}\",\"cargo\":\"TEST\",\"tipo_pago\":\"QUINCENAL\",\"sueldo_basico\":1500000,\"periodo\":\"${PERIODO}\"}")
echo "$CREATE"
ID_EMP=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['ID_Empleado'])")
ID_NOM=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin)['ID_Nomina'])")
echo "→ ID_Empleado=${ID_EMP}  ID_Nomina=${ID_NOM}"

sleep 3
echo
echo "=== 2) VERIFICAR creado en ${PERIODO} con Estado=PENDIENTE ==="
curl -s "${BASE}?ns=gestion&action=mes&periodo=${PERIODO}&fresh=1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
f=[x for x in d['filas'] if x['ID_Empleado']=='${ID_EMP}']
if f: print(f'  Periodo: {f[0][\"Periodo\"]}  Estado: {f[0][\"Estado\"]}  Neto: {f[0][\"Neto_Pagar\"]}')
else: print('  ❌ NO ENCONTRADO en ${PERIODO}')
"

sleep 3
echo
echo "=== 3) RECALCULAR ${PERIODO} PRIMER ==="
curl -s -X POST "${BASE}?ns=nomina&action=recalcular" \
  -H "Content-Type: application/json" \
  -d "{\"periodo\":\"${PERIODO}\",\"corte\":\"PRIMER\"}"
echo

sleep 3
echo
echo "=== 4) VERIFICAR Estado pasa a CALCULADO ==="
curl -s "${BASE}?ns=gestion&action=mes&periodo=${PERIODO}&fresh=1" | python3 -c "
import sys,json
d=json.load(sys.stdin)
f=[x for x in d['filas'] if x['ID_Empleado']=='${ID_EMP}']
if f: print(f'  Periodo: {f[0][\"Periodo\"]}  Estado: {f[0][\"Estado\"]}  Devengado: {f[0][\"Devengado_Basico\"]}  Neto: {f[0][\"Neto_Pagar\"]}')
else: print('  ❌ NO ENCONTRADO')
"

sleep 3
echo
echo "=== 5) BORRAR (cleanup) ==="
curl -s -X POST "${BASE}?ns=gestion&action=empleado-borrar" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"${ID_EMP}\"}"
echo
