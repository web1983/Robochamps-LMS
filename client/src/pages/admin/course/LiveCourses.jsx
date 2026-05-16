import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetCreatorCourseQuery,
  useToggleLiveCourseMutation,
} from "@/features/api/CourseApi";
import { toast } from "sonner";
import { Loader2, Power, PowerOff, Filter, Search } from "lucide-react";
import { useSelector } from "react-redux";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { glassCard, glassInput, glassSelectTrigger, glassSelectContent, accentButton, subtleButton, mutedText, badgeAccent } from "../theme";

const LiveCourses = () => {
  const { isAuthenticated, isLoading: authLoading } = useSelector((store) => store.auth);
  const { data, isLoading, isError, error, refetch, isFetching } = useGetCreatorCourseQuery(undefined, {
    skip: !isAuthenticated || authLoading
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toggleLiveCourse, { isLoading: isToggling }] =
    useToggleLiveCourseMutation();

  const courses = data?.courses || [];

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "live"
          ? course.isLive
          : !course.isLive;

      const matchesCategory =
        categoryFilter === "all" ? true : course.category === categoryFilter;

      const title = course.courseTitle?.toLowerCase() || "";
      const matchesSearch = title.includes(searchQuery.toLowerCase());

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [courses, statusFilter, categoryFilter, searchQuery]);

  const categoryOptions = useMemo(() => {
    const uniqueCategories = new Set(courses.map((course) => course.category));
    return Array.from(uniqueCategories).sort();
  }, [courses]);

  const handleToggleLive = async (course) => {
    if (!course.isPublished && !course.isLive) {
      toast.error("Publish the course before making it live.");
      return;
    }

    try {
      const live = !course.isLive;
      await toggleLiveCourse({ courseId: course._id, live }).unwrap();
      toast.success(
        live
          ? "Course is now visible on the live courses list."
          : "Course removed from the live list."
      );
      refetch();
    } catch (error) {
      toast.error(
        error?.data?.message || "Failed to update live course status."
      );
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="space-y-6 text-white">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">Visibility</p>
          <h1 className="text-3xl font-bold">Live Courses</h1>
          <p className={mutedText}>
            Select which published courses should appear on the live courses list.
          </p>
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
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Visibility</p>
        <h1 className="text-3xl font-bold">Live Courses</h1>
        <p className={mutedText}>
          Select which published courses should appear on the live courses list.
        </p>
      </div>

      <div className={`${glassCard} grid grid-cols-1 gap-4 p-6 xl:grid-cols-4`}>
        <div className="relative w-full xl:col-span-2">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search course by name..."
            className={`${glassInput} pl-12`}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-white/60">Status</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={glassSelectTrigger}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className={glassSelectContent}>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="live">Live Only</SelectItem>
              <SelectItem value="not_live">Not Live</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wide text-white/60">Category</span>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className={glassSelectTrigger}>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className={glassSelectContent}>
              <SelectItem value="all">All Categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching || isLoading}
            className="w-full"
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing
              </>
            ) : (
              "Refresh"
            )}
          </Button>
        </div>
      </div>

      <div className={`${glassCard} overflow-hidden`}>
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead className="text-white/70">Course Name</TableHead>
              <TableHead className="text-white/70">Category</TableHead>
              <TableHead className="text-white/70">Published</TableHead>
              <TableHead className="text-white/70">Live Status</TableHead>
              <TableHead className="text-right text-white/70">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className={`py-10 text-center ${mutedText}`}>
                  No courses found for the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredCourses.map((course) => (
                <TableRow key={course._id} className="border-white/10 hover:bg-white/5">
                  <TableCell className="font-medium text-white">
                    {course.courseTitle || "Untitled Course"}
                  </TableCell>
                  <TableCell className="text-white">
                    <Badge className={`${badgeAccent} capitalize`}>
                      {formatCategory(course.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    {course.isPublished ? (
                      <Badge className="border-none bg-emerald-500/20 text-emerald-300">
                        Published
                      </Badge>
                    ) : (
                      <Badge className="border-none bg-orange-500/20 text-orange-200">
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white">
                    {course.isLive ? (
                      <Badge className="border-none bg-blue-500/20 text-blue-200">
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-white/20 text-white/70">
                        Not Live
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-white">
                    <Button
                      variant={course.isLive ? "outline" : "default"}
                      size="sm"
                      className={course.isLive ? subtleButton : accentButton}
                      onClick={() => handleToggleLive(course)}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : course.isLive ? (
                        <>
                          <PowerOff className="h-4 w-4 mr-2" />
                          Remove Live
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Make Live
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const formatCategory = (category) => {
  const categoryMap = {
    grade_3_5_basic: "Grade 3-5 (Basic)",
    grade_6_8_basic: "Grade 6-8 (Basic)",
    grade_9_12_basic: "Grade 9-12 (Basic)",
    grade_3_5_advance: "Grade 3-5 (Advance)",
    grade_6_8_advance: "Grade 6-8 (Advance)",
    grade_9_12_advance: "Grade 9-12 (Advance)",
  };

  return categoryMap[category] || category || "Unknown";
};

export default LiveCourses;

