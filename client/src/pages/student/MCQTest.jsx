import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetTestQuestionsQuery, useSubmitTestMutation } from '@/features/api/enrollmentApi';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle, XCircle, Award, Loader2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';
import { CircleCheck } from 'lucide-react';

const MCQTest = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const timerRef = useRef(null);
  const { data: testData, isLoading, refetch } = useGetTestQuestionsQuery(courseId);
  const [submitTest, { isLoading: submitting }] = useSubmitTestMutation();

  const questions = testData?.questions || [];
  const timeLimit = testData?.timeLimit || 20;
  const hasAttempted = testData?.hasAttempted || false;
  const previousResult = testData?.previousResult || null;

  const [testStarted, setTestStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [localShowResult, setLocalShowResult] = useState(false);
  const [localTestResult, setLocalTestResult] = useState(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  
  // Refetch data on component mount to ensure we have the latest test status
  useEffect(() => {
    refetch().then(() => setDataLoaded(true));
  }, [courseId, refetch]);
  
  // Determine what to show based on test data
  // Show result if user has attempted and has a result
  const showResult = localShowResult || (hasAttempted && !!previousResult);
  const testResult = localTestResult || previousResult;
  
  // Initialize showStartDialog based on test status - only after data is loaded
  useEffect(() => {
    if (testData && dataLoaded && !testStarted) {
      // Don't show dialog if we should show result instead
      if (showResult) {
        setShowStartDialog(false);
        return;
      }
      
      // Show start dialog if user hasn't attempted OR failed and wants to retake
      const shouldShowDialog = !hasAttempted || (hasAttempted && previousResult && !previousResult.passed && !localShowResult);
      setShowStartDialog(shouldShowDialog);
    }
  }, [testData, hasAttempted, previousResult, localShowResult, dataLoaded, showResult, testStarted]);
  
  // Safely get score values with NaN protection
  const safeScore = testResult?.score != null && !isNaN(testResult.score) ? testResult.score : 0;
  const safeCorrectAnswers = testResult?.correctAnswers != null && !isNaN(testResult.correctAnswers) ? testResult.correctAnswers : 0;
  const safeTotalQuestions = testResult?.totalQuestions != null && !isNaN(testResult.totalQuestions) ? testResult.totalQuestions : 0;
  const safeWrongAnswers = safeTotalQuestions - safeCorrectAnswers;
  const safePassed = testResult?.passed || false;
  const safeAttemptNumber = testResult?.attemptNumber != null && !isNaN(testResult.attemptNumber) ? testResult.attemptNumber : 1;

  // No initialization needed - states are derived directly from testData

  // Handle visibility change (tab switch detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testStarted && !showResult) {
        // User switched tab
        setTabSwitchCount(prev => prev + 1);
        toast.error("⚠️ Tab switch detected! Test will restart.");
        
        // Restart test after 2 seconds
        setTimeout(() => {
          handleRestartTest();
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [testStarted, showResult]);

  // Prevent back button
  useEffect(() => {
    if (testStarted && !showResult) {
      const handlePopState = (e) => {
        e.preventDefault();
        toast.error("⚠️ Cannot go back during test! Test will restart.");
        setTimeout(() => {
          handleRestartTest();
        }, 2000);
      };

      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [testStarted, showResult]);

  // Timer
  useEffect(() => {
    if (testStarted && !showResult && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [testStarted, showResult, timeLeft]);

  const handleStartTest = () => {
    setShowStartDialog(false);
    setTestStarted(true);
    setTimeLeft(timeLimit * 60); // Convert minutes to seconds
    setSelectedAnswers({});
    setTabSwitchCount(0);
  };

  const handleRestartTest = () => {
    setTestStarted(false);
    setTimeLeft(0);
    setSelectedAnswers({});
    setLocalShowResult(false);
    setLocalTestResult(null);
    setReviewDialogOpen(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleTimeUp = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    toast.error("⏰ Time's up! Submitting your answers...");
    await handleSubmitTest();
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex
    }));
  };

  const handleSubmitTest = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Prepare answers array
    const answers = questions.map((_, index) => selectedAnswers[index] ?? -1);

    try {
      const result = await submitTest({ courseId, answers }).unwrap();
      setLocalTestResult(result.result);
      setLocalShowResult(true);
      setTestStarted(false);
      setReviewDialogOpen(false);
      
      // Show special message if certificate was generated
      if (result.result.certificateGenerated && result.result.allCoursesCompleted) {
        toast.success("🎉 Congratulations! You've completed ALL courses and earned your certificate!", {
          duration: 8000,
        });
      }
    } catch (error) {
      toast.error("Failed to submit test. Please try again.");
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const allQuestionsAnswered = questions.length > 0 && questions.every((_, index) => selectedAnswers[index] !== undefined);

  // Show loading spinner while initial load or waiting for refetch
  if (isLoading || !dataLoaded) {
    return <LoadingSpinner />;
  }

  // Result Screen - Check this FIRST before checking for questions
  if (showResult && testResult) {
    const passed = safePassed;
    const reviewData = Array.isArray(testResult?.review)
      ? testResult.review
      : [];
    const hasReview = reviewData.length > 0;
    return (
      <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-contain md:bg-top bg-no-repeat">
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-12 pt-24">
          <Card className={`bg-white/5 backdrop-blur-sm border-2 shadow-2xl ${passed ? 'border-green-500/50' : 'border-orange-500/50'}`}>
            <CardContent className="pt-8 text-center space-y-6">
              {passed ? (
                <div className="bg-green-500/20 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center border border-green-500/50">
                  <Award className="h-16 w-16 text-green-400" />
                </div>
              ) : (
                <div className="bg-orange-500/20 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center border border-orange-500/50">
                  <XCircle className="h-16 w-16 text-orange-400" />
                </div>
              )}
              
              <div>
                <h2 className={`text-3xl font-bold mb-2 ${passed ? 'text-green-400' : 'text-orange-400'}`}>
                  {passed ? '🎉 Congratulations!' : '😔 Test Failed'}
                </h2>
                <p className="text-white/80 text-lg">
                  {passed ? 'You have passed the test!' : 'You scored below 60%. Review the video and retake the test.'}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                  <p className="text-white text-3xl font-bold">{safeScore}%</p>
                  <p className="text-white/70 text-sm">Your Score</p>
                </div>
                <div className="p-4 bg-green-500/20 backdrop-blur-sm rounded-lg border border-green-500/50">
                  <p className="text-green-400 text-3xl font-bold">{safeCorrectAnswers}</p>
                  <p className="text-green-400/70 text-sm">Correct</p>
                </div>
                <div className="p-4 bg-red-500/20 backdrop-blur-sm rounded-lg border border-red-500/50">
                  <p className="text-red-400 text-3xl font-bold">
                    {safeWrongAnswers}
                  </p>
                  <p className="text-red-400/70 text-sm">Wrong</p>
                </div>
              </div>

              {passed && (
                <div className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm border-2 border-green-500/50 rounded-lg">
                  <div className="bg-green-500/20 p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center border border-green-500/50">
                    <CheckCircle className="h-8 w-8 text-green-400" />
                  </div>
                  <p className="text-white font-semibold text-xl mb-2">Course Completed!</p>
                  <p className="text-white/80 text-sm">Congratulations on completing the course successfully!</p>
                  
                  {testResult?.allCoursesCompleted && testResult?.certificateGenerated && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-500/50 rounded-lg">
                      <div className="bg-yellow-500/20 p-2 rounded-full w-10 h-10 mx-auto mb-2 flex items-center justify-center border border-yellow-500/50">
                        <Award className="h-6 w-6 text-yellow-400" />
                      </div>
                      <p className="text-yellow-400 font-bold text-lg">🎓 Certificate Earned!</p>
                      <p className="text-yellow-400/80 text-sm mt-1">
                        You've completed ALL courses! Check your profile to download your certificate.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 justify-center pt-4 flex-wrap">
                <Button
                  onClick={() => navigate(`/course/${courseId}`)}
                  className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Back to Course
                </Button>
                {/* Only show Review Answers button if user passed the test (score >= 60%) */}
                {hasReview && passed && (
                  <Button
                    variant="outline"
                    className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setReviewDialogOpen(true)}
                  >
                    Review Answers
                  </Button>
                )}
                {!passed && (
                  <>
                    <Button
                      onClick={() => navigate(`/course/${courseId}/video`)}
                      className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20 px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Watch Video Again
                    </Button>
                    <Button
                      onClick={() => {
                        setLocalShowResult(false);
                        setLocalTestResult(null);
                        setShowStartDialog(true);
                        refetch();
                      }}
                      className="bg-[#F58120] hover:bg-[#F58120]/90 text-white px-8 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Retake Test
                    </Button>
                  </>
                )}
              </div>
              
              {!passed && (
                <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm text-center font-semibold">
                    ❌ Test Failed - Score below 60%
                  </p>
                  <p className="text-red-400/70 text-xs text-center mt-1">
                    You cannot view this result anymore as you need to retake the test.
                  </p>
                </div>
              )}

              <p className="text-sm text-white/50">
                Attempt #{safeAttemptNumber}
              </p>
            </CardContent>
          </Card>
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl max-w-3xl max-h-[85vh] overflow-y-auto text-white [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100 hover:[&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:rounded-full [&>button]:p-1">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">
                  Test Review
                </DialogTitle>
                <DialogDescription className="text-white/70">
                  Review your answers to understand where you can improve.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                {hasReview ? (
                  reviewData.map((item) => {
                    const questionKey = `question-${item.questionNumber}`;
                    const correctOptionText =
                      Array.isArray(item.options) && item.correctAnswer >= 0
                        ? item.options[item.correctAnswer]
                        : null;

                    return (
                      <div
                        key={questionKey}
                        className="border border-white/20 rounded-lg p-5 text-left shadow-sm bg-white/5 backdrop-blur-sm"
                      >
                        <p className="text-sm font-semibold text-white/50 mb-1">
                          Question {item.questionNumber}
                        </p>
                        <p className="text-lg font-semibold text-white">
                          {item.question || "Untitled question"}
                        </p>
                        <div className="mt-4 space-y-3">
                          {Array.isArray(item.options) && item.options.length > 0 ? (
                            item.options.map((option, index) => {
                              const isCorrect = index === item.correctAnswer;
                              const isSelected = index === item.selectedAnswer;

                              let optionClasses =
                                "border rounded-lg p-3 text-sm transition-colors";
                              if (isCorrect) {
                                optionClasses +=
                                  " border-green-500/50 bg-green-500/20 backdrop-blur-sm text-green-400";
                              } else if (isSelected) {
                                optionClasses +=
                                  " border-red-500/50 bg-red-500/20 backdrop-blur-sm text-red-400";
                              } else {
                                optionClasses +=
                                  " border-white/20 bg-white/5 backdrop-blur-sm text-white/70";
                              }

                              return (
                                <div key={`${questionKey}-option-${index}`} className={optionClasses}>
                                  <p className="font-medium">
                                    {option || `Option ${index + 1}`}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-2 text-xs font-semibold">
                                    {isCorrect && (
                                      <span className="px-2 py-1 rounded-full bg-green-500/30 text-green-400 border border-green-500/50">
                                        Correct Answer
                                      </span>
                                    )}
                                    {isSelected && (
                                      <span
                                        className={`px-2 py-1 rounded-full border ${
                                          isCorrect
                                            ? "bg-green-500/40 text-green-300 border-green-500/70"
                                            : "bg-red-500/30 text-red-400 border-red-500/50"
                                        }`}
                                      >
                                        Your Choice
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-white/50">
                              Options not available.
                            </p>
                          )}
                        </div>

                        {item.selectedAnswer === -1 && (
                          <p className="mt-4 text-sm text-orange-400 font-medium">
                            You did not answer this question.
                          </p>
                        )}

                        {item.selectedAnswer !== -1 && !item.isCorrect && (
                          <p className="mt-4 text-sm text-red-400 font-medium">
                            Your answer was incorrect. Correct answer:{" "}
                            <span className="font-semibold text-red-300">
                              {correctOptionText ?? "Not available"}
                            </span>
                          </p>
                        )}

                        {item.isCorrect && (
                          <p className="mt-4 text-sm text-green-400 font-medium">
                            Great job! You answered this correctly.
                          </p>
                        )}

                        {item.explanation && (
                          <div className="mt-4 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm text-white/80">
                            <strong className="block text-white mb-1">
                              Explanation
                            </strong>
                            {item.explanation}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-white/50">
                    Review data is not available for this attempt.
                  </p>
                )}
              </div>
              <DialogFooter className="pt-4">
                <Button
                  variant="outline"
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 font-semibold"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  // Check for no questions AFTER checking for results
  if (!questions || questions.length === 0) {
    return (
      <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-contain md:bg-top bg-no-repeat pt-24">
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="max-w-md mx-4">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-12 text-center">
              <div className="bg-yellow-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-yellow-500/50">
                <AlertTriangle className="h-10 w-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Test Not Available</h2>
              <p className="text-white/70 mb-6">Please watch the video first to unlock the test.</p>
              <Button 
                onClick={() => navigate(`/course/${courseId}/video`)}
                className="bg-[#F58120] hover:bg-[#F58120]/90 text-white"
              >
                Watch Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-contain md:bg-top bg-no-repeat">
      {/* Start Dialog - Show for new attempts and retakes */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
            <DialogContent className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl max-w-md text-white [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100 hover:[&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:rounded-full [&>button]:p-1">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center text-white">
              {previousResult && !previousResult.passed ? '🔄 Retake Test?' : '📝 Ready for the Test?'}
            </DialogTitle>
            <DialogDescription className="text-center space-y-4 pt-4">
              {previousResult && !previousResult.passed && (
                <div className="p-4 bg-orange-500/20 backdrop-blur-sm border border-orange-500/50 rounded-lg">
                  <p className="text-orange-400 text-sm font-semibold mb-1">
                    Previous Attempt: {previousResult.score}%
                  </p>
                  <p className="text-orange-400/80 text-xs">
                    You need 60% or higher to pass. Let's try again!
                  </p>
                </div>
              )}

              <div className="p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-left">
                <p className="font-semibold text-white mb-2">Test Details:</p>
                <ul className="space-y-1 text-white/80 text-sm">
                  <li>• {questions.length} Questions</li>
                  <li>• {timeLimit} Minutes</li>
                  <li>• Passing Score: 60%</li>
                  <li>• Multiple Choice</li>
                </ul>
              </div>

              <div className="p-4 bg-red-500/20 backdrop-blur-sm border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm font-semibold mb-2">
                  ⚠️ Important Rules:
                </p>
                <ul className="space-y-1 text-red-400/80 text-sm text-left">
                  <li>• Don't switch tabs or minimize window</li>
                  <li>• Don't press back button</li>
                  <li>• Timer will count down</li>
                  <li>• Test will restart if rules are broken</li>
                </ul>
              </div>

              <p className="text-sm text-white/70">
                {previousResult && !previousResult.passed 
                  ? 'Good luck on your retake! You can retake until you pass.' 
                  : 'Good luck! You need 60% to pass.'}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button
              onClick={handleStartTest}
              className="bg-[#F58120] hover:bg-[#F58120]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {previousResult && !previousResult.passed ? 'Retake Test Now' : 'Start Test Now'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Interface */}
      {testStarted && (
        <div className="relative z-10 max-w-4xl mx-auto py-8 px-6 pt-24">
          {/* Header with Timer */}
          <div className="sticky top-24 z-10 bg-white/5 backdrop-blur-sm border border-white/10 shadow-md rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">MCQ Test</h2>
                <p className="text-sm text-white/70">
                  {Object.keys(selectedAnswers).length} of {questions.length} answered
                </p>
              </div>
              <div className={`flex items-center gap-2 px-6 py-3 rounded-lg border ${
                timeLeft < 300 ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-blue-500/20 border-blue-500/50 text-blue-400'
              }`}>
                <Clock className="h-5 w-5" />
                <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <Card key={qIndex} className="bg-white/5 backdrop-blur-sm border-2 border-white/10 shadow-lg">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-lg mb-4 text-white">
                    Question {q.questionNumber}: {q.question}
                  </h3>
                  <div className="space-y-3">
                    {q.options.map((option, oIndex) => (
                      <button
                        key={oIndex}
                        onClick={() => handleAnswerSelect(qIndex, oIndex)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          selectedAnswers[qIndex] === oIndex
                            ? 'border-[#F58120] bg-[#F58120]/20 backdrop-blur-sm'
                            : 'border-white/20 bg-white/5 backdrop-blur-sm hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedAnswers[qIndex] === oIndex
                              ? 'border-[#F58120] bg-[#F58120]'
                              : 'border-white/30 bg-white/5'
                          }`}>
                            {selectedAnswers[qIndex] === oIndex && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-white/70">
                            {String.fromCharCode(65 + oIndex)}.
                          </span>
                          <span className={selectedAnswers[qIndex] === oIndex ? 'text-white font-medium' : 'text-white/80'}>{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-6 bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg rounded-lg p-6 mt-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/70">
                {allQuestionsAnswered 
                  ? '✅ All questions answered' 
                  : `⚠️ ${questions.length - Object.keys(selectedAnswers).length} questions remaining`
                }
              </p>
              <Button
                onClick={handleSubmitTest}
                disabled={submitting || !allQuestionsAnswered}
                className="bg-[#F58120] hover:bg-[#F58120]/90 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Test'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MCQTest;

