import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Video,
  FileCheck,
  Award,
  Target,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useGetDashboardStatsQuery } from '@/features/api/analyticsApi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { glassCard, mutedText, badgeAccent } from './theme';

const Dashboard = () => {
  const { data, isLoading, isError } = useGetDashboardStatsQuery();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !data) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-white shadow-[0_0_30px_rgba(0,0,0,0.35)]">
        <p className="text-center text-lg text-red-300">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const stats = data.stats;

  const statCards = [
    {
      title: 'Total Students',
      value: stats.users.totalStudents,
      icon: Users,
      accent: 'from-[#F58120]/40 via-[#F58120]/10 to-transparent',
      description: `+${stats.users.recentUsers} this week`,
    },
    {
      title: 'Total Courses',
      value: stats.courses.totalCourses,
      icon: BookOpen,
      accent: 'from-purple-500/40 via-purple-500/10 to-transparent',
      description: `${stats.courses.publishedCourses} published`,
    },
    {
      title: 'Total Enrollments',
      value: stats.enrollments.totalEnrollments,
      icon: GraduationCap,
      accent: 'from-emerald-500/40 via-emerald-500/10 to-transparent',
      description: `+${stats.enrollments.recentEnrollments} this week`,
    },
    {
      title: 'Watched Videos',
      value: stats.enrollments.studentsWatchedVideo,
      icon: Video,
      accent: 'from-orange-400/40 via-orange-400/10 to-transparent',
      description: 'Students engaged',
    },
    {
      title: 'Took Tests',
      value: stats.enrollments.studentsTookTest,
      icon: FileCheck,
      accent: 'from-pink-500/40 via-pink-500/10 to-transparent',
      description: 'Test attempts',
    },
    {
      title: 'Completed Courses',
      value: stats.enrollments.studentsCompleted,
      icon: Award,
      accent: 'from-amber-400/40 via-amber-400/10 to-transparent',
      description: 'Certificates issued',
    },
    {
      title: 'Average Score',
      value: `${stats.performance.averageTestScore}%`,
      icon: Target,
      accent: 'from-cyan-400/40 via-cyan-400/10 to-transparent',
      description: 'Test performance',
    },
    {
      title: 'Pass Rate',
      value: `${stats.performance.passRate}%`,
      icon: TrendingUp,
      accent: 'from-emerald-400/40 via-emerald-400/10 to-transparent',
      description: 'Success rate',
    },
  ];

  const engagementStats = [
    {
      title: 'Video Engagement Rate',
      value:
        stats.enrollments.totalEnrollments > 0
          ? Math.round((stats.enrollments.studentsWatchedVideo / stats.enrollments.totalEnrollments) * 100)
          : 0,
      details: `${stats.enrollments.studentsWatchedVideo} of ${stats.enrollments.totalEnrollments} students`,
    },
    {
      title: 'Test Participation Rate',
      value:
        stats.enrollments.totalEnrollments > 0
          ? Math.round((stats.enrollments.studentsTookTest / stats.enrollments.totalEnrollments) * 100)
          : 0,
      details: `${stats.enrollments.studentsTookTest} students took tests`,
    },
    {
      title: 'Completion Rate',
      value:
        stats.enrollments.totalEnrollments > 0
          ? Math.round((stats.enrollments.studentsCompleted / stats.enrollments.totalEnrollments) * 100)
          : 0,
      details: `${stats.enrollments.studentsCompleted} certificates issued`,
    },
  ];

  return (
    <div className="space-y-10 text-white">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.4em] text-white/50">Overview</p>
        <h1 className="text-4xl font-semibold">Dashboard Insights</h1>
        <p className={mutedText}>Welcome back! Track performance, students, and course engagement at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, value, icon, accent, description }) => {
          const Icon = icon;
          return (
            <Card key={title} className={`${glassCard} h-full`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className={`text-sm ${mutedText}`}>{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-xs text-white/60">{description}</p>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-white/10 to-transparent p-3">
                    <Icon className="h-6 w-6 text-[#F58120]" />
                  </div>
                </div>
                <div className={`mt-4 h-1.5 w-full rounded-full bg-gradient-to-r ${accent}`} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className={glassCard}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#F58120]" />
              Popular Courses
            </CardTitle>
            <CardDescription className="text-white/60">Most enrolled courses</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.popularCourses && stats.popularCourses.length > 0 ? (
              <div className="space-y-4">
                {stats.popularCourses.map((course, index) => (
                  <div
                    key={course.courseName}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="relative">
                      <img
                        src={course.thumbnail || 'https://via.placeholder.com/80'}
                        alt={course.courseName}
                        className="h-16 w-16 rounded-xl object-cover"
                      />
                      <Badge className={`${badgeAccent} absolute -top-2 -right-2`}>#{index + 1}</Badge>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">{course.courseName}</h4>
                      <p className={`flex items-center gap-2 text-sm ${mutedText}`}>
                        <Users className="h-4 w-4" />
                        {course.enrollmentCount} students enrolled
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`py-8 text-center ${mutedText}`}>No course data available</p>
            )}
          </CardContent>
        </Card>

        <Card className={glassCard}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#F58120]" />
              Recent Enrollments
            </CardTitle>
            <CardDescription className="text-white/60">Latest student enrollments</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.latestEnrollments && stats.latestEnrollments.length > 0 ? (
              <div className="space-y-4">
                {stats.latestEnrollments.slice(0, 5).map((enrollment) => (
                  <div
                    key={enrollment._id}
                    className="flex items-center gap-4 rounded-2xl border border-white/5 bg-white/5 p-4 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={enrollment.userId?.photoUrl} alt={enrollment.userId?.name} />
                      <AvatarFallback className="bg-[#F58120]/20 text-[#F58120]">
                        {enrollment.userId?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{enrollment.userId?.name}</p>
                      <p className={`text-xs ${mutedText}`}>{enrollment.courseId?.courseTitle}</p>
                    </div>
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className={`py-8 text-center ${mutedText}`}>No recent enrollments</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={glassCard}>
        <CardHeader>
          <CardTitle>Engagement Snapshot</CardTitle>
          <CardDescription className="text-white/60">Student engagement overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {engagementStats.map(({ title, value, details }) => (
              <div
                key={title}
                className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center shadow-inner shadow-black/10"
              >
                <p className="text-sm text-white/70">{title}</p>
                <p className="mt-3 text-4xl font-semibold text-[#F58120]">{value}%</p>
                <p className={`mt-2 text-xs ${mutedText}`}>{details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
