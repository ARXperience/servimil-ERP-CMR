// Validación centralizada — protege motor + API + UI.
// Cota superior generosa pero razonable: nadie cobra > 100M/mes en libranza militar.

export const LIMITES = {
  SUELDO_MIN: 0,
  SUELDO_MAX: 100_000_000,           // 100M COP/mes (techo absoluto)
  DIAS_MIN: 0,
  DIAS_MAX: 31,
  DEDUCCION_MIN: 0,
  DEDUCCION_MAX: 100_000_000,
  BONIFICACION_MIN: 0,
  BONIFICACION_MAX: 50_000_000,
  NETO_MIN: -10_000_000,             // permite ajustes negativos pequeños
  NETO_MAX: 200_000_000,
} as const;

export interface ValidacionResultado {
  ok: boolean;
  errores: string[];
}

/** Parser numérico seguro: rechaza NaN, Infinity, strings raras. Cualquier fallo → 0. */
export function safeNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  // String: limpia comas y otros separadores típicos.
  const s = String(v).replace(/[^0-9.\-]/g, "");
  if (s === "" || s === "-" || s === ".") return 0;
  const n = parseFloat(s);
  if (!Number.isFinite(n)) return 0;
  return n;
}

/** Clamp dentro de un rango. */
export function clamp(n: number, min: number, max: number): number {
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/** Valida sueldo. */
export function validarSueldo(v: unknown): ValidacionResultado {
  const errores: string[] = [];
  const n = safeNum(v);
  if (n < LIMITES.SUELDO_MIN) errores.push(`Sueldo no puede ser negativo`);
  if (n > LIMITES.SUELDO_MAX) errores.push(`Sueldo ${n.toLocaleString()} excede tope de ${LIMITES.SUELDO_MAX.toLocaleString()}`);
  if (!/^-?\d+(\.\d+)?$/.test(String(v).replace(/[^0-9.\-]/g, "")) && v !== "" && v !== undefined && v !== null) {
    if (Number.isNaN(parseFloat(String(v).replace(/[^0-9.\-]/g, "")))) errores.push(`Sueldo no es numérico: "${v}"`);
  }
  return { ok: errores.length === 0, errores };
}

/** Valida días trabajados. */
export function validarDias(v: unknown): ValidacionResultado {
  const errores: string[] = [];
  const n = safeNum(v);
  if (!Number.isInteger(n) && n !== Math.floor(n)) {
    // Permitimos decimales (medio día) pero alertamos si es muy extraño.
  }
  if (n < LIMITES.DIAS_MIN) errores.push(`Días no puede ser negativo`);
  if (n > LIMITES.DIAS_MAX) errores.push(`Días ${n} excede 31`);
  return { ok: errores.length === 0, errores };
}

export function validarDeduccion(label: string, v: unknown): ValidacionResultado {
  const errores: string[] = [];
  const n = safeNum(v);
  if (n < LIMITES.DEDUCCION_MIN) errores.push(`${label} no puede ser negativa`);
  if (n > LIMITES.DEDUCCION_MAX) errores.push(`${label} ${n.toLocaleString()} excede tope`);
  return { ok: errores.length === 0, errores };
}

export function validarBonificacion(v: unknown): ValidacionResultado {
  const errores: string[] = [];
  const n = safeNum(v);
  if (n < LIMITES.BONIFICACION_MIN) errores.push(`Bonificación no puede ser negativa`);
  if (n > LIMITES.BONIFICACION_MAX) errores.push(`Bonificación ${n.toLocaleString()} excede tope`);
  return { ok: errores.length === 0, errores };
}

/** Valida payload de empleado.
 *  NO exige ningún campo: solo valida FORMATO de los campos que vienen con valor.
 *  Esto permite crear empleados parciales (ej. solo nombre) y completar después.
 *  El blindaje contra valores absurdos se mantiene activo cuando hay valor.
 */
export function validarEmpleadoInput(input: {
  empresa?: string; nombre?: string; cedula?: string; cargo?: string;
  tipo_pago?: string; sueldo_basico?: number | string;
  correo?: string;
}): ValidacionResultado {
  const errs: string[] = [];
  // Nombre: si lo escriben, mínimo 2 chars (evita basura tipo "a").
  if (input.nombre && String(input.nombre).trim().length === 1) {
    errs.push("Nombre demasiado corto (mínimo 2 caracteres)");
  }
  // Cédula: si la escriben, debe ser numérica.
  if (input.cedula && String(input.cedula).trim() !== "" && !/^\d{4,15}$/.test(String(input.cedula).trim())) {
    errs.push("Cédula debe ser numérica 4-15 dígitos");
  }
  // Tipo de pago: si viene, debe ser válido.
  const TIPOS = ["FIJO", "VARIABLE", "QUINCENAL", "MENSUAL"];
  if (input.tipo_pago && !TIPOS.includes(String(input.tipo_pago).toUpperCase())) {
    errs.push(`Tipo de pago inválido: "${input.tipo_pago}" (válidos: ${TIPOS.join(", ")})`);
  }
  // Sueldo: si viene con valor > 0, validar rango (impide números astronómicos).
  if (input.sueldo_basico !== undefined && input.sueldo_basico !== "" && input.sueldo_basico !== null) {
    const n = safeNum(input.sueldo_basico);
    if (n > LIMITES.SUELDO_MAX) errs.push(`Sueldo ${n.toLocaleString()} excede tope de ${LIMITES.SUELDO_MAX.toLocaleString()}`);
    if (n < 0) errs.push("Sueldo no puede ser negativo");
  }
  // Correo: si lo escriben, formato básico.
  if (input.correo && String(input.correo).trim() !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(input.correo).trim())) {
    errs.push("Correo con formato inválido");
  }
  return { ok: errs.length === 0, errores: errs };
}

/** Valida un patch de fila Nomina_Periodo (solo campos numéricos críticos). */
export function validarFilaPatch(patch: Record<string, unknown>): ValidacionResultado {
  const errs: string[] = [];
  if (patch.Sueldo_Basico !== undefined) errs.push(...validarSueldo(patch.Sueldo_Basico).errores);
  if (patch.Dias_Trabajados !== undefined) errs.push(...validarDias(patch.Dias_Trabajados).errores);
  if (patch.Bonificacion !== undefined) errs.push(...validarBonificacion(patch.Bonificacion).errores);
  for (const k of ["Ded_Salud", "Ded_Pension", "Ded_FSP", "Ded_RteFte", "Ded_Credito", "Ded_Otras"]) {
    if (patch[k] !== undefined) errs.push(...validarDeduccion(k, patch[k]).errores);
  }
  if (patch.Neto_Pagar !== undefined) {
    const n = safeNum(patch.Neto_Pagar);
    if (n < LIMITES.NETO_MIN) errs.push(`Neto < ${LIMITES.NETO_MIN.toLocaleString()}`);
    if (n > LIMITES.NETO_MAX) errs.push(`Neto > ${LIMITES.NETO_MAX.toLocaleString()}`);
  }
  return { ok: errs.length === 0, errores: errs };
}
