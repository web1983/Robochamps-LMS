import { Enrollment } from "../models/enrollment.model.js";
import { Course } from "../models/course.model.js";
import User from "../models/user.model.js";

const buildReviewData = (questions = [], answersSource = []) => {
  return questions.map((question, index) => {
    let selectedAnswer = -1;

    if (Array.isArray(answersSource) && answersSource.length > 0) {
      const firstItem = answersSource[0];
      if (typeof firstItem === "object" && firstItem !== null) {
        const match = answersSource.find(
          (answer) => answer?.questionIndex === index
        );
        if (match && typeof match.selectedAnswer === "number") {
          selectedAnswer = match.selectedAnswer;
        }
      } else if (typeof answersSource[index] === "number") {
        selectedAnswer = answersSource[index];
      }
    }

    const correctAnswer =
      typeof question?.correctAnswer === "number"
        ? question.correctAnswer
        : -1;

    return {
      questionNumber: index + 1,
      question: question?.question || "",
      options: Array.isArray(question?.options) ? question.options : [],
      correctAnswer,
      selectedAnswer,
      isCorrect: selectedAnswer === correctAnswer && correctAnswer !== -1,
      explanation: question?.explanation || "",
    };
  });
};

// 🟢 ENROLL IN COURSE
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment) {
      return res.status(200).json({
        success: true,
        message: "Already enrolled",
        enrollment: existingEnrollment,
      });
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId,
    });

    // Add course to user's enrolledCourses
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId },
    });

    return res.status(201).json({
      success: true,
      message: "Enrolled successfully",
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to enroll",
      error: error.message,
    });
  }
};

// 🟢 GET ENROLLMENT STATUS
export const getEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const enrollment = await Enrollment.findOne({ userId, courseId });

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        enrolled: false,
      });
    }

    return res.status(200).json({
      success: true,
      enrolled: true,
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get enrollment status",
    });
  }
};

// 🟢 MARK VIDEO AS WATCHED
export const markVideoWatched = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const enrollment = await Enrollment.findOneAndUpdate(
      { userId, courseId },
      { videoWatched: true },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Video marked as watched",
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update video status",
    });
  }
};

// 🟢 SUBMIT TEST
export const submitTest = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;
    const { answers } = req.body; // Array of selected answer indices

    // Get course with test questions
    const course = await Course.findById(courseId);
    if (!course || !course.testQuestions || course.testQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not found",
      });
    }

    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Not enrolled in this course",
      });
    }

    // Calculate score
    const totalQuestions = course.testQuestions.length;
    let correctAnswers = 0;
    const detailedAnswers = [];

    const normalizedAnswers = [];
    for (let i = 0; i < totalQuestions; i += 1) {
      const value =
        Array.isArray(answers) && typeof answers[i] === "number"
          ? answers[i]
          : -1;
      normalizedAnswers.push(value);
    }

    normalizedAnswers.forEach((selectedAnswer, index) => {
      const question = course.testQuestions[index];
      const isCorrect = selectedAnswer === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      detailedAnswers.push({
        questionIndex: index,
        selectedAnswer,
        isCorrect,
      });
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const wrongAnswers = totalQuestions - correctAnswers;
    const passed = score >= 60;

    // Add test attempt
    const attemptNumber = enrollment.testAttempts.length + 1;
    enrollment.testAttempts.push({
      attemptNumber,
      score,
      correctAnswers,
      wrongAnswers,
      totalQuestions,
      passed,
      answers: detailedAnswers,
      completedAt: new Date(),
    });

    // Update best score
    if (score > enrollment.bestScore) {
      enrollment.bestScore = score;
    }

    await enrollment.save();

    // Check if ALL published courses are now completed
    let allCoursesCompleted = false;
    let certificateGenerated = false;

    if (passed) {
      // Get user to check their category
      const user = await User.findById(userId);
      console.log('👤 User category:', user.category);

      // Get all published courses in user's category only
      const allPublishedCourses = await Course.find({ 
        isPublished: true,
        category: user.category 
      });
      const totalPublishedCourses = allPublishedCourses.length;
      const allPublishedCourseIds = allPublishedCourses.map(c => c._id.toString());

      console.log('📚 Total published courses in category:', totalPublishedCourses);

      if (totalPublishedCourses > 0) {
        // Get all user's enrollments for courses in their category
        const userEnrollments = await Enrollment.find({ userId }).populate('courseId');
        const validEnrollments = userEnrollments.filter(e => 
          e.courseId?.isPublished && e.courseId?.category === user.category
        );

        // Check if enrolled in ALL published courses in their category
        const enrolledCourseIds = validEnrollments.map(e => e.courseId._id.toString());
        const hasEnrolledInAll = allPublishedCourseIds.every(courseId =>
          enrolledCourseIds.includes(courseId)
        );

        if (hasEnrolledInAll) {
          // Check if ALL courses are completed (video watched AND test passed >= 60%)
          const completedCourses = validEnrollments.filter(e => {
            const videoWatched = e.videoWatched;
            const testPassed = e.testAttempts && 
                              e.testAttempts.length > 0 && 
                              e.testAttempts.some(attempt => attempt.score >= 60);
            return videoWatched && testPassed;
          });

          allCoursesCompleted = completedCourses.length === totalPublishedCourses;

          // If all courses completed, mark ALL enrollments with certificate flag
          if (allCoursesCompleted) {
            console.log('🎓 ALL COURSES COMPLETED! Generating certificate for user:', userId);
            console.log('Total courses:', totalPublishedCourses, 'Completed:', completedCourses.length);
            
            await Enrollment.updateMany(
              { 
                userId,
                courseId: { $in: allPublishedCourseIds }
              },
              {
                $set: {
                  certificateGenerated: true,
                  completedAt: new Date()
                }
              }
            );
            certificateGenerated = true;
            console.log('✅ Certificate generated successfully!');
          } else {
            console.log('⏳ Progress:', completedCourses.length, '/', totalPublishedCourses, 'courses completed');
          }
        }
      }
    }

    const review = buildReviewData(
      course.testQuestions,
      normalizedAnswers
    );

    return res.status(200).json({
      success: true,
      message: "Test submitted successfully",
      result: {
        score,
        correctAnswers,
        wrongAnswers,
        totalQuestions,
        passed,
        attemptNumber,
        certificateGenerated,
        allCoursesCompleted,
        review,
      },
      enrollment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit test",
      error: error.message,
    });
  }
};

