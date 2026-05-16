import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCourseMutation } from '@/features/api/CourseApi';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { glassCard, glassInput, glassSelectTrigger, glassSelectContent, accentButton, subtleButton, mutedText } from '../theme';

const AddCourse = () => {
  const [courseTitle, setCourseTitle] = useState('');
  const [category, setCategory] = useState('');

  const [createCourse, { data, isLoading, isError, error, isSuccess }] = useCreateCourseMutation();
  const navigate = useNavigate();

  const handleCategoryChange = (value) => setCategory(value);

  const createCourseHandler = async () => {
    if (!courseTitle || !category) {
      toast.error("Please enter course title and select a category.");
      return;
    }
    try {
      await createCourse({ courseTitle, category }).unwrap();
    } catch (err) {
      console.error(err);
    }
  };

  // Show toast messages for success or error
  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Course Created Successfully!");
      navigate("/admin/course"); // Navigate to course list
    }
    if (isError) {
      toast.error(error?.data?.message || "Failed to create course.");
    }
  }, [isSuccess, isError, data, error, navigate]);

  return (
    <div className="space-y-6 text-white">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">Course Builder</p>
        <h1 className="text-3xl font-semibold">Add a New Course</h1>
        <p className={mutedText}>Enter the title and category to get started.</p>
      </div>

      <div className={`${glassCard} space-y-5 p-6`}>
        <div className="space-y-2">
          <Label className="text-white/80">Title</Label>
          <Input
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            type="text"
            placeholder="Your Course Name"
            className={glassInput}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-white/80">Category</Label>
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className={`${glassSelectTrigger} w-full md:w-64`}>
              <SelectValue placeholder="Select a Course" />
            </SelectTrigger>
            <SelectContent className={glassSelectContent}>
              <SelectGroup>
                <SelectLabel className="text-white/60">Basic Level</SelectLabel>
                <SelectItem value="grade_3_5_basic">Grade 3-5 (Basic)</SelectItem>
                <SelectItem value="grade_6_8_basic">Grade 6-8 (Basic)</SelectItem>
                <SelectItem value="grade_9_12_basic">Grade 9-12 (Basic)</SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel className="text-white/60">Advance Level</SelectLabel>
                <SelectItem value="grade_3_5_advance">Grade 3-5 (Advance)</SelectItem>
                <SelectItem value="grade_6_8_advance">Grade 6-8 (Advance)</SelectItem>
                <SelectItem value="grade_9_12_advance">Grade 9-12 (Advance)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={() => navigate("/admin/course")} className={subtleButton}>
            Back
          </Button>

          <Button className={`${accentButton} flex-1 sm:flex-none`} disabled={isLoading} onClick={createCourseHandler}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please Wait
              </>
            ) : (
              "Create Course"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddCourse;
