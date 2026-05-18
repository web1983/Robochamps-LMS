import React from "react";
import { useGetMyEnrollmentsQuery } from "@/features/api/enrollmentApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import LoadingSpinner from "@/components/LoadingSpinner";
import { BookMarked, Play, Video } from "lucide-react";
import { getCategoryLabel } from "@/lib/categoryUtils";

const MyLearning = () => {
  const { user } = useSelector((store) => store.auth);
  const { data, isLoading, isError } = useGetMyEnrollmentsQuery();
  const navigate = useNavigate();

  const enrollments = (data?.enrollments || []).filter((e) => e.courseId);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center bg-no-repeat">
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-12 pt-24 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#F58120] p-3 shadow-lg">
              <BookMarked className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">My Learning</h1>
              <p className="mt-1 text-white/70">
                {user?.category
                  ? `Watching: ${getCategoryLabel(user.category)}`
                  : "Select a category to see courses"}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
            <Link to="/select-category">Change category</Link>
          </Button>
        </div>

        {isError && (
          <p className="text-center text-red-400">Failed to load your courses.</p>
        )}

        {!isError && enrollments.length === 0 && (
          <Card className="border border-white/10 bg-white/5 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <Video className="mx-auto mb-4 h-12 w-12 text-white/40" />
              <p className="text-lg text-white/80">No courses started yet.</p>
              <Button
                className="mt-6 bg-[#F58120] hover:bg-[#F58120]/90"
                onClick={() => navigate("/")}
              >
                Browse videos
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => {
            const course = enrollment.courseId;
            return (
              <Card
                key={enrollment._id}
                className="overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm transition hover:border-[#F58120]/50"
              >
                {course?.courseThumbnail && (
                  <img
                    src={course.courseThumbnail}
                    alt={course.courseTitle}
                    className="h-40 w-full object-cover"
                  />
                )}
                <CardContent className="p-5">
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">
                    {course?.courseTitle || "Course"}
                  </h3>
                  <p className="mb-4 text-sm text-white/60">
                    {enrollment.videoWatched ? "Video watched" : "Not started"}
                  </p>
                  <Button
                    className="w-full bg-[#F58120] hover:bg-[#F58120]/90"
                    onClick={() => navigate(`/course/${course._id}/video`)}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Watch video
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;
