"use client";

import { useCashFlow } from "@/hooks/api/use-finance";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CashFlowPage() {
  const { data, isLoading } = useCashFlow();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const chartData = data?.cashFlow || [
    { name: "Jan", income: 4500, expense: 2400 },
    { name: "Feb", income: 5200, expense: 1398 },
    { name: "Mar", income: 4800, expense: 9800 },
    { name: "Apr", income: 6100, expense: 3908 },
    { name: "May", income: 5900, expense: 4800 },
    { name: "Jun", income: 6800, expense: 3800 },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cash Flow</h2>
      </div>

      <Card className="col-span-4 backdrop-blur-sm bg-background/95 border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle>Cash Flow Overview</CardTitle>
          <CardDescription>Income vs Expenses over time.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  cursor={{ fill: "hsl(var(--muted))" }}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Legend />
                <Bar dataKey="income" name="Income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Income</TableHead>
                <TableHead className="text-right">Expense</TableHead>
                <TableHead className="text-right">Net Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chartData.map((row: any) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right text-emerald-500">${row.income.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-rose-500">${row.expense.toFixed(2)}</TableCell>
                  <TableCell className={`text-right font-bold ${row.income - row.expense >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                    ${(row.income - row.expense).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
