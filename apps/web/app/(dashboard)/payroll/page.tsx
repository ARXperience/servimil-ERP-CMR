"use client";

import { usePayrollKpis } from "@/hooks/api/use-payroll";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, CalendarClock, DollarSign } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function PayrollDashboard() {
  const { data, isLoading } = usePayrollKpis();

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
    { title: "Total Employees", value: "2,350", icon: Users },
    { title: "Next Payroll Run", value: "May 30, 2026", icon: CalendarClock },
    { title: "Est. Payroll Cost", value: "$450,230.00", icon: DollarSign },
    { title: "Active Contracts", value: "2,315", icon: FileText },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Payroll & Compliance</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi: any, i: number) => {
          const Icon = kpi.icon || Users;
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Directory</CardTitle>
            <CardDescription>Manage your employee database.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/payroll/employees">View Employees</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Payroll Runs</CardTitle>
            <CardDescription>Manage past and upcoming payroll runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/payroll/runs">View Payroll Runs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
