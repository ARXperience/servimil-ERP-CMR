// Handlers de la vista "Gestión de Empleados / Base de Datos".
import { providerNomina } from "@/lib/dataProvider";
import type { Row } from "@/lib/dataProvider/types";
import type {
  Empleado, NominaFila, Novedad, Bonificacion, Alerta,
} from "@/lib/types/nomina";
import type { Asesor } from "@/lib/types/asesor";
import { toNumber } from "@/lib/utils/format";
import { getParametrosNomina } from "@/lib/parametros";
import { validarEmpleadoInput, safeNum } from "@/lib/validate";

/** Devuelve TODO lo necesario para pintar la planilla del mes. */
export async function gestionMes(periodo: string) {
  if (!periodo) throw new Error("Falta 'periodo'");
  const p = providerNomina();
  // Batch warmup: 1 sola llamada Sheets para las 5 tablas (en lugar de 5).
  await p.warmup(["Empleados", "Nomina_Periodo", "Novedades", "Bonificaciones", "Alertas"]);
  const [empleados, filas, novedades, bonifs, alertas, params] = await Promise.all([
    p.list("Empleados")      as Promise<unknown> as Promise<Empleado[]>,
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
    p.list("Novedades")      as Promise<unknown> as Promise<Novedad[]>,
    p.list("Bonificaciones") as Promise<unknown> as Promise<Bonificacion[]>,
    p.list("Alertas")        as Promise<unknown> as Promise<Alerta[]>,
    getParametrosNomina(),
  ]);

  const filasMes = filas.filter((f) => String(f.Periodo).trim() === periodo);
  const novMes = novedades.filter((n) => String(n.Periodo).trim() === periodo);
  const bonMes = bonifs.filter((b) => String(b.Periodo).trim() === periodo);
  const aleMes = alertas.filter((a) => String(a.Periodo).trim() === periodo);

  // Agrega novedades por empleado para mostrar columnas INC/VAC/LIC/AUS en la fila.
  type NovBreakdown = { INCAPACIDADES: number; VACACIONES: number; LICENCIA: number; AUSENCIAS: number };
  const novByEmp: Record<string, NovBreakdown> = {};
  const claves: Record<string, keyof NovBreakdown> = {
    "INCAPACIDAD": "INCAPACIDADES",
    "INCAPACIDADES": "INCAPACIDADES",
    "VACACION": "VACACIONES",
    "VACACIONES": "VACACIONES",
    "LICENCIA": "LICENCIA",
    "LICENCIA SIN GOCE": "LICENCIA",
    "LICENCIA REMUNERADA": "LICENCIA",
    "LICENCIA NO REMUNERADA": "LICENCIA",
    "AUSENCIA": "AUSENCIAS",
    "AUSENCIAS": "AUSENCIAS",
  };
  for (const n of novMes) {
    const idE = String(n.ID_Empleado);
    if (!novByEmp[idE]) novByEmp[idE] = { INCAPACIDADES: 0, VACACIONES: 0, LICENCIA: 0, AUSENCIAS: 0 };
    const k = claves[String(n.Tipo_Novedad || "").toUpperCase().trim()];
    if (k) novByEmp[idE][k] += toNumber(n.Dias);
  }
  // Override desde columnas Nomina_Periodo si el usuario las editó vía modal.
  for (const f of filasMes) {
    const idE = String(f.ID_Empleado);
    const inc = toNumber(f.Incapacidades);
    const vac = toNumber(f.Vacaciones);
    const lic = toNumber(f.Licencia);
    const aus = toNumber(f.Ausencias);
    if (inc || vac || lic || aus) {
      if (!novByEmp[idE]) novByEmp[idE] = { INCAPACIDADES: 0, VACACIONES: 0, LICENCIA: 0, AUSENCIAS: 0 };
      // Reemplaza, no suma — la fila es fuente de verdad para edición manual.
      if (inc) novByEmp[idE].INCAPACIDADES = inc;
      if (vac) novByEmp[idE].VACACIONES = vac;
      if (lic) novByEmp[idE].LICENCIA = lic;
      if (aus) novByEmp[idE].AUSENCIAS = aus;
    }
  }

  const tipoPagoMap: Record<string, string> = {};
  const empresaMap: Record<string, string> = {};
  for (const e of empleados) {
    tipoPagoMap[String(e.ID_Empleado)] = String(e.Tipo_Pago || "");
    empresaMap[String(e.ID_Empleado)] = String(e.Empresa || "");
  }

  // Empresas únicas en empleados activos (para filtros).
  const empresas = Array.from(new Set(empleados
    .filter((e) => String(e.Estado || "").toUpperCase() !== "RETIRADO")
    .map((e) => String(e.Empresa || "").trim())
    .filter(Boolean))).sort();

  // KPIs del mes (ambos cortes sumados) — usa safeNum para no romper con basura.
  const filasOk: NominaFila[] = [];
  const filasCorruptas: string[] = [];
  const TECHO = 1_000_000_000; // si una fila supera esto en neto/devengado, se ignora del KPI.
  for (const f of filasMes) {
    const neto = safeNum(f.Neto_Pagar);
    const dev = safeNum(f.Total_Devengado);
    if (Math.abs(neto) > TECHO || Math.abs(dev) > TECHO) {
      filasCorruptas.push(`${f.ID_Nomina} (${f.Nombre}) — neto=${neto.toLocaleString()} dev=${dev.toLocaleString()}`);
      continue;
    }
    filasOk.push(f);
  }
  const kpis = {
    total_nomina: filasOk.reduce((s, r) => s + safeNum(r.Neto_Pagar), 0),
    empleados_unicos: new Set(filasOk.map((f) => f.ID_Empleado)).size,
    total_aux_tte: filasOk.reduce((s, r) => s + safeNum(r.Aux_Transporte), 0),
    total_deducciones: filasOk.reduce((s, r) => s + safeNum(r.Total_Deduccion), 0),
    neto_promedio: filasOk.length
      ? filasOk.reduce((s, r) => s + safeNum(r.Neto_Pagar), 0) / filasOk.length
      : 0,
  };

  // Tasas patronales y de provisión desde Parametros (para costo empresa client-side).
  const tasa = (k: string) => params.raw.get(k.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()) ?? 0;
  return {
    periodo,
    parametros: {
      smmlv: params.smmlv,
      aux_transporte: params.aux_transporte,
      dias_base_mes: params.dias_base_mes,
      // Patronales (sobre devengado_basico)
      pct_salud_patronal: tasa("Salud (patronal)"),
      pct_pension_patronal: tasa("Pension (patronal)"),
      pct_arl: tasa("ARL"),
      pct_sena: tasa("SENA"),
      pct_icbf: tasa("ICBF"),
      pct_caja: tasa("Caja Compensacion"),
      // Provisiones prestacionales (sobre devengado_basico)
      pct_cesantias: tasa("Cesantias"),
      pct_int_cesantias: tasa("Intereses Cesantias"),
      pct_prima: tasa("Prima"),
      pct_vacaciones: tasa("Vacaciones"),
      // Para motor client-side (deducciones empleado)
      pct_salud: params.pct_salud,
      pct_pension: params.pct_pension,
      pct_fsp: params.pct_fsp,
      pct_ss_aprox: params.pct_ss_aprox,
    },
    empresas,
    kpis,
    filas: filasMes,
    filas_corruptas: filasCorruptas,
    novedades_breakdown_por_empleado: novByEmp,
    tipo_pago_por_empleado: tipoPagoMap,
    empresa_por_empleado: empresaMap,
    empleados,
    novedades: novMes,
    bonificaciones: bonMes,
    alertas: aleMes,
  };
}

