import React, { useState, useEffect } from 'react';
import { useGetCreatorCourseQuery, useEditCourseMutation } from '@/features/api/CourseApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Video, HelpCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const CourseTest = () => {
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [testTimeLimit, setTestTimeLimit] = useState(20);
  const [courseSearchQuery, setCourseSearchQuery] = useState("");
  const [questions, setQuestions] = useState([
    {
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0
    }
  ]);

  const { data: coursesData, isLoading: coursesLoading, refetch: refetchCourses } = useGetCreatorCourseQuery();
  const [editCourse, { isLoading: updating, isSuccess, error }] = useEditCourseMutation();

  const publishedCourses = coursesData?.courses?.filter(course => course.isPublished) || [];
  
  // Helper function to format category label
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3-5 (Basic)',
      'grade_6_8_basic': 'Grade 6-8 (Basic)',
      'grade_9_12_basic': 'Grade 9-12 (Basic)',
      'grade_3_5_advance': 'Grade 3-5 (Advance)',
      'grade_6_8_advance': 'Grade 6-8 (Advance)',
      'grade_9_12_advance': 'Grade 9-12 (Advance)'
    };
    return categoryMap[category] || category;
  };
  
  // Filter courses based on search query (search in both title and category)
  const filteredCourses = publishedCourses.filter(course => {
    const titleMatch = course.courseTitle?.toLowerCase().includes(courseSearchQuery.toLowerCase());
    const categoryMatch = getCategoryLabel(course.category)?.toLowerCase().includes(courseSearchQuery.toLowerCase());
    return titleMatch || categoryMatch;
  });
  
  const selectedCourse = publishedCourses.find(c => c._id === selectedCourseId);

  // Load existing data when course is selected
  useEffect(() => {
    if (selectedCourse) {
      setVideoUrl(selectedCourse.videoUrl || "");
      setTestTimeLimit(selectedCourse.testTimeLimit || 20);
      if (selectedCourse.testQuestions && selectedCourse.testQuestions.length > 0) {
        // Create deep copies of questions to avoid immutability issues
        const copiedQuestions = selectedCourse.testQuestions.map(q => {
          const originalOptions = q.options || [];
          // Create a copy and ensure options array always has 4 elements
          const options = [...originalOptions];
          while (options.length < 4) {
            options.push("");
          }
          return {
            question: q.question || "",
            options: options,
            correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0
          };
        });
        setQuestions(copiedQuestions);
      } else {
        setQuestions([
          {
            question: "",
            options: ["", "", "", ""],
            correctAnswer: 0
          }
        ]);
      }
    }
  }, [selectedCourse]);

  const handleCourseSelect = (courseId) => {
    setSelectedCourseId(courseId);
    setCourseSearchQuery(""); // Reset search when course is selected
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = questions.map((q, i) => {
      if (i === index) {
        return { ...q, [field]: value };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
    const newQuestions = questions.map((q, i) => {
      if (i === questionIndex) {
        return { ...q, correctAnswer: optionIndex };
      }
      return q;
    });
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0
      }
    ]);
  };

  const removeQuestion = (index) => {
    if (questions.length > 1) {
      const newQuestions = questions.filter((_, i) => i !== index);
      setQuestions(newQuestions);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    if (!videoUrl.trim()) {
      toast.error("Please add a YouTube video URL");
      return;
    }

    // Validate questions
    const validQuestions = questions.filter(q => 
      q.question.trim() !== "" && 
      q.options.every(opt => opt.trim() !== "")
    );

    if (validQuestions.length === 0) {
      toast.error("Please add at least one complete question with all options filled");
      return;
    }

    if (!testTimeLimit || testTimeLimit <= 0) {
      toast.error("Please set a valid time limit (greater than 0 minutes)");
      return;
    }

    const formData = new FormData();
    formData.append("videoUrl", videoUrl);
    formData.append("testQuestions", JSON.stringify(validQuestions));
    formData.append("testTimeLimit", testTimeLimit);

    await editCourse({ formData, courseId: selectedCourseId });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Course test updated successfully!");
      // Refetch courses to get the updated data
      refetchCourses();
    }
    if (error) {
      toast.error(error?.data?.message || "Failed to update course test");
    }
  }, [isSuccess, error, refetchCourses]);

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;

  if (coursesLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Course Test Management</h1>
          <p className="text-gray-600 mt-2">Add YouTube videos and MCQ tests to your published courses</p>
        </div>

        {/* Course Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose a published course to add test content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Published Courses</Label>
                <Select onValueChange={handleCourseSelect} value={selectedCourseId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a published course" />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-h-[400px]">
                    <div className="p-2 border-b sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          type="text"
                          placeholder="Search courses..."
                          value={courseSearchQuery}
                          onChange={(e) => setCourseSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="pl-8 h-9"
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      <SelectGroup>
                        <SelectLabel>Your Published Courses ({filteredCourses.length})</SelectLabel>
                        {filteredCourses.length > 0 ? (
                          filteredCourses.map((course) => (
                            <SelectItem key={course._id} value={course._id}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-medium">{course.courseTitle}</span>
                                <span className="text-xs text-gray-500 ml-2">({getCategoryLabel(course.category)})</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            {courseSearchQuery ? "No courses found matching your search" : "No published courses available"}
                          </div>
                        )}
                      </SelectGroup>
                    </div>
                  </SelectContent>
                </Select>
              </div>

              {selectedCourse && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{selectedCourse.courseTitle}</h3>
                      <p className="text-sm text-gray-600">{getCategoryLabel(selectedCourse.category)}</p>
                    </div>
                    <Badge className="bg-green-600">Published</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedCourseId && (
          <>
            {/* Video URL Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-blue-600" />
                  <CardTitle>YouTube Video</CardTitle>
                </div>
                <CardDescription>Add the course video link (YouTube)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>YouTube Video URL</Label>
                  <Input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste the full YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
                  </p>
                </div>

                {youtubeId && (
                  <div className="mt-4">
                    <Label className="mb-2 block">Preview</Label>
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        width="100%"
                        height="100%"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube video preview"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test Time Limit Section */}
            <Card>
              <CardHeader>
                <CardTitle>Test Time Limit</CardTitle>
                <CardDescription>Set the time limit for completing the test</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Time Limit (in minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={testTimeLimit}
                      onChange={(e) => setTestTimeLimit(parseInt(e.target.value) || 0)}
                      placeholder="20"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Students will have this many minutes to complete the test
                    </p>
                  </div>
                  <div className="text-4xl font-bold text-blue-600">
                    {testTimeLimit} min
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MCQ Questions Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                    <CardTitle>MCQ Test Questions</CardTitle>
                  </div>
                  <Badge variant="outline">{questions.length} Question{questions.length !== 1 ? 's' : ''}</Badge>
                </div>
                <CardDescription>Add multiple choice questions with 4 options each</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {questions.map((question, qIndex) => (
                  <Card key={qIndex} className="border-2 border-gray-200">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Question Header */}
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg">Question {qIndex + 1}</h3>
                          {questions.length > 1 && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeQuestion(qIndex)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>

                        {/* Question Text */}
                        <div>
                          <Label>Question</Label>
                          <Input
                            type="text"
                            value={question.question}
                            onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                            placeholder="Enter your question here"
                            className="mt-2"
                          />
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                          <Label>Options (Select the correct answer)</Label>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-3">
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={question.correctAnswer === oIndex}
                                onChange={() => handleCorrectAnswerChange(qIndex, oIndex)}
                                className="w-4 h-4 text-green-600 cursor-pointer"
                              />
                              <div className="flex-1 flex items-center gap-2">
                                <Badge variant="outline">{String.fromCharCode(65 + oIndex)}</Badge>
                                <Input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                                />
                              </div>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500">
                            Select the radio button to mark the correct answer
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Question Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addQuestion}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Question
                </Button>

                {/* Info Box */}
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Students will have {testTimeLimit} minute{testTimeLimit !== 1 ? 's' : ''} to complete the test. Passing score is 60%. Add as many questions as you need.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCourseId("");
                  setVideoUrl("");
                  setTestTimeLimit(20);
                  setQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updating}
                className="bg-blue-600 hover:bg-blue-700 px-8"
              >
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Course Test"
                )}
              </Button>
            </div>
          </>
        )}

        {!selectedCourseId && (
          <Card>
            <CardContent className="py-16 text-center">
              <HelpCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a Course to Get Started
              </h3>
              <p className="text-gray-600">
                Choose a published course from the dropdown above to add video and test questions
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CourseTest;

