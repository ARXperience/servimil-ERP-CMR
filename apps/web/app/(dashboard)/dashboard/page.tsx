"use client";

import { KpiCards } from "./components/kpi-cards";
import { RevenueChart } from "./components/revenue-chart";
import { RecentActivity } from "./components/recent-activity";
import { ImportantEmailsWidget } from "./components/important-emails-widget";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Panel Principal</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Descargar Reporte
          </Button>
        </div>
      </div>
      <KpiCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RevenueChart />
        <ImportantEmailsWidget />
        <RecentActivity />
      </div>
    </div>
  );
}
