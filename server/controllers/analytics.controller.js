import User from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { Enrollment } from "../models/enrollment.model.js";

// Get Dashboard Statistics
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Users (students only)
    const totalStudents = await User.countDocuments({ role: "student" });

    // 2. Total Instructors
    const totalInstructors = await User.countDocuments({ role: "instructor" });

    // 3. Total Courses
    const totalCourses = await Course.countDocuments();

    // 4. Published Courses
    const publishedCourses = await Course.countDocuments({ isPublished: true });

    // 5. Total Enrollments
    const totalEnrollments = await Enrollment.countDocuments();

    // 6. Students who watched videos
    const studentsWatchedVideo = await Enrollment.countDocuments({ videoWatched: true });

    // 7. Students who took tests
    const studentsTookTest = await Enrollment.countDocuments({
      "testAttempts.0": { $exists: true } // Has at least one test attempt
    });

    // 8. Students who completed courses (has certificate)
    const studentsCompleted = await Enrollment.countDocuments({ certificateGenerated: true });

    // 9. Recent Users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({
      role: "student",
      createdAt: { $gte: sevenDaysAgo }
    });

    // 10. Recent Enrollments (last 7 days)
    const recentEnrollments = await Enrollment.countDocuments({
      enrolledAt: { $gte: sevenDaysAgo }
    });

    // 11. Average test score
    const enrollmentsWithTests = await Enrollment.find({
      "testAttempts.0": { $exists: true }
    });

    let totalScore = 0;
    let totalTests = 0;
    enrollmentsWithTests.forEach(enrollment => {
      enrollment.testAttempts.forEach(attempt => {
        totalScore += attempt.score;
        totalTests++;
      });
    });

    const averageTestScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;

    // 12. Pass Rate
    const passedTests = enrollmentsWithTests.filter(enrollment => 
      enrollment.testAttempts.some(attempt => attempt.score >= 70)
    ).length;
    const passRate = studentsTookTest > 0 
      ? Math.round((passedTests / studentsTookTest) * 100) 
      : 0;

    // 13. Popular Courses (by enrollment count)
    const popularCourses = await Enrollment.aggregate([
      {
        $group: {
          _id: "$courseId",
          enrollmentCount: { $sum: 1 }
        }
      },
      {
        $sort: { enrollmentCount: -1 }
      },
      {
        $limit: 5
      },
      {
        $lookup: {
          from: "courses",
          localField: "_id",
          foreignField: "_id",
          as: "courseDetails"
        }
      },
      {
        $unwind: "$courseDetails"
      },
      {
        $project: {
          courseName: "$courseDetails.courseTitle",
          enrollmentCount: 1,
          thumbnail: "$courseDetails.courseThumbnail"
        }
      }
    ]);

    // 14. Latest Enrollments
    const latestEnrollments = await Enrollment.find()
      .populate({
        path: "userId",
        select: "name email photoUrl"
      })
      .populate({
        path: "courseId",
        select: "courseTitle courseThumbnail"
      })
      .sort({ enrolledAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          totalStudents,
          totalInstructors,
          recentUsers,
        },
        courses: {
          totalCourses,
          publishedCourses,
          unpublishedCourses: totalCourses - publishedCourses,
        },
        enrollments: {
          totalEnrollments,
          recentEnrollments,
          studentsWatchedVideo,
          studentsTookTest,
          studentsCompleted,
        },
        performance: {
          averageTestScore,
          passRate,
        },
        popularCourses,
        latestEnrollments,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// Get User Growth Data (for charts)
export const getUserGrowthData = async (req, res) => {
  try {
    const { period = "month" } = req.query; // day, week, month, year

    let groupByFormat;
    let dateFilter;

    switch (period) {
      case "day":
        groupByFormat = "%Y-%m-%d";
        dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case "week":
        groupByFormat = "%Y-%U"; // Year-Week
        dateFilter = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000); // Last 12 weeks
        break;
      case "year":
        groupByFormat = "%Y";
        dateFilter = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000); // Last 5 years
        break;
      default: // month
        groupByFormat = "%Y-%m";
        dateFilter = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000); // Last 12 months
    }

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter },
          role: "student"
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: groupByFormat, date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res.status(200).json({
      success: true,
      data: userGrowth,
    });
  } catch (error) {
    console.error("Error fetching user growth data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user growth data",
      error: error.message,
    });
  }
};

