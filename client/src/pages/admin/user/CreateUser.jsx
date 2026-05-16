import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Download, QrCode, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateStudentUserMutation, useGetAllStudentsQuery } from '@/features/api/authApi';
import { QRCodeCanvas } from 'qrcode.react';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    category: 'grade_3_5_basic',
    school: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [generatedUser, setGeneratedUser] = useState(null);
  const qrRef = useRef(null);

  const [createStudent, { isLoading: creating }] = useCreateStudentUserMutation();
  const { data: studentsData, isLoading: loadingStudents, refetch } = useGetAllStudentsQuery();

  const students = studentsData?.users || [];

  const getCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3-5 (Basic)',
      'grade_6_8_basic': 'Grade 6-8 (Basic)',
      'grade_9_12_basic': 'Grade 9-12 (Basic)',
      'grade_3_5_advance': 'Grade 3-5 (Advance)',
      'grade_6_8_advance': 'Grade 6-8 (Advance)',
      'grade_9_12_advance': 'Grade 9-12 (Advance)'
    };
    return categoryMap[category] || category;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleCategoryChange = (value) => {
    setFormData({ ...formData, category: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.category) {
      toast.error('All fields are required');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      const result = await createStudent(formData).unwrap();
      toast.success(result.message);
      
      // Store generated user for QR code
      setGeneratedUser({
        name: result.user.name,
        email: result.credentials.email,
        password: result.credentials.password,
        userId: result.user._id,
      });

      // Show QR dialog
      setShowQRDialog(true);

      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        category: 'grade_3_5_basic',
        school: '',
      });

      // Refetch students list
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to create user');
    }
  };

  const downloadQRCode = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${generatedUser.name.replace(/\s+/g, '_')}_QR.png`;
      link.href = url;
      link.click();
      toast.success('QR Code downloaded successfully!');
    }
  };

  const qrData = generatedUser ? 
    `Name: ${generatedUser.name}\nEmail: ${generatedUser.email}\nPassword: ${generatedUser.password}` : '';

  return (
    <div className="flex-1 mx-10">
      <div className="mb-6">
        <h1 className="font-bold text-black text-xl">User Management</h1>
        <p className="text-sm text-gray-600">Create and manage student accounts</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Create User Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              <CardTitle>Create Student User</CardTitle>
            </div>
            <CardDescription>Create a new student account with auto-generated credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="school">School Name</Label>
                <Input
                  id="school"
                  name="school"
                  type="text"
                  value={formData.school}
                  onChange={handleChange}
                  placeholder="ABC High School"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="category">Grade Category</Label>
                <Select onValueChange={handleCategoryChange} value={formData.category}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a grade category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectGroup>
                      <SelectLabel>Basic Level</SelectLabel>
                      <SelectItem value="grade_3_5_basic">Grade 3 to 5 (Basic)</SelectItem>
                      <SelectItem value="grade_6_8_basic">Grade 6 to 8 (Basic)</SelectItem>
                      <SelectItem value="grade_9_12_basic">Grade 9 to 12 (Basic)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Advance Level</SelectLabel>
                      <SelectItem value="grade_3_5_advance">Grade 3 to 5 (Advance)</SelectItem>
                      <SelectItem value="grade_6_8_advance">Grade 6 to 8 (Advance)</SelectItem>
                      <SelectItem value="grade_9_12_advance">Grade 9 to 12 (Advance)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating User...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Student User
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> After creating a user, a QR code will be generated containing their login credentials. You can download and print it.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Students List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <CardTitle>All Students</CardTitle>
              </div>
              <Badge variant="outline">{students.length} Total</Badge>
            </div>
            <CardDescription>List of all registered student accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStudents ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">Loading students...</p>
              </div>
            ) : students.length > 0 ? (
              <div className="max-h-[500px] overflow-y-auto text-black">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell className="text-sm text-gray-600">{student.school || '-'}</TableCell>
                        <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getCategoryLabel(student.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-600">No students created yet</p>
                <p className="text-sm text-gray-500 mt-1">Create your first student account</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-green-600">
              ✅ Student Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-center">
              Download the QR code with login credentials
            </DialogDescription>
          </DialogHeader>

          {generatedUser && (
            <div className="space-y-6">
              {/* User Details */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Name:</span>
                  <span className="text-sm text-gray-900">{generatedUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Email:</span>
                  <span className="text-sm text-gray-900">{generatedUser.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-semibold text-gray-700">Password:</span>
                  <span className="text-sm text-gray-900 font-mono">{generatedUser.password}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center space-y-4">
                <div ref={qrRef} className="p-6 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
                  <QRCodeCanvas
                    value={qrData}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div className="text-center">
                  <QrCode className="h-5 w-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-gray-600">
                    Scan this QR code to view login credentials
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={downloadQRCode}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download QR Code
                </Button>
                <Button
                  onClick={() => setShowQRDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Close
                </Button>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Important:</strong> Save this QR code! You won't be able to view the password again.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateUser;

