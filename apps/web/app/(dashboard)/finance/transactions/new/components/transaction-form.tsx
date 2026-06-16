"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateTransaction, useAccounts, useCategories } from "@/hooks/api/use-finance";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
  categoryId: z.string().min(1, "Category is required"),
  accountId: z.string().min(1, "Account is required"),
  description: z.string().min(2, "Description is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "RECONCILED"]).default("COMPLETED"),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

export function TransactionForm() {
  const { mutate: createTransaction, isPending } = useCreateTransaction();
  const { data: accounts, isLoading: isLoadingAccounts } = useAccounts();
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const router = useRouter();

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      type: "INCOME",
      categoryId: "",
      accountId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      status: "COMPLETED",
    },
  });

  const accountsList = accounts || [];
  const categoriesList = categories || [];

  function onSubmit(data: TransactionFormValues) {
    createTransaction(
      { ...data, date: new Date(data.date).toISOString() },
      {
        onSuccess: () => {
          router.push("/finance/transactions");
        },
      }
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="INCOME">Income</SelectItem>
                    <SelectItem value="EXPENSE">Expense</SelectItem>
                    <SelectItem value="TRANSFER">Transfer</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Amount ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingAccounts}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountsList.map((acc: any) => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingCategories}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoriesList.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="date"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
                <Input placeholder="Transaction description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save Transaction
          </Button>
        </div>
      </form>
    </Form>
  );
}
