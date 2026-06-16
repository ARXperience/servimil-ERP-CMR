# Mundo Servimil 2.0 — Dashboard

Panel administrativo interno para empresa de créditos por libranza a militares
(PRESTAMIL / SERVIMIL). Agrupa módulos de **Nómina** y **Crédito** con capa
futura de **OCR**.

## URL LIVE

**https://mundo-servimil.pages.dev**

Cuenta Cloudflare: `rappicreditcolombia@gmail.com` (RapiCredit, NO personal).
Account ID: `8b7de4adb3a7a7705b1a1bffa17c9085`. Project: `mundo-servimil`.

## Estado actual (resumen ejecutivo)

| Fase | Estado | Detalle |
|---|---|---|
| 0 — Setup Next.js | ✅ | Scaffold + Tailwind tema blanco |
| 1 — Capa datos | ✅ | `DataProvider` abstracto + impl Sheets (fetch + Web Crypto) |
| 2 — Layout / nav | ✅ | Sidebar + Header + rutas |
| 3 — Nómina | ✅ | Resumen (dashboard) + Base de datos (planilla + Asesores + Desprendible) |
| 4 — Crédito Admin | ✅ iter 1 | Dashboard ejecutivo + FIFO + mora + por pagaduría |
| 6 — Deploy CF | ✅ | Pages + secrets + `next-on-pages` |
| 5 — Crédito Asesoras (bot) | ⏳ Placeholder | Pendiente bot OCR |
| 7 — OCR transversal | ⏳ Placeholder | Pendiente |
| 4 iter 2 — Crédito Admin extra | ⏳ | Bajas, vencimientos, inconsistencias, histórico mensual real, asesores |

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- TailwindCSS (tema blanco, acento `#1F4E78`, semáforos)
- **Sheets vía fetch + Web Crypto JWT** (NO googleapis — incompatible con CF isolates)
- SWR (revalidación cliente)
- Recharts (gráficos: AreaChart, PieChart donut, BarChart horizontal)

## Variables de entorno

`.env.local` (NO se commitea):

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `bot-mia@agente-mia-claudecode-01.iam.gserviceaccount.com`
- `GOOGLE_PRIVATE_KEY` (PEM con `\n` literales escapados, entre comillas)
- `SHEET_ID_CREDITOS` = `1FJlvltrJIqE6EjmN_j_IhwBErqD1Vf--Qu36pOO1Ws0`
- `SHEET_ID_NOMINA` = `1MsW8uE1f3cyqLt5_X3Vv9O1ECRhchRtDUS43TeQ3Jjw` (6 meses ENE-JUN 2026, 12 empleados, 3 empresas)
- `SHEETS_CACHE_TTL=15` (segundos)

Mismos secrets están cargados en Cloudflare Pages vía `scripts/push-secrets.ts`.

## Comandos

```bash
npm install
npm run check:sheets         # valida conexión a ambos workbooks
npm run dev                  # dev local en :3000

# Deploy
rm -rf .vercel/output .next
npx vercel build
npx @cloudflare/next-on-pages --skip-build
npx wrangler pages deploy .vercel/output/static --project-name mundo-servimil --branch main --commit-dirty=true

# Push secrets a CF
npx tsx scripts/push-secrets.ts mundo-servimil

# Seed pestaña Asesores con 18 filas demo
npx tsx scripts/seed-asesores.ts
```

## Arquitectura

