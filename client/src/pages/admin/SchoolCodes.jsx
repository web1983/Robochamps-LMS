import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy,
  Loader2,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Ban,
  Pencil,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  useGetSchoolCodesQuery,
  useCreateSchoolCodeMutation,
  useUpdateSchoolCodeMutation,
  useDeleteSchoolCodeMutation,
} from "@/features/api/schoolCodeApi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SchoolCodes = () => {
  const { data, isLoading, isFetching, refetch } = useGetSchoolCodesQuery();
  const [createSchoolCode, { isLoading: isCreating }] =
    useCreateSchoolCodeMutation();
  const [updateSchoolCode, { isLoading: isUpdating }] =
    useUpdateSchoolCodeMutation();
  const [deleteSchoolCode, { isLoading: isDeleting }] =
    useDeleteSchoolCodeMutation();

  const [formData, setFormData] = useState({
    schoolName: "",
    limit: "",
    customCode: "",
  });
  const [actionId, setActionId] = useState(null);
  const [limitDialog, setLimitDialog] = useState({
    open: false,
    code: null,
    limit: "",
  });
  const [isLimitUpdating, setIsLimitUpdating] = useState(false);

  const schoolCodes = useMemo(
    () => data?.schoolCodes || [],
    [data?.schoolCodes]
  );

  const remainingSeats = (limit, used) => {
    return Math.max(limit - used, 0);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.schoolName.trim()) {
      toast.error("Please enter a school name.");
      return;
    }

    if (!formData.limit || Number(formData.limit) <= 0) {
      toast.error("Please enter a valid student limit.");
      return;
    }

    try {
      await createSchoolCode({
        schoolName: formData.schoolName.trim(),
        limit: Number(formData.limit),
        customCode: formData.customCode.trim() || undefined,
      }).unwrap();
      toast.success("School code generated successfully.");
      setFormData({ schoolName: "", limit: "", customCode: "" });
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to create school code. Please try again."
      );
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    setActionId(id);
    try {
      await updateSchoolCode({ id, isActive: !isActive }).unwrap();
      toast.success(
        !isActive
          ? "School code activated successfully."
          : "School code deactivated successfully."
      );
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to update school code status."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this school code? This action cannot be undone."
    );
    if (!confirmDelete) {
      return;
    }

    setActionId(id);
    try {
      await deleteSchoolCode(id).unwrap();
      toast.success("School code deleted successfully.");
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to delete school code. Please try again."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleOpenLimitDialog = (code) => {
    setLimitDialog({
      open: true,
      code,
      limit: String(code.limit ?? ""),
    });
  };

  const handleLimitInputChange = (event) => {
    const { value } = event.target;
    setLimitDialog((previous) => ({
      ...previous,
      limit: value,
    }));
  };

  const handleLimitSubmit = async (event) => {
    event.preventDefault();
    if (!limitDialog.code) return;

    const parsedLimit = Number(limitDialog.limit);

    if (Number.isNaN(parsedLimit) || parsedLimit <= 0) {
      toast.error("Please enter a valid positive number for the limit.");
      return;
    }

    if (parsedLimit < limitDialog.code.usedCount) {
      toast.error(
        `Limit cannot be less than the number of students already registered (${limitDialog.code.usedCount}).`
      );
      return;
    }

    if (parsedLimit <= limitDialog.code.limit) {
      toast.error("New limit must be greater than the current limit.");
      return;
    }

    try {
      setIsLimitUpdating(true);
      await updateSchoolCode({
        id: limitDialog.code._id,
        limit: parsedLimit,
      }).unwrap();
      toast.success("Student limit updated successfully.");
      setLimitDialog({ open: false, code: null, limit: "" });
    } catch (error) {
      toast.error(
        error?.data?.message ||
          "Failed to update student limit. Please try again."
      );
    } finally {
      setIsLimitUpdating(false);
    }
  };

  const handleCloseDialog = (open) => {
    if (!open) {
      setLimitDialog({ open: false, code: null, limit: "" });
    } else {
      setLimitDialog((previous) => ({ ...previous, open }));
    }
  };

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("School code copied to clipboard.");
    } catch (error) {
      toast.error("Failed to copy school code.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Codes</h1>
        <p className="text-gray-600 mt-2">
          Generate and manage school codes for student registrations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-1 border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle>Generate School Code</CardTitle>
            <CardDescription>
              Create a new school code with a maximum student limit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  value={formData.schoolName}
                  onChange={handleInputChange}
                  placeholder="eg. Robowunder Academy"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="customCode">Custom Code (optional)</Label>
                  <span className="text-xs text-gray-500">
                    Letters, numbers, hyphen. 4-16 chars.
                  </span>
                </div>
                <Input
                  id="customCode"
                  name="customCode"
                  value={formData.customCode}
                  onChange={handleInputChange}
                  placeholder="eg. RW-2025"
                  disabled={isCreating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="limit">Student Limit</Label>
                <Input
                  id="limit"
                  name="limit"
                  type="number"
                  min="1"
                  value={formData.limit}
                  onChange={handleInputChange}
                  placeholder="eg. 50"
                  disabled={isCreating}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Code"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2 border border-gray-200 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Existing School Codes</CardTitle>
              <CardDescription>
                Track usage and manage active school codes.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schoolCodes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-12 text-gray-500"
                      >
                        No school codes generated yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    schoolCodes.map((code) => (
                      <TableRow key={code._id} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {code.schoolName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold tracking-wide">
                              {code.code}
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopy(code.code)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {code.usedCount} / {code.limit}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {remainingSeats(code.limit, code.usedCount)}
                        </TableCell>
                        <TableCell>
                          {code.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(code.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenLimitDialog(code)}
                              disabled={
                                isLimitUpdating &&
                                limitDialog.code?._id === code._id
                              }
                            >
                              {isLimitUpdating &&
                              limitDialog.code?._id === code._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Pencil className="h-4 w-4 mr-1" />
                                  Increase Limit
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleToggleStatus(code._id, code.isActive)
                              }
                              disabled={
                                (isUpdating || isDeleting) && actionId === code._id
                              }
                            >
                              {actionId === code._id && isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : code.isActive ? (
                                <>
                                  <Ban className="h-4 w-4 mr-1" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(code._id)}
                              disabled={
                                (isDeleting || isUpdating) && actionId === code._id
                              }
                            >
                              {actionId === code._id && isDeleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={limitDialog.open} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Increase Student Limit</DialogTitle>
            <DialogDescription>
              Current limit:{" "}
              <span className="font-semibold">
                {limitDialog.code?.limit ?? "-"}
              </span>{" "}
              | Registered:{" "}
              <span className="font-semibold">
                {limitDialog.code?.usedCount ?? 0}
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLimitSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newLimit">New Student Limit</Label>
              <Input
                id="newLimit"
                type="number"
                min={(limitDialog.code?.usedCount ?? 0) + 1}
                value={limitDialog.limit}
                onChange={handleLimitInputChange}
                disabled={isLimitUpdating}
                required
              />
              <p className="text-xs text-gray-500">
                Enter a number greater than the current limit and registered
                students.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setLimitDialog({ open: false, code: null, limit: "" })
                }
                disabled={isLimitUpdating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isLimitUpdating}
              >
                {isLimitUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Limit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolCodes;