// === Mutaciones ===

interface CrearEmpleadoInput {
  empresa: string;
  nombre: string;
  tipo_doc?: string;
  cedula: string;
  fecha_nacimiento?: string;
  fecha_ingreso?: string;
  cargo: string;
  tipo_pago: string;
  sueldo_basico: number;
  banco?: string;
  tipo_cuenta?: string;
  cuenta_bancaria?: string;
  contrato?: string;
  hijos?: string;
  caja_compensacion?: string;
  arl?: string;
  eps?: string;
  pension?: string;
  cesantias?: string;
  celular?: string;
  correo?: string;
  ciudad?: string;
  direccion?: string;
  periodo: string;
}

function nextId(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  const max = existing.reduce((m, s) => {
    const x = re.exec(String(s).trim());
    return x ? Math.max(m, parseInt(x[1], 10)) : m;
  }, 0);
  const n = max + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}

/** Localiza ID_Asesor por cédula (clave natural compartida con Empleados). */
async function findAsesorByCedula(cedula: string): Promise<string | null> {
  const trimmed = String(cedula || "").trim();
  if (!trimmed) return null; // cédula vacía no matchea nada
  try {
    const asesores = (await providerNomina().list("Asesores")) as unknown as Asesor[];
    const m = asesores.find((a) => String(a.Cedula).trim() === trimmed);
    return m ? String(m.ID_Asesor) : null;
  } catch {
    return null;
  }
}

function nextAsesorId(existing: { ID_Asesor: string }[]): string {
  const re = /^AS(\d+)$/i;
  const max = existing.reduce((m, a) => {
    const x = re.exec(String(a.ID_Asesor).trim());
    return x ? Math.max(m, parseInt(x[1], 10)) : m;
  }, 0);
  return `AS${String(max + 1).padStart(3, "0")}`;
}

