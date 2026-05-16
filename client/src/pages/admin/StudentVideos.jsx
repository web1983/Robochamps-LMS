import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Video, Search, Filter, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useGetStudentsWithVideosQuery } from '@/features/api/authApi';
import { glassCard, glassInput, glassSelectTrigger, glassSelectContent, accentButton, mutedText, badgeAccent } from './theme';
import LoadingSpinner from '@/components/LoadingSpinner';

const StudentVideos = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [submissionFilter, setSubmissionFilter] = useState('all');

  // Build query params
  const queryParams = useMemo(() => {
    const params = {};
    if (categoryFilter !== 'all') params.category = categoryFilter;
    if (schoolFilter !== 'all') params.school = schoolFilter;
    if (searchQuery.trim()) params.search = searchQuery.trim();
    return params;
  }, [categoryFilter, schoolFilter, searchQuery]);

  const { data, isLoading, error, isError } = useGetStudentsWithVideosQuery(queryParams);
  const allStudents = data?.students || [];

  // Filter students based on submission status (client-side filtering)
  const students = useMemo(() => {
    if (submissionFilter === 'all') return allStudents;
    if (submissionFilter === 'submitted') {
      return allStudents.filter(s => s.driveLink && s.driveLink.trim() !== '');
    }
    if (submissionFilter === 'not_submitted') {
      return allStudents.filter(s => !s.driveLink || s.driveLink.trim() === '');
    }
    return allStudents;
  }, [allStudents, submissionFilter]);

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

  // Get unique schools from students
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

  // Count students with and without drive links
  const studentsWithLinks = students.filter(s => s.driveLink && s.driveLink.trim() !== '');
  const studentsWithoutLinks = students.filter(s => !s.driveLink || s.driveLink.trim() === '');

  if (isLoading) {
    return (
      <div className="space-y-10 text-white">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Project Videos</p>
          <h1 className="text-4xl font-semibold">Student Drive Links</h1>
          <p className={mutedText}>View and manage student project video drive links</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-10 text-white">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.4em] text-white/50">Project Videos</p>
          <h1 className="text-4xl font-semibold">Student Drive Links</h1>
        </div>
        <Card className={glassCard}>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-400" />
            <p className="text-red-400 text-lg font-semibold mb-2">Failed to load students</p>
            <p className={mutedText}>
              {error?.data?.message || error?.message || 'An error occurred while fetching student videos. Please try again.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-10 text-white">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Project Videos</p>
        <h1 className="text-4xl font-semibold">Student Drive Links</h1>
        <p className={mutedText}>View and manage student project video drive links</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className={glassCard}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Total Students</p>
                <p className="text-3xl font-bold text-white">{students.length}</p>
              </div>
              <Video className="h-8 w-8 text-[#F58120]" />
            </div>
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>With Drive Links</p>
                <p className="text-3xl font-bold text-green-400">{studentsWithLinks.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${mutedText} mb-1`}>Without Links</p>
                <p className="text-3xl font-bold text-orange-400">{studentsWithoutLinks.length}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-orange-400"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className={glassCard}>
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Video className="h-5 w-5 text-[#F58120]" />
            Student Videos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${glassInput}`}
                />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto">
              <div className="w-full md:w-[200px]">
                <Select onValueChange={setCategoryFilter} value={categoryFilter}>
                  <SelectTrigger className={glassSelectTrigger}>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by grade" />
                  </SelectTrigger>
                  <SelectContent className={glassSelectContent}>
                    <SelectGroup>
                      <SelectLabel className="text-white/70">Filter by Grade</SelectLabel>
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Grades</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-white/70">Basic Level</SelectLabel>
                      <SelectItem value="grade_3_5_basic" className="text-white hover:bg-white/10">Grade 3-5 (Basic)</SelectItem>
                      <SelectItem value="grade_6_8_basic" className="text-white hover:bg-white/10">Grade 6-8 (Basic)</SelectItem>
                      <SelectItem value="grade_9_12_basic" className="text-white hover:bg-white/10">Grade 9-12 (Basic)</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-white/70">Advance Level</SelectLabel>
                      <SelectItem value="grade_3_5_advance" className="text-white hover:bg-white/10">Grade 3-5 (Advance)</SelectItem>
                      <SelectItem value="grade_6_8_advance" className="text-white hover:bg-white/10">Grade 6-8 (Advance)</SelectItem>
                      <SelectItem value="grade_9_12_advance" className="text-white hover:bg-white/10">Grade 9-12 (Advance)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[220px]">
                <Select onValueChange={setSchoolFilter} value={schoolFilter}>
                  <SelectTrigger className={glassSelectTrigger}>
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by school" />
                  </SelectTrigger>
                  <SelectContent className={glassSelectContent}>
                    <SelectGroup>
                      <SelectLabel className="text-white/70">Filter by School</SelectLabel>
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Schools</SelectItem>
                      {schoolOptions.map((school) => (
                        <SelectItem key={school} value={school} className="text-white hover:bg-white/10">
                          {school}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-[220px]">
                <Select onValueChange={setSubmissionFilter} value={submissionFilter}>
                  <SelectTrigger className={glassSelectTrigger}>
                    <Video className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by submission" />
                  </SelectTrigger>
                  <SelectContent className={glassSelectContent}>
                    <SelectGroup>
                      <SelectLabel className="text-white/70">Submission Status</SelectLabel>
                      <SelectItem value="all" className="text-white hover:bg-white/10">All Students</SelectItem>
                      <SelectItem value="submitted" className="text-white hover:bg-white/10">Submitted Videos</SelectItem>
                      <SelectItem value="not_submitted" className="text-white hover:bg-white/10">Not Submitted</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {(searchQuery || categoryFilter !== 'all' || schoolFilter !== 'all' || submissionFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                  setSchoolFilter('all');
                  setSubmissionFilter('all');
                }}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                Clear Filters
              </Button>
            )}
          </div>

          {/* Students Table */}
          {students.length > 0 ? (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-black/50 backdrop-blur-xl z-10">
                    <TableRow className="border-white/10">
                      <TableHead className="text-white">Student Name</TableHead>
                      <TableHead className="text-white">School</TableHead>
                      <TableHead className="text-white">Email</TableHead>
                      <TableHead className="text-white">Grade</TableHead>
                      <TableHead className="text-white">Drive Link</TableHead>
                      <TableHead className="text-white text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student._id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-white font-medium">{student.name}</TableCell>
                        <TableCell className="text-white">{student.school || '-'}</TableCell>
                        <TableCell className="text-white">{student.email}</TableCell>
                        <TableCell>
                          <Badge className={badgeAccent}>
                            {getCategoryLabel(student.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.driveLink && student.driveLink.trim() !== '' ? (
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                Provided
                              </Badge>
                            </div>
                          ) : (
                            <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                              Not Provided
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {student.driveLink && student.driveLink.trim() !== '' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(student.driveLink, '_blank')}
                              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Link
                            </Button>
                          ) : (
                            <span className={mutedText}>-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 rounded-lg bg-white/5 border border-white/10">
              <Video className="h-12 w-12 mx-auto mb-3 text-white/40" />
              <p className="text-white/70">
                {searchQuery || categoryFilter !== 'all' || schoolFilter !== 'all' || submissionFilter !== 'all'
                  ? 'No students found matching your criteria'
                  : 'No students found'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentVideos;

