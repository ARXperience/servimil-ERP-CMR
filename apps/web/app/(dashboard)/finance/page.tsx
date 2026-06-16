"use client";

import { useFinanceKpis } from "@/hooks/api/use-finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, DollarSign, Wallet, PiggyBank, Receipt } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function FinanceDashboard() {
  const { data, isLoading } = useFinanceKpis();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  const kpis = data?.financeKpis || [
    { title: "Balance Total", value: "$1,245,340.50", icon: Wallet },
    { title: "Flujo de Caja Mensual", value: "+$45,231.89", icon: DollarSign },
    { title: "Cuentas por Cobrar", value: "$34,231.00", icon: PiggyBank },
    { title: "Cuentas por Pagar", value: "$12,450.00", icon: Receipt },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Finanzas y Tesorería</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/finance/transactions/new">
              <ArrowUpRight className="mr-2 h-4 w-4" /> Nueva Transacción
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi: any, i: number) => {
          const Icon = kpi.icon || DollarSign;
          return (
            <Card key={i} className="backdrop-blur-sm bg-background/95 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Accesos Rápidos</CardTitle>
            <CardDescription>Navegar a módulos financieros</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/finance/transactions">Transacciones</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/finance/cash-flow">Flujo de Caja</Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/finance/accounts">Cuentas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
