"use client";
export const runtime = "edge";
import { useMemo, useState } from "react";
import { useApi } from "@/lib/hooks/useFetcher";
import { useNominaRefresh } from "@/lib/hooks/useNominaRefresh";
import KpiCard from "@/components/ui/KpiCard";
import EditModal from "@/components/nomina/EditModal";
import EmpleadoModal from "@/components/nomina/EmpleadoModal";
import AsesoresTab from "@/components/nomina/AsesoresTab";
import DesprendibleTab from "@/components/nomina/DesprendibleTab";
import ConfirmDialog, { type ConfirmPrompt } from "@/components/ui/ConfirmDialog";
import { formatCop, formatPeriodoEs, toNumber, normTxt, labelCorte } from "@/lib/utils/format";
import type { Empleado, NominaFila } from "@/lib/types/nomina";

type GestionResp = {
  periodo: string;
  parametros: {
    smmlv: number; aux_transporte: number; dias_base_mes: number;
    pct_salud_patronal: number; pct_pension_patronal: number; pct_arl: number;
    pct_sena: number; pct_icbf: number; pct_caja: number;
    pct_cesantias: number; pct_int_cesantias: number; pct_prima: number; pct_vacaciones: number;
    pct_salud: number; pct_pension: number; pct_fsp: number; pct_ss_aprox: number;
  };
  empresas: string[];
  kpis: {
    total_nomina: number;
    empleados_unicos: number;
    total_aux_tte: number;
    total_deducciones: number;
    neto_promedio: number;
  };
  filas: NominaFila[];
  novedades_breakdown_por_empleado: Record<string, { INCAPACIDADES: number; VACACIONES: number; LICENCIA: number; AUSENCIAS: number }>;
  tipo_pago_por_empleado: Record<string, string>;
  empresa_por_empleado: Record<string, string>;
  empleados: Empleado[];
};

// Mes hardcoded list para tabs (genera ENE..DIC del año detectado en data).
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

