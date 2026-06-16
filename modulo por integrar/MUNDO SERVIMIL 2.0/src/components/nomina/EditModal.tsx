"use client";
import { useEffect, useMemo, useState } from "react";
import type { NominaFila, Novedad } from "@/lib/types/nomina";
import type { NominaParametros } from "@/lib/parametros";
import { formatCop, toNumber, labelCorte } from "@/lib/utils/format";
import { recalcularFila, esFijo } from "@/lib/calc/nominaEngine";

type ParamsLite = {
  smmlv: number; aux_transporte: number; dias_base_mes: number;
  pct_salud: number; pct_pension: number; pct_fsp: number; pct_ss_aprox: number;
};

type Props = {
  fila: NominaFila | null;
  empleadoTipoPago?: string;
  parametros?: ParamsLite;
  onClose: () => void;
  onSaved: () => void;
};

type Form = {
  Dias_Trabajados: string;
  Incapacidades: string;
  Vacaciones: string;
  Licencia: string;
  Ausencias: string;
  Bonificacion: string;
  Ded_Credito: string;
  Ded_RteFte: string;
  Ded_Otras: string;
  Neto_Pagar: string;
};

const INIT_FORM: Form = {
  Dias_Trabajados: "", Incapacidades: "", Vacaciones: "", Licencia: "", Ausencias: "",
  Bonificacion: "", Ded_Credito: "", Ded_RteFte: "", Ded_Otras: "", Neto_Pagar: "",
};

