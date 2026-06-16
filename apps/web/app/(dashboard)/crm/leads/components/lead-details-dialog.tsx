import React, { useState } from "react";
import { Lead } from "@/hooks/api/use-crm";
import { useDocumentsByClient } from "@/hooks/api/use-documents";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Mail, Phone, DollarSign, FileText, FileImage, File, ExternalLink, User, Calendar, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface LeadDetailsDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange }: LeadDetailsDialogProps) {
  // Use lead.clientId or lead.id depending on how it's mapped in the backend. 
  // Assuming the Lead model has an implicit relation or we use its email/id.
  // Actually, we need to fetch documents by clientId. Does Lead have a clientId? 
  // According to schema, Lead has an optional clientId. Let's use lead?.id or lead?.clientId.
  const clientId = (lead as any)?.clientId || lead?.id || null;
  const { data: documents, isLoading: isLoadingDocs } = useDocumentsByClient(open ? clientId : null);

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                {lead.name}
                <Badge variant="outline" className="text-xs bg-muted/50">{lead.status}</Badge>
              </DialogTitle>
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                <Building2 className="w-4 h-4" /> {lead.company}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold flex items-center justify-end text-green-600 dark:text-green-500">
                <DollarSign className="w-5 h-5 mr-1" />
                {lead.value?.toLocaleString()}
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="w-full justify-start h-12 bg-transparent">
              <TabsTrigger value="info" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary">
                Información
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary">
                Documentos
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 overflow-y-auto bg-muted/10 p-6">
            <TabsContent value="info" className="m-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3" /> Nombre Completo
                  </div>
                  <div className="font-medium">{lead.name}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3" /> Empresa
                  </div>
                  <div className="font-medium">{lead.company}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Correo
                  </div>
                  <div className="font-medium">{lead.email || "No especificado"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Teléfono
                  </div>
                  <div className="font-medium">{lead.phone || "No especificado"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Fecha Creación
                  </div>
                  <div className="font-medium">{lead.createdAt ? format(new Date(lead.createdAt), "dd MMM yyyy, HH:mm") : "N/A"}</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="documents" className="m-0 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Archivos y Documentos del Cliente
                </h3>
              </div>

              {isLoadingDocs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documents.map((doc: any) => {
                    const isImage = doc.mimeType?.includes("image");
                    const isPdf = doc.mimeType?.includes("pdf");
                    const summary = doc.metadata?.aiAnalysis?.summary || doc.metadata?.aiSummary;

                    return (
                      <div key={doc.id} className="border rounded-lg p-3 bg-background shadow-sm hover:border-primary/50 transition-colors group">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="p-2 rounded-md bg-muted/50 text-muted-foreground group-hover:text-primary transition-colors">
                              {isImage ? <FileImage className="w-5 h-5" /> : isPdf ? <FileText className="w-5 h-5" /> : <File className="w-5 h-5" />}
                            </div>
                            <div>
                              <div className="font-medium text-sm truncate" title={doc.originalName || doc.name}>
                                {doc.originalName || doc.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {doc.createdAt ? format(new Date(doc.createdAt), "dd MMM, HH:mm") : "N/A"}
                              </div>
                            </div>
                          </div>
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${doc.url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 text-muted-foreground hover:bg-muted rounded-md transition-colors flex-shrink-0"
                            title="Abrir Archivo"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                        {summary && (
                          <div className="mt-3 p-2 bg-muted/40 rounded border text-xs text-muted-foreground line-clamp-3" title={summary}>
                            <span className="font-semibold block mb-1">Resumen IA:</span>
                            {summary}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                  <File className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No hay documentos asociados a este lead.</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Simple ScrollArea wrapper if not imported
function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`overflow-auto ${className || ''}`}>{children}</div>;
}
