"use client";
import { useState } from "react";
import type { Empleado } from "@/lib/nomina-module/types/nomina";
import { toNumber } from "@/lib/nomina-module/utils/format";

type Mode = "crear" | "editar";
type Props = {
  open: boolean;
  mode: Mode;
  empresas: string[];
  empleado?: Empleado | null;
  periodo?: string;
  onClose: () => void;
  onSaved: () => void;
};

const TIPOS_PAGO = ["QUINCENAL", "MENSUAL", "VARIABLE"];
const TIPOS_DOC = ["CC", "CE", "PPT", "PS", "TI"];
const TIPOS_CUENTA = ["AHORROS", "CORRIENTE"];
const CONTRATOS = ["LABORAL", "PRESTACION DE SERVICIOS"];
const HIJOS = ["SI", "NO"];

function calcEdad(fnac: string): string {
  if (!fnac) return "";
  const d = new Date(fnac);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const a = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return a > 0 && a < 130 ? `${a} años` : "";
}

export default function EmpleadoModal({ open, mode, empresas, empleado, periodo, onClose, onSaved }: Props) {
  const [form, setForm] = useState(() => initial(empleado));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const set = (k: keyof ReturnType<typeof initial>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function validarLocal(): string | null {
    // Ningún campo es obligatorio. Solo validamos FORMATO de lo que tenga valor.
    // Esto preserva el blindaje contra datos absurdos sin bloquear creaciones parciales.
    if (form.Nombre.trim().length === 1) return "Nombre demasiado corto (mínimo 2 caracteres)";
    if (form.Cedula.trim() !== "" && !/^\d{4,15}$/.test(form.Cedula.trim())) {
      return "Cédula debe ser numérica de 4 a 15 dígitos";
    }
    if (form.Sueldo_Basico.trim() !== "") {
      const sueldo = toNumber(form.Sueldo_Basico);
      if (sueldo < 0) return "Sueldo no puede ser negativo";
      if (sueldo > 100_000_000) return `Sueldo ${sueldo.toLocaleString()} excede tope (100.000.000)`;
    }
    if (form.Correo.trim() !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.Correo.trim())) {
      return "Correo con formato inválido";
    }
    return null;
  }

  async function guardar() {
    setSaving(true);
    setErr(null);
    try {
      const localErr = validarLocal();
      if (localErr) throw new Error(localErr);
      if (mode === "crear") {
        if (!periodo) throw new Error("Falta periodo");
        const body = {
          empresa: form.Empresa,
          nombre: form.Nombre,
          tipo_doc: form.Tipo_Doc,
          cedula: form.Cedula,
          fecha_nacimiento: form.Fecha_Nacimiento,
          fecha_ingreso: form.Fecha_Ingreso,
          cargo: form.Cargo,
          tipo_pago: form.Tipo_Pago,
          sueldo_basico: toNumber(form.Sueldo_Basico),
          banco: form.Banco,
          tipo_cuenta: form.Tipo_Cuenta,
          cuenta_bancaria: form.Cuenta_Bancaria,
          contrato: form.Contrato,
          hijos: form.Hijos,
          caja_compensacion: form.Caja_Compensacion,
          arl: form.ARL,
          eps: form.EPS,
          pension: form.Pension,
          cesantias: form.Cesantias,
          celular: form.Celular,
          correo: form.Correo,
          ciudad: form.Ciudad,
          direccion: form.Direccion,
          periodo,
        };
        const res = await fetch("/api/nomina-data?ns=gestion&action=empleado-crear", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      } else {
        if (!empleado) throw new Error("Falta empleado");
        const patch: Partial<Empleado> = {
          Empresa: form.Empresa,
          Nombre: form.Nombre,
          Tipo_Doc: form.Tipo_Doc,
          Cedula: form.Cedula,
          Fecha_Nacimiento: form.Fecha_Nacimiento,
          Fecha_Ingreso: form.Fecha_Ingreso,
          "Cargo/Campaña": form.Cargo,
          Tipo_Pago: form.Tipo_Pago,
          Sueldo_Basico: toNumber(form.Sueldo_Basico),
          Banco: form.Banco,
          Tipo_Cuenta: form.Tipo_Cuenta,
          Cuenta_Bancaria: form.Cuenta_Bancaria,
          Tipo_Contrato: form.Contrato,
          Hijos: form.Hijos,
          Caja_Compensacion: form.Caja_Compensacion,
          ARL: form.ARL,
          EPS: form.EPS,
          Pension: form.Pension,
          Cesantias: form.Cesantias,
          Celular: form.Celular,
          Correo: form.Correo,
          Ciudad: form.Ciudad,
          Direccion: form.Direccion,
        };
        const res = await fetch("/api/nomina-data?ns=gestion&action=empleado-actualizar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: empleado.ID_Empleado, patch }),
        });
        if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (e) {
      const msg = (e as Error).message || "Error desconocido";
      const friendly = /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded|Sheets ocupado|429/i.test(msg)
        ? "El sistema está procesando muchas solicitudes. Espera unos segundos e intenta de nuevo."
        : msg;
      setErr(friendly);
    } finally {
      setSaving(false);
    }
  }

  const edad = calcEdad(form.Fecha_Nacimiento);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl my-8" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {mode === "crear" ? "Agregar empleado" : "Datos del empleado"}
            </h3>
            {mode === "crear" && (
              <p className="text-xs text-warn mt-1">
                ⚠ El empleado aparecerá desde el mes seleccionado en adelante.
                NO se generan filas para meses pasados. Se registrará también en la pestaña Asesores.
              </p>
            )}
            {mode === "editar" && empleado && (
              <p className="text-xs text-slate-500 mt-0.5">ID: {empleado.ID_Empleado}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Empresa" value={form.Empresa} onChange={set("Empresa")} options={empresas} />
          <Select label="Tipo de pago" value={form.Tipo_Pago} onChange={set("Tipo_Pago")} options={TIPOS_PAGO} />

          <F label="Nombre completo" value={form.Nombre} onChange={set("Nombre")} cols={2} />

          <Select label="Tipo documento" value={form.Tipo_Doc} onChange={set("Tipo_Doc")} options={TIPOS_DOC} />
          <F label="Cédula" value={form.Cedula} onChange={set("Cedula")} />

          <FDate label="Fecha de nacimiento" value={form.Fecha_Nacimiento} onChange={set("Fecha_Nacimiento")}
                 hint={edad || "La edad se calcula sola"} />
          <FDate label="Fecha de ingreso" value={form.Fecha_Ingreso} onChange={set("Fecha_Ingreso")} />

          <F label="Cargo / Campaña" value={form.Cargo} onChange={set("Cargo")} cols={2} />

          <F label="Sueldo básico" value={form.Sueldo_Basico} onChange={set("Sueldo_Basico")} type="number" />
          <F label="Banco" value={form.Banco} onChange={set("Banco")} />

          <Select label="Tipo de cuenta" value={form.Tipo_Cuenta} onChange={set("Tipo_Cuenta")} options={TIPOS_CUENTA} />
          <F label="Cuenta bancaria" value={form.Cuenta_Bancaria} onChange={set("Cuenta_Bancaria")} />

          <Select label="Contrato" value={form.Contrato} onChange={set("Contrato")} options={CONTRATOS} />
          <Select label="Hijos" value={form.Hijos} onChange={set("Hijos")} options={HIJOS} />

          <F label="Caja de Compensación" value={form.Caja_Compensacion} onChange={set("Caja_Compensacion")} />
          <F label="ARL" value={form.ARL} onChange={set("ARL")} />

          <F label="EPS" value={form.EPS} onChange={set("EPS")} />
          <F label="Pensión" value={form.Pension} onChange={set("Pension")} />

          <F label="Cesantías" value={form.Cesantias} onChange={set("Cesantias")} cols={2} />

          <F label="Celular" value={form.Celular} onChange={set("Celular")} />
          <F label="Correo electrónico" value={form.Correo} onChange={set("Correo")} type="email" />

          <F label="Ciudad" value={form.Ciudad} onChange={set("Ciudad")} />
          <F label="Dirección" value={form.Direccion} onChange={set("Direccion")} />
        </div>

        {err && <div className="mx-5 mb-3 text-sm text-bad bg-red-50 border border-red-100 rounded px-3 py-2">{err}</div>}

        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} disabled={saving} className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">Cancelar</button>
          <button onClick={guardar} disabled={saving} className="px-3 py-2 text-sm rounded-lg bg-brand text-white hover:bg-brand-dark disabled:opacity-50">
            {saving ? "Guardando…" : (mode === "crear" ? "Crear empleado" : "Guardar cambios")}
          </button>
        </div>
      </div>
    </div>
  );
}

function initial(emp?: Empleado | null) {
  return {
    Empresa:           emp?.Empresa ?? "",
    Tipo_Pago:         emp?.Tipo_Pago ?? "QUINCENAL",
    Nombre:            emp?.Nombre ?? "",
    Tipo_Doc:          emp?.Tipo_Doc ?? "CC",
    Cedula:            emp?.Cedula ?? "",
    Fecha_Nacimiento:  emp?.Fecha_Nacimiento ?? "",
    Fecha_Ingreso:     emp?.Fecha_Ingreso ?? "",
    Cargo:             emp?.["Cargo/Campaña"] ?? "",
    Sueldo_Basico:     String(emp?.Sueldo_Basico ?? ""),
    Banco:             emp?.Banco ?? "",
    Tipo_Cuenta:       emp?.Tipo_Cuenta ?? "",
    Cuenta_Bancaria:   emp?.Cuenta_Bancaria ?? "",
    Contrato:          emp?.Tipo_Contrato ?? "LABORAL",
    Hijos:             emp?.Hijos ?? "NO",
    Caja_Compensacion: emp?.Caja_Compensacion ?? "",
    ARL:               emp?.ARL ?? "",
    EPS:               emp?.EPS ?? "",
    Pension:           emp?.Pension ?? "",
    Cesantias:         emp?.Cesantias ?? "",
    Celular:           emp?.Celular ?? "",
    Correo:            emp?.Correo ?? "",
    Ciudad:            emp?.Ciudad ?? "",
    Direccion:         emp?.Direccion ?? "",
  };
}

function F({ label, value, onChange, type, placeholder, cols = 1 }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string; placeholder?: string; cols?: 1 | 2;
}) {
  return (
    <div className={cols === 2 ? "md:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input value={value} onChange={onChange} type={type || "text"} placeholder={placeholder}
             className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
    </div>
  );
}

function FDate({ label, value, onChange, hint }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="date" value={value} onChange={onChange}
             className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <select value={value} onChange={onChange}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
        <option value="">— Seleccionar —</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

