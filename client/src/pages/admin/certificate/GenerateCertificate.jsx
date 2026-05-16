import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Award, Search, Filter, Download, UserCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useGetAllStudentsQuery } from '@/features/api/authApi';
import RobowunderCertificate from '@/components/RobowunderCertificate';
import LoadingSpinner from '@/components/LoadingSpinner';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useGetSettingsQuery } from '@/features/api/settingsApi';

const GenerateCertificate = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [bulkCompletionDate, setBulkCompletionDate] = useState(new Date().toISOString().split('T')[0]);
  const [bulkMode, setBulkMode] = useState(null); // 'school1' | 'school2' | null
  const [bulkCurrentName, setBulkCurrentName] = useState('');
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [bulkBusy, setBulkBusy] = useState(false);
  const bulkCertificateElementRef = useRef(null);

  const { data: settingsData } = useGetSettingsQuery();
  const settings = settingsData?.settings;
  const logoUrl = settings?.logoUrl || '';
  const signatureUrl =
    'https://res.cloudinary.com/dmlk8egiw/image/upload/v1766400837/Untitled_design_49_suxtjh.png';

  const SCHOOL_1_NAMES = useMemo(
    () => ['Sauban Mudassar', 'Muhammad Yousuf Ali Khan', 'Hafsa Zafar', 'Aisha Ayub', 'Eeshal Obaidullah'],
    []
  );
  const SCHOOL_2_NAMES = useMemo(
    () => [
      'Ruhaan Nisar Khan',
      'Anand Sham Janorkar',
      'Aaradhya Shyam Janorkar',
      'Ishwari Amit Deshmukh',
      'Suchita manvar Bhagat',
      'mushfiq  Khan',
      'Manvi Umesh Pawar',
      'jignesh Gajanan Shinde',
      'Pranav Ganesh Thakre',
      'Shri Raj Janorkar',
      'abubakar Shaikh',
      'Mohammed Riyaz Mohammed Lakhani',
      'yadenesh meghnath Pawar',
      'Swaraj  Datta kakade',
      'razin Shaikh',
      'Mohammed abuzar',
      'umme Amara mukbeer',
      'aarush Prashant mundhre',
      'Kanhaiya  mohan bahakar',
      'Ayush digambar bahakar',
      'Tanvi Umesh Rathod',
      'Atharva satish ghumse',
      'Shaurya Nitin Bahadare',
      'Mohammed Arsh',
      'Soham Sunil kale',
      'Aryan Prashant nanote',
      'astha purushotam bahadare',
      'Kshitij Nilesh Bhagat',
      'Parth Anil sewalkar',
      'syed Aifaz  Abrar',
      'Arnav Raju aage',
      'Soham Nilesh sontakke',
      'Atif Atik Sheikh',
      'Hasnain mateen Mirza',
      'Ahmed Raza Khan',
      'Anandi Datta kakade',
      'Umesh banchare',
      'ishant Sachin Baburle',
      'Rabia bano Mohammad Riyaz Lakhani',
      'Radhika gunvant Chauhan',
      'Rajeshwari  Janorakar',
      'Arnav Raju aage',
      'Kanhaiya  khandare',
      'Virat Chandrakant kaddate',
      'Aditya bahakar',
      'Jayesh Rathod',
      'Soham Anantha Salunke',
    ],
    []
  );

  const normalizeName = (name) => name.replace(/\s+/g, ' ').trim();

  const waitForImage = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = resolve;
      img.onerror = resolve;
      img.src = src;
    });

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const generatePdfBlobFromElement = async ({ element, studentName, completionDateISO }) => {
    if (!element) throw new Error('Certificate element not found');

    // Ensure images are cached/loaded
    await Promise.all([waitForImage(logoUrl), waitForImage(signatureUrl)]);

    // Scroll into view so layout/styles settle (even though it's offscreen)
    element.scrollIntoView({ behavior: 'auto', block: 'center' });
    await new Promise((r) => setTimeout(r, 400));

    const originalMaxHeight = element.style.maxHeight;
    const originalMaxWidth = element.style.maxWidth;
    element.style.maxHeight = 'none';
    element.style.maxWidth = 'none';
    void element.offsetHeight;
    await new Promise((r) => setTimeout(r, 200));

    const rect = element.getBoundingClientRect();
    const elementWidth = rect.width;
    const elementHeight = rect.height;

    const canvas = await html2canvas(element, {
      scale: 4,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#fffbeb',
      logging: false,
      width: elementWidth,
      height: elementHeight,
      windowWidth: elementWidth,
      windowHeight: elementHeight,
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      removeContainer: false,
      imageTimeout: 20000,
    });

    element.style.maxHeight = originalMaxHeight;
    element.style.maxWidth = originalMaxWidth;

    const pdfWidth = 210;
    const pdfHeight = 297;
    const canvasAspectRatio = canvas.width / canvas.height;
    const imgHeight = pdfHeight;
    const imgWidth = pdfHeight * canvasAspectRatio;
    const xPos = (pdfWidth - imgWidth) / 2;
    const yPos = 0;

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });
    pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight, undefined, 'FAST');

    const year = new Date(completionDateISO).getFullYear();
    const safeName = normalizeName(studentName).replace(/\s+/g, '_');
    const filename = `${safeName}_Robowunder_Certificate_${year}.pdf`;
    const blob = pdf.output('blob');
    return { blob, filename };
  };
  const [certificateData, setCertificateData] = useState({
    userName: '',
    completionDate: new Date().toISOString().split('T')[0],
  });

  const { data: studentsData, isLoading: loadingStudents } = useGetAllStudentsQuery();
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

  // Get unique schools for filter
  const schoolOptions = useMemo(() => {
    const uniqueSchools = new Set(
      students
        .map((student) => student.school?.trim())
        .filter((school) => !!school)
    );
    return Array.from(uniqueSchools).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [students]);

  // Filter students
  const filteredStudents = useMemo(() => {
    let filtered = students;

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(
        (student) => student.category === categoryFilter
      );
    }

    if (schoolFilter !== 'all') {
      filtered = filtered.filter(
        (student) =>
          student.school &&
          student.school.trim().toLowerCase() ===
            schoolFilter.trim().toLowerCase()
      );
    }

    if (searchQuery.trim() !== '') {
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

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = new Set(students.map((student) => student.category).filter(Boolean));
    return ['all', ...Array.from(categories).sort()];
  }, [students]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCertificateData({
      userName: user.name,
      completionDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleCertificateDataChange = (field, value) => {
    setCertificateData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGenerate = () => {
    if (!certificateData.userName || !certificateData.completionDate) {
      toast.error('Please fill in all certificate fields');
      return;
    }
    // Convert date string to Date object for proper formatting
    const dateObj = new Date(certificateData.completionDate + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid date. Please select a valid date.');
      return;
    }
    toast.success('Certificate ready! Scroll down to preview and download.');
    // Scroll to preview section
    setTimeout(() => {
      const previewSection = document.querySelector('[data-certificate-preview]');
      if (previewSection) {
        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSchoolFilter('all');
  };

  useEffect(() => {
    // Keep bulk date in sync with the single certificate date unless user changes it later
    setBulkCompletionDate((prev) => prev || certificateData.completionDate);
  }, [certificateData.completionDate]);

  const runBulkZipDownload = async ({ schoolLabel, names }) => {
    if (bulkBusy) return;

    if (!bulkCompletionDate) {
      toast.error('Please select a completion date for bulk certificates');
      return;
    }

    const dateObj = new Date(bulkCompletionDate + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      toast.error('Invalid date. Please select a valid date.');
      return;
    }

    const cleaned = names.map(normalizeName).filter(Boolean);
    if (cleaned.length === 0) {
      toast.error('No student names found for bulk download');
      return;
    }

    const completionDateISO = new Date(bulkCompletionDate + 'T00:00:00').toISOString();

    try {
      setBulkBusy(true);
      toast.loading(`Preparing ${schoolLabel} ZIP...`);

      const zip = new JSZip();
      const seen = new Map();
      setBulkProgress({ current: 0, total: cleaned.length });

      for (let i = 0; i < cleaned.length; i++) {
        const name = cleaned[i];
        setBulkCurrentName(name);
        setBulkProgress({ current: i + 1, total: cleaned.length });

        // Render this student's certificate in the hidden renderer
        setBulkMode(schoolLabel);
        // Wait for React to commit the new name before capturing
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

        const { blob, filename } = await generatePdfBlobFromElement({
          element: bulkCertificateElementRef.current,
          studentName: name,
          completionDateISO,
        });

        const base = filename;
        const count = (seen.get(base) || 0) + 1;
        seen.set(base, count);
        const finalName = count === 1 ? base : base.replace(/\.pdf$/i, `_${count}.pdf`);
        zip.file(finalName, blob);

        // Small breather so the UI stays responsive
        await new Promise((r) => setTimeout(r, 150));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `${schoolLabel.replace(/\s+/g, '_')}_Certificates.zip`);

      toast.dismiss();
      toast.success(`${schoolLabel} ZIP downloaded`);
    } catch (e) {
      console.error(e);
      toast.dismiss();
      toast.error('Bulk download failed. Try again (or reduce batch size).');
    } finally {
      setBulkBusy(false);
      setBulkCurrentName('');
      setBulkProgress({ current: 0, total: 0 });
      setBulkMode(null);
    }
  };

  if (loadingStudents) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="h-8 w-8 text-amber-600" />
            Generate Certificate
          </h1>
          <p className="text-gray-600 mt-2">
            Select a user and generate a custom certificate
          </p>
        </div>
      </div>

      {/* Bulk ZIP Download */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Download (ZIP)</CardTitle>
          <CardDescription>
            Download certificates for predefined School 1 / School 2 student lists as one ZIP file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <Label htmlFor="bulkCompletionDate">Completion Date *</Label>
              <div className="relative mt-1">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="bulkCompletionDate"
                  type="date"
                  value={bulkCompletionDate}
                  onChange={(e) => setBulkCompletionDate(e.target.value)}
                  className="pl-10"
                  disabled={bulkBusy}
                />
              </div>
            </div>

            <Button
              onClick={() => runBulkZipDownload({ schoolLabel: 'School 1', names: SCHOOL_1_NAMES })}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={bulkBusy}
            >
              <Download className="h-5 w-5 mr-2" />
              School 1 Bulk ZIP ({SCHOOL_1_NAMES.length})
            </Button>

            <Button
              onClick={() => runBulkZipDownload({ schoolLabel: 'School 2', names: SCHOOL_2_NAMES })}
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={bulkBusy}
            >
              <Download className="h-5 w-5 mr-2" />
              School 2 Bulk ZIP ({SCHOOL_2_NAMES.length})
            </Button>
          </div>

          {bulkBusy && (
            <div className="text-sm text-gray-700">
              Generating: <span className="font-semibold">{bulkCurrentName || '...'}</span> —{' '}
              {bulkProgress.current}/{bulkProgress.total}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>Search and select a user to generate certificate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by name, email, or school..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectGroup>
                        <SelectLabel>Filter by Category</SelectLabel>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category === 'all' ? 'All Categories' : getCategoryLabel(category)}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                    <SelectTrigger>
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by School" />
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

              {(searchQuery || categoryFilter !== 'all' || schoolFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              )}

              <div className="text-sm text-gray-600">
                {filteredStudents.length} student(s) found
              </div>
            </div>

            {/* Users Table */}
            <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((user) => (
                      <TableRow
                        key={user._id}
                        className={selectedUser?._id === user._id ? 'bg-blue-50' : ''}
                      >
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryLabel(user.category)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {user.school || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant={selectedUser?._id === user._id ? 'default' : 'outline'}
                            onClick={() => handleUserSelect(user)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            {selectedUser?._id === user._id ? 'Selected' : 'Select'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No students found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle>Certificate Details</CardTitle>
            <CardDescription>Customize certificate information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedUser ? (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900">Selected User</p>
                  <p className="text-lg font-bold text-blue-700">{selectedUser.name}</p>
                  <p className="text-sm text-blue-600">{selectedUser.email}</p>
                  <Badge variant="outline" className="mt-2">
                    {getCategoryLabel(selectedUser.category)}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="userName">Student Name *</Label>
                    <Input
                      id="userName"
                      type="text"
                      value={certificateData.userName}
                      onChange={(e) => handleCertificateDataChange('userName', e.target.value)}
                      placeholder="Enter student name"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="completionDate">Completion Date *</Label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="completionDate"
                        type="date"
                        value={certificateData.completionDate}
                        onChange={(e) => handleCertificateDataChange('completionDate', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    size="lg"
                  >
                    <Award className="h-5 w-5 mr-2" />
                    Generate Certificate
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Please select a user from the list to generate a certificate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Certificate Preview Section */}
      {selectedUser && certificateData.userName && certificateData.completionDate && (
        <Card data-certificate-preview>
          <CardHeader>
            <CardTitle>Certificate Preview</CardTitle>
            <CardDescription>Preview and download the certificate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <RobowunderCertificate
                key={`${certificateData.userName}-${certificateData.completionDate}`}
                userName={certificateData.userName}
                completionDate={new Date(certificateData.completionDate + 'T00:00:00').toISOString()}
                isPreview={false}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden renderer used for bulk PDF generation */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '210mm',
          height: '297mm',
          overflow: 'hidden',
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <RobowunderCertificate
          ref={bulkCertificateElementRef}
          key={`${bulkCurrentName}-${bulkCompletionDate}-${bulkMode}`}
          userName={bulkCurrentName || ' '}
          completionDate={new Date((bulkCompletionDate || new Date().toISOString().split('T')[0]) + 'T00:00:00').toISOString()}
          isPreview={true}
        />
      </div>
    </div>
  );
};

export default GenerateCertificate;

