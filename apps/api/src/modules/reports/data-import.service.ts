import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DataImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lee un CSV o los datos de Google Sheets y actualiza las métricas generales del sistema.
   * Para simplificar, buscamos palabras clave en las cabeceras para saber qué tipo de dato es.
   */
  async processImportData(csvText: string, sourceName: string) {
    const lines = csvText.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) return { success: false, message: 'Archivo vacío o sin datos suficientes.' };

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Detectar qué tipo de tabla es basado en las cabeceras
    const isFinance = headers.some(h => h.includes('ingreso') || h.includes('gasto') || h.includes('monto') || h.includes('amount'));
    const isEmployees = headers.some(h => h.includes('empleado') || h.includes('salario') || h.includes('cargo'));
    const isCredits = headers.some(h => h.includes('credito') || h.includes('préstamo') || h.includes('prestamo'));
    
    // Support for the user's specific Service/CRM spreadsheet
    const isServimilDb = headers.some(h => h.includes('asesor') || h.includes('motivo del servicio') || h.includes('entidad'));

    let totalRevenue = 0;
    let totalExpenses = 0;
    let employeeCount = 0;
    let activeCreditsCount = 0;
    let totalCreditAmount = 0;
    let totalLeads = 0;

    const uniqueAsesores = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',').map(c => c.trim());
      
      if (isServimilDb) {
        totalLeads++;
        activeCreditsCount++; // Usar créditos como alias de "Casos/Servicios"
        
        const asesorIndex = headers.findIndex(h => h.includes('asesor'));
        if (asesorIndex >= 0 && row[asesorIndex]) {
          uniqueAsesores.add(row[asesorIndex]);
        }
      }

      if (isFinance) {
        const typeIndex = headers.findIndex(h => h.includes('tipo'));
        const amountIndex = headers.findIndex(h => h.includes('monto') || h.includes('valor'));
        
        if (amountIndex >= 0 && row[amountIndex]) {
          const val = parseFloat(row[amountIndex].replace(/[^0-9.-]+/g,""));
          if (!isNaN(val)) {
            const type = typeIndex >= 0 ? row[typeIndex].toLowerCase() : 'ingreso';
            if (type.includes('gasto') || type.includes('egreso')) {
              totalExpenses += val;
            } else {
              totalRevenue += val;
            }
          }
        }
      }

      if (isEmployees) {
        employeeCount++;
      }

      if (isCredits && !isServimilDb) {
        const amountIndex = headers.findIndex(h => h.includes('monto') || h.includes('valor'));
        if (amountIndex >= 0 && row[amountIndex]) {
          const val = parseFloat(row[amountIndex].replace(/[^0-9.-]+/g,""));
          if (!isNaN(val)) {
            totalCreditAmount += val;
            activeCreditsCount++;
          }
        }
      }
    }

    if (isServimilDb) {
      employeeCount = uniqueAsesores.size;
    }

    // Guardar los totales extraídos en la base de datos (usaremos metadata del usuario admin o un registro temporal)
    // Como simplificación para los reportes ejecutivos, guardaremos esto en un JSON en el sistema de archivos
    // o podemos inyectarlo en la base de datos.
    
    // Por robustez, guardaremos estos valores extraídos temporalmente en variables de memoria del ReportsService, 
    // o mejor, actualizaremos registros reales.
    
    const result = {
      isFinance,
      isEmployees,
      isCredits,
      isServimilDb,
      totalRevenue,
      totalExpenses,
      employeeCount,
      activeCreditsCount,
      totalCreditAmount,
      totalLeads
    };

    // Guardar en un archivo local para que persista
    const metricsPath = path.join(process.cwd(), 'dashboard-metrics.json');
    let currentMetrics: any = {};
    if (fs.existsSync(metricsPath)) {
      currentMetrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
    }
    
    // Merge new metrics
    if (isFinance) {
      currentMetrics['finance'] = { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
    }
    if (isEmployees || isServimilDb) {
      currentMetrics['payroll'] = { totalEmployees: employeeCount };
    }
    if (isCredits || isServimilDb) {
      currentMetrics['portfolio'] = { activeCredits: activeCreditsCount, totalCreditAmount };
    }
    
    if (isServimilDb) {
      currentMetrics['totalLeads'] = totalLeads;
    }

    fs.writeFileSync(metricsPath, JSON.stringify(currentMetrics, null, 2));

    return {
      success: true,
      message: 'Datos importados correctamente.',
      summary: result
    };
  }

  async fetchGoogleSheetCsv(sheetUrl: string) {
    try {
      // Extract the ID from the URL: https://docs.google.com/spreadsheets/d/ID/edit
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) return { success: false, message: 'URL de Google Sheets inválida.' };
      
      const sheetId = match[1];
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(exportUrl);
      if (!response.ok) {
        return { success: false, message: 'No se pudo leer la hoja. Asegúrate de que esté configurada como "Cualquier persona con el enlace puede leer".' };
      }
      
      const csvText = await response.text();
      return this.processImportData(csvText, 'GoogleSheets');
    } catch (error) {
      return { success: false, message: 'Error al conectar con Google Sheets.' };
    }
  }
}
