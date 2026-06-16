// Motor FIFO: aplica Pagos APLICADOS contra su ID_Credito específico.
// El dashboard solo lee — nunca escribe a Sheets.
import type { Credito, Pago, ScoreNivel } from "@/lib/types/credito";
import { toNumber } from "@/lib/utils/format";

export interface CreditoCalc extends Credito {
  pagado_calc: number;
  pendiente_calc: number;
  pct_recup_total: number;          // 0-100
  dias_mora_num: number;
  score_nivel: ScoreNivel;
  valor_prestamo_num: number;
  valor_esperado_num: number;
  estado_norm: string;              // upper, sin espacios extra
}

export function parseScore(raw: string): ScoreNivel {
  const s = (raw || "").toUpperCase();
  if (s.includes("ALTO")) return "ALTO";
  if (s.includes("MEDIO") || s.includes("MEDIA")) return "MEDIO";
  if (s.includes("BAJO") || s.includes("BAJA")) return "BAJO";
  return "DESCONOCIDO";
}

export function normEstado(e: string): string {
  return (e || "").trim().toUpperCase().replace(/\s+/g, " ");
}

/** Devuelve mapa ID_Credito → total pagado APLICADO. */
export function indexPagosAplicados(pagos: Pago[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of pagos) {
    if (String(p.Estado_Aplicacion || "").toUpperCase() !== "APLICADO") continue;
    const id = String(p.ID_Credito || "").trim();
    if (!id) continue;
    m.set(id, (m.get(id) || 0) + toNumber(p.Valor));
  }
  return m;
}

export function calcCreditos(creditos: Credito[], pagos: Pago[]): CreditoCalc[] {
  const idx = indexPagosAplicados(pagos);
  return creditos.map((c) => {
    const valor_esperado_num = toNumber(c.Valor_Esperado);
    const valor_prestamo_num = toNumber(c.Valor_Prestamo);
    const pagado_calc = idx.get(String(c.ID_Credito).trim()) || 0;
    const pendiente_calc = Math.max(0, valor_esperado_num - pagado_calc);
    const pct_recup_total = valor_esperado_num > 0
      ? (pagado_calc / valor_esperado_num) * 100
      : 0;
    return {
      ...c,
      pagado_calc,
      pendiente_calc,
      pct_recup_total,
      dias_mora_num: toNumber(c.Dias_Mora),
      score_nivel: parseScore(c.Score_Riesgo),
      valor_prestamo_num,
      valor_esperado_num,
      estado_norm: normEstado(c.Estado),
    };
  });
}

// === KPIs ejecutivos ===

export interface KpisCartera {
  num_creditos: number;
  capital_desplegado: number;
  recaudo_acumulado: number;
  capital_riesgo: number;
  indice_mora_count_pct: number;     // por # créditos
  indice_mora_valor_pct: number;     // por $ pendiente
  num_alto_riesgo: number;
  num_vigentes: number;
  num_pagados: number;
  num_mora: number;
}

export function kpisCartera(creds: CreditoCalc[], pagos: Pago[]): KpisCartera {
  const recaudo_acumulado = pagos
    .filter((p) => String(p.Estado_Aplicacion || "").toUpperCase() === "APLICADO")
    .reduce((s, p) => s + toNumber(p.Valor), 0);

  const num_creditos = creds.length;
  const capital_desplegado = creds.reduce((s, c) => s + c.valor_prestamo_num, 0);

  // Capital activo = no PAGADO ni PRE PAGADO.
  const activos = creds.filter((c) =>
    c.estado_norm !== "PAGADO" && c.estado_norm !== "PRE PAGADO" && c.estado_norm !== "PREPAGADO"
  );
  const capital_activo_esperado = activos.reduce((s, c) => s + c.valor_esperado_num, 0);
  const pendiente_activos = activos.reduce((s, c) => s + c.pendiente_calc, 0);

  const mora = creds.filter((c) => c.estado_norm === "MORA");
  const alto = creds.filter((c) => c.score_nivel === "ALTO");

  // Capital en riesgo = pendiente_calc de MORA ∪ Score ALTO (sin dup).
  const seen = new Set<string>();
  let capital_riesgo = 0;
  for (const c of [...mora, ...alto]) {
    if (seen.has(c.ID_Credito)) continue;
    seen.add(c.ID_Credito);
    capital_riesgo += c.pendiente_calc;
  }

  const pend_mora = mora.reduce((s, c) => s + c.pendiente_calc, 0);

  return {
    num_creditos,
    capital_desplegado,
    recaudo_acumulado,
    capital_riesgo,
    indice_mora_count_pct: num_creditos > 0 ? (mora.length / num_creditos) * 100 : 0,
    indice_mora_valor_pct: capital_activo_esperado > 0
      ? (pend_mora / capital_activo_esperado) * 100
      : 0,
    num_alto_riesgo: alto.length,
    num_vigentes: creds.filter((c) => c.estado_norm === "VIGENTE").length,
    num_pagados: creds.filter((c) => c.estado_norm === "PAGADO" || c.estado_norm === "PRE PAGADO" || c.estado_norm === "PREPAGADO").length,
    num_mora: mora.length,
  };
}

