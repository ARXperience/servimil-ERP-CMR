"use client";

import { useRecentTransactions } from "@/hooks/api/use-finance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RecentActivity() {
  const { data, isLoading } = useRecentTransactions();

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  const activities = data?.activities || [
    {
      id: "1",
      name: "Olivia Martin",
      email: "olivia.martin@email.com",
      amount: "+$1,999.00",
      status: "completed",
    },
    {
      id: "2",
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      amount: "+$39.00",
      status: "completed",
    },
    {
      id: "3",
      name: "Isabella Nguyen",
      email: "isabella.nguyen@email.com",
      amount: "+$299.00",
      status: "pending",
    },
    {
      id: "4",
      name: "William Kim",
      email: "will@email.com",
      amount: "+$99.00",
      status: "completed",
    },
    {
      id: "5",
      name: "Sofia Davis",
      email: "sofia.davis@email.com",
      amount: "+$39.00",
      status: "completed",
    },
  ];

  return (
    <Card className="col-span-3 backdrop-blur-sm bg-background/95 border-border/50 shadow-sm">
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <CardDescription>Tienes 265 transacciones este mes.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {activities.map((activity: any) => (
            <div key={activity.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={`https://avatar.vercel.sh/${activity.name}.png`} alt="Avatar" />
                <AvatarFallback>
                  {activity.name.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.name}</p>
                <p className="text-sm text-muted-foreground">{activity.email}</p>
              </div>
              <div className="ml-auto font-medium">{activity.amount}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