```
src/
  app/
    page.tsx                      Inicio
    nomina/
      layout.tsx                  Tabs "Resumen | Base de datos"
      page.tsx                    RESUMEN (dashboard ejecutivo)
      gestion/page.tsx            BASE DE DATOS (sub-tabs Planilla | Asesores | Desprendible)
    credito/admin/page.tsx        Dashboard ejecutivo crédito (3 tabs)
    credito/asesoras/page.tsx     Placeholder
    ocr/page.tsx                  Placeholder
    api/data/route.ts             *** ENDPOINT ÚNICO BACKEND ***
  components/
    layout/                       Sidebar (1 entrada Nómina) + Header
    nomina/                       EditModal, EmpleadoModal, AsesoresTab, DesprendibleTab
    nomina/dashboard/             KpiBig, LineaTendencia, Donas, BarsCargo, MiniNovedad
    ui/                           KpiCard, Charts, ConfirmDialog
  lib/
    dataProvider/                 Capa abstracta (interfaz + impl Sheets con caché + warmup batch)
    sheets/                       sheetsApi.ts (fetch+JWT), googleAuth.ts (Web Crypto)
    handlers/                     nominaHandler, creditoHandler, gestionHandler, asesoresHandler, desprendibleHandler
    calc/                         nominaEngine (FIFO/VARIABLE), creditFifo (motor crédito)
    types/                        nomina, credito, asesor
    hooks/                        useFetcher (SWR + friendly errors), useNominaRefresh
    parametros.ts                 Reader pestaña Parametros con offset
    validate.ts                   Validación + safeNum + clamp + LIMITES
    utils/format.ts               formatCop, formatPeriodoEs, labelCorte, normTxt, matchAny
scripts/                          check-sheets, dump-parametros, count-rows, push-secrets,
                                  seed-asesores, smoke-gestion, smoke-recalc, smoke-sync-asesores
```

## ⚠ Bug estructural — vercel build 47 + Next 15 + edge runtime

`vercel build` (max compatible con `next-on-pages` 1.13.16) produce
`.vercel/output/functions/**/<route>.func/index.js` **IDÉNTICOS** para todas
las API routes edge (verificado por MD5). Todas reciben el handler de la
PRIMERA ruta compilada.

**Workaround obligatorio**: TODO el backend vive en
`src/app/api/data/route.ts`. Dispatch por `?ns=<dominio>&action=<accion>`.
Handlers reales en `src/lib/handlers/`.

NO crear más archivos `route.ts`. Para una nueva API:
1. Crear handler en `src/lib/handlers/xxxHandler.ts`
2. Importar y wired en `src/app/api/data/route.ts` el dispatch
   - GET: `if (ns === "xxx") { if (action === "yyy") return ... }`
   - POST: igual

### Endpoints actuales

**GET**:
- `?ns=nomina&action=lista` — periodos disponibles
- `?ns=nomina&action=periodo&periodo=YYYY-MM&corte=PRIMER|MENSUAL|""` — filas + KPIs + params
- `?ns=nomina&action=tendencia&corte=...` — agregado por mes (todos meses)
- `?ns=gestion&action=mes&periodo=YYYY-MM` — vista planilla completa
- `?ns=credito&action=dashboard|mora|pagaduria`
- `?ns=asesores&action=lista`
- `?ns=desprendible&action=generar&id_empleado=&periodo=&corte=`
- **`?fresh=1`** en cualquier GET → invalida caché provider antes de leer

**POST** (body JSON):
- `?ns=nomina&action=update` — patch directo a Nomina_Periodo
- `?ns=nomina&action=update-recalc` — overrides + motor recalcula
- `?ns=nomina&action=recalcular` — recalcula todas FIJO del periodo+corte
- `?ns=gestion&action=empleado-crear` / `empleado-actualizar` / `empleado-retirar` / `empleado-borrar`
- `?ns=asesores&action=crear` / `actualizar` / `retirar` / `borrar`

## Regla de oro de los datos

- Sheet = única fuente de verdad
- Doble vía: dashboard escribe al Sheet
- KPIs siempre calculados al vuelo (NO persisten)
- UI nunca importa `googleapis`. Solo `DataProvider`.
- Migración a Supabase: implementar `SupabaseProvider` y cambiar factory en
  `lib/dataProvider/index.ts`. **Estructura del Sheet preservada** (NO se
  hicieron pestañas por mes — todo vive en `Empleados` + `Nomina_Periodo` +
  `Asesores` + `Novedades` + `Bonificaciones` + `Alertas` + `Parametros`).

## Decisiones tomadas (confirmadas por usuario)