// 🟢 CHECK CERTIFICATE ELIGIBILITY
export const getCertificateStatus = async (req, res) => {
  try {
    const userId = req.id;
    console.log('📜 Checking certificate status for user:', userId);

    // Get user details to check their category
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log('👤 User category:', user.category);

    // Get published courses in the USER'S category only
    const allPublishedCourses = await Course.find({ 
      isPublished: true,
      category: user.category 
    });
    console.log('📚 Total published courses in category:', allPublishedCourses.length);

    if (allPublishedCourses.length === 0) {
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "No published courses available in your category",
      });
    }

    // Get all user's enrollments
    const enrollments = await Enrollment.find({ userId }).populate('courseId');
    const validEnrollments = enrollments.filter(e => e.courseId);
    console.log('📝 User enrolled in', validEnrollments.length, 'courses');

    // Check if user has enrolled in ALL published courses in their category
    const enrolledCourseIds = validEnrollments.map(e => e.courseId._id.toString());
    const allCourseIds = allPublishedCourses.map(c => c._id.toString());
    
    const hasEnrolledInAll = allCourseIds.every(courseId => 
      enrolledCourseIds.includes(courseId)
    );

    if (!hasEnrolledInAll) {
      console.log('⚠️ Not enrolled in all courses in category');
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "Not enrolled in all courses",
        progress: {
          totalCourses: allPublishedCourses.length,
          enrolledCourses: validEnrollments.length,
          completedCourses: 0,
        },
      });
    }

    // Check if ALL courses are completed (video watched AND test passed with score >= 60)
    const completedCourses = validEnrollments.filter(enrollment => {
      const videoWatched = enrollment.videoWatched;
      const testPassed = enrollment.testAttempts && 
                        enrollment.testAttempts.length > 0 && 
                        enrollment.testAttempts.some(attempt => attempt.score >= 60);
      return videoWatched && testPassed;
    });

    console.log('✅ Completed courses:', completedCourses.length, '/', allPublishedCourses.length);

    const allCompleted = completedCourses.length === allPublishedCourses.length;

    if (allCompleted) {
      console.log('🎓 Certificate eligible for:', user.name);
      
      return res.status(200).json({
        success: true,
        eligible: true,
        certificateData: {
          userName: user.name,
          completionDate: new Date(),
          totalCourses: allPublishedCourses.length,
        },
      });
    } else {
      console.log('⏳ Certificate not yet eligible');
      return res.status(200).json({
        success: true,
        eligible: false,
        message: "Not all courses completed",
        progress: {
          totalCourses: allPublishedCourses.length,
          enrolledCourses: validEnrollments.length,
          completedCourses: completedCourses.length,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to check certificate eligibility",
      error: error.message,
    });
  }
};

