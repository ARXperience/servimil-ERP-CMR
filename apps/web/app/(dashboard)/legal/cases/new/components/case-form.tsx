"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCase } from "@/hooks/api/use-legal";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const caseSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  clientId: z.string().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "CLOSED", "ON_HOLD"]).default("OPEN"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  courtName: z.string().optional(),
  caseNumber: z.string().optional(),
});

type CaseFormValues = z.infer<typeof caseSchema>;

export function CaseForm() {
  const { mutate: createCase, isPending } = useCreateCase();
  const router = useRouter();

  const form = useForm<CaseFormValues>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      description: "",
      clientId: "",
      status: "OPEN",
      priority: "MEDIUM",
      courtName: "",
      caseNumber: "",
    },
  });

  function onSubmit(data: CaseFormValues) {
    const payload: any = { ...data };
    if (!payload.clientId) delete payload.clientId;
    if (!payload.courtName) delete payload.courtName;
    if (!payload.caseNumber) delete payload.caseNumber;
    if (!payload.description) delete payload.description;
    
    createCase(payload, {
      onSuccess: () => {
        router.push("/legal");
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Case Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Contract Dispute - Acme Corp" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Case description..." rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="courtName"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Court Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Juzgado 5to Civil" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="caseNumber"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Case Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 2026-00123" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Case
          </Button>
        </div>
      </form>
    </Form>
  );
}
