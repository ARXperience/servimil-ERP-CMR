"use client";

import { useActivities } from "@/hooks/api/use-crm";
import { format } from "date-fns";
import { Loader2, Calendar, Phone, Mail, CheckSquare, Clock, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ActivitiesPage() {
  const { data: activities, isLoading } = useActivities();

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const activitiesList = activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "CALL": return <Phone className="w-4 h-4" />;
      case "MEETING": return <Calendar className="w-4 h-4" />;
      case "EMAIL": return <Mail className="w-4 h-4" />;
      case "TASK": return <CheckSquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    return status === "COMPLETED" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks, meetings, and calls.</p>
        </div>
        <Button>New Activity</Button>
      </div>

      <div className="grid gap-4">
        {activitiesList.map((activity) => (
          <Card key={activity.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${activity.status === 'COMPLETED' ? 'bg-muted' : 'bg-primary/10 text-primary'}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div>
                  <CardTitle className="text-base font-medium">{activity.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    {format(new Date(activity.dueDate), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(activity.status)}>
                {activity.status}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm mt-2 ml-12 text-muted-foreground">{activity.description}</p>
            </CardContent>
          </Card>
        ))}
        {activitiesList.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No activities found.
          </div>
        )}
      </div>
    </div>
  );
}
