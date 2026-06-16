"use client";
export const runtime = "edge";
import { useState } from "react";
import { useApi } from "@/lib/hooks/useFetcher";
import KpiCard from "@/components/ui/KpiCard";
import { PieDist, BarDist } from "@/components/ui/Charts";
import { formatCop } from "@/lib/utils/format";
import type { CreditoCalc, KpisCartera, BucketEstado, BucketMora, BucketPagaduria } from "@/lib/calc/creditFifo";

type DashResp = {
  kpis: KpisCartera;
  distribucion_estado: BucketEstado[];
  buckets_mora: BucketMora[];
};
type MoraResp = { creditos: CreditoCalc[]; buckets: BucketMora[] };
type PagResp = { pagadurias: BucketPagaduria[] };

type Tab = "dashboard" | "mora" | "pagaduria";

export default function CreditoAdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-brand">Crédito · Administrativo</h1>
        <p className="text-sm text-slate-500">
          Datos en vivo desde BD_CREDITOS_SERVIMIL. Cálculos FIFO sin escribir al Sheet.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        {([
          ["dashboard", "Dashboard"],
          ["mora", "Cartera en mora"],
          ["pagaduria", "Por pagaduría"],
        ] as const).map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              "px-4 py-2 text-sm font-medium border-b-2 transition " +
              (tab === k
                ? "border-brand text-brand"
                : "border-transparent text-slate-500 hover:text-slate-700")
            }
          >
            {lbl}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "mora" && <CarteraMora />}
      {tab === "pagaduria" && <ResumenPagaduria />}
    </div>
  );
}

