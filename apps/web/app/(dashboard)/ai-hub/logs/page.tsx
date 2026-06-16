'use client';

import { useAiHubLogs } from '@/hooks/api/use-ai-hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Activity, ShieldCheck, ShieldAlert, Cpu, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function AiHubLogsPage() {
  const { data: logs, isLoading } = useAiHubLogs();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = logs?.filter((log: any) => 
    log.toolCall?.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="text-indigo-500" />
            Registro de Ejecuciones IA
          </h2>
          <p className="text-sm text-slate-500 mt-1">Supervisa todas las acciones y herramientas ejecutadas por el orquestador.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input 
            placeholder="Buscar herramienta o módulo..." 
            className="pl-9 w-full sm:w-64 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
              <Loader2 className="animate-spin w-8 h-8 mb-4" />
              <p>Cargando registros...</p>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">
              <Cpu className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p>No hay registros de ejecución aún.</p>
            </div>
          ) : filteredLogs.length === 0 ? (
             <div className="text-center py-20 text-slate-500">
              <p>No se encontraron resultados para "{searchTerm}".</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                    <th className="px-6 py-4 font-medium">Usuario</th>
                    <th className="px-6 py-4 font-medium">Herramienta / Acción</th>
                    <th className="px-6 py-4 font-medium">Módulo</th>
                    <th className="px-6 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.map((log: any) => {
                    const isSuccess = log.toolCall?.status === 'SUCCESS' || log.status === 'SUCCESS' || !log.toolCall?.status;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: es })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{log.user?.role || 'User'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-2 py-1 rounded-md inline-flex">
                            {log.toolCall?.toolName || log.action || 'unknown_tool'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs">
                            {log.module || 'System'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {isSuccess ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                              <ShieldCheck size={14} /> Exitoso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
                              <ShieldAlert size={14} /> Error
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