1. **Periodos nómina**: `YYYY-MM` interno; display español. Cortes: `PRIMER` (Primera quincena) / `SEGUNDO` (Segunda quincena) / `MENSUAL`. Selector Resumen incluye opción `""` = "Todos los cortes" (consolidado del mes).
2. **Edición**: modal con preview vivo del motor (FIJO recalcula, VARIABLE manual)
3. **Parámetros legales**: leídos de pestaña `Parametros` (SMMLV, aux, salud, pensión, patronales, provisiones). Sin Año filtrado.
4. **FIFO crédito**: pagos al `ID_Credito` específico, solo `Estado_Aplicacion=APLICADO`.
5. **Score riesgo**: leído de columna, no calculado (emoji + texto).
6. **Auth**: abierta (intranet) en MVP.
7. **Histórico mensual crédito**: agregación por columna `Corte` (sin snapshots).
8. **Empleados VARIABLE**: neto manual, motor NO toca.
9. **Mora % en crédito**: dos indicadores — por # créditos Y por $.
10. **Buckets mora**: 1-30 / 31-60 / 61-90 / 90+ días.
11. **Pagaduría crédito**: por `Creditos.Fuerza` esta iter (futuro: join Clientes.Pagaduria).
12. **Empresas nómina**: SERVIMIL / FUERZA MILITAR / RAPPI CREDIT (3 detectadas).
13. **Asesores como histórico**: pestaña SEPARADA de Empleados, sincronizada por cédula (alta/retiro/borrado).
14. **Desprendible**: calcula al vuelo (Prima 8.33%, Cesantías 8.33%, Int.Ces 1%×cesantías). SERVIMIL NIT 901.644.167-3 real; otros 2 = "—".
15. **Total fila**: FIJO → Neto. VARIABLE → Comisión (Bonificacion).
16. **Periodo por defecto** (Gestión): el MÁS RECIENTE de la lista. Crear empleado se hace en el mes seleccionado (no aparece en meses pasados).
17. **Sin obligatoriedad de campos**: ningún campo es obligatorio en alta/edición. Solo se valida FORMATO de campos con valor. El periodo es el único requerido para crear stub Nomina_Periodo.
18. **Validaciones de blindaje** (siempre activas si hay valor): sueldo ≤ 100M, días 0-31, cédula `^\d{4,15}$`, correo regex básico, deducciones ≤ 100M, bonificación ≤ 50M.
19. **Confirmaciones**: SIEMPRE modal custom `ConfirmDialog`. NUNCA `confirm()` nativo.
20. **Retirar vs Borrar empleado**: 🚫 ámbar = retirar (soft, marca RETIRADO en Empleados + RETIRADA en Asesores). 🗑️ rojo = borrar (hard, elimina Empleados + Nomina_Periodo + Asesores).

## Resumen Nómina (dashboard ejecutivo `/nomina`)

- Selectores Mes + Corte (incluye "Todos los cortes" = consolidado)
- 5 KPIs grandes con delta vs mes anterior (↑↓ % verde/rojo): Total Nómina, Empleados, Deducciones, Bonificaciones, Costo Total Empresa
- Línea tendencia 6 meses (Devengado + Neto con áreas gradiente)
- Dona Distribución por empresa (3 empresas)
- Dona Composición del pago (Devengado/Aux/Bonif/Deducciones)
- Barras horizontales por cargo (top 8)
- 3 mini-novedades (Incapacidades 🤒 / Vacaciones 🏖️ / Ausencias ⚠️)
- Botón Recalcular periodo (sin popup nativo)

## Base de datos Nómina (`/nomina/gestion`)

3 sub-tabs:
1. **Planilla mensual** — 27 columnas estilo Excel original
   - Selector mes (tabs ENE-JUN)
   - Filtro empresa (pills) + buscador free-text (tilde-insensitive)
   - 5 KPIs dinero + 4 personas/novedades (todos respetan filtro)
   - Acciones por fila: ✏️ editar mes / 👤 datos empleado / 🚫 retirar / 🗑️ borrar
   - Badge RETIRADO + tinte fila si empleado retirado
