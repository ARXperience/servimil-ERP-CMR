"use client";

import { useCopilot } from "@/hooks/api/use-whatsapp";
import {
  Bot,
  Sparkles,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Phone,
  MapPin,
  Mail,
  Hash,
  Briefcase,
  DollarSign,
  TrendingUp,
  Loader2,
  File,
  FileImage,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AISidebarProps {
  chatId: string | null;
  onSelectSuggestion: (text: string) => void;
}

const FIELD_ICONS: Record<string, any> = {
  nombre: User,
  cedula: Hash,
  correo: Mail,
  email: Mail,
  telefono: Phone,
  phone: Phone,
  celular: Phone,
  ciudad: MapPin,
  city: MapPin,
  direccion: MapPin,
  ocupacion: Briefcase,
  monto_solicitado: DollarSign,
  monto: DollarSign,
  empresa: Briefcase,
};

const FUNNEL_COLORS: Record<string, string> = {
  NUEVO: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  INTERESADO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400",
  NEGOCIANDO: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400",
  CLIENTE: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  SOPORTE: "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  DESCARTADO: "bg-gray-100 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400",
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  media: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
  baja: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
};

const SENTIMENT_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  positivo: { icon: TrendingUp, color: "text-green-500", label: "Positivo" },
  negativo: { icon: AlertTriangle, color: "text-red-500", label: "Negativo" },
  neutral: { icon: Clock, color: "text-gray-500", label: "Neutral" },
};

export function AISidebar({ chatId, onSelectSuggestion }: AISidebarProps) {
  const { data: copilot, isLoading } = useCopilot(chatId);

  if (!chatId) {
    return (
      <div className="w-80 border-l bg-muted/10 h-full flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center text-muted-foreground">
          <Bot className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm">Selecciona un chat para ver el Copiloto IA</p>
        </div>
      </div>
    );
  }

  const clientDataEntries = copilot?.clientData ? Object.entries(copilot.clientData) : [];
  const hasCopilotData = copilot?.aiSummary || clientDataEntries.length > 0;
  const sentimentInfo = SENTIMENT_CONFIG[copilot?.sentiment || 'neutral'] || SENTIMENT_CONFIG.neutral;
  const SentimentIcon = sentimentInfo.icon;

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <h2 className="font-semibold text-sm">Copiloto IA</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mb-3" />
            <p className="text-xs">Analizando conversación...</p>
          </div>
        ) : !hasCopilotData ? (
          <div className="flex flex-col items-center text-center py-12 text-muted-foreground">
            <Bot className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">Sin análisis aún</p>
            <p className="text-xs mt-1">El copiloto se activará cuando haya suficiente conversación.</p>
          </div>
        ) : (
          <div className="space-y-5">

            {/* Funnel Stage + Priority + Sentiment */}
            <div className="flex flex-wrap gap-2">
              {copilot?.funnelStage && (
                <Badge className={`text-[11px] font-semibold ${FUNNEL_COLORS[copilot.funnelStage] || FUNNEL_COLORS.NUEVO}`}>
                  {copilot.funnelStage}
                </Badge>
              )}
              {copilot?.priority && (
                <Badge className={`text-[11px] ${PRIORITY_COLORS[copilot.priority] || ''}`}>
                  Prioridad: {copilot.priority}
                </Badge>
              )}
              <Badge variant="outline" className={`text-[11px] ${sentimentInfo.color}`}>
                <SentimentIcon className="w-3 h-3 mr-1" />
                {sentimentInfo.label}
              </Badge>
            </div>

            {/* AI Summary */}
            {copilot?.aiSummary && (
              <Card className="border-indigo-200/50 bg-indigo-50/50 dark:bg-indigo-500/5 dark:border-indigo-500/20">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                    <FileText className="h-3.5 w-3.5" /> Resumen IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground leading-relaxed">{copilot.aiSummary}</p>
                </CardContent>
              </Card>
            )}

            {/* Client Data Collected */}
            {clientDataEntries.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <User className="w-3 h-3" /> Datos del Cliente
                </h3>
                <div className="bg-muted/30 rounded-lg border p-3 space-y-2">
                  {clientDataEntries.map(([key, value]) => {
                    const IconComp = FIELD_ICONS[key.toLowerCase()] || Hash;
                    return (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <IconComp className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium capitalize text-foreground">{key.replace(/_/g, ' ')}: </span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Missing Data */}
            {copilot?.missingData && copilot.missingData.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" /> Datos Faltantes
                </h3>
                <div className="space-y-1">
                  {copilot.missingData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 rounded px-2 py-1.5 border border-amber-200/50 dark:border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Actions */}
            {copilot?.suggestedActions && copilot.suggestedActions.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" /> Acciones Sugeridas
                </h3>
                <div className="space-y-1.5">
                  {copilot.suggestedActions.map((action: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => onSelectSuggestion(action)}
                      className="w-full text-left text-xs px-3 py-2 rounded-lg border bg-background hover:bg-accent transition-colors leading-relaxed"
                    >
                      <span className="text-primary font-medium">{i + 1}.</span> {action}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Received Documents */}
            {copilot?.documents && copilot.documents.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-blue-500" /> Documentos Recibidos
                </h3>
                <div className="space-y-2">
                  {copilot.documents.map((doc: any) => {
                    const isImage = doc.mimeType?.includes("image");
                    const summary = doc.metadata?.aiAnalysis?.summary || doc.metadata?.aiSummary;
                    return (
                      <div key={doc.id} className="text-xs border rounded-lg p-2.5 bg-background shadow-sm space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isImage ? (
                              <FileImage className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            ) : (
                              <File className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="font-medium truncate" title={doc.originalName || doc.name}>
                              {doc.originalName || doc.name}
                            </span>
                          </div>
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${doc.url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                            title="Abrir Documento"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        
                        {summary && (
                          <div className="bg-muted/50 p-2 rounded-md border border-border/50 text-[10px] text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground/80 block mb-0.5">Resumen IA:</span>
                            {summary}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Last analyzed timestamp */}
            {copilot?.lastAnalyzedAt && (
              <p className="text-[10px] text-muted-foreground text-center pt-2 border-t">
                Última actualización: {new Date(copilot.lastAnalyzedAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
