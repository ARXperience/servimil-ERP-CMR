"use client";

import { usePayrollRuns } from "@/hooks/api/use-payroll";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, PlayCircle } from "lucide-react";

export default function PayrollRunsPage() {
  const { data, isLoading } = usePayrollRuns();

  const runs = data?.runs || [
    { id: "pr_001", period: "May 2026", date: "2026-05-30T00:00:00Z", status: "draft", totalEmployees: 2350, totalAmount: 450230.00 },
    { id: "pr_002", period: "April 2026", date: "2026-04-30T00:00:00Z", status: "completed", totalEmployees: 2345, totalAmount: 448100.00 },
    { id: "pr_003", period: "March 2026", date: "2026-03-31T00:00:00Z", status: "completed", totalEmployees: 2330, totalAmount: 445000.00 },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Runs</h2>
          <p className="text-muted-foreground">Manage and execute payroll cycles.</p>
        </div>
        <Button>
          <PlayCircle className="mr-2 h-4 w-4" />
          Start New Run
        </Button>
      </div>

      <div className="rounded-md border bg-card mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : runs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">No payroll runs found.</TableCell>
              </TableRow>
            ) : (
              runs.map((run: any) => (
                <TableRow key={run.id}>
                  <TableCell className="font-medium">{run.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      {run.period}
                    </div>
                  </TableCell>
                  <TableCell>{new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(run.date))}</TableCell>
                  <TableCell>{run.totalEmployees}</TableCell>
                  <TableCell>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(run.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={run.status === "completed" ? "default" : "secondary"}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/payroll/runs/${run.id}`}>View Details</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
