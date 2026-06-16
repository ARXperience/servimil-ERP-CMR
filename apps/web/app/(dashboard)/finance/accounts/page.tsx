"use client";

import { useAccounts } from "@/hooks/api/use-finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Landmark, Building, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AccountsPage() {
  const { data, isLoading } = useAccounts();

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const accounts = data?.accounts || [
    { id: "1", name: "Main Operating Account", type: "checking", bank: "Chase", balance: 1450000.50, currency: "USD", status: "active" },
    { id: "2", name: "Payroll Account", type: "checking", bank: "Bank of America", balance: 250000.00, currency: "USD", status: "active" },
    { id: "3", name: "Corporate Credit Card", type: "credit", bank: "Amex", balance: -12450.00, currency: "USD", status: "active" },
    { id: "4", name: "Savings Reserve", type: "savings", bank: "Wells Fargo", balance: 500000.00, currency: "USD", status: "active" },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {accounts.map((acc: any) => {
          let Icon = Landmark;
          if (acc.type === "credit") Icon = CreditCard;
          if (acc.type === "savings") Icon = Building;

          return (
            <Card key={acc.id} className="backdrop-blur-sm bg-background/95 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{acc.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${acc.balance < 0 ? 'text-rose-500' : ''}`}>
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: acc.currency }).format(acc.balance)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{acc.bank} - {acc.type.toUpperCase()}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
          <CardDescription>All linked financial accounts and current balances.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Institution</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc: any) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell>{acc.bank}</TableCell>
                  <TableCell className="capitalize">{acc.type}</TableCell>
                  <TableCell>
                    <Badge variant={acc.status === "active" ? "default" : "secondary"}>
                      {acc.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${acc.balance < 0 ? 'text-rose-500' : ''}`}>
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: acc.currency }).format(acc.balance)}
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
