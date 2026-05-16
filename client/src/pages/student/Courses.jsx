import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Course from "./Course";
import { useGetLiveCoursesQuery, useGetLiveCoursesByCategoryQuery } from "@/features/api/CourseApi";
import { useSelector } from "react-redux";

const Courses = () => {
  const { user, isAuthenticated } = useSelector(store => store.auth);
  
  // Use filtered API for authenticated students, otherwise show all published courses
  const shouldUseFilteredAPI = isAuthenticated && user?.role === 'student';
  
  const { data: allCoursesData, isLoading: allCoursesLoading, isError: allCoursesError } = useGetLiveCoursesQuery(undefined, {
    skip: shouldUseFilteredAPI
  });
  
  const { data: filteredCoursesData, isLoading: filteredCoursesLoading, isError: filteredCoursesError } = useGetLiveCoursesByCategoryQuery(undefined, {
    skip: !shouldUseFilteredAPI
  });

  const data = shouldUseFilteredAPI ? filteredCoursesData : allCoursesData;
  const isLoading = shouldUseFilteredAPI ? filteredCoursesLoading : allCoursesLoading;
  const isError = shouldUseFilteredAPI ? filteredCoursesError : allCoursesError;

  if (isError) {
    return (
      <div className="bg-black py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-bold text-3xl text-center mb-10 text-red-600">
            Failed to load courses
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div id="courses-section" className="bg-transparent py-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
            <span className="text-sm font-semibold text-white">🤖 Championship Courses</span>
          </div>
          <h2 className="font-extrabold text-5xl mb-4 text-white">
            Master <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Robotics Skills</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto">
            Learn robotics concepts, build amazing projects, and prepare for the championship challenge
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <CourseSkeleton key={index} />
              ))
            : data?.courses && data.courses.length > 0 ? (
                data.courses.map((course) => (
                  <Course key={course._id} course={course} />
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <div className="inline-block p-8 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                    <p className="text-white/80 text-lg mb-2">No live courses available yet</p>
                    <p className="text-white/60 text-sm">Check back soon for new courses!</p>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
};

export default Courses;

// ✅ Updated Skeleton to match new card design
const CourseSkeleton = () => {
  return (
    <div className="bg-white/5 backdrop-blur-sm border-2 border-white/10 shadow-md rounded-2xl overflow-hidden animate-pulse">
      <div className="h-52 w-full rounded-none bg-white/10"></div>
      <div className="p-6 space-y-4 bg-transparent">
        <div className="space-y-3">
          <div className="h-6 w-full bg-white/10 rounded"></div>
          <div className="h-4 w-4/5 bg-white/10 rounded"></div>
          <div className="h-3 w-full bg-white/10 rounded"></div>
        </div>
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <div className="h-10 w-10 rounded-full bg-white/10"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-white/10 rounded"></div>
            <div className="h-4 w-28 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
