import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateCategoryMutation } from "@/features/api/authApi";
import { buildCategory } from "@/lib/categoryUtils";

const SelectCategory = () => {
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [studentClass, setStudentClass] = useState("");
  const [level, setLevel] = useState("Basic");
  const [updateCategory, { isLoading }] = useUpdateCategoryMutation();

  const handleSubmit = async () => {
    if (!studentClass) {
      toast.error("Please select your grade");
      return;
    }

    const category = buildCategory(studentClass, level);
    if (!category) {
      toast.error("Invalid category selection");
      return;
    }

    try {
      await updateCategory({ category }).unwrap();
      toast.success("Category saved! Showing your videos.");
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to save category");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center px-4 pt-24 pb-12">
      <Card className="w-full max-w-md border border-white/10 bg-white/5 text-white backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-white">Choose your grade</CardTitle>
          <CardDescription className="text-white/70">
            Hi{user?.name ? ` ${user.name}` : ""}! Pick which videos you want to watch.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label className="font-semibold text-white">Grade</Label>
            <Select value={studentClass} onValueChange={setStudentClass}>
              <SelectTrigger className="!h-10 !w-full !border-white/20 !bg-white/10 !text-white shadow-none focus:!border-[#F58120] focus:!ring-1 focus:!ring-[#F58120] data-[placeholder]:!text-white/50 [&>span]:!text-white [&_svg]:!text-white">
                <SelectValue placeholder="Select your grade" />
              </SelectTrigger>
              <SelectContent className="!z-[100] !border-white/20 !bg-gray-900 !text-white">
                <SelectItem value="3-5" className="!text-white focus:!bg-white/10 focus:!text-white data-[highlighted]:!bg-white/10 data-[highlighted]:!text-white">
                  Grade 3 to 5
                </SelectItem>
                <SelectItem value="6-8" className="!text-white focus:!bg-white/10 focus:!text-white data-[highlighted]:!bg-white/10 data-[highlighted]:!text-white">
                  Grade 6 to 8
                </SelectItem>
                <SelectItem value="9-12" className="!text-white focus:!bg-white/10 focus:!text-white data-[highlighted]:!bg-white/10 data-[highlighted]:!text-white">
                  Grade 9 to 12
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="font-semibold text-white">Level</Label>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="!h-10 !w-full !border-white/20 !bg-white/10 !text-white shadow-none focus:!border-[#F58120] focus:!ring-1 focus:!ring-[#F58120] data-[placeholder]:!text-white/50 [&>span]:!text-white [&_svg]:!text-white">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent className="!z-[100] !border-white/20 !bg-gray-900 !text-white">
                <SelectItem value="Basic" className="!text-white focus:!bg-white/10 focus:!text-white data-[highlighted]:!bg-white/10 data-[highlighted]:!text-white">
                  Basic
                </SelectItem>
                <SelectItem value="Advance" className="!text-white focus:!bg-white/10 focus:!text-white data-[highlighted]:!bg-white/10 data-[highlighted]:!text-white">
                  Advance
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-2 w-full bg-[#F58120] font-semibold text-white hover:bg-[#F58120]/90"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue to videos"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectCategory;
