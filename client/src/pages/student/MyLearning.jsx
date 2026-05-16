import React from "react";
import { useGetMyEnrollmentsQuery, useGetCertificateStatusQuery } from "@/features/api/enrollmentApi";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import RobowunderCertificate from "@/components/RobowunderCertificate";
import LoadingSpinner from "@/components/LoadingSpinner";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play,
  Award,
  TrendingUp,
  BookMarked
} from "lucide-react";

const MyLearning = () => {
  const { user } = useSelector(store => store.auth);
  const { data, isLoading, isError } = useGetMyEnrollmentsQuery();
  const { data: certificateData } = useGetCertificateStatusQuery(undefined, {
    skip: !user || user?.role !== 'student'
  });
  const navigate = useNavigate();
  
  // Filter out enrollments with null/undefined courseId
  const allEnrollments = data?.enrollments || [];
  const enrollments = allEnrollments.filter(enrollment => enrollment.courseId);
  
  const certificateEligible = certificateData?.eligible || false;
  const certificateInfo = certificateData?.certificateData;

  // Helper function to get category label
  const getCategoryLabel = (category) => {
    const labels = {
      'grade_3_5_basic': 'Grade 3-5 (Basic)',
      'grade_6_8_basic': 'Grade 6-8 (Basic)',
      'grade_9_12_basic': 'Grade 9-12 (Basic)',
      'grade_3_5_advance': 'Grade 3-5 (Advance)',
      'grade_6_8_advance': 'Grade 6-8 (Advance)',
      'grade_9_12_advance': 'Grade 9-12 (Advance)',
    };
    return labels[category] || category;
  };

  // Calculate progress percentage
  const calculateProgress = (enrollment) => {
    let progress = 0;
    if (enrollment.videoWatched) progress += 50;
    if (enrollment.testAttempts && enrollment.testAttempts.length > 0) progress += 50;
    return progress;
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-start md:items-center gap-3 mb-4">
            <div className="p-3 bg-[#F58120] rounded-xl shadow-lg">
              <BookMarked className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                My Learning Journey
              </h1>
              <p className="text-white/70 mt-1">Track your progress and continue where you left off</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 font-medium">Total Courses</p>
                    <p className="text-3xl font-bold text-white mt-1">{enrollments.length}</p>
                  </div>
                  <div className="p-3 bg-white/10 rounded-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 font-medium">Completed</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">
                      {enrollments.filter(e => {
                        const lastAttempt = e.testAttempts && e.testAttempts.length > 0 
                          ? e.testAttempts[e.testAttempts.length - 1] 
                          : null;
                        return e.videoWatched && lastAttempt && lastAttempt.score >= 60;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/50">
                    <Award className="h-6 w-6 text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70 font-medium">In Progress</p>
                    <p className="text-3xl font-bold text-[#F58120] mt-1">
                      {enrollments.filter(e => {
                        const lastAttempt = e.testAttempts && e.testAttempts.length > 0 
                          ? e.testAttempts[e.testAttempts.length - 1] 
                          : null;
                        return !e.videoWatched || !lastAttempt || lastAttempt.score < 60;
                      }).length}
                    </p>
                  </div>
                  <div className="p-3 bg-[#F58120]/20 rounded-lg border border-[#F58120]/50">
                    <TrendingUp className="h-6 w-6 text-[#F58120]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Certificate Section */}
        {certificateEligible && certificateInfo && (
          <Card className="mb-12 overflow-hidden bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-500/50 shadow-2xl">
            <CardHeader className="bg-yellow-500/20 backdrop-blur-sm border-b border-yellow-500/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F58120] rounded-xl shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    🎉 Congratulations!
                  </h2>
                  <p className="text-white/80 mt-1">You've completed all courses and earned your certificate!</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white/5 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <RobowunderCertificate 
                  userName={certificateInfo.userName}
                  completionDate={certificateInfo.completionDate}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Courses Section */}
        <div>
        {isError ? (
            <Card className="p-12 text-center bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-red-500/20 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border border-red-500/50">
                  <XCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="text-white text-lg">Failed to load your courses. Please try again.</p>
              </CardContent>
            </Card>
          ) : enrollments.length === 0 ? (
            <Card className="p-12 text-center bg-white/5 backdrop-blur-sm border-2 border-dashed border-white/20 shadow-2xl">
              <CardContent className="p-0">
                <div className="bg-white/10 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-white/50" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Courses Yet</h3>
                <p className="text-white/70 mb-6">Start your robotics journey by enrolling in a course!</p>
                <Button 
                  onClick={() => navigate("/")}
                  className="bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {enrollments.map((enrollment) => {
                const course = enrollment.courseId;
                
                // Safety check: Skip if course data is missing
                if (!course || !course._id) {
                  return null;
                }
                
                const progress = calculateProgress(enrollment);
                const lastAttempt = enrollment.testAttempts && enrollment.testAttempts.length > 0 
                  ? enrollment.testAttempts[enrollment.testAttempts.length - 1] 
                  : null;

                return (
                  <Card 
                    key={enrollment._id} 
                    className="group overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-orange-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-2"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden bg-black/20">
                        {course.courseThumbnail ? (
                          <img 
                            src={course.courseThumbnail} 
                            alt={course.courseTitle}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="h-16 w-16 text-white/50" />
                          </div>
                        )}
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        {/* Progress Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm p-2 z-10">
                          <div className="flex items-center justify-between text-white text-xs mb-1">
                            <span className="font-medium">Progress</span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <div className="w-full bg-white/30 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-[#F58120] to-orange-500 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6 flex flex-col bg-transparent">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          <div className="bg-[#F58120] text-white px-3 py-1.5 text-xs font-semibold rounded-md pointer-events-none">
                            {course.courseLevel}
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-semibold rounded-md border border-white/30 pointer-events-none">
                            {getCategoryLabel(course.category)}
                          </div>
                          {(enrollment.videoWatched && lastAttempt && lastAttempt.score >= 60) && (
                            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 text-xs font-semibold rounded-md flex items-center gap-1 pointer-events-none">
                              <Award className="h-3 w-3" />
                              Completed
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-bold text-xl text-white mb-2 line-clamp-2 group-hover:text-orange-400 transition-colors">
                          {course.courseTitle}
                        </h3>

                        {/* Subtitle */}
                        <p className="text-sm text-white/70 mb-4 line-clamp-2 flex-1">
                          {course.courseSubTitle || course.subTitle || 'No description available'}
                        </p>

                        {/* Status Section */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            {enrollment.videoWatched ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Clock className="h-4 w-4 text-orange-400" />
                            )}
                            <span className={enrollment.videoWatched ? "text-green-400 font-medium" : "text-orange-400 font-medium"}>
                              {enrollment.videoWatched ? "Video Watched" : "Video Pending"}
                            </span>
                          </div>

                          {lastAttempt && (
                            <div className="flex items-center gap-2 text-sm">
                              {lastAttempt.score >= 60 ? (
                                <CheckCircle className="h-4 w-4 text-green-400" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-400" />
                              )}
                              <span className={lastAttempt.score >= 60 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                                Test Score: {lastAttempt.score}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Action Button */}
                        <Button
                          onClick={() => navigate(`/course/${course._id}`)}
                          className="w-full bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 group"
                        >
                          <Play className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          {(enrollment.videoWatched && lastAttempt && lastAttempt.score >= 60) ? "Review Course" : "Continue Learning"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default MyLearning;

// ✅ Skeleton Component for loading state
const MyLearningSkeleton = () => (
  <div className="space-y-6">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {[...Array(3)].map((_, index) => (
      <div
        key={index}
          className="h-28 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-pulse"
        ></div>
      ))}
    </div>
    
    {/* Courses Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, index) => (
        <div
          key={index}
          className="h-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl animate-pulse"
      ></div>
    ))}
    </div>
  </div>
);
