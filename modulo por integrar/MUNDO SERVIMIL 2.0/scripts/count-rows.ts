import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { valuesGet } from "../src/lib/sheets/sheetsApi";
async function main() {
  const id = process.env.SHEET_ID_NOMINA!;
  for (const tab of ["Nomina_Periodo","Empleados","Novedades","Bonificaciones","Alertas"]) {
    const r = await valuesGet(id, `${tab}!A:A`);
    console.log(`${tab}: ${Math.max(0, r.length - 1)} filas`);
  }
  // Periodos distintos
  const rows = await valuesGet(id, "Nomina_Periodo!A:D");
  const headers = rows[0];
  const idxPer = headers.indexOf("Periodo");
  const idxCor = headers.indexOf("Corte");
  const set = new Map<string,number>();
  for (const r of rows.slice(1)) {
    const k = `${r[idxPer]}|${r[idxCor]||""}`;
    set.set(k, (set.get(k)||0)+1);
  }
  console.log("\nPeriodo|Corte → filas:");
  Array.from(set.entries()).sort().forEach(([k,v]) => console.log("  ", k, "→", v));
  // Empresas
  const eRows = await valuesGet(id, "Empleados!A:B");
  const empresas = new Map<string,number>();
  for (const r of eRows.slice(1)) {
    const e = (r[1]||"").trim();
    if (e) empresas.set(e, (empresas.get(e)||0)+1);
  }
  console.log("\nEmpresas → # empleados:");
  Array.from(empresas.entries()).forEach(([k,v]) => console.log("  ",k,"→",v));
}
main();
