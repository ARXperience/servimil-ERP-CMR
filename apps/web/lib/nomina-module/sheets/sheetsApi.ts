// Wrappers REST de Google Sheets API v4. Solo fetch + JWT (sin googleapis).
import { getAccessToken } from "./googleAuth";

const BASE = "https://sheets.googleapis.com/v4/spreadsheets";

/** Retry con exponential backoff para 429 (rate limit) y 5xx transitorios. */
async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const delays = [800, 2000, 4500]; // ms; total ~7s max
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const res = await fetch(url, { ...init, headers });
    if (res.status !== 429 && res.status < 500) return res;
    if (attempt === delays.length) return res; // último intento: devuelve la respuesta
    await new Promise((r) => setTimeout(r, delays[attempt]));
  }
  // unreachable
  return fetch(url, { ...init, headers });
}

async function jsonOrThrowFriendly<T>(res: Response, ctx: string): Promise<T> {
  if (!res.ok) {
    const txt = await res.text();
    // Detecta rate limit y traduce a mensaje amigable.
    if (res.status === 429 || /RATE_LIMIT|RESOURCE_EXHAUSTED|Quota exceeded/i.test(txt)) {
      throw new Error("Sheets ocupado. Espera unos segundos e intenta de nuevo.");
    }
    throw new Error(`${ctx}: ${txt.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

async function jsonOrThrow<T>(res: Response, ctx: string): Promise<T> {
  return jsonOrThrowFriendly<T>(res, ctx);
}

export interface SpreadsheetMeta {
  properties?: { title?: string };
  sheets?: { properties?: { title?: string; sheetId?: number } }[];
}

export async function getSpreadsheetMeta(spreadsheetId: string): Promise<SpreadsheetMeta> {
  const res = await authedFetch(`${BASE}/${spreadsheetId}?fields=properties.title,sheets.properties`);
  return jsonOrThrow<SpreadsheetMeta>(res, "spreadsheets.get");
}

export async function valuesGet(spreadsheetId: string, range: string): Promise<string[][]> {
  const url = `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  const res = await authedFetch(url);
  const data = await jsonOrThrow<{ values?: string[][] }>(res, "values.get");
  return data.values || [];
}

/** Lee múltiples rangos en UNA sola llamada (consume 1 quota unit, no N). */
export async function valuesBatchGet(
  spreadsheetId: string, ranges: string[]
): Promise<Record<string, string[][]>> {
  if (ranges.length === 0) return {};
  const qs = ranges.map((r) => `ranges=${encodeURIComponent(r)}`).join("&");
  const url = `${BASE}/${spreadsheetId}/values:batchGet?${qs}`;
  const res = await authedFetch(url);
  const data = await jsonOrThrow<{
    valueRanges?: { range: string; values?: string[][] }[];
  }>(res, "values.batchGet");
  const out: Record<string, string[][]> = {};
  const vr = data.valueRanges || [];
  for (let i = 0; i < ranges.length; i++) {
    // Asocia por orden (batchGet preserva orden).
    out[ranges[i]] = vr[i]?.values || [];
  }
  return out;
}

export async function valuesUpdate(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<void> {
  const url =
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}` +
    `?valueInputOption=USER_ENTERED`;
  const res = await authedFetch(url, {
    method: "PUT",
    body: JSON.stringify({ range, majorDimension: "ROWS", values }),
  });
  await jsonOrThrow<unknown>(res, "values.update");
}

/** Crea una pestaña nueva. Devuelve el sheetId asignado. */
export async function addSheet(spreadsheetId: string, title: string): Promise<number> {
  const url = `${BASE}/${spreadsheetId}:batchUpdate`;
  const body = { requests: [{ addSheet: { properties: { title } } }] };
  const res = await authedFetch(url, { method: "POST", body: JSON.stringify(body) });
  const json = await jsonOrThrow<{ replies: { addSheet: { properties: { sheetId: number } } }[] }>(res, "batchUpdate.addSheet");
  return json.replies[0].addSheet.properties.sheetId;
}

/** Borra una fila concreta (rowNumber base-1, incluyendo header). Requiere sheetId numérico. */
export async function deleteRow(
  spreadsheetId: string,
  sheetId: number,
  rowNumber: number
): Promise<void> {
  const url = `${BASE}/${spreadsheetId}:batchUpdate`;
  const body = {
    requests: [{
      deleteDimension: {
        range: {
          sheetId,
          dimension: "ROWS",
          startIndex: rowNumber - 1,  // base-0
          endIndex: rowNumber,        // exclusive
        },
      },
    }],
  };
  const res = await authedFetch(url, { method: "POST", body: JSON.stringify(body) });
  await jsonOrThrow<unknown>(res, "batchUpdate.deleteDimension");
}

export async function valuesAppend(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][]
): Promise<void> {
  const url =
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append` +
    `?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await authedFetch(url, {
    method: "POST",
    body: JSON.stringify({ values }),
  });
  await jsonOrThrow<unknown>(res, "values.append");
}
