"use client";

import { useReportsDashboard } from "@/hooks/api/use-reports";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Loader2, DollarSign, Users, Briefcase, Activity, Bot, MessageCircle, 
  TrendingUp, UserCheck, Zap
} from "lucide-react";

const FUNNEL_COLORS = ['#3b82f6', '#eab308', '#f97316', '#22c55e', '#a855f7', '#6b7280'];
const SENTIMENT_COLORS = ['#22c55e', '#eab308', '#ef4444'];

import { DataImportDialog } from "./components/data-import-dialog";

export default function ReportsDashboardPage() {
  const { data, isLoading } = useReportsDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const { finance, crm, portfolio, payroll, crmAi } = data || {};

  const riskData = portfolio?.riskDistribution ? [
    { name: 'Bajo', value: portfolio.riskDistribution.low },
    { name: 'Medio', value: portfolio.riskDistribution.medium },
    { name: 'Alto', value: portfolio.riskDistribution.high },
  ] : [];

  const leadsData = crm?.leadsByStatus ? crm.leadsByStatus.map((item: any) => ({
    name: item.status,
    value: item._count,
  })) : [];

  const funnelData = crmAi?.funnelDistribution || [];
  const sentimentData = crmAi?.sentimentData || [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reportes Ejecutivos</h2>
          <p className="text-muted-foreground">Analíticas en tiempo real del CRM, IA y operaciones.</p>
        </div>
        <DataImportDialog />
      </div>

      <Tabs defaultValue="crm-ai" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="crm-ai" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            CRM & Inteligencia Artificial
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            General
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: CRM & AI                              */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="crm-ai" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversaciones Totales</CardTitle>
                <MessageCircle className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmAi?.totalConversations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{crmAi?.conversations?.newThisMonth || 0} este mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clientes en CRM</CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmAi?.clients?.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  +{crmAi?.clients?.newThisMonth || 0} nuevos este mes
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmAi?.leads?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {crmAi?.leads?.won || 0} ganados / {crmAi?.leads?.total || 0} leads
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Automatización IA</CardTitle>
                <Zap className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crmAi?.botEfficiency?.automationRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {crmAi?.botEfficiency?.botMessages || 0} de {crmAi?.botEfficiency?.totalMessages || 0} mensajes
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {/* Funnel Distribution - Donut Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Distribución del Embudo IA
                </CardTitle>
                <CardDescription>Estado actual de las conversaciones clasificadas por IA</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={funnelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={100}
                        fill="#8884d8"
                        paddingAngle={3}
                        dataKey="count"
                        nameKey="label"
                        label={({ label, count }) => count > 0 ? `${label}: ${count}` : ''}
                      >
                        {funnelData.map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [value, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment Analysis - Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Análisis de Sentimiento (IA)
                </CardTitle>
                <CardDescription>Cómo se sienten los clientes según el análisis de la IA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sentimentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {sentimentData.map((_: any, index: number) => (
                          <Cell key={`sent-${index}`} fill={SENTIMENT_COLORS[index % SENTIMENT_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leads by Source */}
          {crmAi?.leads?.bySource?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Prospectos por Fuente de Origen
                </CardTitle>
                <CardDescription>De dónde provienen los prospectos del negocio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={crmAi.leads.bySource}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="source" type="category" width={70} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════ */}
        {/* TAB: GENERAL                               */}
        {/* ═══════════════════════════════════════════ */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${finance?.netProfit?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Rentabilidad general</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Empleados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payroll?.totalEmployees || 0}</div>
                <p className="text-xs text-muted-foreground">Fuerza laboral activa</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Créditos Activos</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{portfolio?.activeCredits || 0}</div>
                <p className="text-xs text-muted-foreground">${portfolio?.totalCreditAmount?.toLocaleString() || 0} total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Prospectos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{crm?.totalLeads || 0}</div>
                <p className="text-xs text-muted-foreground">{crm?.conversionRate || '0%'} tasa de conversión</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Riesgo del Portafolio</CardTitle>
                <CardDescription>Niveles de riesgo de los créditos activos</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[300px] w-full max-w-md">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label
                      >
                        {riskData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#22c55e', '#eab308', '#ef4444'][index % 3]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prospectos por Estado</CardTitle>
                <CardDescription>Pipeline actual del CRM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
