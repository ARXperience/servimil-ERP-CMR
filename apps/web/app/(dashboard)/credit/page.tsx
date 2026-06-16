"use client";

import { useCreditKpis } from "@/hooks/api/use-credit";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, TrendingUp, AlertTriangle, Briefcase } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreditDashboard() {
  const { data, isLoading } = useCreditKpis();

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

  const kpis = data?.kpis || [
    { title: "Total Portfolio", value: "$12,450,000", icon: Briefcase },
    { title: "Active Loans", value: "854", icon: ShieldCheck },
    { title: "Avg. Interest Rate", value: "14.2%", icon: TrendingUp },
    { title: "At Risk (Overdue)", value: "$340,000", icon: AlertTriangle, isWarning: true },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Credit & Portfolio</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi: any, i: number) => {
          const Icon = kpi.icon || Briefcase;
          return (
            <Card key={i} className={`backdrop-blur-sm bg-background/95 border-border/50 ${kpi.isWarning ? 'border-rose-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={`text-sm font-medium ${kpi.isWarning ? 'text-rose-500' : 'text-muted-foreground'}`}>{kpi.title}</CardTitle>
                <Icon className={`h-4 w-4 ${kpi.isWarning ? 'text-rose-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credit Requests</CardTitle>
            <CardDescription>Review and approve incoming loan applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/credit/requests">View Requests Kanban</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Portfolio</CardTitle>
            <CardDescription>Manage active loans and track repayments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/credit/portfolio">View Portfolio</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
