"use client";

import { useLeads, useActivities } from "@/hooks/api/use-crm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";
import { Loader2, TrendingUp, Users, Target, Activity } from "lucide-react";

export default function CRMDashboardPage() {
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: activities, isLoading: activitiesLoading } = useActivities();

  if (leadsLoading || activitiesLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const leadsList = leads || [];
  
  const funnelData = [
    { name: "Nuevo", value: leadsList.filter((l) => l.status === "NEW").length },
    { name: "Contactado", value: leadsList.filter((l) => l.status === "CONTACTED").length },
    { name: "Calificado", value: leadsList.filter((l) => l.status === "QUALIFIED").length },
    { name: "Propuesta", value: leadsList.filter((l) => l.status === "PROPOSAL").length },
    { name: "Ganado", value: leadsList.filter((l) => l.status === "WON").length },
  ];

  const totalPipelineValue = leadsList
    .filter((l) => l.status !== "WON" && l.status !== "LOST")
    .reduce((acc, l) => acc + l.value, 0);

  const wonValue = leadsList
    .filter((l) => l.status === "WON")
    .reduce((acc, l) => acc + l.value, 0);

  // Mock conversion trend
  const conversionTrend = [
    { month: "Ene", rate: 12 },
    { month: "Feb", rate: 15 },
    { month: "Mar", rate: 14 },
    { month: "Abr", rate: 18 },
    { month: "May", rate: 22 },
    { month: "Jun", rate: 25 },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel de Clientes (CRM)</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospectos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadsList.length}</div>
            <p className="text-xs text-muted-foreground">+12% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor del Embudo</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPipelineValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+8% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Ganados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${wonValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+24% vs mes anterior</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades Abiertas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities?.filter(a => a.status === "PENDING").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">-4 desde ayer</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Embudo de Ventas</CardTitle>
            <CardDescription>Número de prospectos en cada etapa</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Tendencia de Conversión</CardTitle>
            <CardDescription>Tasa de conversión de prospectos a ganados (%)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={conversionTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="rate" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRate)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
