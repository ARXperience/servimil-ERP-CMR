import { providerNomina } from "@/lib/nomina-module/dataProvider";
import type { NominaFila, Novedad, Bonificacion, Alerta, Empleado } from "@/lib/nomina-module/types/nomina";
import type { Row } from "@/lib/nomina-module/dataProvider/types";
import { toNumber } from "@/lib/nomina-module/utils/format";
import { getParametrosNomina } from "@/lib/nomina-module/parametros";
import { recalcularFila, esFijo } from "@/lib/nomina-module/calc/nominaEngine";
import { validarFilaPatch } from "@/lib/nomina-module/validate";

export async function nominaLista() {
  const rows = (await providerNomina().list("Nomina_Periodo")) as unknown as NominaFila[];
  const set = new Map<string, { periodo: string; corte: string }>();
  for (const r of rows) {
    const periodo = String(r.Periodo ?? "").trim();
    const corte = String(r.Corte ?? "").trim();
    if (!periodo) continue;
    const k = `${periodo}|${corte}`;
    if (!set.has(k)) set.set(k, { periodo, corte });
  }
  const list = Array.from(set.values()).sort((a, b) =>
    b.periodo === a.periodo
      ? a.corte.localeCompare(b.corte)
      : b.periodo.localeCompare(a.periodo)
  );
  return { periodos: list };
}

export async function nominaPeriodo(periodo: string, corte: string | null) {
  const p = providerNomina();
  await p.warmup(["Nomina_Periodo", "Novedades", "Bonificaciones", "Alertas", "Empleados"]);
  const [filas, novedades, bonifs, alertas, empleados, params] = await Promise.all([
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
    p.list("Novedades")      as Promise<unknown> as Promise<Novedad[]>,
    p.list("Bonificaciones") as Promise<unknown> as Promise<Bonificacion[]>,
    p.list("Alertas")        as Promise<unknown> as Promise<Alerta[]>,
    p.list("Empleados")      as Promise<unknown> as Promise<Empleado[]>,
    getParametrosNomina(),
  ]);
  const tipoPagoMap: Record<string, string> = {};
  const empresaMap: Record<string, string> = {};
  for (const e of empleados) {
    tipoPagoMap[String(e.ID_Empleado)] = String(e.Tipo_Pago || "");
    empresaMap[String(e.ID_Empleado)] = String(e.Empresa || "");
  }
  const matchPeriodo = (r: { Periodo?: string }) =>
    String(r.Periodo || "").trim() === periodo;
  const matchCorte = (r: { Corte?: string }) =>
    !corte || String(r.Corte || "").trim() === corte;

  const filasPeriodo = filas.filter((r) => matchPeriodo(r) && matchCorte(r));
  const novPeriodo = novedades.filter(matchPeriodo);
  const bonPeriodo = bonifs.filter(matchPeriodo);
  const alePeriodo = alertas.filter(matchPeriodo);

  return {
    periodo, corte,
    kpis: {
      total_nomina: filasPeriodo.reduce((s, r) => s + toNumber(r.Neto_Pagar), 0),
      empleados: filasPeriodo.length,
      total_deducciones: filasPeriodo.reduce((s, r) => s + toNumber(r.Total_Deduccion), 0),
      total_bonificaciones: filasPeriodo.reduce((s, r) => s + toNumber(r.Bonificacion), 0),
    },
    filas: filasPeriodo,
    novedades: novPeriodo,
    bonificaciones: bonPeriodo,
    alertas: alePeriodo,
    tipo_pago_por_empleado: tipoPagoMap,
    empresa_por_empleado: empresaMap,
    parametros: {
      smmlv: params.smmlv,
      aux_transporte: params.aux_transporte,
      dias_base_mes: params.dias_base_mes,
      pct_salud: params.pct_salud,
      pct_pension: params.pct_pension,
      pct_fsp: params.pct_fsp,
      pct_ss_aprox: params.pct_ss_aprox,
    },
  };
}

