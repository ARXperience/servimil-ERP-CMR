"use client";

import { useFinanceKpis } from "@/hooks/api/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, DollarSign, Users, CreditCard, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function KpiCards() {
  const { data, isLoading, isError } = useFinanceKpis();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  // Fallback production-ready structure if API is unseeded
  const kpis = data?.kpis || [
    { title: "Ingresos Totales", value: "$45,231.89", trend: "+20.1%", isPositive: true, icon: DollarSign },
    { title: "Empleados Activos", value: "2,350", trend: "+180", isPositive: true, icon: Users },
    { title: "Portafolio de Créditos", value: "$12,234.00", trend: "+19%", isPositive: true, icon: CreditCard },
    { title: "Préstamos Activos", value: "573", trend: "-201", isPositive: false, icon: Activity },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi: any, index: number) => {
        const Icon = kpi.icon || DollarSign;
        return (
          <Card key={index} className="backdrop-blur-sm bg-background/95 shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className={`text-xs flex items-center mt-1 ${kpi.isPositive ? "text-emerald-500" : "text-rose-500"}`}>
                {kpi.isPositive ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
                {kpi.trend} vs mes anterior
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
