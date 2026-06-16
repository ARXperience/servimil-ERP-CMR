// Pestaña Asesores — histórico de personal (activas + retiradas).
// Tabla separada de Empleados/Nómina. No se cruza.

export interface Asesor {
  ID_Asesor: string;
  Empresa: string;
  Nombre: string;
  Tipo_Doc: string;
  Cedula: string;
  Fecha_Nacimiento: string;
  Fecha_Ingreso: string;
  Fecha_Retiro: string;
  Banco: string;
  Tipo_Cuenta: string;
  Cuenta_Bancaria: string;
  Contrato: string;
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
  Estado: "ACTIVA" | "RETIRADA" | string;
}

export const ASESOR_HEADERS = [
  "ID_Asesor", "Empresa", "Nombre", "Tipo_Doc", "Cedula",
  "Fecha_Nacimiento", "Fecha_Ingreso", "Fecha_Retiro",
  "Banco", "Tipo_Cuenta", "Cuenta_Bancaria", "Contrato",
  "Hijos", "Caja_Compensacion", "ARL", "EPS", "Pension", "Cesantias",
  "Celular", "Correo", "Ciudad", "Direccion", "Estado",
] as const;
