"use client";
import { useEffect, useMemo, useState } from "react";
import { useApi } from "@/lib/hooks/useFetcher";
import { formatCop, formatPeriodoEs, labelCorte } from "@/lib/utils/format";
import type { Empleado, NominaFila } from "@/lib/types/nomina";

type Desprendible = {
  encabezado: { empresa: string; nit: string; periodo_pago: string; periodo_causacion: string; corte: string };
  empleado: { id_empleado: string; cedula: string; tipo_doc: string; nombre: string; ocupacion: string; fecha_ingreso: string; sueldo_bruto: number };
  ingresos: { label: string; valor: number }[];
  descuentos: { label: string; valor: number }[];
  totales: { total_ingresos: number; total_descuentos: number; neto_pagar: number };
};

type Props = {
  periodo: string;
  empleados: Empleado[];
  filas: NominaFila[];
};

export default function DesprendibleTab({ periodo, empleados, filas }: Props) {
  // Solo empleados con fila en este periodo.
  const empleadosDelMes = useMemo(() => {
    const ids = new Set(filas.map((f) => String(f.ID_Empleado)));
    return empleados.filter((e) => ids.has(String(e.ID_Empleado)));
  }, [filas, empleados]);

  const [empId, setEmpId] = useState<string>("");
  useEffect(() => {
    if (!empId && empleadosDelMes[0]) setEmpId(empleadosDelMes[0].ID_Empleado);
  }, [empleadosDelMes, empId]);

  // Si hay 2 cortes para este empleado, dejar elegir.
  const cortesDelEmp = useMemo(() => {
    return Array.from(new Set(filas
      .filter((f) => String(f.ID_Empleado) === empId)
      .map((f) => String(f.Corte))));
  }, [filas, empId]);
  const [corte, setCorte] = useState<string>("");
  useEffect(() => {
    if (cortesDelEmp.length && !cortesDelEmp.includes(corte)) setCorte(cortesDelEmp[0]);
  }, [cortesDelEmp, corte]);

  const url = empId && periodo
    ? `/api/data?ns=desprendible&action=generar&id_empleado=${encodeURIComponent(empId)}&periodo=${encodeURIComponent(periodo)}&corte=${encodeURIComponent(corte)}`
    : null;
  const { data, error, isLoading } = useApi<Desprendible>(url);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 justify-between print:hidden">
        <div>
          <h3 className="text-lg font-semibold text-brand">Desprendible de Nómina</h3>
          <p className="text-xs text-slate-500">Colilla de pago — generada al vuelo desde Parametros + Nomina_Periodo.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Empleado</label>
          <select value={empId} onChange={(e) => setEmpId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 min-w-[260px]">
            {empleadosDelMes.length === 0 && <option>Sin empleados en este mes</option>}
            {empleadosDelMes.map((e) => (
              <option key={e.ID_Empleado} value={e.ID_Empleado}>{e.Nombre} · {e.Cedula}</option>
            ))}
          </select>
          {cortesDelEmp.length > 1 && (
            <>
              <label className="text-xs text-slate-500">Corte</label>
              <select value={corte} onChange={(e) => setCorte(e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
                {cortesDelEmp.map((c) => <option key={c} value={c}>{labelCorte(c)}</option>)}
              </select>
            </>
          )}
          <button onClick={() => window.print()}
                  className="px-3 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark">
            Imprimir
          </button>
        </div>
      </div>

      {error && <div className="card bg-red-50 text-bad text-sm print:hidden">Error: {(error as Error).message}</div>}
      {isLoading && <div className="card text-slate-500 text-sm print:hidden">Cargando…</div>}

      {data && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 max-w-3xl mx-auto shadow-sm desprendible-print">
          {/* Encabezado */}
          <div className="text-center border-b border-slate-300 pb-3 mb-4">
            <h2 className="text-xl font-bold text-brand uppercase">{data.encabezado.empresa}</h2>
            <p className="text-xs text-slate-600">NIT {data.encabezado.nit}</p>
            <p className="text-xs text-slate-600 mt-1">DESPRENDIBLE DE NÓMINA</p>
          </div>

          {/* Datos cabecera */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs mb-5 border-b border-slate-200 pb-3">
            <KV label="Periodo de pago" value={formatPeriodoEs(data.encabezado.periodo_pago)} />
            <KV label="Periodo de causación" value={data.encabezado.periodo_causacion} />
            <KV label="Corte" value={labelCorte(data.encabezado.corte)} />
            <KV label="Empleado" value={`${data.empleado.tipo_doc} ${data.empleado.cedula}`} />
            <KV label="Nombre" value={data.empleado.nombre} cols={2} />
            <KV label="Ocupación" value={data.empleado.ocupacion} cols={2} />
            <KV label="Fecha ingreso" value={data.empleado.fecha_ingreso || "—"} />
            <KV label="Sueldo bruto" value={formatCop(data.empleado.sueldo_bruto)} />
          </div>

          {/* Dos columnas */}
          <div className="grid grid-cols-2 gap-6 mb-4">
            <Tabla titulo="INGRESOS" rows={data.ingresos} total={data.totales.total_ingresos} />
            <Tabla titulo="DESCUENTOS" rows={data.descuentos} total={data.totales.total_descuentos} esBad />
          </div>

          {/* Neto */}
          <div className="bg-brand text-white rounded-lg px-4 py-3 flex justify-between items-center mt-4">
            <span className="text-sm uppercase tracking-wide">Neto a Pagar</span>
            <span className="text-xl font-bold tabular-nums">{formatCop(data.totales.neto_pagar)}</span>
          </div>

          <p className="text-[10px] text-slate-400 mt-6 text-center">
            Este documento es generado automáticamente desde la base de datos de nómina.
            Validar con el área administrativa en caso de inconsistencia.
          </p>
        </div>
      )}

      <style>{`
        @media print {
          @page { margin: 1.2cm; size: A4; }
          html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          /* Oculta TODO por defecto sin romper layout */
          body * { visibility: hidden !important; }
          /* Solo la colilla queda visible */
          .desprendible-print, .desprendible-print * { visibility: visible !important; }
          .desprendible-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 1.5rem !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
          }
          /* Asegura colores de impresión */
          .desprendible-print, .desprendible-print * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

function KV({ label, value, cols = 1 }: { label: string; value: string; cols?: 1 | 2 }) {
  return (
    <div className={cols === 2 ? "col-span-2" : ""}>
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function Tabla({ titulo, rows, total, esBad = false }: {
  titulo: string; rows: { label: string; valor: number }[]; total: number; esBad?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-300 pb-1 mb-2">{titulo}</div>
      <table className="w-full text-xs">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-slate-100">
              <td className="py-1 text-slate-700">{r.label}</td>
              <td className={"py-1 text-right tabular-nums " + (esBad && r.valor > 0 ? "text-bad" : "text-slate-800")}>
                {formatCop(r.valor)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-bold">
            <td className="pt-2 uppercase text-[10px]">Total {titulo.toLowerCase()}</td>
            <td className={"pt-2 text-right tabular-nums " + (esBad ? "text-bad" : "text-brand")}>{formatCop(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
