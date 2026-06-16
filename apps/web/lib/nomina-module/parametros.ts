// Lector de la pestaña Parametros del workbook NÓMINA.
// La pestaña tiene título en fila 1, cabecera real en fila 3 (Concepto|Valor|Año|Notas),
// datos desde fila 4. No usa el dataProvider genérico para evitar el offset.

import { providerNomina } from "@/lib/nomina-module/dataProvider";
import { toNumber } from "@/lib/nomina-module/utils/format";

export interface NominaParametros {
  smmlv: number;
  aux_transporte: number;
  dias_base_mes: number;
  pct_salud: number;
  pct_pension: number;
  pct_fsp: number;
  // Suma patronales sobre devengado_basico (informativo: SS_Aproximado).
  pct_ss_aprox: number;
  raw: Map<string, number>; // todos los conceptos por nombre normalizado
}

function norm(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

let cache: { at: number; data: NominaParametros } | null = null;
const TTL = 60_000;

export async function getParametrosNomina(): Promise<NominaParametros> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  // Leemos vía dataProvider que ya cachea, pero con offset header: usamos el provider
  // engañándolo no funciona (asume header en fila 1). Aquí leemos directo del API REST.
  const { valuesGet } = await import("@/lib/nomina-module/sheets/sheetsApi");
  const id = process.env.SHEET_ID_NOMINA;
  if (!id) throw new Error("Falta SHEET_ID_NOMINA");
  const rows = await valuesGet(id, "Parametros!A1:E100");

  // Localizar fila de cabecera buscando "Concepto" en col A.
  let headerIdx = rows.findIndex((r) => (r[0] || "").trim().toLowerCase() === "concepto");
  if (headerIdx < 0) headerIdx = 2; // fallback: fila 3

  const map = new Map<string, number>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const concepto = (r[0] || "").trim();
    if (!concepto) continue;
    const valor = toNumber(r[1]);
    map.set(norm(concepto), valor);
  }

  const need = (k: string, label: string): number => {
    const v = map.get(norm(k));
    if (v === undefined) {
      throw new Error(`Parametros: falta concepto "${label}" en la pestaña`);
    }
    return v;
  };

  const salud_patronal = map.get(norm("Salud (patronal)")) ?? 0;
  const pension_patronal = map.get(norm("Pension (patronal)")) ?? 0;
  const arl = map.get(norm("ARL")) ?? 0;
  const sena = map.get(norm("SENA")) ?? 0;
  const icbf = map.get(norm("ICBF")) ?? 0;
  const caja = map.get(norm("Caja Compensacion")) ?? 0;

  // FSP no existe aún en Parametros — default 0. Documentado en CLAUDE.md.
  const pct_fsp = map.get(norm("FSP")) ?? map.get(norm("Fondo Solidaridad Pensional")) ?? 0;

  const data: NominaParametros = {
    smmlv: need("Salario Minimo (SMMLV)", "Salario Minimo (SMMLV)"),
    aux_transporte: need("Auxilio de Transporte", "Auxilio de Transporte"),
    dias_base_mes: need("Dias Laborales (mes)", "Dias Laborales (mes)"),
    pct_salud: need("Deduccion Salud (empleado)", "Deduccion Salud (empleado)"),
    pct_pension: need("Deduccion Pension (empleado)", "Deduccion Pension (empleado)"),
    pct_fsp,
    pct_ss_aprox: salud_patronal + pension_patronal + arl + sena + icbf + caja,
    raw: map,
  };

  cache = { at: Date.now(), data };
  // Mantenemos providerNomina cacheando otras tablas; este lector es paralelo.
  void providerNomina;
  return data;
}

export function clearParametrosCache() { cache = null; }

