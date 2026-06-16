"use client";

import { useState } from "react";
import { useEmployees } from "@/hooks/api/use-payroll";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "./components/employee-form";
import { Badge } from "@/components/ui/badge";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading } = useEmployees({ search });

  const employees = data?.employees || [
    { id: "1", name: "Alice Smith", email: "alice@company.com", role: "Senior Developer", department: "Engineering", status: "active", type: "full-time" },
    { id: "2", name: "Bob Jones", email: "bob@company.com", role: "Sales Executive", department: "Sales", status: "active", type: "full-time" },
    { id: "3", name: "Charlie Brown", email: "charlie@company.com", role: "Marketing Intern", department: "Marketing", status: "on-leave", type: "part-time" },
    { id: "4", name: "Diana Prince", email: "diana@company.com", role: "Product Manager", department: "Engineering", status: "active", type: "full-time" },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employee Directory</h2>
          <p className="text-muted-foreground">Manage your organization's personnel.</p>
        </div>
        <EmployeeForm />
      </div>

      <div className="flex items-center py-4">
        <Input
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">No employees found.</TableCell>
              </TableRow>
            ) : (
              employees.map((emp: any) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{emp.name}</span>
                      <span className="text-xs text-muted-foreground">{emp.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{emp.role}</TableCell>
                  <TableCell>{emp.department}</TableCell>
                  <TableCell className="capitalize">{emp.type}</TableCell>
                  <TableCell>
                    <Badge variant={emp.status === "active" ? "default" : "secondary"}>
                      {emp.status}
                    </Badge>
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
