"use client";
export const runtime = "edge";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/nomina-module/hooks/useFetcher";
import { useNominaRefresh } from "@/lib/nomina-module/hooks/useNominaRefresh";
import KpiBig from "@/components/nomina/dashboard/KpiBig";
import LineaTendencia from "@/components/nomina/dashboard/LineaTendencia";
import { Donut } from "@/components/nomina/dashboard/Donas";
import BarsCargo from "@/components/nomina/dashboard/BarsCargo";
import MiniNovedad from "@/components/nomina/dashboard/MiniNovedad";
import { formatCop, formatPeriodoEs, toNumber, labelCorte } from "@/lib/nomina-module/utils/format";
import type { NominaFila, Novedad, Bonificacion, Alerta } from "@/lib/nomina-module/types/nomina";

type PeriodosResp = { periodos: { periodo: string; corte: string }[] };
type PeriodoResp = {
  periodo: string;
  corte: string | null;
  kpis: { total_nomina: number; empleados: number; total_deducciones: number; total_bonificaciones: number };
  filas: NominaFila[];
  novedades: Novedad[];
  bonificaciones: Bonificacion[];
  alertas: Alerta[];
  tipo_pago_por_empleado: Record<string, string>;
  empresa_por_empleado: Record<string, string>;
  parametros?: {
    smmlv: number; aux_transporte: number; dias_base_mes: number;
    pct_salud: number; pct_pension: number; pct_fsp: number; pct_ss_aprox: number;
    pct_cesantias?: number; pct_int_cesantias?: number; pct_prima?: number; pct_vacaciones?: number;
    pct_salud_patronal?: number; pct_pension_patronal?: number; pct_arl?: number;
    pct_sena?: number; pct_icbf?: number; pct_caja?: number;
  };
};
type TendenciaResp = {
  corte: string | null;
  tendencia: { periodo: string; total_neto: number; total_devengado: number; total_deduccion: number; total_bonificacion: number; num_empleados: number }[];
};

