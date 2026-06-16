"use client";

import { useState } from "react";
import { useTransactions } from "@/hooks/api/use-finance";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TransactionForm } from "./components/transaction-form";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useTransactions({ search });

  const transactions = data?.transactions || [
    { id: "1", date: new Date().toISOString(), description: "Client Payment - Acme Corp", amount: 5000, type: "income", status: "completed" },
    { id: "2", date: new Date().toISOString(), description: "Office Supplies", amount: -250, type: "expense", status: "completed" },
    { id: "3", date: new Date().toISOString(), description: "Software Licenses", amount: -1200, type: "expense", status: "pending" },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">Manage and track all financial transactions.</p>
        </div>
        <TransactionForm />
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Filter transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No transactions found.</TableCell>
              </TableRow>
            ) : (
              transactions.map((tx: any) => (
                <TableRow key={tx.id}>
                  <TableCell>{new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(tx.date))}</TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "income" ? "default" : "destructive"}>
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{tx.status}</Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === "income" ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm">Previous</Button>
        <Button variant="outline" size="sm">Next</Button>
      </div>
    </div>
  );
}
