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
import { useCreateEmployee } from "@/hooks/api/use-payroll";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const employeeSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(2),
  department: z.string(),
  salary: z.coerce.number().positive(),
  employmentType: z.enum(["full-time", "part-time", "contract"]),
});

export function EmployeeForm() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateEmployee();

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      department: "engineering",
      salary: 0,
      employmentType: "full-time",
    },
  });

  function onSubmit(values: z.infer<typeof employeeSchema>) {
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
          <UserPlus className="mr-2 h-4 w-4" />
          Add Employee
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Onboard a new employee to the company directory.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 px-1">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Work Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john.doe@company.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dept" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="engineering">Engineering</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="hr">HR</SelectItem>
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
                  name="salary"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Annual Salary</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full Time</SelectItem>
                          <SelectItem value="part-time">Part Time</SelectItem>
                          <SelectItem value="contract">Contractor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full mt-6" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Create Employee Profile"}
              </Button>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