export default function GestionPage() {
  // Periodos disponibles vienen del endpoint lista (lo reutilizamos).
  const { data: pList } = useApi<{ periodos: { periodo: string; corte: string }[] }>("/api/data?ns=nomina&action=lista");
  const periodosUnicos = useMemo(() => {
    const set = new Set<string>();
    pList?.periodos?.forEach((p) => set.add(p.periodo));
    return Array.from(set).sort();  // 2026-01..2026-06
  }, [pList]);

  const [periodo, setPeriodo] = useState<string>("");
  // Default al periodo MÁS RECIENTE (último en orden ASC), no al más antiguo.
  // Así "+ Agregar empleado" y "Recalcular mes" actúan sobre el mes vigente.
  const periodoEfectivo = periodo || periodosUnicos[periodosUnicos.length - 1] || "";

  const url = periodoEfectivo
    ? `/api/data?ns=gestion&action=mes&periodo=${encodeURIComponent(periodoEfectivo)}`
    : null;
  const { data, error, isLoading } = useApi<GestionResp>(url);

  const [subTab, setSubTab] = useState<"planilla" | "asesores" | "desprendible">("planilla");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [editFila, setEditFila] = useState<NominaFila | null>(null);
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [empModalMode, setEmpModalMode] = useState<"crear" | "editar">("crear");
  const [empModalTarget, setEmpModalTarget] = useState<Empleado | null>(null);
  const [recalcMsg, setRecalcMsg] = useState<string | null>(null);

  const refreshAll = useNominaRefresh();
  function refresh() {
    refreshAll(periodoEfectivo);
  }

  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt>({
    open: false, title: "", message: "", onConfirm: () => { /* noop */ },
  });
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  function closeConfirm() { setConfirmPrompt((p) => ({ ...p, open: false })); }

  function pedirRetirar(emp: Empleado) {
    setConfirmPrompt({
      open: true,
      tone: "warn",
      title: "Retirar empleado",
      confirmLabel: "Retirar",
      message: (
        <div className="space-y-2">
          <p>¿Seguro que quieres retirar a <span className="font-semibold">{emp.Nombre}</span> (CC {emp.Cedula})?</p>
          <ul className="text-xs text-slate-500 list-disc pl-5 space-y-0.5">
            <li>Marca Estado = <span className="font-medium text-amber-700">RETIRADO</span> + Fecha_Retiro = hoy.</li>
            <li>Mantiene el histórico (filas pasadas no se borran).</li>
            <li>También se marca como RETIRADA en la pestaña Asesores.</li>
            <li>El empleado quedará marcado con badge gris en la planilla del mes actual.</li>
          </ul>
        </div>
      ),
      onConfirm: () => { closeConfirm(); ejecutarRetirar(emp); },
      onCancel: closeConfirm,
    });
  }
  async function ejecutarRetirar(emp: Empleado) {
    setActionMsg(`Retirando a ${emp.Nombre}…`);
    try {
      const res = await fetch("/api/data?ns=gestion&action=empleado-retirar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.ID_Empleado }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setActionMsg(`✅ ${emp.Nombre} retirado · fecha ${j.fecha_retiro}${j.asesor_sync ? " · Asesor sincronizado" : ""}`);
      refresh();
    } catch (e) {
      const m = (e as Error).message;
      const f = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(m)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : m;
      setActionMsg(`❌ ${f}`);
    }
  }

  function pedirBorrar(emp: Empleado) {
    setConfirmPrompt({
      open: true,
      tone: "bad",
      title: "Borrar empleado por completo",
      confirmLabel: "Borrar definitivamente",
      message: (
        <div className="space-y-2">
          <p>¿Borrar PERMANENTEMENTE a <span className="font-semibold">{emp.Nombre}</span> (CC {emp.Cedula})?</p>
          <ul className="text-xs text-bad list-disc pl-5 space-y-0.5">
            <li>Elimina la fila de Empleados.</li>
            <li>Elimina TODAS sus filas históricas en Nomina_Periodo.</li>
            <li>Elimina su registro en Asesores.</li>
            <li><span className="font-semibold">No se puede deshacer.</span></li>
          </ul>
        </div>
      ),
      onConfirm: () => { closeConfirm(); ejecutarBorrar(emp); },
      onCancel: closeConfirm,
    });
  }
  async function ejecutarBorrar(emp: Empleado) {
    setActionMsg(`Borrando ${emp.Nombre}…`);
    try {
      const res = await fetch("/api/data?ns=gestion&action=empleado-borrar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: emp.ID_Empleado }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
      setActionMsg(`✅ ${emp.Nombre} borrado · ${j.nominas_borradas} filas históricas eliminadas${j.asesor_borrado ? " · Asesor eliminado" : ""}`);
      refresh();
    } catch (e) {
      const m = (e as Error).message;
      const f = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(m)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : m;
      setActionMsg(`❌ ${f}`);
    }
  }

  async function recalcular() {
    if (!periodoEfectivo) return;
    setRecalcMsg(`Recalculando ${formatPeriodoEs(periodoEfectivo)}…`);
    try {
      // Recalcular ambos cortes del mes activo (PRIMER y MENSUAL).
      const out: string[] = [];
      let totalRec = 0;
      let totalOmit = 0;
      const erroresAll: string[] = [];
      for (const corte of ["PRIMER", "MENSUAL"]) {
        const res = await fetch("/api/data?ns=nomina&action=recalcular", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ periodo: periodoEfectivo, corte }),
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || `HTTP ${res.status}`);
        out.push(`${corte}: ${j.recalculadas}✓ ${j.omitidas_variable}✗`);
        totalRec += j.recalculadas || 0;
        totalOmit += j.omitidas_variable || 0;
        if (Array.isArray(j.errores) && j.errores.length) erroresAll.push(...j.errores);
      }
      const errMsg = erroresAll.length ? ` · errores: ${erroresAll.slice(0, 2).join("; ")}` : "";
      setRecalcMsg(`✅ ${formatPeriodoEs(periodoEfectivo)} — ${totalRec} recalculadas, ${totalOmit} omitidas (VARIABLE)${errMsg}`);
      refresh();
    } catch (e) {
      const msg = (e as Error).message || "Error desconocido";
      const friendly = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(msg)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : msg;
      setRecalcMsg(`❌ ${friendly}`);
    }
  }

  // Filtrar filas por empresa + búsqueda libre.
  const filasFiltradas = useMemo(() => {
    if (!data) return [];
    const q = normTxt(busqueda);
    return data.filas.filter((f) => {
      const empresa = (data.empresa_por_empleado[String(f.ID_Empleado)] || "").trim().toUpperCase();
      if (filtroEmpresa !== "TODAS" && empresa !== filtroEmpresa) return false;
      if (!q) return true;
      // Concatenamos campos buscables y normalizamos una vez.
      const hay =
        normTxt(empresa) + " " +
        normTxt(f.Corte) + " " +
        normTxt(f.Cedula) + " " +
        normTxt(f.Nombre) + " " +
        normTxt(f.Cargo) + " " +
        normTxt(f.Estado) + " " +
        normTxt(f.Sueldo_Basico) + " " +
        normTxt(f.Neto_Pagar) + " " +
        normTxt(f.ID_Empleado);
      return hay.includes(q);
    });
  }, [data, filtroEmpresa, busqueda]);

  // KPIs recalculados sobre filas filtradas — sincronizados con tabla.
  const kpisVista = useMemo(() => {
    const total_nomina = filasFiltradas.reduce((s, r) => s + toNumber(r.Neto_Pagar), 0);
    const empleados_unicos = new Set(filasFiltradas.map((f) => f.ID_Empleado)).size;
    const total_aux_tte = filasFiltradas.reduce((s, r) => s + toNumber(r.Aux_Transporte), 0);
    const total_deducciones = filasFiltradas.reduce((s, r) => s + toNumber(r.Total_Deduccion), 0);
    const total_bonificaciones = filasFiltradas.reduce((s, r) => s + toNumber(r.Bonificacion), 0);
    const total_devengado = filasFiltradas.reduce((s, r) => s + toNumber(r.Total_Devengado), 0);
    const devengado_basico = filasFiltradas.reduce((s, r) => s + toNumber(r.Devengado_Basico), 0);
    const neto_promedio = filasFiltradas.length ? total_nomina / filasFiltradas.length : 0;

    // Costo total empresa — leído de Parametros.
    const p = data?.parametros;
    const patronales = p
      ? p.pct_salud_patronal + p.pct_pension_patronal + p.pct_arl + p.pct_sena + p.pct_icbf + p.pct_caja
      : 0;
    const ces  = devengado_basico * (p?.pct_cesantias ?? 0);
    const intc = ces * (p?.pct_int_cesantias ?? 0);
    const prima = devengado_basico * (p?.pct_prima ?? 0);
    const vac = devengado_basico * (p?.pct_vacaciones ?? 0);
    const provisiones = ces + intc + prima + vac;
    const aportes = devengado_basico * patronales;
    const costo_total_empresa = total_devengado + aportes + provisiones;

    // Novedades por tipo: sumar días + contar personas distintas (de los empleados visibles).
    const idsVisibles = new Set(filasFiltradas.map((f) => String(f.ID_Empleado)));
    const breakdown = data?.novedades_breakdown_por_empleado || {};
    const sumarTipo = (k: "INCAPACIDADES" | "VACACIONES" | "AUSENCIAS") => {
      let dias = 0, personas = 0;
      for (const id of idsVisibles) {
        const v = breakdown[id]?.[k] || 0;
        if (v > 0) { dias += v; personas++; }
      }
      return { dias, personas };
    };

    return {
      total_nomina, empleados_unicos, total_aux_tte, total_deducciones, neto_promedio,
      total_bonificaciones, costo_total_empresa,
      incapacidades: sumarTipo("INCAPACIDADES"),
      vacaciones: sumarTipo("VACACIONES"),
      ausencias: sumarTipo("AUSENCIAS"),
    };
  }, [filasFiltradas, data]);

  // Mes para encabezado planilla
  const mesNombre = formatPeriodoEs(periodoEfectivo);
  const empresaTitulo = filtroEmpresa === "TODAS" ? "TODAS LAS EMPRESAS" : filtroEmpresa;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Gestión de Empleados</h1>
          <p className="text-sm text-slate-500">Vista planilla mensual. Doble vía real al Google Sheet.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEmpModalMode("crear"); setEmpModalTarget(null); setEmpModalOpen(true); }}
                  className="px-3 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark">
            + Agregar empleado
          </button>
          <button onClick={recalcular}
                  className="px-3 py-2 text-sm rounded-lg border border-brand text-brand hover:bg-slate-50">
            Recalcular mes
          </button>
        </div>
      </div>

      {/* Tabs de mes (estilo pestañas Excel) */}
      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {periodosUnicos.map((p) => {
          const [, mm] = p.split("-");
          const idx = parseInt(mm, 10) - 1;
          const yy = p.split("-")[0].slice(2);
          const lbl = `${MESES[idx]} ${yy}`;
          const active = p === periodoEfectivo;
          return (
            <button key={p} onClick={() => setPeriodo(p)}
                    className={"px-4 py-2 text-sm font-medium border-b-2 transition " +
                      (active ? "border-brand text-brand bg-slate-50" : "border-transparent text-slate-500 hover:text-slate-700")}>
              {lbl}
            </button>
          );
        })}
      </div>

      {/* Sub-tabs (estilo pestañas Excel) — Planilla | Asesores | Desprendible */}
      <div className="flex gap-1 border-b border-slate-200 -mt-1">
        {([
          ["planilla", "Planilla mensual"],
          ["asesores", "Asesores"],
          ["desprendible", "Desprendible"],
        ] as const).map(([k, lbl]) => (
          <button key={k} onClick={() => setSubTab(k)}
                  className={"px-3 py-1.5 text-xs font-semibold rounded-t border-t border-l border-r transition " +
                    (subTab === k
                      ? "bg-white border-slate-300 text-brand"
                      : "bg-slate-50 border-transparent text-slate-500 hover:text-slate-700")}>
            {lbl}
          </button>
        ))}
      </div>

      {subTab === "planilla" && (
        <>
          {/* Filtros empresa + buscador */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap gap-2">
              {["TODAS", ...(data?.empresas || [])].map((e) => (
                <button key={e} onClick={() => setFiltroEmpresa(e)}
                        className={"px-3 py-1 text-xs font-medium rounded-full border transition " +
                          (filtroEmpresa === e ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50")}>
                  {e}
                </button>
              ))}
            </div>
            <div className="relative">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, cédula, cargo…"
                className="w-72 rounded-lg border border-slate-200 bg-white px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <span className="absolute left-2.5 top-2.5 text-slate-400 text-sm pointer-events-none">🔍</span>
              {busqueda && (
                <button onClick={() => setBusqueda("")}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-700 text-sm">×</button>
              )}
            </div>
          </div>

          {error && <div className="card bg-red-50 text-bad text-sm">Error: {(error as Error).message}</div>}
          {recalcMsg && <div className={"card text-sm " + (recalcMsg.startsWith("✅") ? "bg-emerald-50 text-ok" : recalcMsg.startsWith("❌") ? "bg-red-50 text-bad" : "bg-slate-50")}>{recalcMsg}</div>}
        </>
      )}

      {subTab === "planilla" && (<>
      {/* Encabezado planilla */}
      <div className="card bg-gradient-to-r from-slate-50 to-white border-l-4 border-brand">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-brand uppercase tracking-wide">NÓMINA {empresaTitulo} — {mesNombre}</h2>
            <p className="text-xs text-slate-500 mt-1">Periodo: {periodoEfectivo}</p>
          </div>
          <div className="flex gap-4 text-xs">
            <div><span className="text-slate-500">SMMLV:</span> <span className="font-semibold text-slate-800">{formatCop(data?.parametros.smmlv ?? 0)}</span></div>
            <div><span className="text-slate-500">Días laborales:</span> <span className="font-semibold text-slate-800">{data?.parametros.dias_base_mes ?? "—"}</span></div>
            <div><span className="text-slate-500">Aux. tte:</span> <span className="font-semibold text-slate-800">{formatCop(data?.parametros.aux_transporte ?? 0)}</span></div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      {/* KPIs dinero */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label={`Total nómina${filtroEmpresa !== "TODAS" ? ` (${filtroEmpresa})` : " (mes)"}`}
                 value={isLoading ? "…" : formatCop(kpisVista.total_nomina)} />
        <KpiCard label="Total deducciones" value={isLoading ? "…" : formatCop(kpisVista.total_deducciones)} />
        <KpiCard label="Total Aux. tte" value={isLoading ? "…" : formatCop(kpisVista.total_aux_tte)} />
        <KpiCard label="Total bonificaciones" value={isLoading ? "…" : formatCop(kpisVista.total_bonificaciones)} />
        <KpiCard label="Costo total empresa" value={isLoading ? "…" : formatCop(kpisVista.costo_total_empresa)}
                 hint="Devengado + patronales + provisiones" />
      </div>

      {/* KPIs personas / novedades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Empleados únicos" value={isLoading ? "…" : kpisVista.empleados_unicos}
                 hint={`Neto promedio: ${formatCop(kpisVista.neto_promedio)}`} />
        <KpiCard label="Incapacidades"
                 value={isLoading ? "…" : `${kpisVista.incapacidades.dias} días`}
                 hint={`${kpisVista.incapacidades.personas} ${kpisVista.incapacidades.personas === 1 ? "persona" : "personas"}`} />
        <KpiCard label="Vacaciones"
                 value={isLoading ? "…" : `${kpisVista.vacaciones.dias} días`}
                 hint={`${kpisVista.vacaciones.personas} ${kpisVista.vacaciones.personas === 1 ? "persona" : "personas"}`} />
        <KpiCard label="Ausencias"
                 value={isLoading ? "…" : `${kpisVista.ausencias.dias} días`}
                 hint={`${kpisVista.ausencias.personas} ${kpisVista.ausencias.personas === 1 ? "persona" : "personas"}`} />
      </div>

      {/* Tabla planilla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2400px] text-xs">
            <thead className="bg-brand text-white sticky top-0">
              <tr>
                {[
                  "EMPRESA", "CORTE", "CÉDULA", "NOMBRE", "CAMPAÑA",
                  "SUELDO BÁSICO", "DÍAS TRABAJADOS",
                  "INCAPACIDADES", "VACACIONES", "LICENCIA", "AUSENCIAS",
                  "DEVENGADO BÁSICO", "AUX. TRANSPORTE", "TOTAL DEVENGADO",
                  "DEDUCCIÓN SALUD", "DEDUCCIÓN PENSIÓN", "FSP", "RETENCIÓN EN LA FUENTE",
                  "DEDUCCIÓN CRÉDITO", "DEDUCCIÓN OTRAS", "TOTAL DEDUCCIÓN",
                  "NETO A PAGAR", "SS APROXIMADO", "COMISIÓN", "TOTAL",
                  "ESTADO", "",
                ].map((h) => (
                  <th key={h} className="text-left px-2 py-2 font-semibold whitespace-nowrap border-r border-brand-light/40 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasFiltradas.map((r) => {
                const nov = data?.novedades_breakdown_por_empleado[String(r.ID_Empleado)] || { INCAPACIDADES: 0, VACACIONES: 0, LICENCIA: 0, AUSENCIAS: 0 };
                const empresa = data?.empresa_por_empleado[String(r.ID_Empleado)] || "—";
                const emp = data?.empleados.find((e) => e.ID_Empleado === r.ID_Empleado);
                const tipoPago = (data?.tipo_pago_por_empleado[String(r.ID_Empleado)] || "").toUpperCase();
                const isVariable = tipoPago === "VARIABLE";
                const comision = toNumber(r.Bonificacion);
                const total = isVariable ? comision : toNumber(r.Neto_Pagar);
                const empRetirado = (emp?.Estado || "").toUpperCase() === "RETIRADO";
                return (
                  <tr key={r.ID_Nomina} className={"border-b border-slate-100 " + (empRetirado ? "bg-slate-50 opacity-70" : "hover:bg-slate-50")}>
                    <Td>{empresa}</Td>
                    <Td><span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100">{labelCorte(r.Corte)}</span></Td>
                    <Td>{r.Cedula}</Td>
                    <Td className="font-medium text-slate-800">
                      {r.Nombre}
                      {empRetirado && <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-amber-100 text-amber-700 font-semibold">RETIRADO</span>}
                    </Td>
                    <Td className="text-slate-600">{r.Cargo}</Td>
                    <TdNum>{formatCop(r.Sueldo_Basico)}</TdNum>
                    <TdNum>{r.Dias_Trabajados}</TdNum>
                    <TdNum>{nov.INCAPACIDADES || ""}</TdNum>
                    <TdNum>{nov.VACACIONES || ""}</TdNum>
                    <TdNum>{nov.LICENCIA || ""}</TdNum>
                    <TdNum>{nov.AUSENCIAS || ""}</TdNum>
                    <TdNum>{formatCop(r.Devengado_Basico)}</TdNum>
                    <TdNum>{formatCop(r.Aux_Transporte)}</TdNum>
                    <TdNum className="font-semibold">{formatCop(r.Total_Devengado)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_Salud)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_Pension)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_FSP)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_RteFte)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_Credito)}</TdNum>
                    <TdNum className="text-bad">{formatCop(r.Ded_Otras)}</TdNum>
                    <TdNum className="text-bad font-semibold">{formatCop(r.Total_Deduccion)}</TdNum>
                    <TdNum className="font-bold text-brand">{formatCop(r.Neto_Pagar)}</TdNum>
                    <TdNum className="text-slate-500">{formatCop(r.SS_Aproximado)}</TdNum>
                    <TdNum>{formatCop(comision)}</TdNum>
                    <TdNum className="font-bold text-brand bg-slate-50">{formatCop(total)}</TdNum>
                    <Td><EstadoBadge v={r.Estado} /></Td>
                    <Td>
                      <div className="flex gap-1">
                        <button onClick={() => setEditFila(r)} title="Editar mes (días/bonif/deducciones)" className="text-xs px-2 py-1 rounded hover:bg-slate-200">✏️</button>
                        {emp && <button onClick={() => { setEmpModalMode("editar"); setEmpModalTarget(emp); setEmpModalOpen(true); }} title="Datos empleado (sueldo/cargo/banco)" className="text-xs px-2 py-1 rounded hover:bg-slate-200">👤</button>}
                        {emp && (emp.Estado || "").toUpperCase() !== "RETIRADO" && (
                          <button onClick={() => pedirRetirar(emp)} title="Retirar (mantiene histórico, marca RETIRADO)" className="text-xs px-2 py-1 rounded hover:bg-amber-100 text-amber-700">🚫</button>
                        )}
                        {emp && <button onClick={() => pedirBorrar(emp)} title="Borrar definitivamente (elimina TODO el historial)" className="text-xs px-2 py-1 rounded hover:bg-red-100 text-bad">🗑️</button>}
                      </div>
                    </Td>
                  </tr>
                );
              })}
              {filasFiltradas.length === 0 && (
                <tr><td colSpan={27} className="text-center text-slate-400 py-8">
                  {busqueda ? `No se encontraron resultados para "${busqueda}".` : "Sin filas para este mes/empresa."}
                </td></tr>
              )}
            </tbody>
            {filasFiltradas.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50">
                  <td colSpan={13} className="px-2 py-2 text-xs uppercase text-slate-600 font-semibold text-right">Totales mes:</td>
                  <td className="px-2 py-2 text-xs text-right font-bold tabular-nums">{formatCop(filasFiltradas.reduce((s, r) => s + toNumber(r.Total_Devengado), 0))}</td>
                  <td colSpan={6} />
                  <td className="px-2 py-2 text-xs text-right font-bold tabular-nums text-bad">{formatCop(filasFiltradas.reduce((s, r) => s + toNumber(r.Total_Deduccion), 0))}</td>
                  <td className="px-2 py-2 text-xs text-right font-bold tabular-nums text-brand">{formatCop(filasFiltradas.reduce((s, r) => s + toNumber(r.Neto_Pagar), 0))}</td>
                  <td />
                  <td className="px-2 py-2 text-xs text-right font-bold tabular-nums">{formatCop(filasFiltradas.reduce((s, r) => s + toNumber(r.Bonificacion), 0))}</td>
                  <td className="px-2 py-2 text-xs text-right font-bold tabular-nums text-brand">{formatCop(filasFiltradas.reduce((s, r) => {
                    const isVar = (data?.tipo_pago_por_empleado[String(r.ID_Empleado)] || "").toUpperCase() === "VARIABLE";
                    return s + (isVar ? toNumber(r.Bonificacion) : toNumber(r.Neto_Pagar));
                  }, 0))}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </>)}

      {subTab === "asesores" && <AsesoresTab />}
      {subTab === "desprendible" && (
        <DesprendibleTab
          periodo={periodoEfectivo}
          empleados={data?.empleados || []}
          filas={data?.filas || []}
        />
      )}

      <ConfirmDialog {...confirmPrompt} />
      {actionMsg && (
        <div className={"fixed bottom-4 right-4 z-50 max-w-md px-4 py-3 rounded-lg shadow-lg text-sm " +
          (actionMsg.startsWith("✅") ? "bg-emerald-50 text-ok border border-emerald-200" :
           actionMsg.startsWith("❌") ? "bg-red-50 text-bad border border-red-200" :
           "bg-white text-slate-700 border border-slate-200")}>
          <div className="flex items-start gap-2">
            <span className="flex-1">{actionMsg}</span>
            <button onClick={() => setActionMsg(null)} className="text-slate-400 hover:text-slate-700">×</button>
          </div>
        </div>
      )}

      <EditModal
        fila={editFila}
        empleadoTipoPago={editFila ? data?.tipo_pago_por_empleado?.[String(editFila.ID_Empleado)] : undefined}
        parametros={data?.parametros}
        onClose={() => setEditFila(null)}
        onSaved={refresh}
      />
      <EmpleadoModal
        open={empModalOpen}
        mode={empModalMode}
        empresas={data?.empresas || []}
        empleado={empModalTarget}
        periodo={periodoEfectivo}
        onClose={() => setEmpModalOpen(false)}
        onSaved={refresh}
      />
    </div>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1.5 whitespace-nowrap ${className}`}>{children}</td>;
}
function TdNum({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1.5 text-right tabular-nums whitespace-nowrap ${className}`}>{children}</td>;
}
function EstadoBadge({ v }: { v: string }) {
  const k = String(v || "").toUpperCase();
  const c =
    k.includes("CALCUL") ? "bg-emerald-50 text-ok" :
    k === "MANUAL"       ? "bg-blue-50 text-brand" :
    k === "PENDIENTE"    ? "bg-amber-50 text-warn" :
    "bg-slate-100 text-slate-600";
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${c}`}>{v || "—"}</span>;
}
