import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCourseByIdQuery } from '@/features/api/CourseApi';
import { useGetEnrollmentStatusQuery, useEnrollCourseMutation } from '@/features/api/enrollmentApi';
import { useSelector } from 'react-redux';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Clock, Users, Award, CheckCircle, Video, Play, Star, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { getCategoryLabel } from '@/lib/categoryUtils';

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector(store => store.auth);

  const { data, isLoading, isError } = useGetCourseByIdQuery(courseId);
  const { data: enrollmentData, refetch: refetchEnrollment } = useGetEnrollmentStatusQuery(courseId, {
    skip: !isAuthenticated || user?.role === 'instructor'
  });
  const [enrollCourse, { isLoading: enrolling }] = useEnrollCourseMutation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [courseId]);

  useEffect(() => {
    if (isAuthenticated && user?.role !== 'instructor') {
      refetchEnrollment();
    }
  }, [courseId, isAuthenticated, user?.role, refetchEnrollment]);

  if (isLoading) return <LoadingSpinner />;

  if (isError || !data?.course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat pt-24">
        <Card className="max-w-md mx-4 shadow-2xl bg-white/5 backdrop-blur-sm border border-white/10">
          <CardContent className="p-12 text-center">
            <AlertTriangle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">Course Not Found</h2>
            <Button onClick={() => navigate('/')} className="bg-[#F58120] hover:bg-[#F58120]/90 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const course = data.course;
  const isEnrolled = enrollmentData?.enrolled || false;

  const goToVideo = () => navigate(`/course/${courseId}/video`);

  const handleEnrollClick = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to watch this course");
      navigate('/login');
      return;
    }

    if (!user?.category) {
      toast.error("Please select your grade first");
      navigate('/select-category');
      return;
    }

    try {
      await enrollCourse(courseId).unwrap();
      toast.success("Starting video...");
      setTimeout(goToVideo, 500);
    } catch (error) {
      toast.error(error?.data?.message || "Failed to start course");
    }
  };

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-contain md:bg-top bg-no-repeat">
      <div className="relative text-white overflow-hidden pt-24 z-10">
        <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 mb-6 border border-white/20 bg-white/5"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Courses
          </Button>

          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3 space-y-6">
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-white/20 text-white border border-white/30 px-4 py-1.5">
                  {getCategoryLabel(course.category)}
                </Badge>
                {isEnrolled && (
                  <Badge className="bg-green-500 text-white px-4 py-1.5 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Enrolled
                  </Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold">{course.courseTitle}</h1>
              {course.subTitle && (
                <p className="text-xl text-white/70">{course.subTitle}</p>
              )}

              <div className="flex flex-wrap gap-4 pt-2">
                {course.videoDuration && (
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                    <Clock className="h-5 w-5" />
                    <span>{course.videoDuration}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                  <Star className="h-5 w-5 text-[#F58120]" />
                  <span>Free Course</span>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-[#F58120] hover:bg-[#F58120]/90 font-bold px-10 py-6 text-lg"
                onClick={isEnrolled ? goToVideo : handleEnrollClick}
                disabled={enrolling}
              >
                <Play className="mr-2 h-5 w-5" />
                {enrolling ? 'Please wait...' : isEnrolled ? 'Watch Video' : 'Start Watching'}
              </Button>
            </div>

            <div className="lg:col-span-2">
              <img
                src={course.courseThumbnail || "https://via.placeholder.com/600x400?text=Course"}
                alt={course.courseTitle}
                className="w-full h-[350px] object-cover rounded-2xl border-4 border-white/20 shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 z-10">
        {course.description && (
          <Card className="bg-white/5 border border-white/10 mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                About This Course
              </h2>
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            </CardContent>
          </Card>
        )}

        {course.learningOutcomes?.length > 0 && (
          <Card className="bg-white/5 border border-white/10">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">What You&apos;ll Learn</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {course.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <CheckCircle className="h-5 w-5 text-[#F58120] shrink-0" />
                    <p className="text-white/80">{outcome}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseDetail;