// Get All Students Marks
export const getAllStudentsMarks = async (req, res) => {
  try {
    console.log('📊 Fetching students marks...');
    
    // Fetch all students with their enrollments
    const students = await User.find({ role: "student" })
      .select("name email photoUrl school category")
      .lean();

    console.log('👥 Total students found:', students.length);

    // Get all enrollments with course details
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        // Get all published courses in the student's category
        const allPublishedCoursesInCategory = await Course.find({
          isPublished: true,
          category: student.category,
        })
          .select("_id courseTitle")
          .lean();

        const totalCoursesInCategory = allPublishedCoursesInCategory.length;
        const allCourseIdsInCategory = allPublishedCoursesInCategory.map((c) =>
          c._id.toString()
        );

        console.log(`\n👤 Student: ${student.name}, Category: ${student.category}`);
        console.log(`📚 Total published courses in category: ${totalCoursesInCategory}`);

        // Get all enrollments for this student
        const enrollments = await Enrollment.find({ userId: student._id })
          .populate({
            path: "courseId",
            select: "courseTitle category isPublished",
          })
          .lean();

        console.log(`📝 Total enrollments: ${enrollments.length}`);

        // Get course with test questions for answer sheets
        const courseDetailsMap = new Map();
        const courseIds = enrollments
          .filter((e) => e.courseId?.isPublished && e.courseId?.category === student.category)
          .map((e) => e.courseId._id.toString());

        if (courseIds.length > 0) {
          const coursesWithTests = await Course.find({
            _id: { $in: courseIds },
          })
            .select("_id courseTitle testQuestions")
            .lean();

          coursesWithTests.forEach((course) => {
            courseDetailsMap.set(course._id.toString(), course);
          });
        }

        // Filter only published courses in student's category and calculate marks
        const courseMarks = enrollments
          .filter(
            (enrollment) =>
              enrollment.courseId?.isPublished &&
              enrollment.courseId?.category === student.category
          )
          .map((enrollment) => {
            // Get all test attempts with details
            const allAttempts = (enrollment.testAttempts || []).map((attempt) => {
              const score = attempt.score || 0;
              const correctAnswers = attempt.correctAnswers || 0;
              const totalQuestions = attempt.totalQuestions || 0;
              const wrongAnswers = attempt.wrongAnswers !== undefined 
                ? attempt.wrongAnswers 
                : (totalQuestions - correctAnswers);
              const passed = attempt.passed !== undefined 
                ? attempt.passed 
                : (score >= 60);
              
              return {
                attemptNumber: attempt.attemptNumber || 0,
                score,
                correctAnswers,
                wrongAnswers,
                totalQuestions,
                passed,
                answers: attempt.answers || [],
                completedAt: attempt.completedAt || attempt.createdAt || enrollment.updatedAt,
              };
            });

            // Get the latest test attempt
            const latestAttempt =
              allAttempts.length > 0 ? allAttempts[allAttempts.length - 1] : null;

            const isPassed = latestAttempt?.score >= 60;
            const isVideoWatched = enrollment.videoWatched || false;
            const isCompleted = isPassed && isVideoWatched;

            // Get course test questions for answer sheets
            const courseDetails = courseDetailsMap.get(enrollment.courseId._id.toString());
            const testQuestions = courseDetails?.testQuestions || [];

            // Calculate test statistics
            const totalTests = allAttempts.length;
            const passedTests = allAttempts.filter((a) => a.passed || a.score >= 60).length;
            const failedTests = allAttempts.filter((a) => !a.passed && a.score < 60).length;
            const notAttended = enrollment.videoWatched && totalTests === 0 ? 1 : 0;

            return {
              courseId: enrollment.courseId._id,
              courseTitle: enrollment.courseId.courseTitle,
              courseCategory: enrollment.courseId.category,
              score: latestAttempt?.score || 0,
              correctAnswers: latestAttempt?.correctAnswers || 0,
              totalQuestions: latestAttempt?.totalQuestions || 0,
              passed: isPassed,
              videoWatched: isVideoWatched,
              testTaken: totalTests > 0,
              completedAt: latestAttempt?.completedAt || null,
              isCompleted,
              testStatistics: {
                totalTests,
                passedTests,
                failedTests,
                notAttended,
              },
              testAttempts: allAttempts,
              testQuestions, // Include test questions for answer sheets
            };
          });

        console.log(`📖 Courses in category: ${courseMarks.length}`);

        // Calculate total marks (average of all course scores where test was taken)
        const coursesWithTests = courseMarks.filter((c) => c.testTaken);
        const totalCourses = courseMarks.length;
        const totalScore =
          coursesWithTests.length > 0
            ? Math.round(
                coursesWithTests.reduce((sum, course) => sum + course.score, 0) /
                  coursesWithTests.length
              )
            : 0;

        // Count completed courses (video watched AND test passed >= 60%)
        const completedCourses = courseMarks.filter((c) => c.isCompleted).length;

        // Calculate overall test statistics
        const overallTestStats = courseMarks.reduce(
          (acc, course) => {
            acc.totalTests += course.testStatistics.totalTests;
            acc.passedTests += course.testStatistics.passedTests;
            acc.failedTests += course.testStatistics.failedTests;
            acc.notAttended += course.testStatistics.notAttended;
            return acc;
          },
          { totalTests: 0, passedTests: 0, failedTests: 0, notAttended: 0 }
        );

        console.log(`✅ Completed courses: ${completedCourses} / ${totalCoursesInCategory}`);
        console.log(`📊 Test stats: ${overallTestStats.totalTests} tests (${overallTestStats.passedTests} passed, ${overallTestStats.failedTests} failed, ${overallTestStats.notAttended} not attended)`);

        // Check if student completed ALL courses in their category
        const hasCompletedAllCoursesInCategory =
          totalCoursesInCategory > 0 &&
          completedCourses === totalCoursesInCategory;

        console.log(`🎓 Completed all? ${hasCompletedAllCoursesInCategory}`);

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          photoUrl: student.photoUrl,
          school: student.school || "N/A",
          category: student.category,
          totalMarks: totalScore,
          totalCourses,
          completedCourses,
          courseMarks,
          hasCompletedAllCourses: hasCompletedAllCoursesInCategory,
          overallTestStatistics: overallTestStats,
        };
      })
    );

    // Return ALL students (not just those who completed all courses)
    console.log(`\n🎯 Total students returned: ${enrichedStudents.length}`);

    return res.status(200).json({
      success: true,
      students: enrichedStudents,
    });
  } catch (error) {
    console.error("Error fetching students marks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch students marks",
      error: error.message,
    });
  }
};

