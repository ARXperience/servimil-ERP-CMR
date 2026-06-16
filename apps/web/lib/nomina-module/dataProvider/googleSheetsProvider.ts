import { DataProvider, Row, Workbook } from "./types";
import {
  valuesGet, valuesBatchGet, valuesUpdate, valuesAppend, deleteRow, getSpreadsheetMeta,
} from "@/lib/nomina-module/sheets/sheetsApi";

type CacheEntry = { at: number; rows: Row[]; header: string[] };

const TTL_MS = (Number(process.env.SHEETS_CACHE_TTL || 60)) * 1000;

function getSpreadsheetId(workbook: Workbook): string {
  const id =
    workbook === "creditos"
      ? process.env.SHEET_ID_CREDITOS
      : process.env.SHEET_ID_NOMINA;
  if (!id) throw new Error(`Falta SHEET_ID_${workbook.toUpperCase()} en .env`);
  return id;
}

export class GoogleSheetsProvider implements DataProvider {
  private cache = new Map<string, CacheEntry>();
  constructor(private workbook: Workbook) {}

  private get spreadsheetId() {
    return getSpreadsheetId(this.workbook);
  }

  private async readRange(table: string): Promise<{ header: string[]; rows: Row[] }> {
    const cached = this.cache.get(table);
    if (cached && Date.now() - cached.at < TTL_MS) {
      return { header: cached.header, rows: cached.rows };
    }
    const values = await valuesGet(this.spreadsheetId, `${table}!A:ZZ`);
    const header = (values[0] || []).map(String);
    const rows: Row[] = values.slice(1).map((r) => {
      const obj: Row = {};
      header.forEach((h, i) => {
        const v = r[i];
        obj[h] = v === undefined || v === "" ? null : v;
      });
      return obj;
    });
    this.cache.set(table, { at: Date.now(), header, rows });
    return { header, rows };
  }

  async list(table: string): Promise<Row[]> {
    const { rows } = await this.readRange(table);
    return rows;
  }

  /** Pre-carga VARIAS tablas en una sola llamada batchGet. */
  async warmup(tables: string[]): Promise<void> {
    const missing = tables.filter((t) => {
      const c = this.cache.get(t);
      return !c || Date.now() - c.at >= TTL_MS;
    });
    if (missing.length === 0) return;
    if (missing.length === 1) { await this.readRange(missing[0]); return; }
    const ranges = missing.map((t) => `${t}!A:ZZ`);
    const result = await valuesBatchGet(this.spreadsheetId, ranges);
    for (const t of missing) {
      const values = result[`${t}!A:ZZ`] || [];
      const header = (values[0] || []).map(String);
      const rows: Row[] = values.slice(1).map((r) => {
        const obj: Row = {};
        header.forEach((h, i) => {
          const v = r[i];
          obj[h] = v === undefined || v === "" ? null : v;
        });
        return obj;
      });
      this.cache.set(t, { at: Date.now(), header, rows });
    }
  }

  async get(table: string, id: string): Promise<Row | null> {
    const { header, rows } = await this.readRange(table);
    const idCol = header[0];
    if (!idCol) return null;
    return rows.find((r) => String(r[idCol]) === String(id)) ?? null;
  }

  async update(table: string, id: string, patch: Partial<Row>): Promise<void> {
    const { header, rows } = await this.readRange(table);
    const idCol = header[0];
    const idx = rows.findIndex((r) => String(r[idCol]) === String(id));
    if (idx < 0) throw new Error(`Fila no encontrada: ${table} id=${id}`);
    const merged = { ...rows[idx], ...patch };
    const rowValues = header.map((h) => (merged[h] ?? "") as string | number);
    const rowNumber = idx + 2;
    await valuesUpdate(
      this.spreadsheetId,
      `${table}!A${rowNumber}:${colLetter(header.length)}${rowNumber}`,
      [rowValues]
    );
    // NO invalidamos: actualizamos la fila in-place en cache para evitar re-lectura.
    const cached = this.cache.get(table);
    if (cached) {
      const norm: Row = {};
      for (const h of cached.header) {
        const v = merged[h];
        norm[h] = v === undefined ? null : v;
      }
      cached.rows[idx] = norm;
      cached.at = Date.now();
    }
  }

  /** Borra una fila por ID (col A). Resuelve sheetId al vuelo. */
  async remove(table: string, id: string): Promise<boolean> {
    const { header, rows } = await this.readRange(table);
    const idCol = header[0];
    const idx = rows.findIndex((r) => String(r[idCol]) === String(id));
    if (idx < 0) return false;
    const rowNumber = idx + 2;  // +1 header, +1 base-1
    // Mapea nombre de pestaña → sheetId numérico (cacheable).
    const meta = await getSpreadsheetMeta(this.spreadsheetId);
    const sheet = (meta.sheets || []).find((s) => s.properties?.title === table);
    const sheetId = sheet?.properties?.sheetId;
    if (sheetId === undefined) throw new Error(`No se encontró sheetId para "${table}"`);
    await deleteRow(this.spreadsheetId, sheetId, rowNumber);
    this.invalidate(table);
    return true;
  }

  async append(table: string, row: Row): Promise<void> {
    const { header } = await this.readRange(table);
    const rowValues = header.map((h) => (row[h] ?? "") as string | number);
    await valuesAppend(
      this.spreadsheetId,
      `${table}!A:${colLetter(header.length)}`,
      [rowValues]
    );
    // Append a cache local — evita re-lectura tras crear.
    const cached = this.cache.get(table);
    if (cached) {
      const obj: Row = {};
      cached.header.forEach((h) => {
        const v = row[h];
        obj[h] = v === undefined ? null : v;
      });
      cached.rows.push(obj);
      cached.at = Date.now();
    }
  }

  invalidate(table?: string): void {
    if (table) this.cache.delete(table);
    else this.cache.clear();
  }
}

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

let credP: GoogleSheetsProvider | null = null;
let nomP: GoogleSheetsProvider | null = null;
export function providerCreditos(): DataProvider {
  return (credP ??= new GoogleSheetsProvider("creditos"));
}
export function providerNomina(): DataProvider {
  return (nomP ??= new GoogleSheetsProvider("nomina"));
}

