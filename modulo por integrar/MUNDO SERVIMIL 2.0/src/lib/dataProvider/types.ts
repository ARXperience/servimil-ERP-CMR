// Interfaz abstracta del proveedor de datos.
// Hoy implementada con Google Sheets, mañana con Supabase sin tocar la UI.

export type Row = Record<string, string | number | null>;

export interface DataProvider {
  /** Lista todas las filas de una "tabla" (pestaña en Sheets). */
  list(table: string): Promise<Row[]>;
  /** Obtiene una fila por su columna ID (la primera columna). */
  get(table: string, id: string): Promise<Row | null>;
  /** Actualiza una fila existente (match por columna ID). */
  update(table: string, id: string, patch: Partial<Row>): Promise<void>;
  /** Inserta una fila nueva al final. */
  append(table: string, row: Row): Promise<void>;
  /** Borra una fila por su ID (primera columna). Devuelve true si la encontró. */
  remove(table: string, id: string): Promise<boolean>;
  /** Pre-carga varias tablas en una sola llamada (batchGet). */
  warmup(tables: string[]): Promise<void>;
  /** Invalida la caché de una tabla (o todas si no se pasa nombre). */
  invalidate(table?: string): void;
}

// Identificadores lógicos de cada Sheet por dominio.
export type Workbook = "creditos" | "nomina";
