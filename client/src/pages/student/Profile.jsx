import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Award, User, Mail, Shield, GraduationCap, Edit2, Camera, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLoadUserQuery, useUpdateUserMutation } from '@/features/api/authApi.js';
import { useGetCertificateStatusQuery } from '@/features/api/enrollmentApi';
import RobowunderCertificate from '@/components/RobowunderCertificate';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

const Profile = () => {
  const [name, setName] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const { data, isLoading, refetch } = useLoadUserQuery();
  const [updateUser, { data: updateUserData, isLoading: updateUserIsLoading, isError, error, isSuccess }] = useUpdateUserMutation();
  
  const user = data?.user;
  const { data: certificateData } = useGetCertificateStatusQuery(undefined, {
    skip: !user || user?.role !== 'student'
  });

  // Set initial name
  useEffect(() => {
    if (data?.user?.name) setName(data.user.name);
  }, [data]);

  const onChangeHandler = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfilePhoto(file);
  };

  const updateUserHandler = async () => {
    const formData = new FormData();
    formData.append("name", name);
    if (profilePhoto) formData.append("profilePhoto", profilePhoto);

    await updateUser(formData);
  };


  useEffect(() => {
    refetch();
  },[])

  // Toast notifications
useEffect(() => {
  if (isSuccess) {
    refetch();
    toast.success(updateUserData?.message || "Profile updated!");
  }

  if (isError) {
    toast.error(error?.message || "Profile update failed!");
  }
}, [isSuccess, isError, updateUserData, error, refetch]);


  // Helper function to get category label
  const getCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3 to 5 (Basic)',
      'grade_6_8_basic': 'Grade 6 to 8 (Basic)',
      'grade_9_12_basic': 'Grade 9 to 12 (Basic)',
      'grade_3_5_advance': 'Grade 3 to 5 (Advance)',
      'grade_6_8_advance': 'Grade 6 to 8 (Advance)',
      'grade_9_12_advance': 'Grade 9 to 12 (Advance)'
    };
    return categoryMap[category] || category;
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F58120] rounded-xl shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">My Profile</h1>
              <p className="text-white/70 mt-1">Manage your account information and preferences</p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="h-32 w-32 md:w-40 md:h-40 ring-4 ring-[#F58120]/50 ring-offset-4 ring-offset-black/50 shadow-2xl">
                    <AvatarImage 
                      src={user?.photoUrl || "https://github.com/shadcn.png"} 
                      alt={user?.name || "User"}
                      key={user?.photoUrl}
                    />
                    <AvatarFallback className="bg-[#F58120] text-white text-3xl font-bold">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-[#F58120] p-2 rounded-full shadow-lg">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* User Info Section */}
              <div className="flex-1 w-full">
                <div className="space-y-4">
                  {/* Name */}
                  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <User className="h-5 w-5 text-[#F58120]" />
                      <Label className="text-white/70 font-semibold text-sm">Name</Label>
                    </div>
                    <p className="text-white text-lg font-semibold ml-8">{user?.name || 'N/A'}</p>
                  </div>

                  {/* Email */}
                  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Mail className="h-5 w-5 text-[#F58120]" />
                      <Label className="text-white/70 font-semibold text-sm">Email</Label>
                    </div>
                    <p className="text-white text-lg font-semibold ml-8">{user?.email || 'N/A'}</p>
                  </div>

                  {/* Role */}
                  <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-[#F58120]" />
                      <Label className="text-white/70 font-semibold text-sm">Role</Label>
                    </div>
                    <p className="text-white text-lg font-semibold ml-8">{user?.role?.toUpperCase() || 'N/A'}</p>
                  </div>

                  {/* Category (Student only) */}
                  {user?.role === 'student' && user?.category && (
                    <div className="p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                      <div className="flex items-center gap-3 mb-2">
                        <GraduationCap className="h-5 w-5 text-[#F58120]" />
                        <Label className="text-white/70 font-semibold text-sm">Category</Label>
                      </div>
                      <p className="text-white text-lg font-semibold ml-8">{getCategoryLabel(user.category)}</p>
                    </div>
                  )}

                  {/* Edit Profile Button */}
                  <div className="flex flex-col sm:flex-row gap-4 mt-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full md:w-auto bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold py-6 px-8 shadow-lg hover:shadow-xl transition-all duration-300">
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl text-white [&>button]:text-white [&>button]:hover:text-white [&>button]:opacity-100 hover:[&>button]:opacity-100 [&>button]:hover:bg-white/10 [&>button]:rounded-full [&>button]:p-1">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">Edit Profile</DialogTitle>
                        <DialogDescription className="text-white/70">
                          Make changes to your profile here. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 my-4">
                        <div className="grid gap-2">
                          <Label className="text-white font-semibold">Name</Label>
                          <Input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-white font-semibold">Profile Image</Label>
                          <Input
                            onChange={onChangeHandler}
                            type="file"
                            accept="image/*"
                            className="bg-white/10 border-white/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#F58120] file:text-white hover:file:bg-[#F58120]/90 cursor-pointer"
                          />
                          <p className="text-xs text-white/50">Upload a new profile picture (JPG, PNG, or GIF)</p>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button 
                          disabled={updateUserIsLoading} 
                          onClick={updateUserHandler}
                          className="bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold"
                        >
                          {updateUserIsLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please Wait
                            </>
                          ) : 'Save Changes'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                    <Link to="/upload-video">
                      <Button className="w-full md:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold py-6 px-8 shadow-lg hover:shadow-xl transition-all duration-300">
                        <Video className="h-4 w-4 mr-2" />
                        Upload Project Videos
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Section */}
        {certificateData?.eligible && certificateData?.certificateData && (
          <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border-2 border-yellow-500/50 shadow-2xl overflow-hidden">
            <CardHeader className="bg-yellow-500/20 backdrop-blur-sm border-b border-yellow-500/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#F58120] rounded-xl shadow-lg">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">
                    🎉 Your Certificate
                  </h2>
                  <p className="text-white/80 mt-1">You've earned your championship certificate!</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 bg-white/5 backdrop-blur-sm">
              <div className="max-w-3xl mx-auto">
                <RobowunderCertificate 
                  userName={certificateData.certificateData.userName}
                  completionDate={certificateData.certificateData.completionDate}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;
