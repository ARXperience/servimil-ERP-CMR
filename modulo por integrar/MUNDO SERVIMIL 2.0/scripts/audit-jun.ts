import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
import { valuesGet } from "../src/lib/sheets/sheetsApi";

const SHEET_ID = process.env.SHEET_ID_NOMINA!;

async function main() {
  const rows = await valuesGet(SHEET_ID, "Nomina_Periodo!A:ZZ");
  const hdr = rows[0];
  const data = rows.slice(1);
  const idx = (h: string) => hdr.indexOf(h);
  const c = {
    id: idx("ID_Nomina"), per: idx("Periodo"), corte: idx("Corte"),
    emp: idx("ID_Empleado"), nombre: idx("Nombre"),
    sueldo: idx("Sueldo_Basico"), dias: idx("Dias_Trabajados"),
    dev: idx("Devengado_Basico"), aux: idx("Aux_Transporte"),
    bonif: idx("Bonificacion"), total_dev: idx("Total_Devengado"),
    salud: idx("Ded_Salud"), pension: idx("Ded_Pension"),
    fsp: idx("Ded_FSP"), rtefte: idx("Ded_RteFte"),
    credito: idx("Ded_Credito"), otras: idx("Ded_Otras"),
    total_ded: idx("Total_Deduccion"), neto: idx("Neto_Pagar"),
    estado: idx("Estado"),
  };

  // Filas de 2026-06
  const jun = data.filter((r) => r[c.per] === "2026-06");
  console.log(`\n=== Filas en 2026-06: ${jun.length} ===\n`);

  // Detectar anomalías
  const LIMITES = {
    sueldo_max: 30_000_000,         // sueldo mensual > 30M es sospechoso
    dias_max: 31,
    dev_max: 50_000_000,
    neto_max: 50_000_000,
  };

  for (const r of jun) {
    const sueldo = Number(r[c.sueldo]) || 0;
    const dias = Number(r[c.dias]) || 0;
    const dev = Number(r[c.dev]) || 0;
    const neto = Number(r[c.neto]) || 0;
    const flags: string[] = [];
    if (sueldo > LIMITES.sueldo_max) flags.push(`SUELDO=${sueldo}`);
    if (dias < 0 || dias > LIMITES.dias_max) flags.push(`DIAS=${dias}`);
    if (dev > LIMITES.dev_max) flags.push(`DEV=${dev}`);
    if (neto > LIMITES.neto_max || neto < -1_000_000) flags.push(`NETO=${neto}`);
    if (flags.length) {
      console.log(`⚠️ ${r[c.id]} | ${r[c.emp]} ${r[c.nombre]} | ${r[c.corte]} | ${flags.join(" ")}`);
    } else {
      console.log(`✓ ${r[c.id]} | ${r[c.emp]} ${r[c.nombre]} | ${r[c.corte]} | sueldo=${sueldo} dias=${dias} dev=${dev} neto=${neto}`);
    }
  }

  // Totales actuales
  const sumNeto = jun.reduce((s, r) => s + (Number(r[c.neto]) || 0), 0);
  const sumDev = jun.reduce((s, r) => s + (Number(r[c.total_dev]) || 0), 0);
  console.log(`\nTOTAL NETO actual: ${sumNeto.toLocaleString()}`);
  console.log(`TOTAL DEV actual:  ${sumDev.toLocaleString()}`);
}
main().catch(console.error);