// 🟢 GET USER'S ENROLLED COURSES
export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.id;

    // Get all enrollments for this user and populate course details
    const enrollments = await Enrollment.find({ userId })
      .populate({
        path: 'courseId',
        select: 'courseTitle courseSubTitle courseThumbnail courseLevel category videoUrl',
      })
      .sort({ enrolledAt: -1 }); // Most recent first

    // Filter out enrollments where course no longer exists (soft deletes)
    const validEnrollments = enrollments.filter(enrollment => enrollment.courseId);

    return res.status(200).json({
      success: true,
      enrollments: validEnrollments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get enrollments",
      error: error.message,
    });
  }
};

// 🟢 GET TEST QUESTIONS
export const getTestQuestions = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Check enrollment and video watched
    const enrollment = await Enrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "Not enrolled in this course",
      });
    }

    if (!enrollment.videoWatched) {
      return res.status(403).json({
        success: false,
        message: "Please watch the video first",
      });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.testQuestions || course.testQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Test not available",
      });
    }

    // Check if user has already attempted the test
    const hasAttempted =
      enrollment.testAttempts && enrollment.testAttempts.length > 0;
    let review = [];

    // If already attempted, check if passed
    if (hasAttempted) {
      const lastAttempt =
        enrollment.testAttempts[enrollment.testAttempts.length - 1];

      // Calculate correctAnswers if not stored (for old attempts)
      let correctAnswers = lastAttempt.correctAnswers;
      let wrongAnswers = lastAttempt.wrongAnswers;
      let passed = lastAttempt.passed;

      if (correctAnswers === undefined && lastAttempt.answers) {
        correctAnswers = lastAttempt.answers.filter((a) => a.isCorrect).length;
        wrongAnswers = lastAttempt.answers.length - correctAnswers;
        passed = lastAttempt.score >= 60;
      }

      review = buildReviewData(
        course.testQuestions,
        lastAttempt.answers || []
      );

      // If passed (score >= 60%), show result only
      if (passed) {
        return res.status(200).json({
          success: true,
          hasAttempted: true,
          previousResult: {
            score: lastAttempt.score,
            correctAnswers: correctAnswers || 0,
            wrongAnswers: wrongAnswers || 0,
            totalQuestions: course.testQuestions.length,
            passed: passed !== undefined ? passed : false,
            attemptNumber: enrollment.testAttempts.length,
            certificateGenerated: enrollment.certificateGenerated,
            review,
          },
          questions: [],
          timeLimit: course.testTimeLimit || 20,
        });
      }

      // If failed (score < 60%), allow retake but also show previous result
      // Fall through to return questions
    }

    // Return questions without correct answers (for new attempt or retake)
    const questions = course.testQuestions.map((q, index) => ({
      questionNumber: index + 1,
      question: q.question,
      options: q.options,
    }));

    // Include previous result if this is a retake
    let previousResult = null;
    if (hasAttempted) {
      const lastAttempt =
        enrollment.testAttempts[enrollment.testAttempts.length - 1];
      let correctAnswers = lastAttempt.correctAnswers;
      let wrongAnswers = lastAttempt.wrongAnswers;

      if (correctAnswers === undefined && lastAttempt.answers) {
        correctAnswers = lastAttempt.answers.filter((a) => a.isCorrect).length;
        wrongAnswers = lastAttempt.answers.length - correctAnswers;
      }

      previousResult = {
        score: lastAttempt.score,
        correctAnswers: correctAnswers || 0,
        wrongAnswers: wrongAnswers || 0,
        totalQuestions: course.testQuestions.length,
        passed: false,
        attemptNumber: enrollment.testAttempts.length,
        review,
      };
    }

    return res.status(200).json({
      success: true,
      hasAttempted: false,
      questions,
      timeLimit: course.testTimeLimit || 20, // Use course time limit or default to 20 minutes
      previousResult, // Include previous result if retaking
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to get test questions",
    });
  }
};

