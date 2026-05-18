import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Course from "./Course";
import { useGetLiveCoursesQuery, useGetLiveCoursesByCategoryQuery } from "@/features/api/CourseApi";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/categoryUtils";

const Courses = () => {
  const { user, isAuthenticated } = useSelector(store => store.auth);
  const needsCategory = isAuthenticated && user?.role === "student" && !user?.category;
  
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
  const courseList = data?.courses || [];
  const meta = filteredCoursesData?.meta;

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
        {needsCategory && (
          <div className="mb-10 rounded-2xl border border-[#F58120]/40 bg-[#F58120]/10 p-6 text-center">
            <p className="mb-4 text-white">Choose your grade to see matching videos.</p>
            <Button asChild className="bg-[#F58120] hover:bg-[#F58120]/90">
              <Link to="/select-category">Select category</Link>
            </Button>
          </div>
        )}

        {isAuthenticated && user?.category && (
          <p className="mb-8 text-center text-white/70">
            Showing courses for <span className="font-semibold text-[#F58120]">{getCategoryLabel(user.category)}</span>
            {" · "}
            <Link to="/select-category" className="underline hover:text-white">Change</Link>
          </p>
        )}

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 border border-white/20">
            <span className="text-sm font-semibold text-white">🤖 Robochamps Courses</span>
          </div>
          <h2 className="font-extrabold text-5xl mb-4 text-white">
            Master <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Robotics Skills</span>
          </h2>
          <p className="text-white/80 text-xl max-w-2xl mx-auto">
            Watch video lessons matched to your grade and level — learn robotics at your own pace
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, index) => (
                <CourseSkeleton key={index} />
              ))
            : courseList.length > 0 ? (
                courseList.map((course) => (
                  <Course key={course._id} course={course} />
                ))
              ) : (
                <EmptyCoursesMessage
                  isAuthenticated={isAuthenticated}
                  user={user}
                  needsCategory={needsCategory}
                  meta={meta}
                />
              )}
        </div>
      </div>
    </div>
  );
};

export default Courses;

function EmptyCoursesMessage({ isAuthenticated, user, needsCategory, meta }) {
  let title = "No live courses available yet";
  let detail = "Check back soon for new courses!";
  let action = null;

  if (needsCategory) {
    title = "Select your grade first";
    detail = "Courses are filtered by the grade and level you choose after login.";
    action = (
      <Button asChild className="mt-4 bg-[#F58120] hover:bg-[#F58120]/90">
        <Link to="/select-category">Choose grade & level</Link>
      </Button>
    );
  } else if (!isAuthenticated) {
    title = "Log in to see your courses";
    detail = "Sign in and pick your grade to watch videos matched to your class.";
    action = (
      <Button asChild className="mt-4 bg-[#F58120] hover:bg-[#F58120]/90">
        <Link to="/login">Login</Link>
      </Button>
    );
  } else if (user?.category && meta?.notLiveCount > 0) {
    title = `No live courses for ${getCategoryLabel(user.category)}`;
    detail = `${meta.publishedInCategory} course(s) exist for this grade but ${meta.notLiveCount} are not marked as Live in admin. Ask an instructor to enable them under Admin → Live Courses, or try a different level (e.g. Basic).`;
    action = (
      <Button asChild variant="outline" className="mt-4 border-white/30 text-white hover:bg-white/10">
        <Link to="/select-category">Try another grade / level</Link>
      </Button>
    );
  } else if (user?.category) {
    title = `No courses for ${getCategoryLabel(user.category)}`;
    detail =
      "There are no published live videos for this grade and level yet. Try changing your category or contact your instructor.";
    action = (
      <Button asChild variant="outline" className="mt-4 border-white/30 text-white hover:bg-white/10">
        <Link to="/select-category">Change category</Link>
      </Button>
    );
  }

  return (
    <div className="col-span-full text-center py-16">
      <div className="mx-auto max-w-lg rounded-xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
        <p className="mb-2 text-lg text-white/90">{title}</p>
        <p className="text-sm text-white/60">{detail}</p>
        {action}
      </div>
      </div>
  );
}

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
