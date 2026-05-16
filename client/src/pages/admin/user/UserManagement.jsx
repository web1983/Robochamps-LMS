import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, Filter, Edit, Loader2, Eye, EyeOff, CircleDot, Download, QrCode, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllStudentsQuery, useUpdateStudentByAdminMutation, useDeleteStudentByAdminMutation } from '@/features/api/authApi';
import { QRCodeCanvas } from 'qrcode.react';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    category: '',
    school: '',
    resetPassword: '',
  });

  const qrRef = useRef(null);

  const { data: studentsData, isLoading: loadingStudents, refetch } = useGetAllStudentsQuery();
  const [updateStudent, { isLoading: updating }] = useUpdateStudentByAdminMutation();
  const [deleteStudent, { isLoading: deleting }] = useDeleteStudentByAdminMutation();

  const students = studentsData?.users || [];

  const getCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3-5 (B)',
      'grade_6_8_basic': 'Grade 6-8 (B)',
      'grade_9_12_basic': 'Grade 9-12 (B)',
      'grade_3_5_advance': 'Grade 3-5 (A)',
      'grade_6_8_advance': 'Grade 6-8 (A)',
      'grade_9_12_advance': 'Grade 9-12 (A)'
    };
    return categoryMap[category] || category;
  };

  const getFullCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3 to 5 (Basic)',
      'grade_6_8_basic': 'Grade 6 to 8 (Basic)',
      'grade_9_12_basic': 'Grade 9 to 12 (Basic)',
      'grade_3_5_advance': 'Grade 3 to 5 (Advance)',
      'grade_6_8_advance': 'Grade 6 to 8 (Advance)',
      'grade_9_12_advance': 'Grade 9 to 12 (Advance)'
    };
    return categoryMap[category] || category;
  };

  // Filter and search logic
  const schoolOptions = useMemo(() => {
    const uniqueSchools = new Set(
      students
        .map((student) => student.school?.trim())
        .filter((school) => !!school)
    );
    return Array.from(uniqueSchools).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (student) => student.category === categoryFilter
      );
    }

    if (schoolFilter !== "all") {
      filtered = filtered.filter(
        (student) =>
          student.school &&
          student.school.trim().toLowerCase() ===
            schoolFilter.trim().toLowerCase()
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          (student.school && student.school.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [students, categoryFilter, schoolFilter, searchQuery]);

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      category: user.category,
      school: user.school || '',
      resetPassword: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditFormChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (value) => {
    setEditFormData({ ...editFormData, category: value });
  };

  const handleUpdateUser = async () => {
    if (!editFormData.name || !editFormData.email || !editFormData.category) {
      toast.error('Name, email, and category are required');
      return;
    }

    if (editFormData.resetPassword && editFormData.resetPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await updateStudent({
        userId: selectedUser._id,
        userData: editFormData,
      }).unwrap();

      toast.success(result.message);
      setEditDialogOpen(false);
      setSelectedUser(null);
      setEditFormData({ name: '', email: '', category: '', school: '', resetPassword: '' });
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to update user');
    }
  };

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    
    const canvas = qrRef.current.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${selectedUser?.name || 'user'}-qrcode.png`;
      link.href = url;
      link.click();
      toast.success('QR Code downloaded successfully');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const result = await deleteStudent(selectedUser._id).unwrap();
      toast.success(result.message);
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to delete user');
    }
  };

  const getActiveStatus = (user) => {
    if (user.isActive) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CircleDot className="h-3 w-3 mr-1" />
          Active
        </Badge>
      );
    } else if (user.lastLogin) {
      const lastLoginDate = new Date(user.lastLogin);
      const now = new Date();
      const diffInMinutes = Math.floor((now - lastLoginDate) / (1000 * 60));
      
      if (diffInMinutes < 5) {
        return <Badge variant="outline" className="text-yellow-700">Just left</Badge>;
      }
      return <Badge variant="outline" className="text-gray-600">Offline</Badge>;
    }
    return <Badge variant="outline" className="text-gray-500">Never logged in</Badge>;
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';
    const date = new Date(lastLogin);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex-1 mx-10">
      <div className="mb-6">
        <h1 className="font-bold text-black text-xl">User Management</h1>
        <p className="text-sm text-gray-600">View and manage all student accounts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle>All Students</CardTitle>
            </div>
            <Badge variant="outline">
              {filteredStudents.length} of {students.length} students
            </Badge>
          </div>
          <CardDescription>Search, filter, and edit student information</CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
              <div className="w-full md:w-[200px]">
                <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel>Filter by Category</SelectLabel>
                      <SelectItem value="all">All Categories</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Basic Level</SelectLabel>
                      <SelectItem value="grade_3_5_basic">
                        Grade 3-5 (Basic)
                      </SelectItem>
                      <SelectItem value="grade_6_8_basic">
                        Grade 6-8 (Basic)
                      </SelectItem>
                      <SelectItem value="grade_9_12_basic">
                        Grade 9-12 (Basic)
                      </SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Advance Level</SelectLabel>
                      <SelectItem value="grade_3_5_advance">
                        Grade 3-5 (Advance)
                      </SelectItem>
                      <SelectItem value="grade_6_8_advance">
                        Grade 6-8 (Advance)
                      </SelectItem>
                      <SelectItem value="grade_9_12_advance">
                        Grade 9-12 (Advance)
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[220px]">
                <Select
                  onValueChange={setSchoolFilter}
                  value={schoolFilter}
                >
                  <SelectTrigger>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel>Filter by School</SelectLabel>
                      <SelectItem value="all">All Schools</SelectItem>
                      {schoolOptions.map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          {loadingStudents ? (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-sm text-gray-500 mt-2">Loading students...</p>
            </div>
          ) : filteredStudents.length > 0 ? (
            <div className="max-h-[600px] overflow-y-auto text-black border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student._id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{student.school || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryLabel(student.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getActiveStatus(student)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatLastLogin(student.lastLogin)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(student);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600">
                {searchQuery || categoryFilter !== 'all' 
                  ? 'No students found matching your criteria' 
                  : 'No students created yet'}
              </p>
              {(searchQuery || categoryFilter !== 'all') && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setSchoolFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-white max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold">Edit Student</DialogTitle>
            <DialogDescription>
              Update student information and reset password if needed
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4 overflow-y-auto flex-1">
              <div>
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditFormChange}
                  placeholder="Student Name"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditFormChange}
                  placeholder="student@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-school">School Name</Label>
                <Input
                  id="edit-school"
                  name="school"
                  type="text"
                  value={editFormData.school}
                  onChange={handleEditFormChange}
                  placeholder="ABC High School"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-category">Grade Category</Label>
                <Select onValueChange={handleCategoryChange} value={editFormData.category}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a grade category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel>Basic Level</SelectLabel>
                      <SelectItem value="grade_3_5_basic">{getFullCategoryLabel('grade_3_5_basic')}</SelectItem>
                      <SelectItem value="grade_6_8_basic">{getFullCategoryLabel('grade_6_8_basic')}</SelectItem>
                      <SelectItem value="grade_9_12_basic">{getFullCategoryLabel('grade_9_12_basic')}</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Advance Level</SelectLabel>
                      <SelectItem value="grade_3_5_advance">{getFullCategoryLabel('grade_3_5_advance')}</SelectItem>
                      <SelectItem value="grade_6_8_advance">{getFullCategoryLabel('grade_6_8_advance')}</SelectItem>
                      <SelectItem value="grade_9_12_advance">{getFullCategoryLabel('grade_9_12_advance')}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-password">Reset Password (Optional)</Label>
                <div className="relative mt-2">
                  <Input
                    id="edit-password"
                    name="resetPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={editFormData.resetPassword}
                    onChange={handleEditFormChange}
                    placeholder="Leave empty to keep current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only fill this if you want to reset the password
                </p>
              </div>

              {/* QR Code Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Student Login QR Code
                  </Label>
                </div>
                
                <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div ref={qrRef} className="bg-white p-3 rounded-lg shadow-sm">
                    <QRCodeCanvas 
                      value={JSON.stringify({
                        email: selectedUser?.email,
                        userId: selectedUser?._id,
                      })}
                      size={150}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadQRCode}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download QR Code
                  </Button>
                  <p className="text-xs text-gray-500 text-center">
                    QR code contains student email and ID for quick access
                  </p>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Changing the category will affect which courses the student can see.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this student account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="py-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Student:</strong> {selectedUser.name}
                </p>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Email:</strong> {selectedUser.email}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Category:</strong> {getFullCategoryLabel(selectedUser.category)}
                </p>
              </div>
              <p className="text-sm text-red-600 mt-4 font-medium">
                ⚠️ All student data, enrollments, and progress will be permanently deleted.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteUser}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;

