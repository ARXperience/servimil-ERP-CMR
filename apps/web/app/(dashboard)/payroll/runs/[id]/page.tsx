"use client";

import { usePayrollRun } from "@/hooks/api/use-payroll";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, Download, Play } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PayrollRunDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { data, isLoading } = usePayrollRun(id);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const runDetails = data?.run || {
    id: id,
    period: "May 2026",
    status: "draft",
    totalGross: 450230.00,
    totalTaxes: 85000.00,
    totalDeductions: 12000.00,
    totalNet: 353230.00,
    employeesCount: 2350,
  };

  const lineItems = data?.lineItems || [
    { empId: "e1", name: "Alice Smith", gross: 8500, taxes: 1500, deductions: 200, net: 6800 },
    { empId: "e2", name: "Bob Jones", gross: 6200, taxes: 1100, deductions: 150, net: 4950 },
    { empId: "e3", name: "Charlie Brown", gross: 4000, taxes: 600, deductions: 100, net: 3300 },
    { empId: "e4", name: "Diana Prince", gross: 9500, taxes: 1800, deductions: 250, net: 7450 },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/payroll/runs">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Run Details: {runDetails.id}</h2>
          <div className="flex items-center mt-1 space-x-2">
            <p className="text-muted-foreground">Period: {runDetails.period}</p>
            <Badge variant={runDetails.status === "completed" ? "default" : "secondary"}>
              {runDetails.status}
            </Badge>
          </div>
        </div>
        <div className="ml-auto flex items-center space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          {runDetails.status !== "completed" && (
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Play className="mr-2 h-4 w-4" /> Execute Run
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mt-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Gross</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(runDetails.totalGross)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Taxes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(runDetails.totalTaxes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(runDetails.totalDeductions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Net Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(runDetails.totalNet)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Employee Calculations</CardTitle>
          <CardDescription>Detailed breakdown of {runDetails.employeesCount} employees in this run.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead className="text-right">Gross Pay</TableHead>
                <TableHead className="text-right">Taxes</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Net Pay</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item: any) => (
                <TableRow key={item.empId}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.gross)}</TableCell>
                  <TableCell className="text-right text-rose-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.taxes)}</TableCell>
                  <TableCell className="text-right text-rose-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.deductions)}</TableCell>
                  <TableCell className="text-right text-emerald-500 font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.net)}</TableCell>
                  <TableCell className="text-center">
                    <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-500" />
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