export async function empleadoCrear(input: CrearEmpleadoInput) {
  // Sin campos obligatorios. Solo formatos cuando hay valor + periodo válido.
  const v = validarEmpleadoInput(input);
  if (!v.ok) throw new Error("Validación: " + v.errores.join(" · "));
  if (!input.periodo || !/^\d{4}-\d{2}$/.test(input.periodo)) {
    throw new Error(`Validación: periodo inválido "${input.periodo}" (formato YYYY-MM)`);
  }
  const p = providerNomina();
  const [empleadosRaw, filasRaw] = await Promise.all([
    p.list("Empleados") as Promise<unknown> as Promise<Empleado[]>,
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
  ]);

  const ID_Empleado = nextId("EMP", empleadosRaw.map((e) => e.ID_Empleado));
  const tipo_pago_norm = (input.tipo_pago || "").trim().toUpperCase();
  const isMensual = tipo_pago_norm === "MENSUAL";
  const corte = isMensual ? "MENSUAL" : "PRIMER";
  const dias_default = isMensual ? 30 : 15;

  // INSERT en Empleados
  const empRow: Row = {
    ID_Empleado,
    Empresa: input.empresa,
    Nombre: input.nombre,
    Tipo_Doc: input.tipo_doc || "CC",
    Cedula: input.cedula,
    Fecha_Nacimiento: input.fecha_nacimiento || "",
    Fecha_Ingreso: input.fecha_ingreso || new Date().toISOString().slice(0, 10),
    Fecha_Retiro: "",
    "Cargo/Campaña": input.cargo,
    Tipo_Contrato: input.contrato || "LABORAL",
    Tipo_Pago: tipo_pago_norm,
    Sueldo_Basico: input.sueldo_basico,
    Banco: input.banco || "",
    Tipo_Cuenta: input.tipo_cuenta || "",
    Cuenta_Bancaria: input.cuenta_bancaria || "",
    Hijos: input.hijos || "NO",
    Caja_Compensacion: input.caja_compensacion || "",
    ARL: input.arl || "",
    EPS: input.eps || "",
    Pension: input.pension || "",
    Cesantias: input.cesantias || "",
    Celular: input.celular || "",
    Correo: input.correo || "",
    Ciudad: input.ciudad || "",
    Direccion: input.direccion || "",
    Estado: "ACTIVO",
  };
  await p.append("Empleados", empRow);

  // INSERT fila Nomina_Periodo (stub) — motor calculará en Recalcular periodo.
  const ID_Nomina = nextId("NOM", filasRaw.map((f) => f.ID_Nomina));
  const filaStub: Row = {
    ID_Nomina,
    Periodo: input.periodo,
    Corte: corte,
    ID_Empleado,
    Cedula: input.cedula,
    Nombre: input.nombre,
    Cargo: input.cargo,
    Sueldo_Basico: input.sueldo_basico,
    Dias_Trabajados: dias_default,
    Incapacidades: 0,
    Vacaciones: 0,
    Licencia: 0,
    Ausencias: 0,
    Devengado_Basico: 0,
    Aux_Transporte: 0,
    Bonificacion: 0,
    Total_Devengado: 0,
    Ded_Salud: 0,
    Ded_Pension: 0,
    Ded_FSP: 0,
    Ded_RteFte: 0,
    Ded_Credito: 0,
    Ded_Otras: 0,
    Total_Deduccion: 0,
    Neto_Pagar: 0,
    SS_Aproximado: 0,
    Estado: "PENDIENTE",
    Fecha_Calculo: "",
  };
  await p.append("Nomina_Periodo", filaStub);

  // === Sincronizar con pestaña Asesores (histórico de personal) ===
  let ID_Asesor: string | null = null;
  try {
    const asesores = (await p.list("Asesores")) as unknown as Asesor[];
    // Solo buscamos duplicado si la cédula viene con valor (evita matchear strings vacíos entre sí).
    const cedTrim = String(input.cedula || "").trim();
    const yaExiste = cedTrim
      ? asesores.find((a) => String(a.Cedula).trim() === cedTrim)
      : null;
    if (yaExiste) {
      ID_Asesor = String(yaExiste.ID_Asesor);
    } else {
      ID_Asesor = nextAsesorId(asesores);
      const asesorRow: Row = {
        ID_Asesor,
        Empresa: input.empresa,
        Nombre: input.nombre,
        Tipo_Doc: input.tipo_doc || "CC",
        Cedula: input.cedula,
        Fecha_Nacimiento: input.fecha_nacimiento || "",
        Fecha_Ingreso: input.fecha_ingreso || new Date().toISOString().slice(0, 10),
        Fecha_Retiro: "",
        Banco: input.banco || "",
        Tipo_Cuenta: input.tipo_cuenta || "",
        Cuenta_Bancaria: input.cuenta_bancaria || "",
        Contrato: input.contrato || "LABORAL",
        Hijos: input.hijos || "NO",
        Caja_Compensacion: input.caja_compensacion || "",
        ARL: input.arl || "",
        EPS: input.eps || "",
        Pension: input.pension || "",
        Cesantias: input.cesantias || "",
        Celular: input.celular || "",
        Correo: input.correo || "",
        Ciudad: input.ciudad || "",
        Direccion: input.direccion || "",
        Estado: "ACTIVA",
      };
      await p.append("Asesores", asesorRow);
    }
  } catch (e) {
    // Si Asesores no existe, no rompemos la creación principal.
    console.warn("Sync Asesores omitida:", (e as Error).message);
  }

  return { ok: true, ID_Empleado, ID_Nomina, ID_Asesor, periodo: input.periodo, corte };
}