2. **Asesores** — histórico personal (22 cols + acciones)
   - Filtros empresa + estado + buscador
   - Fila roja si RETIRADA
   - Edad calculada desde Fecha_Nacimiento
3. **Desprendible** — colilla pago con CSS print que oculta TODA la UI excepto la colilla

EditModal: 2 columnas (entrada | preview vivo). 9 campos editables (días/INC/VAC/LIC/AUS/bonif/3 ded). 10 readonly (devengado/aux/totalDev/4 ded calculadas/neto/SS/total).

EmpleadoModal: 22 campos (sin obligatorios). Edad calculada en hint. Fecha_Retiro NO se incluye en alta. Sincroniza Asesores.

## Crédito Admin (`/credito/admin`)

3 tabs: Dashboard / Cartera mora / Por pagaduría.
Motor FIFO ya implementado. Faltan iter 2: bajas, vencimientos, inconsistencias, histórico mensual real, desempeño asesor.

## Optimizaciones clave aplicadas

- **Batch reads**: `provider.warmup([tablas])` usa `values.batchGet` → 1 call para N tablas
- **Cache server-side per-isolate** (TTL 15s); `?fresh=1` invalida puntual
- **Cache update in-place tras write** (no re-lectura completa)
- **Retry+backoff** en `authedFetch` (800/2000/4500ms) para 429/5xx
- **Errores friendly**: detección 429 + traducción a mensaje claro en sheetsApi, useFetcher, modals, recalcular
- **SWR refresh focalizado**: 1 fetch `?fresh=1` + `mutate` SWR de URLs específicas

## Pendientes futuros (anotados)

- **OCR transversal** (Fase 7): leer desprendibles militares + certificados tiempo + soportes
- **Bot Asesoras Crédito** (Fase 5): flujo análisis crédito desde dashboard
- **Crédito iter 2**: bajas / vencimientos / inconsistencias / histórico real / asesores
- **Pagaduría real crédito**: join con `Clientes.Pagaduria` (hoy se agrupa por `Creditos.Fuerza`)
- **SMMLV**: Julián actualiza valor anual en pestaña `Parametros`. Motor lee al vuelo.
- **FSP tabla escalonada**: hoy 0%. Producción con sueldos altos requiere implementar
  4-16 SMMLV: 1%; 16-17: 1.2%; 17-18: 1.4%; 18-19: 1.6%; 19-20: 1.8%; ≥20: 2%
- **Retención fuente**: hoy manual. Pendiente cálculo UVT.
- **Ded_Credito ↔ Crédito**: enlazar automáticamente cuota crédito empleado en nómina (cruce por cédula)
- **NITs**: SERVIMIL real (`901.644.167-3`). FUERZA MILITAR y RAPPI CREDIT = "—" hasta confirmar.
- **Migración Supabase**: implementar `SupabaseProvider`. Diego se encarga.

## Notas Windows

- **Developer Mode activado** (Settings → For Developers) — necesario para
  symlinks de `vercel build`. Sin esto: `EPERM symlink`.
- `vercel@47.0.4` pinned (next-on-pages no acepta ≥48).
- Node 24 + npm 11. Si OOM en `npm install`: cerrar Chrome / apps pesadas,
  reintentar con `NODE_OPTIONS="--max-old-space-size=4096"`.

## Próximo paso (mañana)

Opciones de continuación:
1. **Crédito Admin iter 2** — bajas, vencimientos próximos 90d, inconsistencias, histórico mensual real con snapshots, desempeño por asesor comercial. Calendario SICOD.
2. **Conexión Crédito ↔ Nómina** — Ded_Credito automático desde cuotas del empleado.
3. **Vista Asesoras Crédito** — flujo bot análisis (requiere prompt).
4. **OCR** — capa transversal lectura desprendibles/certificados.
5. **Otras mejoras Nómina** sugeridas por usuario tras probar UI dashboard nuevo.

Empezar mañana: confirmar con usuario qué prioridad sigue. Antes de codear,
mostrar plan corto y preguntar reglas no claras (patrón establecido en toda
la conversación).
