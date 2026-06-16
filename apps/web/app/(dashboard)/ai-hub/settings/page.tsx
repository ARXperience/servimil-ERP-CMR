'use client';

import { useAiHubSettings, useAiHubTools } from '@/hooks/api/use-ai-hub';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Settings, Wrench, Shield, Cpu, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AiHubSettingsPage() {
  const { data: settings, isLoading: isLoadingSettings } = useAiHubSettings();
  const { data: tools, isLoading: isLoadingTools } = useAiHubTools();

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="text-indigo-500" />
          Configuración del AI Hub
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Gestiona las preferencias, parámetros y herramientas disponibles para el agente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parámetros del Sistema */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Cpu className="text-indigo-500 w-5 h-5" />
              Parámetros del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingSettings ? (
              <div className="flex justify-center py-8 text-indigo-500"><Loader2 className="animate-spin" /></div>
            ) : !settings || settings.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No se encontraron configuraciones AI_.</div>
            ) : (
              <div className="space-y-4">
                {settings.map((setting: any) => (
                  <div key={setting.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="font-medium text-sm text-slate-700 dark:text-slate-300 font-mono">{setting.key}</div>
                      {setting.description && <div className="text-xs text-slate-500 mt-0.5">{setting.description}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium px-3 py-1 bg-white dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 max-w-[200px] truncate" title={setting.value}>
                        {setting.key.includes('KEY') || setting.key.includes('SECRET') ? '••••••••••••••••' : setting.value}
                      </div>
                      {(setting.key.includes('KEY') || setting.key.includes('SECRET')) && <Lock className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Herramientas Disponibles */}
        <Card className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="text-indigo-500 w-5 h-5" />
              Tus Herramientas Habilitadas
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingTools ? (
              <div className="flex justify-center py-8 text-indigo-500"><Loader2 className="animate-spin" /></div>
            ) : !tools || tools.length === 0 ? (
              <div className="text-center py-8 text-slate-500 flex flex-col items-center">
                <Shield className="w-10 h-10 text-slate-300 mb-2" />
                No tienes herramientas especiales habilitadas.
              </div>
            ) : (
              <div className="grid gap-3">
                {tools.map((tool: any) => (
                  <div key={tool.id} className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-500/5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={16} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{tool.toolName}</div>
                      {tool.description && <div className="text-xs text-slate-500 mt-0.5">{tool.description}</div>}
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] h-4 font-normal px-1.5">{tool.module}</Badge>
                        {tool.requiresConfirmation && <span className="text-orange-500 font-medium">Requiere confirmación</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