export default function EditModal({ fila, empleadoTipoPago, parametros, onClose, onSaved }: Props) {
  const variable = (empleadoTipoPago || "").toUpperCase() === "VARIABLE";
  const [form, setForm] = useState<Form>(INIT_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!fila) return;
    setForm({
      Dias_Trabajados: String(toNumber(fila.Dias_Trabajados)),
      Incapacidades:   String(toNumber(fila.Incapacidades)),
      Vacaciones:      String(toNumber(fila.Vacaciones)),
      Licencia:        String(toNumber(fila.Licencia)),
      Ausencias:       String(toNumber(fila.Ausencias)),
      Bonificacion:    String(toNumber(fila.Bonificacion)),
      Ded_Credito:     String(toNumber(fila.Ded_Credito)),
      Ded_RteFte:      String(toNumber(fila.Ded_RteFte)),
      Ded_Otras:       String(toNumber(fila.Ded_Otras)),
      Neto_Pagar:      String(toNumber(fila.Neto_Pagar)),
    });
    setErr(null);
  }, [fila]);

  // === PREVIEW EN VIVO ===
  // Para FIJO: recalcular client-side usando el mismo motor del backend.
  const preview = useMemo(() => {
    if (!fila || !parametros) return null;
    if (variable) {
      // VARIABLE: motor no calcula. Mostramos lo manual.
      const dev = toNumber(fila.Devengado_Basico);
      const aux = toNumber(fila.Aux_Transporte);
      const totalDev = dev + aux + toNumber(form.Bonificacion);
      const ded = toNumber(form.Ded_Credito) + toNumber(form.Ded_RteFte) + toNumber(form.Ded_Otras);
      const neto = toNumber(form.Neto_Pagar);
      return {
        Devengado_Basico: dev, Aux_Transporte: aux, Total_Devengado: totalDev,
        Ded_Salud: 0, Ded_Pension: 0, Ded_FSP: 0,
        Total_Deduccion: ded, Neto_Pagar: neto,
        SS_Aproximado: 0,
        total: toNumber(form.Bonificacion),
      };
    }
    // Sintetizamos novedades desde los días editados.
    const mk = (tipo: string, dias: number): Novedad | null => dias > 0 ? ({
      ID_Novedad: "preview", Fecha_Registro: "", Periodo: fila.Periodo,
      ID_Empleado: fila.ID_Empleado, Cedula: "", Nombre: "",
      Tipo_Novedad: tipo, Dias: dias, Valor: 0, Fecha_Inicio: "", Fecha_Fin: "",
      Soporte_URL: "", Origen: "PREVIEW", Estado: "", Observaciones: "",
    }) : null;
    const novs = [
      mk("AUSENCIA", toNumber(form.Ausencias)),
      mk("LICENCIA SIN GOCE", toNumber(form.Licencia)),
      // INC y VAC no descuentan días pero las incluimos para que el motor las "vea" si futuras reglas las usan.
      mk("INCAPACIDAD", toNumber(form.Incapacidades)),
      mk("VACACIONES", toNumber(form.Vacaciones)),
    ].filter((x): x is Novedad => x !== null);
    // Construir params con shape minimal para motor.
    const paramsFull = {
      smmlv: parametros.smmlv, aux_transporte: parametros.aux_transporte,
      dias_base_mes: parametros.dias_base_mes,
      pct_salud: parametros.pct_salud, pct_pension: parametros.pct_pension,
      pct_fsp: parametros.pct_fsp, pct_ss_aprox: parametros.pct_ss_aprox,
      raw: new Map<string, number>(),
    } as NominaParametros;
    const empSint = { Tipo_Pago: empleadoTipoPago || "QUINCENAL", Sueldo_Basico: toNumber(fila.Sueldo_Basico) } as never;
    const { fila: filaPreview } = recalcularFila({
      fila, empleado: empSint, novedades_empleado: novs, params: paramsFull,
      override: {
        Bonificacion: toNumber(form.Bonificacion),
        Ded_Credito: toNumber(form.Ded_Credito),
        Ded_RteFte: toNumber(form.Ded_RteFte),
        Ded_Otras: toNumber(form.Ded_Otras),
      },
    });
    return {
      Devengado_Basico: toNumber(filaPreview.Devengado_Basico),
      Aux_Transporte: toNumber(filaPreview.Aux_Transporte),
      Total_Devengado: toNumber(filaPreview.Total_Devengado),
      Ded_Salud: toNumber(filaPreview.Ded_Salud),
      Ded_Pension: toNumber(filaPreview.Ded_Pension),
      Ded_FSP: toNumber(filaPreview.Ded_FSP),
      Total_Deduccion: toNumber(filaPreview.Total_Deduccion),
      Neto_Pagar: toNumber(filaPreview.Neto_Pagar),
      SS_Aproximado: toNumber(filaPreview.SS_Aproximado),
      total: toNumber(filaPreview.Neto_Pagar),
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fila, parametros, form, variable, empleadoTipoPago]);

  if (!fila) return null;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validarLocal(): string | null {
    const checkDias = (label: string, val: string) => {
      const n = toNumber(val);
      if (n < 0 || n > 31) return `${label} debe estar entre 0 y 31 (recibido: ${val})`;
      return null;
    };
    for (const [lbl, key] of [
      ["Días trabajados", "Dias_Trabajados"], ["Incapacidades", "Incapacidades"],
      ["Vacaciones", "Vacaciones"], ["Licencia", "Licencia"], ["Ausencias", "Ausencias"],
    ] as const) {
      const e = checkDias(lbl, form[key]);
      if (e) return e;
    }
    const TOPES: [string, string, number][] = [
      ["Bonificación", form.Bonificacion, 50_000_000],
      ["Ded. Crédito", form.Ded_Credito, 100_000_000],
      ["Ded. Retención Fuente", form.Ded_RteFte, 100_000_000],
      ["Ded. Otras", form.Ded_Otras, 100_000_000],
    ];
    for (const [label, val, tope] of TOPES) {
      const n = toNumber(val);
      if (n < 0) return `${label} no puede ser negativa`;
      if (n > tope) return `${label} ${n.toLocaleString()} excede tope ${tope.toLocaleString()}`;
    }
    if (variable) {
      const n = toNumber(form.Neto_Pagar);
      if (n < -10_000_000 || n > 200_000_000) return `Neto fuera de rango`;
    }
    return null;
  }

  async function guardar() {
    setSaving(true);
    setErr(null);
    try {
      const localErr = validarLocal();
      if (localErr) throw new Error(localErr);
      if (variable) {
        // VARIABLE: escribir manual sin recalc.
        const patch: Partial<NominaFila> = {
          Dias_Trabajados: toNumber(form.Dias_Trabajados),
          Incapacidades: toNumber(form.Incapacidades),
          Vacaciones: toNumber(form.Vacaciones),
          Licencia: toNumber(form.Licencia),
          Ausencias: toNumber(form.Ausencias),
          Bonificacion: toNumber(form.Bonificacion),
          Ded_Credito: toNumber(form.Ded_Credito),
          Ded_RteFte: toNumber(form.Ded_RteFte),
          Ded_Otras: toNumber(form.Ded_Otras),
          Neto_Pagar: toNumber(form.Neto_Pagar),
          Estado: "MANUAL",
          Fecha_Calculo: new Date().toISOString(),
        };
        const res = await fetch("/api/data?ns=nomina&action=update", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: fila!.ID_Nomina, patch }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      } else {
        // FIJO: motor recalcula con overrides + days.
        const overrides: Partial<NominaFila> = {
          Dias_Trabajados: toNumber(form.Dias_Trabajados),
          Incapacidades: toNumber(form.Incapacidades),
          Vacaciones: toNumber(form.Vacaciones),
          Licencia: toNumber(form.Licencia),
          Ausencias: toNumber(form.Ausencias),
          Bonificacion: toNumber(form.Bonificacion),
          Ded_Credito: toNumber(form.Ded_Credito),
          Ded_RteFte: toNumber(form.Ded_RteFte),
          Ded_Otras: toNumber(form.Ded_Otras),
        };
        const res = await fetch("/api/data?ns=nomina&action=update-recalc", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: fila!.ID_Nomina, overrides }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message || "Error desconocido";
      // Traduce mensajes técnicos a algo amigable.
      const friendly = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(msg)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : msg;
      setErr(friendly);
    } finally {
      setSaving(false);
    }
  }

  void esFijo; // referenced
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Editar empleado · {fila.Periodo} · {labelCorte(fila.Corte)}</h3>
            <p className="text-xs text-slate-500">{fila.Nombre} · {fila.Cedula} · {fila.Cargo}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Tipo de pago: <span className="font-medium text-slate-600">{empleadoTipoPago || "—"}</span>
              {variable && <span className="ml-2 px-2 py-0.5 rounded bg-amber-50 text-warn text-[10px] font-semibold">MANUAL</span>}
              {!variable && <span className="ml-2 px-2 py-0.5 rounded bg-emerald-50 text-ok text-[10px] font-semibold">CALCULADO</span>}
              <span className="ml-2 text-slate-400">Sueldo base: {formatCop(fila.Sueldo_Basico)} (edítese desde 👤 Datos empleado)</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* IZQUIERDA — Datos de entrada (editables) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">
              Datos de entrada
            </h4>
            <div className="space-y-2">
              <F label="Días trabajados" value={form.Dias_Trabajados} onChange={set("Dias_Trabajados")} />
              <F label="Incapacidades (días)" value={form.Incapacidades} onChange={set("Incapacidades")} hint="No descuenta" />
              <F label="Vacaciones (días)"    value={form.Vacaciones}    onChange={set("Vacaciones")}    hint="No descuenta" />
              <F label="Licencia (días)"      value={form.Licencia}      onChange={set("Licencia")}      hint="Descuenta días (sin goce)" />
              <F label="Ausencias (días)"     value={form.Ausencias}     onChange={set("Ausencias")}     hint="Descuenta días" />
              <div className="h-px bg-slate-100 my-2" />
              <F label="Bonificación / Comisión" value={form.Bonificacion} onChange={set("Bonificacion")} />
              <F label="Ded. Crédito"            value={form.Ded_Credito}  onChange={set("Ded_Credito")} hint="Manual; futuro: módulo Crédito" />
              <F label="Ded. Retención Fuente"   value={form.Ded_RteFte}   onChange={set("Ded_RteFte")}  hint="Manual (UVT no automatizado)" />
              <F label="Ded. Otras"              value={form.Ded_Otras}    onChange={set("Ded_Otras")} />
              {variable && (
                <>
                  <div className="h-px bg-slate-100 my-2" />
                  <F label="Neto a pagar (MANUAL)" value={form.Neto_Pagar} onChange={set("Neto_Pagar")} hint="VARIABLE: neto ingresado directo" />
                </>
              )}
            </div>
          </div>

          {/* DERECHA — Cálculo (solo lectura, vivo) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700 border-b border-slate-200 pb-1 mb-3">
              Cálculo (preview en vivo)
            </h4>
            <div className="space-y-1.5 text-sm">
              <RO label="Devengado Básico"  value={formatCop(preview?.Devengado_Basico ?? 0)} />
              <RO label="Aux. Transporte"   value={formatCop(preview?.Aux_Transporte ?? 0)} />
              <RO label="Total Devengado"   value={formatCop(preview?.Total_Devengado ?? 0)} bold />
              <div className="h-px bg-slate-100 my-1" />
              <RO label="Ded. Salud (4%)"   value={formatCop(preview?.Ded_Salud ?? 0)} neg />
              <RO label="Ded. Pensión (4%)" value={formatCop(preview?.Ded_Pension ?? 0)} neg />
              <RO label="FSP"               value={formatCop(preview?.Ded_FSP ?? 0)} neg />
              <RO label="Total Deducción"   value={formatCop(preview?.Total_Deduccion ?? 0)} bold neg />
              <div className="h-px bg-slate-100 my-1" />
              <RO label="Neto a Pagar"      value={formatCop(preview?.Neto_Pagar ?? 0)} bold highlight />
              <RO label="SS Aproximado"     value={formatCop(preview?.SS_Aproximado ?? 0)} hint="Patronal informativo" />
              <RO label="TOTAL"             value={formatCop(preview?.total ?? 0)}
                  hint={variable ? "VARIABLE = Comisión" : "FIJO = Neto"} bold highlight />
            </div>
          </div>
        </div>

        {err && <div className="mx-5 mb-3 text-sm text-bad bg-red-50 border border-red-100 rounded px-3 py-2">{err}</div>}

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} disabled={saving}
                  className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
            Cancelar
          </button>
          <button onClick={guardar} disabled={saving}
                  className="px-3 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar y escribir al Sheet"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-600 mb-0.5">{label}</label>
      <input value={value} onChange={onChange} inputMode="numeric"
             className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function RO({ label, value, hint, bold, neg, highlight }: {
  label: string; value: string; hint?: string; bold?: boolean; neg?: boolean; highlight?: boolean;
}) {
  return (
    <div className={"flex justify-between items-baseline gap-2 px-2.5 py-1.5 rounded " + (highlight ? "bg-brand/5" : "")}>
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className={"tabular-nums " + (bold ? "font-semibold " : "") + (neg ? "text-bad " : highlight ? "text-brand" : "text-slate-800")}>
        {value}
        {hint && <span className="block text-[9px] text-slate-400 font-normal text-right">{hint}</span>}
      </span>
    </div>
  );
}