/** Tendencia mensual: total devengado/neto/empleados por mes (todos los meses con datos). */
export async function nominaTendencia(corte: string | null) {
  const p = providerNomina();
  await p.warmup(["Nomina_Periodo"]);
  const filas = (await p.list("Nomina_Periodo")) as unknown as NominaFila[];
  type Acc = { periodo: string; total_neto: number; total_devengado: number; total_deduccion: number; total_bonificacion: number; empleados: Set<string> };
  const map = new Map<string, Acc>();
  for (const f of filas) {
    const per = String(f.Periodo || "").trim();
    if (!per) continue;
    if (corte && String(f.Corte || "").trim().toUpperCase() !== corte.toUpperCase()) continue;
    let cur = map.get(per);
    if (!cur) {
      cur = { periodo: per, total_neto: 0, total_devengado: 0, total_deduccion: 0, total_bonificacion: 0, empleados: new Set() };
      map.set(per, cur);
    }
    cur.total_neto += toNumber(f.Neto_Pagar);
    cur.total_devengado += toNumber(f.Total_Devengado);
    cur.total_deduccion += toNumber(f.Total_Deduccion);
    cur.total_bonificacion += toNumber(f.Bonificacion);
    cur.empleados.add(String(f.ID_Empleado));
  }
  return {
    corte,
    tendencia: Array.from(map.values())
      .map((a) => ({
        periodo: a.periodo,
        total_neto: a.total_neto,
        total_devengado: a.total_devengado,
        total_deduccion: a.total_deduccion,
        total_bonificacion: a.total_bonificacion,
        num_empleados: a.empleados.size,
      }))
      .sort((a, b) => a.periodo.localeCompare(b.periodo)),
  };
}

/** Update single fila Nomina_Periodo. patch = partial fields. */
export async function nominaUpdate(id: string, patch: Partial<NominaFila>) {
  if (!id) throw new Error("Falta id (ID_Nomina)");
  const v = validarFilaPatch(patch as Record<string, unknown>);
  if (!v.ok) throw new Error("Validación: " + v.errores.join(" · "));
  const p = providerNomina();
  await p.update("Nomina_Periodo", id, patch as Row);
  return { ok: true, id, fields: Object.keys(patch) };
}

/** Recalcula todas las filas FIJO del periodo+corte. VARIABLE se omite. */
export async function nominaRecalcular(periodo: string, corte: string | null) {
  if (!periodo) throw new Error("Falta periodo");
  const p = providerNomina();
  await p.warmup(["Nomina_Periodo", "Novedades", "Empleados"]);
  const [filas, novedades, empleadosRaw, params] = await Promise.all([
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
    p.list("Novedades")      as Promise<unknown> as Promise<Novedad[]>,
    p.list("Empleados")      as Promise<unknown> as Promise<Empleado[]>,
    getParametrosNomina(),
  ]);
  const empleados = new Map(empleadosRaw.map((e) => [String(e.ID_Empleado), e]));

  const target = filas.filter((f) =>
    String(f.Periodo).trim() === periodo &&
    (!corte || String(f.Corte).trim() === corte)
  );

  let recalculadas = 0;
  let omitidas_variable = 0;
  const errores: string[] = [];

  for (const fila of target) {
    const emp = empleados.get(String(fila.ID_Empleado));
    if (!emp || !esFijo(emp.Tipo_Pago)) {
      omitidas_variable++;
      continue;
    }
    const nov_emp = novedades.filter(
      (n) => String(n.ID_Empleado) === String(fila.ID_Empleado) &&
             String(n.Periodo).trim() === periodo
    );
    try {
      const { cambios } = recalcularFila({
        fila, empleado: emp, novedades_empleado: nov_emp, params,
      });
      await p.update("Nomina_Periodo", String(fila.ID_Nomina), cambios as Row);
      recalculadas++;
    } catch (e) {
      errores.push(`${fila.ID_Nomina}: ${(e as Error).message}`);
    }
  }

  return { periodo, corte, recalculadas, omitidas_variable, errores };
}