export async function empleadoActualizar(id: string, patch: Partial<Empleado>) {
  if (!id) throw new Error("Falta ID_Empleado");
  // Ningún campo es obligatorio. Solo validamos formato cuando hay valor no vacío.
  if (patch.Sueldo_Basico !== undefined && String(patch.Sueldo_Basico).trim() !== "") {
    const n = safeNum(patch.Sueldo_Basico);
    if (n < 0) throw new Error("Validación: sueldo negativo");
    if (n > 100_000_000) throw new Error(`Validación: sueldo ${n.toLocaleString()} excede tope 100.000.000`);
    patch.Sueldo_Basico = n;
  }
  if (patch.Cedula !== undefined && String(patch.Cedula).trim() !== ""
      && !/^\d{4,15}$/.test(String(patch.Cedula).trim())) {
    throw new Error("Validación: cédula debe ser 4-15 dígitos");
  }
  const p = providerNomina();
  await p.update("Empleados", id, patch as Row);
  return { ok: true, id, fields: Object.keys(patch) };
}

export async function empleadoRetirar(id: string) {
  if (!id) throw new Error("Falta ID_Empleado");
  const hoy = new Date().toISOString().slice(0, 10);
  const p = providerNomina();
  // Cargar empleado para obtener cédula (necesaria para sync con Asesores).
  const emps = (await p.list("Empleados")) as unknown as Empleado[];
  const emp = emps.find((e) => String(e.ID_Empleado) === String(id));
  if (!emp) throw new Error(`Empleado ${id} no encontrado`);

  await p.update("Empleados", id, {
    Estado: "RETIRADO",
    Fecha_Retiro: hoy,
  } as Row);

  // Sync Asesores por cédula.
  let asesor_sync = false;
  const idAs = await findAsesorByCedula(emp.Cedula);
  if (idAs) {
    try {
      await p.update("Asesores", idAs, { Estado: "RETIRADA", Fecha_Retiro: hoy } as Row);
      asesor_sync = true;
    } catch (e) {
      console.warn("Sync Asesores en retiro omitida:", (e as Error).message);
    }
  }

  return { ok: true, id, fecha_retiro: hoy, asesor_sync };
}

/**
 * Borra completamente al empleado del Sheet + todas sus filas de Nomina_Periodo.
 * Útil para cleanup tras smoke tests. NO usar en producción para empleados reales.
 */
export async function empleadoBorrar(id: string) {
  if (!id) throw new Error("Falta ID_Empleado");
  const p = providerNomina();
  // Capturar cédula ANTES de borrar para luego buscar en Asesores.
  const emps = (await p.list("Empleados")) as unknown as Empleado[];
  const emp = emps.find((e) => String(e.ID_Empleado) === String(id));
  const cedula = emp?.Cedula ? String(emp.Cedula) : "";

  const filas = (await p.list("Nomina_Periodo")) as unknown as NominaFila[];
  const filasDelEmp = filas.filter((f) => String(f.ID_Empleado) === String(id));

  let nominasBorradas = 0;
  for (const f of filasDelEmp) {
    const ok = await p.remove("Nomina_Periodo", String(f.ID_Nomina));
    if (ok) nominasBorradas++;
  }
  const okEmp = await p.remove("Empleados", id);

  // Cleanup Asesores (mismo origen).
  let asesor_borrado = false;
  if (cedula) {
    const idAs = await findAsesorByCedula(cedula);
    if (idAs) {
      try { asesor_borrado = await p.remove("Asesores", idAs); }
      catch (e) { console.warn("Cleanup Asesores omitido:", (e as Error).message); }
    }
  }

  return { ok: okEmp, id, nominas_borradas: nominasBorradas, asesor_borrado };
}
