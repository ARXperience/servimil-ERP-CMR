"use client";

import { TransactionForm } from "./components/transaction-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTransactionPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/finance/transactions" className="text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Nueva Transacción</h2>
          <p className="text-muted-foreground">Agregar un nuevo ingreso o gasto.</p>
        </div>
      </div>
      
      <div className="bg-card text-card-foreground border rounded-lg p-6 shadow-sm">
        <TransactionForm />
      </div>
    </div>
  );
}
