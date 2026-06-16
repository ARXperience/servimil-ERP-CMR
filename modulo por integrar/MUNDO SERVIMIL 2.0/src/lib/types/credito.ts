// Tipos crudos de las tablas del workbook CRÉDITOS.

export interface Credito {
  ID_Credito: string;
  Empresa: string;
  Corte: string;
  ID_Cliente: string;
  Codigo_Militar: string;
  Nombre: string;
  Fuerza: string;
  Valor_Prestamo: number | string;
  Valor_Esperado: number | string;
  Valor_Pagado: number | string;
  Pendiente: number | string;
  Pct_Recup_Capital: number | string;
  Pct_Recup_Total: number | string;
  Cuotas_Descontadas: number | string;
  Ultimo_Mes_Descuento: string;
  Seguro_Esperado: number | string;
  Seguro_Recaudado: number | string;
  Dias_Mora: number | string;
  Estado: "VIGENTE" | "PAGADO" | "PRE PAGADO" | "PREPAGADO" | "MORA" | string;
  Baja_Enviada: string;
  Fecha_Baja: string;
  Score_Riesgo: string;  // "🟢 BAJO" | "🟡 MEDIO" | "🔴 ALTO"
  Asesor_Comercial: string;
  Fecha_Desembolso: string;
  Fecha_Fin: string;
}

export interface Pago {
  ID_Pago: string;
  Fecha_Pago: string;
  ID_Cliente: string;
  Codigo_Militar: string;
  Nombre: string;
  ID_Credito: string;
  Tipo_Pago: "NOMINA" | "PREPAGO" | "CREMIL" | string;
  Valor: number | string;
  Mes_Aplicado: string;
  Origen: string;
  Estado_Aplicacion: "APLICADO" | "PENDIENTE" | "RECHAZADO" | string;
}

export type ScoreNivel = "BAJO" | "MEDIO" | "ALTO" | "DESCONOCIDO";
