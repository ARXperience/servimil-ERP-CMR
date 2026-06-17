"use client";

import { useCases } from "@/hooks/api/use-legal";
import { format } from "date-fns";
import { Loader2, Plus, Search, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useState } from "react";

export default function LegalCasesPage() {
  const { data: cases, isLoading } = useCases();
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const casesList = cases || [];
  const filteredCases = casesList.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.caseNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.client?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Open</Badge>;
      case "IN_PROGRESS": return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>;
      case "CLOSED": return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Closed</Badge>;
      case "ON_HOLD": return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">On Hold</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Legal Cases</h1>
          <p className="text-muted-foreground mt-1">Manage all active and historical legal matters.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="flex items-center space-x-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Case Name & Number</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Court</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Filed Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCases.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                      <Scale className="h-4 w-4" />
                    </div>
                    <div>
                      <Link href={`/legal/cases/${c.id}`} className="font-medium hover:underline text-primary">
                        {c.title}
                      </Link>
                      <div className="text-xs text-muted-foreground font-mono mt-0.5">{c.caseNumber}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{c.client?.name || "Unknown Client"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.courtName}</TableCell>
                <TableCell>{getStatusBadge(c.status)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {format(new Date(c.createdAt), "MMM d, yyyy")}
                </TableCell>
              </TableRow>
            ))}
            {filteredCases.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No cases found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
