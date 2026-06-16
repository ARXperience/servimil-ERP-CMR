"use client";

import { useAiUsage } from "@/hooks/api/use-ai";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Loader2, Coins, Zap, Hash, Activity } from "lucide-react";

export default function AiUsagePage() {
  const { data, isLoading, error } = useAiUsage();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando métricas de IA...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-destructive">
        <p>Hubo un error al cargar las métricas de uso.</p>
      </div>
    );
  }

  const { totalTokens, totalRequests, estimatedCost, chartData, typeBreakdown } = data;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Control de Gastos de IA</h1>
        <p className="text-muted-foreground">
          Monitorea el uso de la API de Gemini y los costos estimados de los últimos 30 días.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokens Consumidos</CardTitle>
            <Hash className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Tokens procesados (prompts + respuestas)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Costo Estimado</CardTitle>
            <Coins className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${estimatedCost.toFixed(4)} USD</div>
            <p className="text-xs text-muted-foreground">Basado en tarifa aproximada de Gemini 2.5 Flash</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Peticiones</CardTitle>
            <Zap className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Peticiones exitosas al modelo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Consumo de Tokens (Últimos 30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.split("-").slice(1).join("/")}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value >= 1000 ? (value / 1000) + 'k' : value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tokens" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso por Operación</CardTitle>
            <CardDescription>Desglose de tokens por tipo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {Object.entries(typeBreakdown).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No hay datos suficientes</p>
              ) : (
                Object.entries(typeBreakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([type, tokens]) => (
                  <div key={type} className="flex items-center">
                    <Activity className="h-4 w-4 text-muted-foreground mr-2" />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none capitalize">
                        {type}
                      </p>
                    </div>
                    <div className="font-medium text-sm">
                      {((tokens as number) / 1000).toFixed(1)}k
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
