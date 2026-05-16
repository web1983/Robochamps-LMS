import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { useResetPasswordMutation } from '@/features/api/authApi';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';
  
  const [formData, setFormData] = useState({
    email: emailFromState,
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.email || !formData.otp || !formData.newPassword || !formData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (formData.otp.length !== 6) {
      toast.error('OTP must be 6 digits');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      }).unwrap();
      
      toast.success(response.message || 'Password reset successful!');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error?.data?.message || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="relative flex items-start justify-center min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat px-4 pt-24 pb-12">
      <div className="relative z-10 w-full max-w-md mt-4">
        <Card className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-h-[calc(100vh-8rem)] flex flex-col">
          <CardHeader className="space-y-1 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-2 justify-center">
              <KeyRound className="h-8 w-8 text-white" />
              <CardTitle className="text-2xl font-semibold text-white">Reset Password</CardTitle>
            </div>
            <CardDescription className="text-white/70 text-center">
              Enter the OTP sent to your email and create a new password
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 pb-6 px-6 overflow-y-auto flex-1 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-semibold">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120] h-11"
                  disabled={isLoading}
                />
              </div>

              {/* OTP */}
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-white font-semibold">
                  OTP Code (6 digits)
                </Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength={6}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120] h-11 text-center text-2xl tracking-widest font-bold"
                  disabled={isLoading}
                />
                <p className="text-xs text-white/50">Check your email for the OTP code</p>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-white font-semibold">
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120] h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-semibold">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120] h-11 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#F58120] hover:bg-[#F58120]/90 text-white font-semibold transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    Reset Password
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

                <Link to="/forgot-password">
                  <Button
                    variant="outline"
                    className="w-full h-11 border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent"
                    type="button"
                  >
                    Resend OTP
                  </Button>
                </Link>

                <Link to="/login">
                  <Button
                    variant="ghost"
                    className="w-full h-11 text-white hover:bg-white/10 hover:text-white bg-transparent"
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
                ⚠️ Important:
              </p>
              <ul className="mt-2 text-sm text-white/70 space-y-1 list-disc list-inside">
                <li>OTP is valid for 10 minutes only</li>
                <li>Password must be at least 6 characters</li>
                <li>After reset, use your new password to login</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;

