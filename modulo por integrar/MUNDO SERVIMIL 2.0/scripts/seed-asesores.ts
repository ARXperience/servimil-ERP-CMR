/**
 * Crea la pestaña "Asesores" en BD_NOMINA_SERVIMIL (si no existe)
 * y la pueblan con 18 filas ficticias (mezcla ACTIVA/RETIRADA, 3 empresas).
 *
 * Uso: npx tsx scripts/seed-asesores.ts
 */
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import {
  getSpreadsheetMeta, valuesGet, valuesAppend, addSheet, valuesUpdate,
} from "../src/lib/sheets/sheetsApi";
import { ASESOR_HEADERS } from "../src/lib/types/asesor";

const SHEET_ID = process.env.SHEET_ID_NOMINA!;
const TAB = "Asesores";

const EMPRESAS = ["SERVIMIL", "FUERZA MILITAR", "RAPPI CREDIT"];
const BANCOS = ["BANCOLOMBIA", "DAVIVIENDA", "BBVA", "BANCO DE BOGOTA", "AV VILLAS"];
const EPS = ["SURA", "SANITAS", "COMPENSAR", "NUEVA EPS", "SALUD TOTAL"];
const FONDOS = ["PORVENIR", "PROTECCION", "COLPENSIONES", "COLFONDOS"];
const CAJAS = ["COLSUBSIDIO", "COMPENSAR", "CAFAM"];
const CONTRATOS = ["LABORAL INDEFINIDO", "LABORAL FIJO", "OBRA O LABOR"];
const CIUDADES = ["BOGOTA", "MEDELLIN", "CALI", "BARRANQUILLA", "BUCARAMANGA", "CARTAGENA", "PEREIRA"];

const NOMBRES_MUJER = [
  "MARIA CAMILA RODRIGUEZ LOPEZ", "ANA SOFIA MARTINEZ PEREZ", "VALENTINA GOMEZ SUAREZ",
  "LAURA DANIELA HERRERA RIOS", "JULIANA ALEJANDRA CASTRO MEJIA", "ISABELLA SANCHEZ TORRES",
  "GABRIELA MORENO VARGAS", "CAMILA ANDREA OSPINA RUIZ", "MARIANA RAMIREZ DIAZ",
  "SOFIA NATALIA GUTIERREZ LEON", "ANDREA CAROLINA BUSTOS MORA",
];
const NOMBRES_HOMBRE = [
  "CARLOS ALBERTO MORENO RUIZ", "JUAN DAVID ARANGO LOPEZ", "ANDRES FELIPE GIRALDO",
  "DIEGO ALEJANDRO PINEDA OSPINA", "SANTIAGO QUINTERO ZULETA", "FERNANDO RIVERA GUTIERREZ",
  "RICARDO MEJIA PARRA",
];
const TODOS = [...NOMBRES_MUJER, ...NOMBRES_HOMBRE];

function pick<T>(arr: readonly T[], i: number): T { return arr[i % arr.length]; }
function randIn<T>(arr: readonly T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function fechaNac(anioMin = 1985, anioMax = 2002): string {
  const y = anioMin + Math.floor(Math.random() * (anioMax - anioMin + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function fechaIngreso(): string {
  // Entre 2020 y 2025
  const y = 2020 + Math.floor(Math.random() * 6);
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function fechaRetiro(despues: string): string {
  // Entre fecha_ingreso+6 meses y 2025-12
  const ing = new Date(despues);
  const min = new Date(ing.getTime() + 1000 * 60 * 60 * 24 * 180);
  const max = new Date("2025-12-31");
  const diff = max.getTime() - min.getTime();
  const at = new Date(min.getTime() + Math.random() * diff);
  return at.toISOString().slice(0, 10);
}
function cedula(seed: number): string {
  return String(1000000000 + seed * 73 + Math.floor(Math.random() * 999));
}
function celular(): string {
  return `3${[0,0,1,1,2,3][Math.floor(Math.random()*6)]}${String(Math.floor(Math.random()*1e8)).padStart(8,"0")}`;
}
function cuenta(): string {
  return String(Math.floor(Math.random() * 1e10)).padStart(11, "0");
}
function correo(nombre: string): string {
  const parts = nombre.toLowerCase().split(/\s+/);
  return `${parts[0]}.${parts[parts.length - 1]}@servimil.com.co`;
}

async function ensureTab(): Promise<void> {
  const meta = await getSpreadsheetMeta(SHEET_ID);
  const exists = (meta.sheets || []).some((s) => s.properties?.title === TAB);
  if (exists) {
    console.log(`Pestaña "${TAB}" ya existe.`);
  } else {
    console.log(`Creando pestaña "${TAB}"…`);
    await addSheet(SHEET_ID, TAB);
    console.log("  ✓ creada");
  }
  // Asegurar header.
  const r = await valuesGet(SHEET_ID, `${TAB}!1:1`);
  const hdr = (r[0] || []).map(String);
  if (hdr.join("|") !== ASESOR_HEADERS.join("|")) {
    console.log("Escribiendo header…");
    await valuesUpdate(SHEET_ID, `${TAB}!A1:W1`, [Array.from(ASESOR_HEADERS) as string[]]);
    console.log("  ✓ header listo");
  }
}

async function seed(): Promise<void> {
  // Borrar lo que hubiera (si filas > 1).
  const existing = await valuesGet(SHEET_ID, `${TAB}!A:A`);
  if (existing.length > 1) {
    console.log(`Ya hay ${existing.length - 1} filas. Skipping seed (no overwrite).`);
    return;
  }

  // 18 asesoras/asesores: 6 SERVIMIL, 6 FM, 6 RAPPI. ~5 retiradas.
  const rows: (string | number)[][] = [];
  let seq = 0;
  const retiradasIdx = new Set([2, 5, 7, 11, 14]); // 5 retiradas distribuidas

  for (let e = 0; e < EMPRESAS.length; e++) {
    for (let n = 0; n < 6; n++) {
      const i = seq;
      const empresa = EMPRESAS[e];
      const nombre = pick(TODOS, i + Math.floor(Math.random() * 3));
      const fnac = fechaNac();
      const fing = fechaIngreso();
      const retirada = retiradasIdx.has(i);
      const fret = retirada ? fechaRetiro(fing) : "";
      const tipoCuenta = randIn(["AHORROS", "CORRIENTE"]);
      const id = `AS${String(i + 1).padStart(3, "0")}`;

      rows.push([
        id, empresa, nombre, "CC", cedula(i),
        fnac, fing, fret,
        randIn(BANCOS), tipoCuenta, cuenta(), randIn(CONTRATOS),
        Math.random() < 0.4 ? "SI" : "NO", randIn(CAJAS), "POSITIVA",
        randIn(EPS), randIn(FONDOS), randIn(FONDOS),
        celular(), correo(nombre), randIn(CIUDADES), `CALLE ${10 + i} # ${20 + i}-${30 + i}`,
        retirada ? "RETIRADA" : "ACTIVA",
      ]);
      seq++;
    }
  }

  console.log(`Insertando ${rows.length} filas…`);
  await valuesAppend(SHEET_ID, `${TAB}!A:W`, rows);
  console.log("  ✓ seed completo");
}

async function main() {
  await ensureTab();
  await seed();
  console.log("\n🎉 Listo.");
}
main().catch((e) => { console.error("❌ ", e); process.exit(1); });
