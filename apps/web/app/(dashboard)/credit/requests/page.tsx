"use client";

import { useCreditRequests } from "@/hooks/api/use-credit";
import { CreditRequestForm } from "./components/credit-request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CreditRequestsPage() {
  const { data, isLoading } = useCreditRequests();

  const requests = data?.requests || [
    { id: "req_001", applicant: "Acme Corp", amount: 50000, score: 720, status: "pending" },
    { id: "req_002", applicant: "Jane Smith", amount: 15000, score: 680, status: "under-review" },
    { id: "req_003", applicant: "TechStart Inc", amount: 120000, score: 790, status: "approved" },
    { id: "req_004", applicant: "Bob Johnson", amount: 5000, score: 540, status: "rejected" },
    { id: "req_005", applicant: "Global Logistics", amount: 250000, score: 750, status: "pending" },
  ];

  const columns = [
    { title: "Pending", status: "pending" },
    { title: "Under Review", status: "under-review" },
    { title: "Approved", status: "approved" },
    { title: "Rejected", status: "rejected" },
  ];

  return (
    <div className="flex-1 space-y-4 p-8 pt-6 h-full flex flex-col">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Credit Requests</h2>
          <p className="text-muted-foreground">Kanban board for loan applications.</p>
        </div>
        <CreditRequestForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 flex-1 items-start">
        {columns.map((col) => (
          <div key={col.status} className="flex flex-col gap-4 bg-muted/30 p-4 rounded-xl min-h-[500px]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider">{col.title}</h3>
              <Badge variant="secondary">
                {requests.filter((r: any) => r.status === col.status).length}
              </Badge>
            </div>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              requests
                .filter((r: any) => r.status === col.status)
                .map((req: any) => (
                  <Card key={req.id} className="cursor-pointer hover:border-primary/50 transition-colors shadow-sm">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">{req.applicant}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex justify-between items-center mt-2">
                        <span className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(req.amount)}</span>
                        <Badge variant={req.score >= 700 ? "default" : req.score >= 600 ? "secondary" : "destructive"}>
                          Score: {req.score}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
