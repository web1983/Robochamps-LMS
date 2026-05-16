import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useLoadUserQuery, useUpdateDriveLinkMutation } from '@/features/api/authApi.js';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

const UploadVideo = () => {
  const [driveLink, setDriveLink] = useState("");
  const { data, isLoading, refetch } = useLoadUserQuery();
  const [updateDriveLink, { isLoading: updateLoading, isSuccess, isError, error }] = useUpdateDriveLinkMutation();
  
  const user = data?.user;

  // Set initial drive link
  useEffect(() => {
    if (user?.driveLink) {
      setDriveLink(user.driveLink);
    }
  }, [user]);

  // Toast notifications
  useEffect(() => {
    if (isSuccess) {
      refetch();
      toast.success("Drive link updated successfully!");
      setDriveLink(user?.driveLink || "");
    }

    if (isError) {
      toast.error(error?.data?.message || error?.message || "Failed to update drive link!");
    }
  }, [isSuccess, isError, error, refetch, user?.driveLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driveLink.trim()) {
      toast.error("Please enter a drive link");
      return;
    }

    // Basic URL validation
    try {
      new URL(driveLink);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    await updateDriveLink(driveLink.trim());
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat">
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#F58120] rounded-xl shadow-lg">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Upload Project Videos</h1>
              <p className="text-white/70 mt-1">Share your Google Drive link where all your project videos are stored</p>
            </div>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
          <CardHeader>
            <div className="flex items-center gap-2 text-white">
              <Video className="h-5 w-5 text-[#F58120]" />
              <h2 className="text-2xl font-bold">Google Drive Link</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="driveLink" className="text-white font-semibold">
                  Drive Link URL
                </Label>
                <Input
                  id="driveLink"
                  type="url"
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                />
                <p className="text-sm text-white/60">
                  Please share the link to your Google Drive folder containing all your project videos. Make sure the folder is set to "Anyone with the link can view".
                </p>
              </div>

              {user?.driveLink && (
                <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Drive link is set</span>
                  </div>
                  <a
                    href={user.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-2 text-white/80 hover:text-[#F58120] transition-colors text-sm break-all"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {user.driveLink}
                  </a>
                </div>
              )}

              <Button
                type="submit"
                disabled={updateLoading}
                className="w-full bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold py-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {updateLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : user?.driveLink ? (
                  'Update Drive Link'
                ) : (
                  'Save Drive Link'
                )}
              </Button>
            </form>

            <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-semibold mb-2">Instructions:</h3>
              <ul className="space-y-2 text-white/70 text-sm list-disc list-inside">
                <li>Upload all your project videos to a Google Drive folder</li>
                <li>Right-click on the folder and select "Share"</li>
                <li>Set permission to "Anyone with the link can view"</li>
                <li>Copy the folder link and paste it above</li>
                <li>Click "Save Drive Link" to submit</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadVideo;