// === Distribuciones ===

export interface BucketEstado { estado: string; count: number; valor_pendiente: number; }
export function distribucionEstado(creds: CreditoCalc[]): BucketEstado[] {
  const m = new Map<string, BucketEstado>();
  for (const c of creds) {
    const k = c.estado_norm || "SIN ESTADO";
    const cur = m.get(k) || { estado: k, count: 0, valor_pendiente: 0 };
    cur.count++;
    cur.valor_pendiente += c.pendiente_calc;
    m.set(k, cur);
  }
  return Array.from(m.values()).sort((a, b) => b.count - a.count);
}

export interface BucketPagaduria {
  fuerza: string;
  num_creditos: number;
  capital: number;
  recaudado: number;
  pendiente: number;
  num_mora: number;
  mora_pct: number;  // por # créditos dentro de la pagaduría
}
export function resumenPagaduria(creds: CreditoCalc[]): BucketPagaduria[] {
  const m = new Map<string, BucketPagaduria>();
  for (const c of creds) {
    const k = (c.Fuerza || "SIN FUERZA").trim().toUpperCase();
    const cur = m.get(k) || {
      fuerza: k, num_creditos: 0, capital: 0, recaudado: 0,
      pendiente: 0, num_mora: 0, mora_pct: 0,
    };
    cur.num_creditos++;
    cur.capital += c.valor_prestamo_num;
    cur.recaudado += c.pagado_calc;
    cur.pendiente += c.pendiente_calc;
    if (c.estado_norm === "MORA") cur.num_mora++;
    m.set(k, cur);
  }
  for (const v of m.values()) {
    v.mora_pct = v.num_creditos > 0 ? (v.num_mora / v.num_creditos) * 100 : 0;
  }
  return Array.from(m.values()).sort((a, b) => b.num_creditos - a.num_creditos);
}

// === Buckets antigüedad mora ===

export interface BucketMora {
  rango: "1-30" | "31-60" | "61-90" | "90+";
  count: number;
  pendiente: number;
}
export function bucketsMora(creds: CreditoCalc[]): BucketMora[] {
  const out: Record<BucketMora["rango"], BucketMora> = {
    "1-30":  { rango: "1-30",  count: 0, pendiente: 0 },
    "31-60": { rango: "31-60", count: 0, pendiente: 0 },
    "61-90": { rango: "61-90", count: 0, pendiente: 0 },
    "90+":   { rango: "90+",   count: 0, pendiente: 0 },
  };
  for (const c of creds) {
    if (c.estado_norm !== "MORA" || c.dias_mora_num <= 0) continue;
    const d = c.dias_mora_num;
    const k: BucketMora["rango"] =
      d <= 30 ? "1-30" : d <= 60 ? "31-60" : d <= 90 ? "61-90" : "90+";
    out[k].count++;
    out[k].pendiente += c.pendiente_calc;
  }
  return Object.values(out);
}

// Tabla mora ordenada por pendiente desc.
export function listaMora(creds: CreditoCalc[]): CreditoCalc[] {
  return creds
    .filter((c) => c.estado_norm === "MORA")
    .sort((a, b) =>
      b.pendiente_calc - a.pendiente_calc || b.dias_mora_num - a.dias_mora_num
    );
}
