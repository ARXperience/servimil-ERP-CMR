"use client";

import { useEmails } from "@/hooks/api/use-emails";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertCircle, Mail, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ImportantEmailsWidget() {
  // Solo traemos correos marcados como importantes
  const { data: emails, isLoading } = useEmails({ importantOnly: true, limit: 5 });

  return (
    <Card className="col-span-full md:col-span-3">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center text-red-600">
            <AlertCircle className="mr-2 h-5 w-5" />
            Correos Importantes
          </CardTitle>
          <CardDescription>
            Atención requerida identificada por IA
          </CardDescription>
        </div>
        <Mail className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !emails || emails.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No hay correos importantes pendientes.
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {emails.map((email: any) => (
              <div key={email.id} className="flex flex-col space-y-1 border-l-2 border-red-500 pl-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none truncate max-w-[200px]">
                    {email.subject}
                  </p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(email.date), "dd MMM", { locale: es })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  De: {email.sender}
                </p>
                {email.aiSummary && (
                  <p className="text-xs mt-1 text-primary/80 line-clamp-2">
                    {email.aiSummary}
                  </p>
                )}
              </div>
            ))}
            <div className="pt-2 border-t">
              <Button asChild variant="ghost" className="w-full text-xs h-8 justify-center">
                <Link href="/emails">
                  Ver todos los correos <ArrowRight className="ml-2 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
