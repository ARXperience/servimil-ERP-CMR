"use client";

import { useState } from "react";
import { useLeads, useUpdateLeadStatus, LeadStatus } from "@/hooks/api/use-crm";
import { LeadCard } from "./components/lead-card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LeadForm } from "./components/lead-form";
import { LeadDetailsDialog } from "./components/lead-details-dialog";
import { Lead } from "@/hooks/api/use-crm";

const COLUMNS: { id: LeadStatus; title: string }[] = [
  { id: "NEW", title: "New" },
  { id: "CONTACTED", title: "Contacted" },
  { id: "QUALIFIED", title: "Qualified" },
  { id: "PROPOSAL", title: "Proposal" },
  { id: "WON", title: "Won" },
  { id: "LOST", title: "Lost" },
];

export default function LeadsKanbanPage() {
  const { data: leads, isLoading } = useLeads();
  const { mutate: updateStatus } = useUpdateLeadStatus();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData("leadId");
    if (leadId) {
      updateStatus({ id: leadId, status });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const leadsList = leads || [];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Leads Kanban</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
            <LeadForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const columnLeads = leadsList.filter((l) => l.status === column.id);
          const totalValue = columnLeads.reduce((acc, l) => acc + l.value, 0);

          return (
            <div
              key={column.id}
              className="flex flex-col min-w-[300px] w-[300px] bg-muted/40 rounded-lg p-4"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">{column.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">
                    ${totalValue.toLocaleString()}
                  </span>
                  <span className="bg-secondary text-secondary-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto min-h-[150px]">
                {columnLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} onDragStart={handleDragStart} onClick={setSelectedLead} />
                ))}
                {columnLeads.length === 0 && (
                  <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg p-4 text-center">
                    <span className="text-xs text-muted-foreground">Drop leads here</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <LeadDetailsDialog 
        lead={selectedLead} 
        open={!!selectedLead} 
        onOpenChange={(open) => !open && setSelectedLead(null)} 
      />
    </div>
  );
}
