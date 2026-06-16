// Helpers de formato comunes.

const MESES_ES = [
  "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
  "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
];

/** Label legible para el corte de nómina. Cadena vacía → consolidado. */
export function labelCorte(raw: string): string {
  const c = (raw || "").trim().toUpperCase();
  if (c === "") return "Todos los cortes";
  if (c === "PRIMER")  return "Primera quincena";
  if (c === "SEGUNDO") return "Segunda quincena";
  if (c === "MENSUAL") return "Mensual";
  return raw;
}

/** "2024-01" → "ENERO 2024" */
export function formatPeriodoEs(iso: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const [, y, mm] = m;
  const idx = parseInt(mm, 10) - 1;
  return `${MESES_ES[idx] || mm} ${y}`;
}

export function formatCop(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "$0";
  const num = typeof n === "number" ? n : parseFloat(String(n).replace(/[^0-9.-]/g, ""));
  if (!isFinite(num)) return "$0";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(num);
}

/** Normaliza para búsqueda: lowercase + sin tildes + sin caracteres raros. */
export function normTxt(s: unknown): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

/** Devuelve true si CUALQUIER campo del objeto contiene la query (normalizada). */
export function matchAny(obj: Record<string, unknown>, query: string): boolean {
  const q = normTxt(query);
  if (!q) return true;
  for (const k of Object.keys(obj)) {
    if (normTxt(obj[k]).includes(q)) return true;
  }
  return false;
}

export function toNumber(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}
