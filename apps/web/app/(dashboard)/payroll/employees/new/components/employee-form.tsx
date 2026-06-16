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
import { useCreateEmployee, useDepartments, usePositions } from "@/hooks/api/use-payroll";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const employeeSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  documentId: z.string().min(5, "Document ID is required"),
  email: z.string().email("Invalid email address"),
  baseSalary: z.coerce.number().positive("Base salary must be positive"),
  departmentId: z.string().min(1, "Department is required"),
  positionId: z.string().min(1, "Position is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).default("ACTIVE"),
});

type EmployeeFormValues = z.infer<typeof employeeSchema>;

export function EmployeeForm() {
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { data: departments, isLoading: isLoadingDeps } = useDepartments();
  const { data: positions, isLoading: isLoadingPos } = usePositions();
  const router = useRouter();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      documentId: "",
      email: "",
      baseSalary: 0,
      departmentId: "",
      positionId: "",
      status: "ACTIVE",
    },
  });

  const depsList = departments || [];
  const posList = positions || [];

  function onSubmit(data: EmployeeFormValues) {
    createEmployee(data, {
      onSuccess: () => {
        router.push("/payroll");
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="documentId"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Document ID</FormLabel>
                <FormControl>
                  <Input placeholder="123456789" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingDeps}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {depsList.map((dep: any) => (
                      <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="positionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Position</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPos}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {posList.map((pos: any) => (
                      <SelectItem key={pos.id} value={pos.id}>{pos.title}</SelectItem>
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
          name="baseSalary"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Base Salary ($)</FormLabel>
              <FormControl>
                <Input type="number" step="100" {...field} />
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
            Save Employee
          </Button>
        </div>
      </form>
    </Form>
  );
}
