import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  roles: string[];
}

const AVAILABLE_ROLES = ["admin", "manager", "salesperson", "technician"];

const ROLE_DESCRIPTIONS = {
  admin: "Full system access and user management",
  manager: "Manage all data, view all reports",
  salesperson: "Manage own clients, offers, and tasks",
  technician: "Manage service tickets and robots",
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRoles, setBulkRoles] = useState<string[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Access denied. Admin privileges required.");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    fetchUsers();
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        roles: rolesData
          ?.filter((r) => r.user_id === profile.id)
          .map((r) => r.role) || [],
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserEmail,
        password: newUserPassword,
        options: {
          data: {
            full_name: newUserName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user && selectedRoles.length > 0) {
        const roleInserts = selectedRoles.map((role) => ({
          user_id: authData.user!.id,
          role: role as "admin" | "manager" | "salesperson" | "technician",
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      toast.success("User created successfully");
      setDialogOpen(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setSelectedRoles([]);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
      console.error(error);
    }
  };

  const handleUpdateUserRoles = async () => {
    if (!editingUser) return;

    try {
      // Delete existing roles
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUser.id);

      // Insert new roles
      if (selectedRoles.length > 0) {
        const roleInserts = selectedRoles.map((role) => ({
          user_id: editingUser.id,
          role: role as "admin" | "manager" | "salesperson" | "technician",
        }));

        const { error: rolesError } = await supabase
          .from("user_roles")
          .insert(roleInserts);

        if (rolesError) throw rolesError;
      }

      toast.success("User roles updated successfully");
      setDialogOpen(false);
      setEditingUser(null);
      setSelectedRoles([]);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user roles");
      console.error(error);
    }
  };

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setDialogOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleBulkRole = (role: string) => {
    setBulkRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  const handleBulkRoleAssignment = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    if (bulkRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    try {
      // Delete existing roles for selected users
      await supabase
        .from("user_roles")
        .delete()
        .in("user_id", selectedUsers);

      // Insert new roles for all selected users
      const roleInserts = selectedUsers.flatMap((userId) =>
        bulkRoles.map((role) => ({
          user_id: userId,
          role: role as "admin" | "manager" | "salesperson" | "technician",
        }))
      );

      const { error: rolesError } = await supabase
        .from("user_roles")
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      toast.success(`Roles updated for ${selectedUsers.length} users`);
      setBulkDialogOpen(false);
      setSelectedUsers([]);
      setBulkRoles([]);
      fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user roles");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage users and their access privileges
          </p>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <Dialog open={bulkDialogOpen} onOpenChange={(open) => {
              setBulkDialogOpen(open);
              if (!open) {
                setBulkRoles([]);
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  Bulk Assign Roles ({selectedUsers.length})
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Role Assignment</DialogTitle>
                  <DialogDescription>
                    Assign roles to {selectedUsers.length} selected user(s)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label>Roles</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Selected roles will replace existing roles for all selected users
                    </p>
                    <div className="space-y-2 mt-2">
                      {AVAILABLE_ROLES.map((role) => (
                        <div key={role} className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id={`bulk-${role}`}
                            checked={bulkRoles.includes(role)}
                            onChange={() => toggleBulkRole(role)}
                            className="mt-1"
                          />
                          <label htmlFor={`bulk-${role}`} className="text-sm">
                            <div className="font-medium capitalize">{role}</div>
                            <div className="text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleBulkRoleAssignment} className="w-full">
                    Assign Roles to {selectedUsers.length} User(s)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={dialogOpen && !editingUser} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setNewUserEmail("");
            setNewUserPassword("");
            setNewUserName("");
            setSelectedRoles([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system and assign their roles
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label>Roles</Label>
                <div className="space-y-2 mt-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <div key={role} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id={`new-${role}`}
                        checked={selectedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        className="mt-1"
                      />
                      <label htmlFor={`new-${role}`} className="text-sm">
                        <div className="font-medium capitalize">{role}</div>
                        <div className="text-muted-foreground">
                          {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateUser} className="w-full">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>
            View and manage all users and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={toggleAllUsers}
                    className="cursor-pointer"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.length > 0 ? (
                        user.roles.map((role) => (
                          <Badge key={role} variant="secondary" className="capitalize">
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No roles</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={dialogOpen && editingUser?.id === user.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (!open) {
                        setEditingUser(null);
                        setSelectedRoles([]);
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Roles</DialogTitle>
                          <DialogDescription>
                            Manage roles for {user.full_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          <div>
                            <Label>Roles</Label>
                            <div className="space-y-2 mt-2">
                              {AVAILABLE_ROLES.map((role) => (
                                <div key={role} className="flex items-start gap-2">
                                  <input
                                    type="checkbox"
                                    id={`edit-${role}`}
                                    checked={selectedRoles.includes(role)}
                                    onChange={() => toggleRole(role)}
                                    className="mt-1"
                                  />
                                  <label htmlFor={`edit-${role}`} className="text-sm">
                                    <div className="font-medium capitalize">{role}</div>
                                    <div className="text-muted-foreground">
                                      {ROLE_DESCRIPTIONS[role as keyof typeof ROLE_DESCRIPTIONS]}
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                          <Button onClick={handleUpdateUserRoles} className="w-full">
                            Update Roles
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
