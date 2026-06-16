"use client";

import { useState } from "react";
import { useLegalCalendar } from "@/hooks/api/use-legal";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Loader2, Calendar as CalendarIcon, Gavel, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LegalCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { data: events, isLoading } = useLegalCalendar();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const eventsList = events || [];

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  const getEventIcon = (type: string) => {
    switch (type) {
      case "HEARING": return <Gavel className="w-3 h-3" />;
      case "DEADLINE": return <AlertCircle className="w-3 h-3" />;
      case "FILING": return <FileText className="w-3 h-3" />;
      default: return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case "HEARING": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
      case "DEADLINE": return "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300";
      case "FILING": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      const dayEvents = eventsList.filter(e => isSameDay(new Date(e.scheduledAt), cloneDay));

      days.push(
        <div
          key={day.toString()}
          className={`min-h-[120px] p-2 border-r border-b relative ${
            !isSameMonth(day, monthStart)
              ? "bg-muted/30 text-muted-foreground"
              : isSameDay(day, new Date())
              ? "bg-primary/5"
              : "bg-background"
          }`}
        >
          <div className="flex justify-end mb-1">
            <span className={`text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>
              {formattedDate}
            </span>
          </div>
          <div className="space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
            {dayEvents.map((event) => (
              <div 
                key={event.id} 
                className={`text-xs p-1 px-1.5 rounded-md border truncate flex items-center gap-1 cursor-pointer hover:opacity-80 ${getEventColor(event.eventType)}`}
                title={event.title}
              >
                {getEventIcon(event.eventType)}
                <span className="truncate">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="p-6 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Legal Calendar</h1>
          <p className="text-muted-foreground mt-1">Track hearings, deadlines, and meetings.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-none dark:bg-blue-900/30 dark:text-blue-300">Hearing</Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-none dark:bg-orange-900/30 dark:text-orange-300">Deadline</Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-none dark:bg-green-900/30 dark:text-green-300">Filing</Badge>
          </div>
          <div className="flex items-center bg-muted rounded-md p-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold px-4 min-w-[140px] text-center">
              {format(currentDate, "MMMM yyyy")}
            </div>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={today}>Today</Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <CardContent className="flex-1 p-0 overflow-y-auto border-l">
          {rows}
        </CardContent>
      </Card>
    </div>
  );
}
