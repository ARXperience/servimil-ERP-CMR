// Motor de cálculo de nómina FIJO.
// VARIABLE no se calcula: respeta los valores manuales de la fila.
import type { NominaFila, Novedad, Empleado } from "@/lib/types/nomina";
import type { NominaParametros } from "@/lib/parametros";
import { toNumber } from "@/lib/utils/format";
import { safeNum, clamp, LIMITES } from "@/lib/validate";

/** Tipos de novedad que descuentan días al FIJO (sin remunerar). */
const TIPOS_DESCUENTAN_DIAS = new Set([
  "AUSENCIA",
  "LICENCIA SIN GOCE",
  "LICENCIA NO REMUNERADA",
]);

/** Determina si el empleado es de cálculo automático (FIJO) o manual (VARIABLE). */
export function esFijo(tipo_pago: string): boolean {
  const t = (tipo_pago || "").trim().toUpperCase();
  if (t === "VARIABLE") return false;
  // QUINCENAL, MENSUAL, FIJO o cualquier otro → calculado.
  return true;
}

export function diasBasePorCorte(corte: string, dias_base_mes: number): number {
  const c = (corte || "").trim().toUpperCase();
  if (c === "MENSUAL") return dias_base_mes;
  if (c === "PRIMER" || c === "SEGUNDO") return Math.round(dias_base_mes / 2);
  return Math.round(dias_base_mes / 2);
}

export function diasDescontados(novedades: Novedad[]): number {
  return novedades.reduce((s, n) => {
    const tipo = String(n.Tipo_Novedad || "").trim().toUpperCase();
    return TIPOS_DESCUENTAN_DIAS.has(tipo) ? s + toNumber(n.Dias) : s;
  }, 0);
}

export interface RecalcInput {
  fila: NominaFila;
  empleado?: Empleado;            // para Tipo_Pago/Sueldo_Basico oficial
  novedades_empleado: Novedad[];  // ya filtradas por ID_Empleado y periodo
  params: NominaParametros;
  /** Overrides manuales del modal (bonificacion, ded_credito, ded_otras, etc.). */
  override?: Partial<NominaFila>;
}

export interface RecalcOutput {
  fila: NominaFila;
  cambios: Partial<NominaFila>;
  calculado: boolean; // false si VARIABLE
}

export function recalcularFila(input: RecalcInput): RecalcOutput {
  const { fila, empleado, novedades_empleado, params, override } = input;

  const tipo_efectivo = (empleado?.Tipo_Pago ?? "").toString();
  // Sueldo SIEMPRE deriva de Empleados (maestro) → previene acumulación sobre
  // valores ya inflados en Nomina_Periodo. Override del modal solo si user lo cambió.
  const sueldoRaw = override?.Sueldo_Basico ?? empleado?.Sueldo_Basico ?? fila.Sueldo_Basico ?? 0;
  const sueldo_basico = clamp(safeNum(sueldoRaw), LIMITES.SUELDO_MIN, LIMITES.SUELDO_MAX);

  // VARIABLE: motor no toca cálculos.
  if (!esFijo(tipo_efectivo)) {
    const cambios: Partial<NominaFila> = {};
    if (override) Object.assign(cambios, override);
    cambios.Estado = "MANUAL";
    cambios.Fecha_Calculo = new Date().toISOString();
    return { fila: { ...fila, ...cambios }, cambios, calculado: false };
  }

  // FIJO: recalcula desde sueldo base (nunca acumula sobre valores inflados).
  const dias_base = clamp(diasBasePorCorte(fila.Corte, params.dias_base_mes), LIMITES.DIAS_MIN, LIMITES.DIAS_MAX);
  const dias_desc = clamp(diasDescontados(novedades_empleado), 0, LIMITES.DIAS_MAX);
  const dias_efectivos = clamp(dias_base - dias_desc, LIMITES.DIAS_MIN, LIMITES.DIAS_MAX);

  const aplica_aux = sueldo_basico <= 2 * params.smmlv;
  const aux_completo_corte = aplica_aux
    ? Math.round(params.aux_transporte * dias_base / params.dias_base_mes)
    : 0;

  const devengado_basico = Math.round(sueldo_basico * dias_efectivos / params.dias_base_mes);
  const aux_transporte = aplica_aux
    ? Math.round(aux_completo_corte * dias_efectivos / dias_base)
    : 0;

  const bonificacion = clamp(safeNum(override?.Bonificacion ?? fila.Bonificacion ?? 0), LIMITES.BONIFICACION_MIN, LIMITES.BONIFICACION_MAX);
  const ded_credito = clamp(safeNum(override?.Ded_Credito ?? fila.Ded_Credito ?? 0), LIMITES.DEDUCCION_MIN, LIMITES.DEDUCCION_MAX);
  const ded_otras = clamp(safeNum(override?.Ded_Otras ?? fila.Ded_Otras ?? 0), LIMITES.DEDUCCION_MIN, LIMITES.DEDUCCION_MAX);
  const ded_rtefte = clamp(safeNum(override?.Ded_RteFte ?? fila.Ded_RteFte ?? 0), LIMITES.DEDUCCION_MIN, LIMITES.DEDUCCION_MAX);

  const total_devengado = devengado_basico + aux_transporte + bonificacion;

  const ded_salud = Math.round(devengado_basico * params.pct_salud);
  const ded_pension = Math.round(devengado_basico * params.pct_pension);
  const ded_fsp = devengado_basico >= 4 * params.smmlv
    ? Math.round(devengado_basico * params.pct_fsp)
    : 0;

  const total_deduccion = ded_salud + ded_pension + ded_fsp + ded_rtefte + ded_credito + ded_otras;
  const neto_pagar = total_devengado - total_deduccion;
  const ss_aproximado = Math.round(devengado_basico * params.pct_ss_aprox);

  const cambios: Partial<NominaFila> = {
    Sueldo_Basico: sueldo_basico,
    Dias_Trabajados: dias_efectivos,
    Devengado_Basico: devengado_basico,
    Aux_Transporte: aux_transporte,
    Bonificacion: bonificacion,
    Total_Devengado: total_devengado,
    Ded_Salud: ded_salud,
    Ded_Pension: ded_pension,
    Ded_FSP: ded_fsp,
    Ded_RteFte: ded_rtefte,
    Ded_Credito: ded_credito,
    Ded_Otras: ded_otras,
    Total_Deduccion: total_deduccion,
    Neto_Pagar: neto_pagar,
    SS_Aproximado: ss_aproximado,
    Estado: "CALCULADO",
    Fecha_Calculo: new Date().toISOString(),
  };

  return { fila: { ...fila, ...cambios }, cambios, calculado: true };
}
