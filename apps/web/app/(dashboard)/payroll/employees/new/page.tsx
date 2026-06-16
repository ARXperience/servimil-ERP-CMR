"use client";

import { EmployeeForm } from "./components/employee-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEmployeePage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center space-x-4">
        <Link href="/payroll" className="text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">New Employee</h2>
          <p className="text-muted-foreground">Register a new employee for the payroll system.</p>
        </div>
      </div>
      
      <div className="bg-card text-card-foreground border rounded-lg p-6 shadow-sm">
        <EmployeeForm />
      </div>
    </div>
  );
}
