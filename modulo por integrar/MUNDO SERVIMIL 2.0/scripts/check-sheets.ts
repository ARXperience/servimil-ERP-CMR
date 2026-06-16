/**
 * Verifica conexión Google Sheets usando la nueva capa fetch+Web Crypto
 * (la misma que correrá en Cloudflare). Si esto pasa local, pasa en prod.
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { getSpreadsheetMeta, valuesGet } from "../src/lib/sheets/sheetsApi";

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const idC = process.env.SHEET_ID_CREDITOS;
  const idN = process.env.SHEET_ID_NOMINA;

  console.log("\n=== Verificación Sheets (fetch+Web Crypto) ===");
  console.log("Service account:", email || "(FALTA)");
  console.log("SHEET_ID_CREDITOS:", idC || "(FALTA)");
  console.log("SHEET_ID_NOMINA :", idN || "(FALTA)");
  if (!email || !idC || !idN || !process.env.GOOGLE_PRIVATE_KEY) {
    console.error("\n❌ Faltan variables. Abortando.");
    process.exit(1);
  }

  for (const [label, id] of [["CRÉDITOS", idC], ["NÓMINA", idN]] as const) {
    console.log(`\n--- ${label} (${id}) ---`);
    try {
      const meta = await getSpreadsheetMeta(id);
      console.log("Título :", meta.properties?.title);
      const tabs = (meta.sheets || []).map((s) => s.properties?.title || "?");
      console.log("Pestañas:", tabs.join(", "));
      if (tabs[0]) {
        const head = await valuesGet(id, `${tabs[0]}!1:1`);
        console.log(`Cabecera "${tabs[0]}":`, (head[0] || []).join(" | "));
      }
      console.log(`✅ ${label} accesible.`);
    } catch (e) {
      console.error(`❌ ${label} falló:`, (e as Error).message);
    }
  }
}

main().catch((e) => { console.error("Error:", e); process.exit(1); });
