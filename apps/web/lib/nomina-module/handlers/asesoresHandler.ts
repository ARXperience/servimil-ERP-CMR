import { providerNomina } from "@/lib/nomina-module/dataProvider";
import type { Row } from "@/lib/nomina-module/dataProvider/types";
import type { Asesor } from "@/lib/nomina-module/types/asesor";

export async function asesoresLista() {
  try {
    const rows = (await providerNomina().list("Asesores")) as unknown as Asesor[];
    return { asesores: rows };
  } catch (e) {
    const msg = (e as Error).message || "";
    // Pestaña aún no existe → devuelve lista vacía + flag para el cliente.
    if (msg.includes("Unable to parse range") || msg.includes("not found")) {
      return { asesores: [], notice: "Pestaña 'Asesores' no existe. Ejecutar seed-asesores." };
    }
    throw e;
  }
}

function nextId(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}(\\d+)$`, "i");
  const max = existing.reduce((m, s) => {
    const x = re.exec(String(s).trim());
    return x ? Math.max(m, parseInt(x[1], 10)) : m;
  }, 0);
  const n = max + 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}

export async function asesorCrear(input: Partial<Asesor>) {
  const p = providerNomina();
  const existing = (await p.list("Asesores")) as unknown as Asesor[];
  const ID_Asesor = nextId("AS", existing.map((a) => a.ID_Asesor));
  const row: Row = {
    ID_Asesor,
    Empresa: input.Empresa || "",
    Nombre: input.Nombre || "",
    Tipo_Doc: input.Tipo_Doc || "CC",
    Cedula: input.Cedula || "",
    Fecha_Nacimiento: input.Fecha_Nacimiento || "",
    Fecha_Ingreso: input.Fecha_Ingreso || new Date().toISOString().slice(0, 10),
    Fecha_Retiro: input.Fecha_Retiro || "",
    Banco: input.Banco || "",
    Tipo_Cuenta: input.Tipo_Cuenta || "",
    Cuenta_Bancaria: input.Cuenta_Bancaria || "",
    Contrato: input.Contrato || "LABORAL",
    Hijos: input.Hijos || "NO",
    Caja_Compensacion: input.Caja_Compensacion || "",
    ARL: input.ARL || "",
    EPS: input.EPS || "",
    Pension: input.Pension || "",
    Cesantias: input.Cesantias || "",
    Celular: input.Celular || "",
    Correo: input.Correo || "",
    Ciudad: input.Ciudad || "",
    Direccion: input.Direccion || "",
    Estado: input.Estado || "ACTIVA",
  };
  await p.append("Asesores", row);
  return { ok: true, ID_Asesor };
}

export async function asesorActualizar(id: string, patch: Partial<Asesor>) {
  if (!id) throw new Error("Falta ID_Asesor");
  await providerNomina().update("Asesores", id, patch as Row);
  return { ok: true, id, fields: Object.keys(patch) };
}

export async function asesorRetirar(id: string) {
  if (!id) throw new Error("Falta ID_Asesor");
  const hoy = new Date().toISOString().slice(0, 10);
  await providerNomina().update("Asesores", id, { Estado: "RETIRADA", Fecha_Retiro: hoy } as Row);
  return { ok: true, id, fecha_retiro: hoy };
}

export async function asesorBorrar(id: string) {
  if (!id) throw new Error("Falta ID_Asesor");
  const ok = await providerNomina().remove("Asesores", id);
  return { ok, id };
}