export default function NominaPage() {
  const { data: pData, error: pErr, isLoading: pLoading } =
    useApi<PeriodosResp>("/api/nomina-data?ns=nomina&action=lista");

  const [mes, setMes] = useState<string>("");
  const [corteSel, setCorteSel] = useState<string>("");

  const mesesDisponibles = useMemo(() => {
    if (!pData?.periodos) return [];
    return Array.from(new Set(pData.periodos.map((p) => p.periodo))).sort().reverse();
  }, [pData]);

  const cortesDisponibles = useMemo(() => {
    if (!pData?.periodos || !mes) return [];
    // "" = todos los cortes (consolidado del mes) — siempre primera opción.
    return ["", ...Array.from(new Set(pData.periodos.filter((p) => p.periodo === mes).map((p) => p.corte)))];
  }, [pData, mes]);

  useEffect(() => {
    if (!mes && mesesDisponibles.length) setMes(mesesDisponibles[0]);
  }, [mes, mesesDisponibles]);
  useEffect(() => {
    // Default: "" (consolidado). Si el seleccionado ya no existe en el mes, vuelve a "".
    if (cortesDisponibles.length && !cortesDisponibles.includes(corteSel)) setCorteSel("");
  }, [cortesDisponibles, corteSel]);

  const periodo = mes;
  const corte = corteSel;
  const url = periodo
    ? `/api/nomina-data?ns=nomina&action=periodo&periodo=${encodeURIComponent(periodo)}&corte=${encodeURIComponent(corte || "")}`
    : null;
  const { data, error, isLoading } = useApi<PeriodoResp>(url);

  // Tendencia mensual (filtrada por corte si hay).
  const urlTendencia = `/api/nomina-data?ns=nomina&action=tendencia${corte ? `&corte=${encodeURIComponent(corte)}` : ""}`;
  const { data: tData } = useApi<TendenciaResp>(urlTendencia);

  const [recalcMsg, setRecalcMsg] = useState<string | null>(null);
  const [recalcLoading, setRecalcLoading] = useState(false);
  const refreshAll = useNominaRefresh();

  async function recalcular() {
    if (!periodo) return;
    setRecalcLoading(true);
    setRecalcMsg(null);
    try {
      const res = await fetch("/api/nomina-data?ns=nomina&action=recalcular", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodo, corte }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRecalcMsg(`✅ Recalculadas ${json.recalculadas}, omitidas (VARIABLE) ${json.omitidas_variable}`);
      refreshAll(periodo, corte);
    } catch (e) {
      const m = (e as Error).message || "Error";
      const f = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(m)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : m;
      setRecalcMsg(`❌ ${f}`);
    } finally {
      setRecalcLoading(false);
    }
  }

  // === CÁLCULOS DASHBOARD ===
  const periodoAnterior = useMemo(() => {
    if (!mes) return null;
    const idx = mesesDisponibles.indexOf(mes);
    // mesesDisponibles está desc → idx+1 es el ANTERIOR (más viejo).
    return idx >= 0 && idx + 1 < mesesDisponibles.length ? mesesDisponibles[idx + 1] : null;
  }, [mes, mesesDisponibles]);

  const tendenciaArr = tData?.tendencia || [];
  const puntoActual = tendenciaArr.find((t) => t.periodo === periodo);
  const puntoPrev = periodoAnterior ? tendenciaArr.find((t) => t.periodo === periodoAnterior) : null;

  const delta = (cur: number | undefined, prev: number | undefined): number | null => {
    if (cur === undefined || prev === undefined || !prev) return null;
    return (cur - prev) / prev;
  };

  // KPIs del periodo seleccionado
  const totalNomina       = data?.kpis.total_nomina ?? 0;
  const empleadosUnicos   = new Set((data?.filas || []).map((f) => f.ID_Empleado)).size;
  const totalDeducciones  = data?.kpis.total_deducciones ?? 0;
  const totalBonif        = data?.kpis.total_bonificaciones ?? 0;

  // Costo total empresa — fórmula con tasas Parametros (server las envía en parametros).
  const costoTotalEmpresa = useMemo(() => {
    const p = data?.parametros;
    const filas = data?.filas || [];
    const devBasico = filas.reduce((s, r) => s + toNumber(r.Devengado_Basico), 0);
    const totalDev  = filas.reduce((s, r) => s + toNumber(r.Total_Devengado), 0);
    if (!p) return totalDev;
    const patron = (p.pct_salud_patronal ?? 0) + (p.pct_pension_patronal ?? 0) + (p.pct_arl ?? 0)
                 + (p.pct_sena ?? 0) + (p.pct_icbf ?? 0) + (p.pct_caja ?? 0);
    const ces  = devBasico * (p.pct_cesantias ?? 0);
    const intC = ces * (p.pct_int_cesantias ?? 0);
    const prima = devBasico * (p.pct_prima ?? 0);
    const vac = devBasico * (p.pct_vacaciones ?? 0);
    return totalDev + devBasico * patron + ces + intC + prima + vac;
  }, [data]);

  const costoPrev = useMemo(() => {
    // Estimación simple para delta (sin filas del mes prev → usa total_devengado prev × multiplicador).
    if (!puntoPrev) return undefined;
    return puntoPrev.total_devengado * 1.5; // heurístico — sin filas del prev no podemos exacto
  }, [puntoPrev]);

  // Distribución por empresa (donut)
  const distEmpresa = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data?.filas || []) {
      const e = (data?.empresa_por_empleado[String(r.ID_Empleado)] || "—").trim().toUpperCase() || "—";
      m.set(e, (m.get(e) || 0) + toNumber(r.Neto_Pagar));
    }
    return Array.from(m.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [data]);

  // Composición del pago (donut)
  const composicion = useMemo(() => {
    const filas = data?.filas || [];
    const dev = filas.reduce((s, r) => s + toNumber(r.Devengado_Basico), 0);
    const aux = filas.reduce((s, r) => s + toNumber(r.Aux_Transporte), 0);
    const bon = filas.reduce((s, r) => s + toNumber(r.Bonificacion), 0);
    const ded = filas.reduce((s, r) => s + toNumber(r.Total_Deduccion), 0);
    return [
      { name: "Devengado básico", value: dev },
      { name: "Aux. transporte",  value: aux },
      { name: "Bonificación",     value: bon },
      { name: "Deducciones",      value: ded },
    ].filter((x) => x.value > 0);
  }, [data]);

  // Nómina por cargo (barras horizontales top 8)
  const porCargo = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of data?.filas || []) {
      const c = (r.Cargo || "—").trim().toUpperCase() || "—";
      m.set(c, (m.get(c) || 0) + toNumber(r.Neto_Pagar));
    }
    return Array.from(m.entries())
      .map(([cargo, total]) => ({ cargo, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [data]);

  // Mini-novedades (breakdown por tipo en este periodo)
  const novedadesMini = useMemo(() => {
    const acc = { INC: { d: 0, p: new Set<string>() }, VAC: { d: 0, p: new Set<string>() }, AUS: { d: 0, p: new Set<string>() } };
    for (const n of data?.novedades || []) {
      const t = String(n.Tipo_Novedad || "").toUpperCase();
      const d = toNumber(n.Dias);
      const id = String(n.ID_Empleado);
      if (t.includes("INCAPAC")) { acc.INC.d += d; acc.INC.p.add(id); }
      else if (t.includes("VACAC")) { acc.VAC.d += d; acc.VAC.p.add(id); }
      else if (t.includes("AUSEN")) { acc.AUS.d += d; acc.AUS.p.add(id); }
    }
    // También cuenta desde columnas fila si existen.
    for (const f of data?.filas || []) {
      const inc = toNumber(f.Incapacidades); if (inc > 0) { acc.INC.d = Math.max(acc.INC.d, inc); acc.INC.p.add(String(f.ID_Empleado)); }
      const vac = toNumber(f.Vacaciones);    if (vac > 0) { acc.VAC.d = Math.max(acc.VAC.d, vac); acc.VAC.p.add(String(f.ID_Empleado)); }
      const aus = toNumber(f.Ausencias);     if (aus > 0) { acc.AUS.d = Math.max(acc.AUS.d, aus); acc.AUS.p.add(String(f.ID_Empleado)); }
    }
    return {
      INC: { dias: acc.INC.d, personas: acc.INC.p.size },
      VAC: { dias: acc.VAC.d, personas: acc.VAC.p.size },
      AUS: { dias: acc.AUS.d, personas: acc.AUS.p.size },
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand">Resumen Nómina</h1>
          <p className="text-sm text-slate-500">
            Dashboard ejecutivo · {periodo ? `${formatPeriodoEs(periodo)} · ${labelCorte(corte)}` : "—"}
          </p>
        </div>
        <div className="flex items-end gap-2">
          <button onClick={recalcular} disabled={!periodo || recalcLoading}
                  className="px-3 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50">
            {recalcLoading ? "Recalculando…" : "Recalcular periodo"}
          </button>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Mes</label>
            <select value={mes} onChange={(e) => setMes(e.target.value)}
                    disabled={pLoading || !!pErr}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
              {pLoading && <option>Cargando…</option>}
              {mesesDisponibles.map((m) => <option key={m} value={m}>{formatPeriodoEs(m)}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Corte</label>
            <select value={corteSel} onChange={(e) => setCorteSel(e.target.value)}
                    disabled={cortesDisponibles.length === 0}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
              {cortesDisponibles.map((c) => <option key={c} value={c}>{labelCorte(c)}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && <div className="card border-bad/30 bg-red-50 text-bad text-sm">Error: {(error as Error).message}</div>}
      {recalcMsg && (
        <div className={"card text-sm " + (recalcMsg.startsWith("✅") ? "bg-emerald-50 text-ok" : "bg-red-50 text-bad")}>
          {recalcMsg}
        </div>
      )}

      {/* KPIs grandes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiBig label="Total nómina" accent="brand"
                value={isLoading ? "…" : formatCop(totalNomina)}
                delta={delta(puntoActual?.total_neto, puntoPrev?.total_neto)} />
        <KpiBig label="Empleados pagados" accent="cyan"
                value={isLoading ? "…" : empleadosUnicos}
                delta={delta(puntoActual?.num_empleados, puntoPrev?.num_empleados)} />
        <KpiBig label="Total deducciones" accent="bad"
                value={isLoading ? "…" : formatCop(totalDeducciones)}
                delta={delta(puntoActual?.total_deduccion, puntoPrev?.total_deduccion)} />
        <KpiBig label="Total bonificaciones" accent="warn"
                value={isLoading ? "…" : formatCop(totalBonif)}
                delta={delta(puntoActual?.total_bonificacion, puntoPrev?.total_bonificacion)} />
        <KpiBig label="Costo total empresa" accent="violet"
                value={isLoading ? "…" : formatCop(costoTotalEmpresa)}
                hint="Devengado + patronales + provisiones"
                delta={costoPrev ? delta(costoTotalEmpresa, costoPrev) : null} />
      </div>

      {/* Tendencia mensual */}
      <div className="card">
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="text-sm font-semibold text-slate-700">Tendencia de nómina mensual</h3>
          <span className="text-[11px] text-slate-400">{tendenciaArr.length} meses · corte {labelCorte(corte)}</span>
        </div>
        {tendenciaArr.length > 0
          ? <LineaTendencia data={tendenciaArr} />
          : <p className="text-sm text-slate-400 py-10 text-center">Sin datos de tendencia.</p>}
      </div>

      {/* Donas: empresa + composición */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Distribución por empresa</h3>
          {distEmpresa.length > 0
            ? <Donut data={distEmpresa} totalLabel="Nómina del mes" />
            : <p className="text-sm text-slate-400 py-10 text-center">Sin datos.</p>}
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Composición del pago</h3>
          {composicion.length > 0
            ? <Donut data={composicion} totalLabel="Total componentes" />
            : <p className="text-sm text-slate-400 py-10 text-center">Sin datos.</p>}
        </div>
      </div>

      {/* Barras por cargo */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Nómina por cargo / campaña (top 8)</h3>
        {porCargo.length > 0
          ? <BarsCargo data={porCargo} />
          : <p className="text-sm text-slate-400 py-10 text-center">Sin datos.</p>}
      </div>

      {/* Mini-novedades */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniNovedad label="Incapacidades" dias={novedadesMini.INC.dias} personas={novedadesMini.INC.personas} tone="info" icon={<span>🤒</span>} />
        <MiniNovedad label="Vacaciones"    dias={novedadesMini.VAC.dias} personas={novedadesMini.VAC.personas} tone="ok"   icon={<span>🏖️</span>} />
        <MiniNovedad label="Ausencias"     dias={novedadesMini.AUS.dias} personas={novedadesMini.AUS.personas} tone="bad"  icon={<span>⚠️</span>} />
      </div>
    </div>
  );
}

