"use client";

import { useCase, useCaseEvents } from "@/hooks/api/use-legal";
import { Loader2, ArrowLeft, Scale, Calendar, FileText, Gavel, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CaseDetailPage({ params }: { params: { id: string } }) {
  const { data: legalCase, isLoading: caseLoading } = useCase(params.id);
  const { data: events, isLoading: eventsLoading } = useCaseEvents(params.id);

  if (caseLoading || eventsLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!legalCase) return <div>Case not found</div>;

  const eventsList = events || [];
  // Sort events newest first
  const sortedEvents = [...eventsList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getEventIcon = (type: string) => {
    switch (type) {
      case "HEARING": return <Gavel className="w-4 h-4" />;
      case "DEADLINE": return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case "FILING": return <FileText className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/legal/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{legalCase.title}</h1>
          <div className="flex items-center text-muted-foreground text-sm mt-1 gap-2">
            <Scale className="h-3.5 w-3.5" />
            <span>Case #{legalCase.caseNumber}</span>
            <span>&bull;</span>
            <span>{legalCase.court}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Case Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Status</p>
                <Badge>{legalCase.status}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Client</p>
                <p className="font-medium">{legalCase.clientName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Filed Date</p>
                <p>{format(new Date(legalCase.filedDate), "PPP")}</p>
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full">Add New Event</Button>
          <Button variant="outline" className="w-full">Upload Document</Button>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Case Timeline</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[500px] p-6">
                <div className="relative border-l-2 border-muted ml-3 space-y-8">
                  {sortedEvents.map((event, index) => (
                    <div key={event.id} className="relative pl-6">
                      <div className="absolute -left-3 top-1 bg-background border-2 border-muted rounded-full p-1 shadow-sm">
                        {getEventIcon(event.type)}
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{event.title}</h4>
                          <Badge variant="outline" className="text-[10px] uppercase h-5">{event.type}</Badge>
                        </div>
                        <time className="text-sm text-primary font-medium">
                          {format(new Date(event.date), "PPP 'at' p")}
                        </time>
                        <p className="text-sm text-muted-foreground mt-2 bg-muted/30 p-3 rounded-md border">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {sortedEvents.length === 0 && (
                    <p className="text-muted-foreground pl-6">No events recorded for this case.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
