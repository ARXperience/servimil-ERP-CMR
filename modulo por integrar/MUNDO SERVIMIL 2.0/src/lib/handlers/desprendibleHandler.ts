import { providerNomina } from "@/lib/dataProvider";
import type { NominaFila, Empleado } from "@/lib/types/nomina";
import { getParametrosNomina } from "@/lib/parametros";
import { toNumber } from "@/lib/utils/format";

const NITS: Record<string, string> = {
  "SERVIMIL": "901.644.167-3",
  "SERVIMIL COL SAS": "901.644.167-3",
  "FUERZA MILITAR": "—",
  "RAPPI CREDIT": "—",
};

function periodoCausacion(periodo: string, corte: string): string {
  // 2026-06 + PRIMER → 01-15 jun 2026 ; SEGUNDO → 16-30 jun 2026 ; MENSUAL → 01-30 jun 2026
  const [y, m] = periodo.split("-");
  const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
  const mesNombre = meses[parseInt(m, 10) - 1] || m;
  const c = String(corte || "").toUpperCase();
  if (c === "PRIMER")  return `01 al 15 de ${mesNombre} ${y}`;
  if (c === "SEGUNDO") return `16 al 30 de ${mesNombre} ${y}`;
  return `01 al 30 de ${mesNombre} ${y}`;
}

export async function desprendibleGenerar(id_empleado: string, periodo: string, corte?: string) {
  if (!id_empleado || !periodo) throw new Error("Faltan id_empleado y periodo");
  const p = providerNomina();
  const [filas, empleados, params] = await Promise.all([
    p.list("Nomina_Periodo") as Promise<unknown> as Promise<NominaFila[]>,
    p.list("Empleados")      as Promise<unknown> as Promise<Empleado[]>,
    getParametrosNomina(),
  ]);

  const candidatos = filas.filter((f) =>
    String(f.ID_Empleado) === String(id_empleado) &&
    String(f.Periodo).trim() === periodo
  );
  // Si hay 2 cortes (PRIMER + MENSUAL), preferir el solicitado.
  const fila = corte
    ? candidatos.find((f) => String(f.Corte).toUpperCase() === corte.toUpperCase())
    : candidatos[0];
  if (!fila) throw new Error(`No hay fila Nomina_Periodo para empleado=${id_empleado} periodo=${periodo}`);

  const emp = empleados.find((e) => String(e.ID_Empleado) === String(id_empleado));
  if (!emp) throw new Error(`Empleado no encontrado: ${id_empleado}`);

  const dev = toNumber(fila.Devengado_Basico);
  const aux = toNumber(fila.Aux_Transporte);
  const bon = toNumber(fila.Bonificacion);

  const pct_cesantias = params.raw.get(norm("Cesantias")) ?? 0.0833;
  const pct_int_ces   = params.raw.get(norm("Intereses Cesantias")) ?? 0.01;
  const pct_prima     = params.raw.get(norm("Prima")) ?? 0.0833;

  const prima        = Math.round(dev * pct_prima);
  const cesantias    = Math.round(dev * pct_cesantias);
  const int_cesant   = Math.round(cesantias * pct_int_ces);

  const ingresos = [
    { label: "Salario bruto",                 valor: dev },
    { label: "Auxilio de transporte",         valor: aux },
    { label: "Prima de servicios (provisión)",valor: prima },
    { label: "Cesantías (provisión)",         valor: cesantias },
    { label: "Intereses sobre cesantías",     valor: int_cesant },
    { label: "Bonificación mensual",          valor: bon },
  ];
  const totalIngresos = ingresos.reduce((s, i) => s + i.valor, 0);

  const descuentos = [
    { label: "Deducción Salud (4%)",          valor: toNumber(fila.Ded_Salud) },
    { label: "Deducción Pensión (4%)",        valor: toNumber(fila.Ded_Pension) },
    { label: "Fondo de Solidaridad (FSP)",    valor: toNumber(fila.Ded_FSP) },
    { label: "Retención en la fuente",        valor: toNumber(fila.Ded_RteFte) },
    { label: "Deducción crédito",             valor: toNumber(fila.Ded_Credito) },
    { label: "Deducción otras",               valor: toNumber(fila.Ded_Otras) },
  ];
  const totalDescuentos = descuentos.reduce((s, d) => s + d.valor, 0);

  return {
    encabezado: {
      empresa: emp.Empresa,
      nit: NITS[String(emp.Empresa).toUpperCase()] || "—",
      periodo_pago: periodo,
      periodo_causacion: periodoCausacion(periodo, String(fila.Corte || "")),
      corte: String(fila.Corte || ""),
    },
    empleado: {
      id_empleado: emp.ID_Empleado,
      cedula: emp.Cedula,
      tipo_doc: emp.Tipo_Doc,
      nombre: emp.Nombre,
      ocupacion: emp["Cargo/Campaña"],
      fecha_ingreso: emp.Fecha_Ingreso,
      sueldo_bruto: toNumber(emp.Sueldo_Basico),
    },
    ingresos,
    descuentos,
    totales: {
      total_ingresos: totalIngresos,
      total_descuentos: totalDescuentos,
      neto_pagar: toNumber(fila.Neto_Pagar),
    },
  };
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}
