import React, { useState } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MoreVertical, Plus, Key, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllInstructorsQuery,
  useCreateInstructorMutation,
  useUpdateInstructorPasswordMutation,
  useDeleteInstructorMutation,
} from "@/features/api/instructorApi";
import { glassCard, glassInput, accentButton, subtleButton, mutedText, badgeAccent } from "./theme";

const InstructorTab = () => {
  const { data, isLoading } = useGetAllInstructorsQuery();
  const [createInstructor, { isLoading: isCreating }] = useCreateInstructorMutation();
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdateInstructorPasswordMutation();
  const [deleteInstructor, { isLoading: isDeleting }] = useDeleteInstructorMutation();

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState(null);

  // Form states
  const [newInstructor, setNewInstructor] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [newPassword, setNewPassword] = useState("");

  // Handle create instructor
  const handleCreateInstructor = async (e) => {
    e.preventDefault();
    
    if (!newInstructor.name || !newInstructor.email || !newInstructor.password) {
      toast.error("All fields are required");
      return;
    }

    if (newInstructor.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await createInstructor(newInstructor).unwrap();
      toast.success(response.message || "Instructor created successfully");
      setCreateDialogOpen(false);
      setNewInstructor({ name: "", email: "", password: "" });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create instructor");
    }
  };

  // Handle update password
  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!newPassword) {
      toast.error("Password is required");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      const response = await updatePassword({
        instructorId: selectedInstructor._id,
        newPassword,
      }).unwrap();
      toast.success(response.message || "Password updated successfully");
      setPasswordDialogOpen(false);
      setNewPassword("");
      setSelectedInstructor(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update password");
    }
  };

  // Handle delete instructor
  const handleDeleteInstructor = async () => {
    try {
      const response = await deleteInstructor(selectedInstructor._id).unwrap();
      toast.success(response.message || "Instructor deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedInstructor(null);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete instructor");
    }
  };

  const instructors = data?.instructors || [];

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Team</p>
          <h2 className="text-3xl font-bold tracking-tight">Instructors</h2>
          <p className={mutedText}>
            Manage instructor accounts
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className={accentButton}>
          <Plus className="mr-2 h-4 w-4" />
          Add Instructor
        </Button>
      </div>

      {/* Stats Card */}
      <Card className={glassCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Total Instructors
          </CardTitle>
          <CardDescription className={mutedText}>Total number of instructors in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-[#F58120]">{instructors.length}</div>
        </CardContent>
      </Card>

      {/* Instructors Table */}
      <Card className={glassCard}>
        <CardHeader>
          <CardTitle>All Instructors</CardTitle>
          <CardDescription className={mutedText}>
            View and manage all instructor accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#F58120]" />
            </div>
          ) : instructors.length === 0 ? (
            <div className={`py-8 text-center ${mutedText}`}>
              No instructors found. Create your first instructor!
            </div>
          ) : (
            <div className="rounded-md border border-white/10">
              <Table className="text-white">
                <TableHeader className="bg-white/5">
                  <TableRow>
                    <TableHead className="text-white/70">Name</TableHead>
                    <TableHead className="text-white/70">Email</TableHead>
                    <TableHead className="text-white/70">Status</TableHead>
                    <TableHead className="text-white/70">Created At</TableHead>
                    <TableHead className="text-right text-white/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructors.map((instructor) => (
                    <TableRow key={instructor._id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="font-medium">{instructor.name}</TableCell>
                      <TableCell className={mutedText}>{instructor.email}</TableCell>
                      <TableCell>
                        <Badge className={instructor.isActive ? badgeAccent : "border border-white/20 bg-white/10 text-white/70"}>
                          {instructor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(instructor.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedInstructor(instructor);
                                setPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedInstructor(instructor);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Instructor Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className={`${glassCard} max-w-lg`}>
          <DialogHeader>
            <DialogTitle>Create New Instructor</DialogTitle>
            <DialogDescription className={mutedText}>
              Add a new instructor account to the system
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInstructor}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter instructor name"
                  value={newInstructor.name}
                  onChange={(e) =>
                    setNewInstructor({ ...newInstructor, name: e.target.value })
                  }
                  className={glassInput}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter instructor email"
                  value={newInstructor.email}
                  onChange={(e) =>
                    setNewInstructor({ ...newInstructor, email: e.target.value })
                  }
                  className={glassInput}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min. 6 characters)"
                  value={newInstructor.password}
                  onChange={(e) =>
                    setNewInstructor({ ...newInstructor, password: e.target.value })
                  }
                  className={glassInput}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  setNewInstructor({ name: "", email: "", password: "" });
                }}
                className={subtleButton}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className={accentButton}>
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Instructor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className={`${glassCard} max-w-md`}>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription className={mutedText}>
              Update password for {selectedInstructor?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={glassInput}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setNewPassword("");
                  setSelectedInstructor(null);
                }}
                className={subtleButton}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPassword} className={accentButton}>
                {isUpdatingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className={`${glassCard} max-w-md`}>
          <DialogHeader>
            <DialogTitle>Delete Instructor</DialogTitle>
            <DialogDescription className={mutedText}>
              Are you sure you want to delete {selectedInstructor?.name}? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedInstructor(null);
              }}
              className={subtleButton}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteInstructor}
              disabled={isDeleting}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorTab;

