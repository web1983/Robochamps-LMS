import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useGetCreatorCourseQuery } from '@/features/api/CourseApi'
import { Edit, Search } from 'lucide-react'
import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LoadingSpinner from '@/components/LoadingSpinner'
import { glassCard, glassInput, glassSelectTrigger, glassSelectContent, accentButton, subtleButton, mutedText, badgeAccent } from '../theme'

const CourseTable = () => {
  const { isAuthenticated, isLoading: authLoading } = useSelector((store) => store.auth);
  const {data, isLoading, isError, error} = useGetCreatorCourseQuery(undefined, {
    skip: !isAuthenticated || authLoading
  });
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Category mapping for display
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

  // Filter and sort courses based on search query and category
  const filteredCourses = useMemo(() => {
    if (!data?.courses) return [];
    
    // First filter the courses
    const filtered = data.courses.filter((course) => {
      // Filter by search query
      const matchesSearch = course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Filter by category
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Then sort by creation date (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA; // Descending order (newest first)
    });
  }, [data?.courses, searchQuery, categoryFilter]);

  if(isLoading) return (
    <div className="py-20">
      <LoadingSpinner />
    </div>
  )

  if(isError) {
    return (
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Courses</p>
            <h1 className="text-3xl font-semibold">Course Library</h1>
            <p className={mutedText}>Search, filter, and manage every course in the catalog.</p>
          </div>
          <Button className={`${accentButton} w-full sm:w-auto`} onClick={()=> navigate(`create`)}>
            Create new course
          </Button>
        </div>
        <div className={`${glassCard} p-8 text-center`}>
          <p className="text-red-400 text-lg font-semibold mb-2">Failed to load courses</p>
          <p className={`${mutedText} text-sm`}>
            {error?.data?.message || error?.message || 'An error occurred while fetching courses. Please try again.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">Courses</p>
            <h1 className="text-3xl font-semibold">Course Library</h1>
            <p className={mutedText}>Search, filter, and manage every course in the catalog.</p>
          </div>
          <Button className={`${accentButton} w-full sm:w-auto`} onClick={()=> navigate(`create`)}>
            Create new course
          </Button>
        </div>

        <div className={`${glassCard} space-y-4 p-6`}>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                type="text"
                placeholder="Search courses by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${glassInput} pl-12`}
              />
            </div>

            <div className="w-full md:w-64">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className={glassSelectTrigger}>
                  <SelectValue placeholder="Filter by Category" />
                </SelectTrigger>
                <SelectContent className={glassSelectContent}>
                  <SelectGroup>
                    <SelectLabel className="text-white/60">All Categories</SelectLabel>
                    <SelectItem value="all">All Categories</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-white/60">Basic Level</SelectLabel>
                    <SelectItem value="grade_3_5_basic">Grade 3-5 (Basic)</SelectItem>
                    <SelectItem value="grade_6_8_basic">Grade 6-8 (Basic)</SelectItem>
                    <SelectItem value="grade_9_12_basic">Grade 9-12 (Basic)</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-white/60">Advance Level</SelectLabel>
                    <SelectItem value="grade_3_5_advance">Grade 3-5 (Advance)</SelectItem>
                    <SelectItem value="grade_6_8_advance">Grade 6-8 (Advance)</SelectItem>
                    <SelectItem value="grade_9_12_advance">Grade 9-12 (Advance)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/70">
            <p>
              Showing {filteredCourses.length} of {data?.courses?.length || 0} courses
            </p>
            {(searchQuery || categoryFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('all');
                }}
                className={subtleButton}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>

    <div className={`${glassCard} overflow-hidden`}>
      <div className="overflow-x-auto">
        <Table className="text-white">
          <TableCaption className="text-white/60">A list of your recent courses.</TableCaption>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead className="text-white/70">Status</TableHead>
              <TableHead className="text-white/70">Title</TableHead>
              <TableHead className="text-white/70">Category</TableHead>
              <TableHead className="text-right text-white/70">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <TableRow key={course._id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="text-white">
                    <Badge className={course.isPublished ? badgeAccent : 'border border-white/20 bg-white/10 text-white'}>
                      {course.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-white">{course.courseTitle}</TableCell>
                  <TableCell className="text-white">{getCategoryLabel(course.category) || "N/A"}</TableCell>
                  <TableCell className="text-right text-white">
                    <Button size="sm" className="text-white hover:text-[#F58120]" variant="ghost" onClick={() => navigate(`${course._id}`)}><Edit/></Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className={`py-8 text-center ${mutedText}`}>
                  No courses found matching your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>

    </div>
  )
}

export default CourseTable