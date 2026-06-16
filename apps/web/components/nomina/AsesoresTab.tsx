"use client";
import { useState } from "react";
import { useApi } from "@/lib/nomina-module/hooks/useFetcher";
import { useNominaRefresh } from "@/lib/nomina-module/hooks/useNominaRefresh";
import { matchAny } from "@/lib/nomina-module/utils/format";
import type { Asesor } from "@/lib/nomina-module/types/asesor";
import ConfirmDialog, { type ConfirmPrompt } from "@/components/nomina-ui/ConfirmDialog";

type Resp = { asesores: Asesor[]; notice?: string };

const HEADERS = [
  "EMPRESA", "NOMBRE", "TIPO DOCUMENTO", "CÉDULA", "FECHA NACIMIENTO", "EDAD",
  "FECHA DE INGRESO", "FECHA RETIRO / DURACIÓN",
  "BANCO", "TIPO", "CUENTA BANCARIA", "CONTRATO",
  "HIJOS", "CAJA DE COMPENSACIÓN", "ARL", "EPS", "PENSIÓN", "CESANTIAS",
  "CELULAR", "CORREO ELECTRÓNICO", "CIUDAD", "DIRECCIÓN", "ESTADO", "",
];

function calcEdad(fnac: string): string {
  if (!fnac) return "—";
  const d = new Date(fnac);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const a = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return String(a);
}
function diasDesde(f: string): string {
  if (!f) return "—";
  const d = new Date(f);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}m`;
  const years = (days / 365.25).toFixed(1);
  return `${years}a`;
}

export default function AsesoresTab() {
  const { data, error, isLoading } = useApi<Resp>("/api/nomina-data?ns=asesores&action=lista");
  const refreshAll = useNominaRefresh();
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("TODAS");
  const [filtroEstado, setFiltroEstado] = useState<"TODAS" | "ACTIVA" | "RETIRADA">("TODAS");
  const [busqueda, setBusqueda] = useState<string>("");
  const [confirmPrompt, setConfirmPrompt] = useState<ConfirmPrompt>({
    open: false, title: "", message: "", onConfirm: () => { /* noop */ },
  });
  function closeConfirm() { setConfirmPrompt((p) => ({ ...p, open: false })); }

  function pedirRetirar(a: Asesor) {
    setConfirmPrompt({
      open: true, tone: "warn", title: "Retirar asesor",
      confirmLabel: "Retirar",
      message: (
        <div className="space-y-2">
          <p>¿Retirar a <span className="font-semibold">{a.Nombre}</span>?</p>
          <p className="text-xs text-slate-500">Marca Estado = RETIRADA y Fecha_Retiro = hoy. Se mantiene en el histórico.</p>
        </div>
      ),
      onConfirm: async () => {
        closeConfirm();
        const res = await fetch("/api/nomina-data?ns=asesores&action=retirar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.ID_Asesor }),
        });
        if (!res.ok) return; // error silenciado — el provider ya muestra via SWR
        refresh();
      },
      onCancel: closeConfirm,
    });
  }
  function pedirBorrar(a: Asesor) {
    setConfirmPrompt({
      open: true, tone: "bad", title: "Borrar asesor",
      confirmLabel: "Borrar definitivamente",
      message: (
        <div className="space-y-2">
          <p>¿Borrar PERMANENTEMENTE a <span className="font-semibold">{a.Nombre}</span>?</p>
          <p className="text-xs text-bad">Elimina la fila del Sheet. No se puede deshacer.</p>
        </div>
      ),
      onConfirm: async () => {
        closeConfirm();
        const res = await fetch("/api/nomina-data?ns=asesores&action=borrar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.ID_Asesor }),
        });
        if (!res.ok) return;
        refresh();
      },
      onCancel: closeConfirm,
    });
  }

  function refresh() {
    refreshAll();
    // Adicional: revalidar la URL exacta de asesores.
    fetch("/api/nomina-data?ns=asesores&action=lista&fresh=1", { cache: "no-store" });
  }

  const empresas = Array.from(new Set((data?.asesores || []).map((a) => a.Empresa))).filter(Boolean).sort();
  const filas = (data?.asesores || []).filter((a) => {
    if (filtroEmpresa !== "TODAS" && a.Empresa !== filtroEmpresa) return false;
    if (filtroEstado !== "TODAS" && a.Estado !== filtroEstado) return false;
    if (busqueda && !matchAny(a as unknown as Record<string, unknown>, busqueda)) return false;
    return true;
  });

  const activas = (data?.asesores || []).filter((a) => a.Estado === "ACTIVA").length;
  const retiradas = (data?.asesores || []).filter((a) => a.Estado === "RETIRADA").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand">Asesores Comerciales</h3>
          <p className="text-xs text-slate-500">
            Histórico de personal. <span className="text-ok">{activas} activas</span> ·{" "}
            <span className="text-bad">{retiradas} retiradas</span>
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          {(["TODAS", "ACTIVA", "RETIRADA"] as const).map((e) => (
            <button key={e} onClick={() => setFiltroEstado(e)}
              className={"px-2 py-1 rounded-full border " + (filtroEstado === e ? "bg-brand text-white border-brand" : "bg-white text-slate-600 border-slate-200")}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-1">
          {["TODAS", ...empresas].map((e) => (
            <button key={e} onClick={() => setFiltroEmpresa(e)}
              className={"px-3 py-1 text-xs font-medium rounded-full border " +
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
            placeholder="Buscar por nombre, cédula, ciudad, EPS…"
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
      {data?.notice && <div className="card bg-amber-50 text-warn text-sm">{data.notice}</div>}

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2400px] text-xs">
            <thead className="bg-brand text-white sticky top-0">
              <tr>
                {HEADERS.map((h) => (
                  <th key={h} className="text-left px-2 py-2 font-semibold whitespace-nowrap border-r border-brand-light/40 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={HEADERS.length} className="text-center text-slate-400 py-6">Cargando…</td></tr>}
              {!isLoading && filas.length === 0 && (
                <tr><td colSpan={HEADERS.length} className="text-center text-slate-400 py-6">
                  {busqueda ? `No se encontraron resultados para "${busqueda}".` : "Sin asesores."}
                </td></tr>
              )}
              {filas.map((a) => {
                const retirada = a.Estado === "RETIRADA";
                return (
                  <tr key={a.ID_Asesor}
                      className={"border-b border-slate-100 " + (retirada ? "bg-red-50 text-red-900/70" : "hover:bg-slate-50")}>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Empresa}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap font-medium">{a.Nombre}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Tipo_Doc}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Cedula}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Fecha_Nacimiento || "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{calcEdad(a.Fecha_Nacimiento)}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Fecha_Ingreso || "—"}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      {retirada ? <span className="text-bad font-medium">{a.Fecha_Retiro || "—"}</span>
                                : <span className="text-slate-500">Activo {diasDesde(a.Fecha_Ingreso)}</span>}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Banco}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Tipo_Cuenta}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Cuenta_Bancaria}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Contrato}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Hijos}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Caja_Compensacion}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.ARL}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.EPS}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Pension}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Cesantias}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Celular}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Correo}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Ciudad}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{a.Direccion}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <span className={"px-2 py-0.5 rounded text-[10px] font-semibold " +
                        (retirada ? "bg-red-200 text-red-900" : "bg-emerald-100 text-ok")}>
                        {a.Estado}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap">
                      <div className="flex gap-1">
                        {!retirada && <button onClick={() => pedirRetirar(a)} title="Retirar" className="text-xs px-2 py-1 rounded hover:bg-amber-100 text-amber-700">🚫</button>}
                        <button onClick={() => pedirBorrar(a)} title="Borrar definitivamente" className="text-xs px-2 py-1 rounded hover:bg-red-100 text-bad">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog {...confirmPrompt} />
    </div>
  );
}

