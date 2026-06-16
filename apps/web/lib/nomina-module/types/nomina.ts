// Tipos crudos de las tablas del workbook NÓMINA (1:1 con cabeceras del Sheet).

export interface Empleado {
  ID_Empleado: string;
  Empresa: string;
  Nombre: string;
  Tipo_Doc: string;
  Cedula: string;
  Fecha_Nacimiento: string | null;
  Fecha_Ingreso: string | null;
  Fecha_Retiro: string | null;
  "Cargo/Campaña": string;
  Tipo_Contrato: string;
  Tipo_Pago: "FIJO" | "VARIABLE" | "QUINCENAL" | "MENSUAL" | string;
  Sueldo_Basico: number;
  Banco: string;
  Tipo_Cuenta: string;
  Cuenta_Bancaria: string;
  Hijos: string;
  Caja_Compensacion: string;
  ARL: string;
  EPS: string;
  Pension: string;
  Cesantias: string;
  Celular: string;
  Correo: string;
  Ciudad: string;
  Direccion: string;
  Estado: string;
}

export interface NominaFila {
  ID_Nomina: string;
  Periodo: string;          // "2024-01"
  Corte: "PRIMER" | "SEGUNDO" | "MENSUAL" | string;
  ID_Empleado: string;
  Cedula: string;
  Nombre: string;
  Cargo: string;
  Sueldo_Basico: number;
  Dias_Trabajados: number;
  Incapacidades: number;
  Vacaciones: number;
  Licencia: number;
  Ausencias: number;
  Devengado_Basico: number;
  Aux_Transporte: number;
  Bonificacion: number;
  Total_Devengado: number;
  Ded_Salud: number;
  Ded_Pension: number;
  Ded_FSP: number;
  Ded_RteFte: number;
  Ded_Credito: number;
  Ded_Otras: number;
  Total_Deduccion: number;
  Neto_Pagar: number;
  SS_Aproximado: number;
  Estado: string;
  Fecha_Calculo?: string | null;
}

export interface Novedad {
  ID_Novedad: string;
  Fecha_Registro: string;
  Periodo: string;
  ID_Empleado: string;
  Cedula: string;
  Nombre: string;
  Tipo_Novedad: string;
  Dias: number;
  Valor: number;
  Fecha_Inicio: string | null;
  Fecha_Fin: string | null;
  Soporte_URL: string;
  Origen: string;
  Estado: string;
  Observaciones: string;
}

export interface Bonificacion {
  ID_Bonif: string;
  Periodo: string;
  ID_Empleado: string;
  Cedula: string;
  Nombre: string;
  Base_Calculo: string;
  Cantidad_Ventas: number | null;
  Valor_Base: number | null;
  Porcentaje: number | null;
  Valor_Bonificacion: number | null;
  Estado: string;
  Observaciones: string;
}

export interface Alerta {
  ID_Alerta: string;
  Fecha: string;
  Periodo: string;
  ID_Empleado: string;
  Cedula: string;
  Nombre: string;
  Tipo_Alerta: string;
  Descripcion: string;
  Severidad: "BAJA" | "MEDIA" | "ALTA" | string;
  Estado: string;
}

export interface PeriodoKey {
  periodo: string;          // "2024-01"
  corte: string;            // PRIMER | SEGUNDO | MENSUAL
}