/** Recalcula una sola fila aplicando overrides del modal y guarda.
 *  Acepta también Incapacidades/Vacaciones/Licencia/Ausencias como overrides
 *  que se inyectan como novedades sintéticas al motor.
 */
export async function nominaUpdateRecalc(id: string, overrides: Partial<NominaFila>) {
  if (!id) throw new Error("Falta id (ID_Nomina)");
  const v = validarFilaPatch(overrides as Record<string, unknown>);
  if (!v.ok) throw new Error("Validación: " + v.errores.join(" · "));
  const p = providerNomina();
  await p.warmup(["Nomina_Periodo", "Novedades", "Empleados"]);
  const [filas, novedades, empleadosRaw, params] = await Promise.all([
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
    p.list("Novedades")      as Promise<unknown> as Promise<Novedad[]>,
    p.list("Empleados")      as Promise<unknown> as Promise<Empleado[]>,
    getParametrosNomina(),
  ]);
  const fila = filas.find((f) => String(f.ID_Nomina) === String(id));
  if (!fila) throw new Error(`Fila no encontrada: ${id}`);
  const emp = empleadosRaw.find((e) => String(e.ID_Empleado) === String(fila.ID_Empleado));

  const nov_emp = novedades.filter(
    (n) => String(n.ID_Empleado) === String(fila.ID_Empleado) &&
           String(n.Periodo).trim() === String(fila.Periodo).trim()
  );

  // Si el override trae los 4 campos de días (INC/VAC/LIC/AUS), reemplaza
  // las novedades del empleado por sintéticas — fila-level es la fuente de verdad.
  const usarOverrideDias = ["Incapacidades", "Vacaciones", "Licencia", "Ausencias"]
    .some((k) => (overrides as Record<string, unknown>)[k] !== undefined);
  const novEfectivas: Novedad[] = usarOverrideDias
    ? sintNovedades(fila.ID_Empleado, String(fila.Periodo), overrides)
    : nov_emp;

  const { cambios, calculado } = recalcularFila({
    fila, empleado: emp, novedades_empleado: novEfectivas, params, override: overrides,
  });
  // También persiste los 4 días en columnas Nomina_Periodo si vinieron en override.
  for (const k of ["Incapacidades", "Vacaciones", "Licencia", "Ausencias"] as const) {
    if ((overrides as Record<string, unknown>)[k] !== undefined) {
      (cambios as Record<string, unknown>)[k] = (overrides as Record<string, unknown>)[k];
    }
  }
  await p.update("Nomina_Periodo", String(fila.ID_Nomina), cambios as Row);
  return { ok: true, id, calculado, cambios };
}

/** Construye novedades sintéticas (4 tipos) desde overrides fila-level. */
function sintNovedades(idEmp: string, periodo: string, ov: Partial<NominaFila>): Novedad[] {
  const o = ov as Record<string, unknown>;
  const mk = (tipo: string, dias: unknown): Novedad | null => {
    const d = Number(dias) || 0;
    if (d <= 0) return null;
    return {
      ID_Novedad: `SYNTH-${idEmp}-${tipo}`,
      Fecha_Registro: new Date().toISOString().slice(0, 10),
      Periodo: periodo,
      ID_Empleado: idEmp,
      Cedula: "",
      Nombre: "",
      Tipo_Novedad: tipo,
      Dias: d,
      Valor: 0,
      Fecha_Inicio: "",
      Fecha_Fin: "",
      Soporte_URL: "",
      Origen: "OVERRIDE_FILA",
      Estado: "APROBADA",
      Observaciones: "",
    };
  };
  return [
    mk("INCAPACIDAD", o.Incapacidades),
    mk("VACACIONES", o.Vacaciones),
    mk("LICENCIA SIN GOCE", o.Licencia),
    mk("AUSENCIA", o.Ausencias),
  ].filter((x): x is Novedad => x !== null);
}

