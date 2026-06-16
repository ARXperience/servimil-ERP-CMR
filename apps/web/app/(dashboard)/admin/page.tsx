"use client";

import { useUsers } from "@/hooks/api/use-users";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Shield, ShieldCheck, Mail, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminPage() {
  const { data: users, isLoading } = useUsers();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">System Administration</h2>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage system users, roles, and access permissions.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <span>{user.firstName} {user.lastName}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Mail className="mr-2 h-3 w-3" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit space-x-1">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "secondary"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
