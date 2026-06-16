import { Lead, LeadStatus } from "@/hooks/api/use-crm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, DollarSign } from "lucide-react";

interface LeadCardProps {
  lead: Lead;
  onDragStart: (e: React.DragEvent, leadId: string) => void;
  onClick?: (lead: Lead) => void;
}

export function LeadCard({ lead, onDragStart, onClick }: LeadCardProps) {
  return (
    <Card 
      draggable 
      onDragStart={(e) => onDragStart(e, lead.id)}
      onClick={() => onClick && onClick(lead)}
      className="cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors bg-card/50 backdrop-blur-sm"
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="font-semibold text-sm line-clamp-1">{lead.name}</div>
        </div>
        <div className="flex items-center text-xs text-muted-foreground mt-1">
          <Building2 className="w-3 h-3 mr-1" />
          <span className="line-clamp-1">{lead.company}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <Mail className="w-3 h-3 mr-1" />
          <span className="line-clamp-1">{lead.email}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          <Phone className="w-3 h-3 mr-1" />
          <span>{lead.phone}</span>
        </div>
        <div className="pt-2 flex justify-between items-center border-t mt-2">
          <Badge variant="secondary" className="font-mono text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            {lead.value.toLocaleString()}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(lead.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
