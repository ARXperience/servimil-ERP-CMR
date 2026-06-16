import { Injectable, Logger } from '@nestjs/common';

/**
 * GoogleSheetsService
 * 
 * Reads a public Google Sheet by converting its URL to a CSV export link,
 * downloads the CSV, parses it into an array of row objects, and caches it.
 * No Google Cloud credentials needed — just "Anyone with the link" view access.
 */
@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);
  private cache = new Map<string, { data: Record<string, string>[]; columns: string[]; fetchedAt: Date }>();
  private readonly CACHE_TTL_MS = 30 * 1000; // 30 seconds

  /**
   * Convert any Google Sheets URL to the CSV export link.
   * Supports:
   * - https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=0
   * - https://docs.google.com/spreadsheets/d/SHEET_ID/
   */
  private toCsvUrl(sheetUrl: string): string | null {
    try {
      const match = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) return null;
      const sheetId = match[1];
      // Extract gid if present, default to 0
      const gidMatch = sheetUrl.match(/gid=(\d+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    } catch {
      return null;
    }
  }

  /**
   * Parse a CSV string into rows of key-value objects.
   * Uses the first row as headers (column names).
   */
  private parseCsv(csv: string): { columns: string[]; rows: Record<string, string>[] } {
    const lines = csv.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return { columns: [], rows: [] };

    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const columns = parseRow(lines[0]);
    const rows = lines.slice(1).map(line => {
      const values = parseRow(line);
      const obj: Record<string, string> = {};
      columns.forEach((col, i) => {
        obj[col] = values[i] || '';
      });
      return obj;
    });

    return { columns, rows };
  }

  /**
   * Fetch and parse a Google Sheet. Results are cached for 5 minutes.
   */
  async fetchSheet(sheetUrl: string): Promise<{ columns: string[]; data: Record<string, string>[] } | null> {
    if (!sheetUrl) return null;

    // Check cache
    const cached = this.cache.get(sheetUrl);
    if (cached && (Date.now() - cached.fetchedAt.getTime()) < this.CACHE_TTL_MS) {
      return { columns: cached.columns, data: cached.data };
    }

    const csvUrl = this.toCsvUrl(sheetUrl);
    if (!csvUrl) {
      this.logger.warn(`Could not parse Google Sheets URL: ${sheetUrl}`);
      return null;
    }

    try {
      this.logger.log(`Fetching Google Sheet CSV: ${csvUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(csvUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        this.logger.warn(`Failed to fetch sheet: HTTP ${response.status}`);
        return null;
      }
      const csvText = await response.text();
      const { columns, rows } = this.parseCsv(csvText);

      this.logger.log(`Parsed ${rows.length} rows with ${columns.length} columns: [${columns.join(', ')}]`);

      // Cache result
      this.cache.set(sheetUrl, { data: rows, columns, fetchedAt: new Date() });

      return { columns, data: rows };
    } catch (error) {
      this.logger.error('Error fetching Google Sheet', error);
      return null;
    }
  }

  /**
   * Search the sheet data by phone number (partial match).
   * Returns the matching row(s) or null.
   */
  async findByPhone(sheetUrl: string, phone: string): Promise<Record<string, string>[] | null> {
    const result = await this.fetchSheet(sheetUrl);
    if (!result) return null;

    // Normalize the phone: strip all non-digits
    const normalizedPhone = phone.replace(/\D/g, '');
    // Try to find phone-like columns
    const phoneColumns = result.columns.filter(col =>
      /tel[eé]?f|phone|celular|m[oó]vil|whatsapp|contacto|n[uú]mero/i.test(col)
    );

    if (phoneColumns.length === 0) {
      // Fall back: search ALL columns
      return result.data.filter(row =>
        Object.values(row).some(val => val.replace(/\D/g, '').includes(normalizedPhone))
      );
    }

    return result.data.filter(row =>
      phoneColumns.some(col => row[col]?.replace(/\D/g, '').includes(normalizedPhone))
    );
  }

  /**
   * Search the sheet data by any of the provided terms across all columns.
   * Only terms >= 4 chars are used to avoid false positives.
   */
  async findByTerms(sheetUrl: string, searchTerms: string[]): Promise<Record<string, string>[] | null> {
    const result = await this.fetchSheet(sheetUrl);
    if (!result) return null;

    const terms = searchTerms
      .map(t => t?.toString().trim().toLowerCase())
      .filter(t => t && t.length > 3);

    if (terms.length === 0) return null;

    return result.data.filter(row => {
      const rowValues = Object.values(row).map(v => v?.toLowerCase().trim() || '');
      return terms.some(term => rowValues.some(val => val.includes(term)));
    });
  }

  /**
   * Returns a text summary of the sheet columns and a few sample rows,
   * suitable for injecting into an LLM prompt.
   */
  async getSheetContextForPrompt(sheetUrl: string, searchTerms: string[] = []): Promise<string> {
    const result = await this.fetchSheet(sheetUrl);
    if (!result || result.data.length === 0) return '';

    let context = `\n--- BASE DE DATOS (Google Sheets) ---\n`;
    context += `Columnas disponibles: ${result.columns.join(', ')}\n`;

    let matches: Record<string, string>[] | null = null;
    if (searchTerms && searchTerms.length > 0) {
      matches = await this.findByTerms(sheetUrl, searchTerms);
    }

    if (matches && matches.length > 0) {
      context += `\nDatos del cliente encontrado:\n`;
      matches.slice(0, 5).forEach((row, i) => {
        context += `Registro ${i + 1}:\n`;
        result.columns.forEach(col => {
          if (row[col]) context += `  ${col}: ${row[col]}\n`;
        });
      });
    } else {
      context += `\nNo se encontraron datos previos para los criterios de búsqueda. ESTE ES UN CLIENTE NUEVO.\n`;
      context += `(Primeros 3 registros de ejemplo, solo para que conozcas la estructura de la tabla. NO pertenecen al cliente actual):\n`;
      result.data.slice(0, 3).forEach((row, i) => {
        context += `Ejemplo ${i + 1}: ${result.columns.map(c => `${c}=${row[c] || ''}`).join(', ')}\n`;
      });
    }

    context += `--- FIN BASE DE DATOS ---\n`;
    return context;
  }

  /**
   * Clears the cache for a specific sheet URL, or all caches if no URL provided.
   */
  clearCache(sheetUrl?: string): void {
    if (sheetUrl) {
      this.cache.delete(sheetUrl);
      this.logger.log(`Cleared Google Sheets cache for ${sheetUrl}`);
    } else {
      this.cache.clear();
      this.logger.log('Cleared all Google Sheets caches');
    }
  }
}
