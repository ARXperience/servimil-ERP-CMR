"use client";

import { useEmails } from "@/hooks/api/use-emails";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Paperclip, AlertCircle, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export default function EmailsPage() {
  const { data: emails, isLoading } = useEmails();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-2 mb-6">
        <Mail className="h-6 w-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Correos Integrados</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bandeja de Entrada Procesada por IA</CardTitle>
          <CardDescription>
            Correos recibidos a través de la integración de Google Gmail. La inteligencia artificial resume el contenido y resalta mensajes prioritarios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : emails?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se han sincronizado correos recientemente.
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {emails?.map((email: any) => (
                  <Card key={email.id} className={`overflow-hidden ${email.isImportant ? 'border-l-4 border-l-red-500' : ''}`}>
                    <div className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 gap-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{email.subject}</h3>
                          {email.isImportant && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Urgente
                            </Badge>
                          )}
                          {!email.isRead && (
                            <Badge variant="secondary">Nuevo</Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.date), "dd MMM yyyy, p", { locale: es })}
                        </span>
                      </div>
                      
                      <div className="mb-2 text-sm">
                        <span className="font-medium">De:</span> {email.sender}
                      </div>

                      {email.aiSummary && (
                        <div className="bg-muted/50 p-3 rounded-md mb-3 border border-border/50">
                          <div className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Resumen IA</div>
                          <p className="text-sm">{email.aiSummary}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex gap-2">
                          {email.aiActions?.map((action: any, idx: number) => (
                            <Button key={idx} variant="outline" size="sm">
                              {action.label}
                            </Button>
                          ))}
                        </div>
                        
                        {email.hasAttachments && (
                          <div className="flex items-center text-sm text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full">
                            <Paperclip className="w-4 h-4 mr-2" />
                            Archivos Adjuntos (En Módulo Documentos)
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
