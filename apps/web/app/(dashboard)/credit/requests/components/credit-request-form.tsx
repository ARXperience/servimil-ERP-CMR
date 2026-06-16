"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCreditRequest } from "@/hooks/api/use-credit";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { FilePlus } from "lucide-react";

const requestSchema = z.object({
  applicantName: z.string().min(2),
  amount: z.coerce.number().positive(),
  termMonths: z.coerce.number().positive().int(),
  purpose: z.string().min(5),
  riskScore: z.coerce.number().min(300).max(850),
});

export function CreditRequestForm() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateCreditRequest();

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      applicantName: "",
      amount: 10000,
      termMonths: 12,
      purpose: "",
      riskScore: 700,
    },
  });

  function onSubmit(values: z.infer<typeof requestSchema>) {
    mutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <FilePlus className="mr-2 h-4 w-4" />
          New Application
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Credit Request</DialogTitle>
          <DialogDescription>
            Submit a new loan application for underwriting review.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="applicantName"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Applicant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Loan Amount</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="termMonths"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Term (Months)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="riskScore"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Credit Risk Score</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select purpose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="business">Business Expansion</SelectItem>
                      <SelectItem value="equipment">Equipment Finance</SelectItem>
                      <SelectItem value="personal">Personal Loan</SelectItem>
                      <SelectItem value="mortgage">Mortgage</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
