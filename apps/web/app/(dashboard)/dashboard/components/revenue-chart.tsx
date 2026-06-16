"use client";

import { useRevenueData } from "@/hooks/api/use-finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function RevenueChart() {
  const { data, isLoading } = useRevenueData();

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const chartData = data?.revenue || [
    { name: "Ene", total: 4500 },
    { name: "Feb", total: 5200 },
    { name: "Mar", total: 4800 },
    { name: "Abr", total: 6100 },
    { name: "May", total: 5900 },
    { name: "Jun", total: 6800 },
    { name: "Jul", total: 7200 },
    { name: "Ago", total: 7800 },
    { name: "Sep", total: 8100 },
    { name: "Oct", total: 8500 },
    { name: "Nov", total: 9100 },
    { name: "Dic", total: 10200 },
  ];

  return (
    <Card className="col-span-4 backdrop-blur-sm bg-background/95 border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Resumen de Ingresos</CardTitle>
        <CardDescription>Rendimiento de ingresos mensuales para el año fiscal actual.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorTotal)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
