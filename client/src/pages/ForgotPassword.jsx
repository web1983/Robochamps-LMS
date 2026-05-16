import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useForgotPasswordMutation } from '@/features/api/authApi';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      const response = await forgotPassword({ email }).unwrap();
      toast.success(response.message || 'OTP sent to your email!');
      // Navigate to reset password page with email
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  return (
    <div className="relative flex items-start justify-center min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat px-4 pt-24 pb-12">
      <div className="relative z-10 w-full max-w-md mt-4">
        <Card className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="space-y-1 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <Mail className="h-8 w-8 text-white" />
              <CardTitle className="text-2xl font-semibold text-white">Forgot Password?</CardTitle>
            </div>
            <CardDescription className="text-white/70 text-center">
              No worries! Enter your email and we'll send you an OTP to reset your password.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 pb-6 px-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120] h-11"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                  </>
                )}
              </Button>

              <div className="pt-4 space-y-3">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/5 px-2 text-white/50">Or</span>
                  </div>
                </div>

                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                    type="button"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-lg border border-white/20">
              <p className="text-sm text-white font-semibold">
                📧 What happens next?
              </p>
              <ul className="mt-2 text-sm text-white/70 space-y-1 list-disc list-inside">
                <li>You'll receive a 6-digit OTP via email</li>
                <li>The OTP is valid for 10 minutes</li>
                <li>Use the OTP to create a new password</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;