function Dashboard() {
  const { data, error, isLoading } = useApi<DashResp>("/api/data?ns=credito&action=dashboard");
  if (error) return <ErrBox e={error as Error} />;
  const k = data?.kpis;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total créditos" value={isLoading ? "…" : k?.num_creditos ?? 0} />
        <KpiCard label="Capital desplegado" value={isLoading ? "…" : formatCop(k?.capital_desplegado ?? 0)} />
        <KpiCard label="Recaudo acumulado" value={isLoading ? "…" : formatCop(k?.recaudo_acumulado ?? 0)} />
        <KpiCard label="Capital en riesgo" value={isLoading ? "…" : formatCop(k?.capital_riesgo ?? 0)} hint="MORA ∪ Score ALTO" />
        <KpiCard label="Mora (por $)" value={isLoading ? "…" : `${(k?.indice_mora_valor_pct ?? 0).toFixed(1)}%`} hint="pendiente MORA / capital activo" />
        <KpiCard label="Mora (por #)" value={isLoading ? "…" : `${(k?.indice_mora_count_pct ?? 0).toFixed(1)}%`} hint="# MORA / # total" />
        <KpiCard label="# Alto riesgo" value={isLoading ? "…" : k?.num_alto_riesgo ?? 0} hint="🔴 Score" />
        <KpiCard label="# Vigentes / Pagados / Mora" value={isLoading ? "…" : `${k?.num_vigentes ?? 0} / ${k?.num_pagados ?? 0} / ${k?.num_mora ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Distribución por estado</h3>
          {data && <PieDist data={data.distribucion_estado.map((d) => ({ ...d }))} dataKey="count" nameKey="estado" />}
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Mora por antigüedad (días)</h3>
          {data && (
            <BarDist
              data={data.buckets_mora.map((b) => ({ ...b }))}
              xKey="rango"
              yKey="count"
              label="# créditos"
            />
          )}
        </div>
      </div>

      {data && <BucketsMoraTabla buckets={data.buckets_mora} />}
    </div>
  );
}

function BucketsMoraTabla({ buckets }: { buckets: BucketMora[] }) {
  const total_count = buckets.reduce((s, b) => s + b.count, 0);
  const total_pend = buckets.reduce((s, b) => s + b.pendiente, 0);
  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">Buckets antigüedad mora</h3>
      </div>
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>{["Rango (días)", "# créditos", "Pendiente"].map((h) => (
            <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 border-b border-slate-200">{h}</th>
          ))}</tr>
        </thead>
        <tbody>
          {buckets.map((b) => (
            <tr key={b.rango} className="hover:bg-slate-50">
              <td className="px-3 py-2 text-sm border-b border-slate-100 font-medium">{b.rango}</td>
              <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{b.count}</td>
              <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{formatCop(b.pendiente)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="px-3 py-2 text-xs uppercase text-slate-500">Total mora</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{total_count}</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCop(total_pend)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CarteraMora() {
  const { data, error, isLoading } = useApi<MoraResp>("/api/data?ns=credito&action=mora");
  if (error) return <ErrBox e={error as Error} />;
  return (
    <div className="space-y-4">
      {data && <BucketsMoraTabla buckets={data.buckets} />}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">
            Créditos en mora ({data?.creditos.length ?? 0}) — priorizados por pendiente
          </h3>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Cargando…</p>
        ) : (data?.creditos.length ?? 0) === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Sin créditos en mora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>{["Cliente", "Fuerza", "Pendiente", "Días mora", "% recaudo", "Score", "Asesor"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 border-b border-slate-200">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {data?.creditos.map((c) => (
                  <tr key={c.ID_Credito} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-sm border-b border-slate-100">
                      <div className="font-medium text-slate-800">{c.Nombre}</div>
                      <div className="text-xs text-slate-400">{c.Codigo_Militar}</div>
                    </td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100">{c.Fuerza}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums font-semibold text-bad">{formatCop(c.pendiente_calc)}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{c.dias_mora_num}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{c.pct_recup_total.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100"><ScoreBadge nivel={c.score_nivel} /></td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-slate-600">{c.Asesor_Comercial}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ResumenPagaduria() {
  const { data, error, isLoading } = useApi<PagResp>("/api/data?ns=credito&action=pagaduria");
  if (error) return <ErrBox e={error as Error} />;
  const rows = data?.pagadurias ?? [];
  const tot = rows.reduce(
    (a, r) => ({
      num_creditos: a.num_creditos + r.num_creditos,
      capital: a.capital + r.capital,
      recaudado: a.recaudado + r.recaudado,
      pendiente: a.pendiente + r.pendiente,
      num_mora: a.num_mora + r.num_mora,
    }),
    { num_creditos: 0, capital: 0, recaudado: 0, pendiente: 0, num_mora: 0 }
  );
  return (
    <div className="space-y-4">
      {data && (
        <div className="card">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Distribución por pagaduría (Fuerza)</h3>
          <BarDist
            data={rows.slice(0, 6).map((r) => ({ fuerza: r.fuerza, n: r.num_creditos }))}
            xKey="fuerza"
            yKey="n"
            label="# créditos"
          />
        </div>
      )}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Resumen por Fuerza</h3>
        </div>
        {isLoading ? (
          <p className="text-sm text-slate-400 py-6 text-center">Cargando…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50">
                <tr>{["Fuerza", "# créditos", "Capital", "Recaudado", "Pendiente", "# mora", "% mora"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2 border-b border-slate-200">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.fuerza} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-sm border-b border-slate-100 font-medium">{r.fuerza}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{r.num_creditos}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{formatCop(r.capital)}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums text-ok">{formatCop(r.recaudado)}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{formatCop(r.pendiente)}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">{r.num_mora}</td>
                    <td className="px-3 py-2 text-sm border-b border-slate-100 text-right tabular-nums">
                      <span className={r.mora_pct > 20 ? "text-bad font-semibold" : r.mora_pct > 10 ? "text-warn" : "text-slate-600"}>
                        {r.mora_pct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-3 py-2 text-xs uppercase text-slate-500">Total</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{tot.num_creditos}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCop(tot.capital)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCop(tot.recaudado)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCop(tot.pendiente)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{tot.num_mora}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBadge({ nivel }: { nivel: "BAJO" | "MEDIO" | "ALTO" | "DESCONOCIDO" }) {
  const map = {
    BAJO:  { c: "bg-emerald-50 text-ok",     dot: "🟢" },
    MEDIO: { c: "bg-amber-50 text-warn",     dot: "🟡" },
    ALTO:  { c: "bg-red-50 text-bad",        dot: "🔴" },
    DESCONOCIDO: { c: "bg-slate-100 text-slate-500", dot: "·" },
  };
  const { c, dot } = map[nivel];
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c}`}>{dot} {nivel}</span>;
}

function ErrBox({ e }: { e: Error }) {
  return <div className="card border-bad/30 bg-red-50 text-bad text-sm">Error: {e.message}</div>;
}
