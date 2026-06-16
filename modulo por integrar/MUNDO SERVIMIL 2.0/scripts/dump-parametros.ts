import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { valuesGet } from "../src/lib/sheets/sheetsApi";

async function main() {
  const id = process.env.SHEET_ID_NOMINA!;
  const rows = await valuesGet(id, "Parametros!A:E");
  console.log(`\nFilas totales: ${rows.length}\n`);
  rows.forEach((r, i) => {
    console.log(`fila ${i + 1}: ${(r || []).map((c) => JSON.stringify(c)).join(" | ")}`);
  });
}
main().catch((e) => { console.error(e); process.exit(1); });
