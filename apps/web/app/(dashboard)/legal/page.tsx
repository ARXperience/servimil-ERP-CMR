"use client";

import { useCases, useLegalCalendar } from "@/hooks/api/use-legal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Scale, CalendarDays, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalDashboardPage() {
  const { data: cases, isLoading: casesLoading } = useCases();
  const { data: events, isLoading: eventsLoading } = useLegalCalendar();

  if (casesLoading || eventsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-100px)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const casesList = cases || [];
  const eventsList = events || [];

  const activeCases = casesList.filter((c) => c.status === "OPEN" || c.status === "IN_PROGRESS");
  const upcomingDeadlines = eventsList.filter((e) => e.eventType === "DEADLINE").slice(0, 5);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Legal Agenda</h2>
        <Button asChild>
          <Link href="/legal/cases">View All Cases</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCases.length}</div>
            <p className="text-xs text-muted-foreground">Across all courts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
            <p className="text-xs text-muted-foreground">In the next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hearings This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventsList.filter((e) => e.eventType === "HEARING").length}
            </div>
            <p className="text-xs text-muted-foreground">Scheduled hearings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Filings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {eventsList.filter((e) => e.eventType === "FILING").length}
            </div>
            <p className="text-xs text-muted-foreground">Documents submitted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Latest opened and active legal matters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {activeCases.slice(0, 5).map((legalCase) => (
                <div key={legalCase.id} className="flex items-center">
                  <div className="space-y-1 flex-1">
                    <Link href={`/legal/cases/${legalCase.id}`} className="font-medium hover:underline">
                      {legalCase.title}
                    </Link>
                    <div className="text-sm text-muted-foreground flex gap-2">
                      <span>{legalCase.caseNumber}</span>
                      <span>&bull;</span>
                      <span>{legalCase.courtName}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{legalCase.client?.name || "Unknown Client"}</div>
                    <div className="text-xs text-muted-foreground">
                      Filed: {format(new Date(legalCase.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Critical Deadlines</CardTitle>
            <CardDescription>Upcoming dates requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="flex items-start gap-4">
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400 mt-0.5">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{deadline.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(deadline.scheduledAt), "MMM d, yyyy - h:mm a")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
