import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react"; // import Loader2
import { useLoginUserMutation, useRegisterUserMutation } from "@/features/api/authApi";
import { toast } from "sonner";
import { useNavigate, Link } from "react-router-dom";


const Login = () => {
  const [signupInput, setSignupInput] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    schoolCode: "",
    studentClass: "",
    level: ""
  });
  const [loginInput, setLoginInput] = useState({ email: "", password: "" });

  const [registerUser, { data: registerData, error: registerError, isLoading: registerIsLoading, isSuccess: registerIsSuccess }] =
    useRegisterUserMutation();
  const [loginUser, { data: loginData, error: loginError, isLoading: loginIsLoading, isSuccess: loginIsSuccess }] =
    useLoginUserMutation();
    const navigate = useNavigate();

  const changeInputHandler = (e, type) => {
    const { name, value } = e.target;

    if (type === "signup") {
      setSignupInput({ ...signupInput, [name]: value });
    } else {
      setLoginInput({ ...loginInput, [name]: value });
    }
  };

  const handleRegistration = async (type) => {   // async added
    let inputData = type === "signup" ? signupInput : loginInput;
    
    // If signup, validate and construct category from studentClass and level
    if (type === "signup") {
      if (!signupInput.studentClass || !signupInput.level) {
        toast.error("Please select your grade and level");
        return;
      }

      if (!signupInput.schoolCode || signupInput.schoolCode.trim() === "") {
        toast.error("Please enter your school code");
        return;
      }
      
      const categoryMap = {
        "3-5_basic": "grade_3_5_basic",
        "3-5_advance": "grade_3_5_advance",
        "6-8_basic": "grade_6_8_basic",
        "6-8_advance": "grade_6_8_advance",
        "9-12_basic": "grade_9_12_basic",
        "9-12_advance": "grade_9_12_advance"
      };
      
      const categoryKey = `${signupInput.studentClass}_${signupInput.level.toLowerCase()}`;
      const category = categoryMap[categoryKey];
      
      inputData = {
        name: signupInput.name,
        email: signupInput.email,
        password: signupInput.password,
        schoolCode: signupInput.schoolCode.trim().toUpperCase(),
        category: category
      };
    }
    
    console.log(inputData);
    const action = type === "signup" ? registerUser : loginUser;
    await action(inputData);  // works fine now
  };


useEffect(() => {
  if (registerIsSuccess && registerData) {
    toast.success(registerData.message || "Signup Successful. Logging you in...");
    // Automatically log in the user after successful signup
    loginUser({ email: signupInput.email, password: signupInput.password });
  }
  if (registerError) {
    toast.error(registerError?.data?.message || "Signup Failed");
  }

  if (loginIsSuccess && loginData) {
    toast.success(loginData.message || "Login Successful.");
    navigate("/");
  }
  if (loginError) {
    toast.error(loginError?.data?.message || "Login Failed");
  }
}, [registerIsSuccess, registerError, registerData, loginIsSuccess, loginError, loginData]);

  return (
    <div className="relative flex items-start justify-center min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1762946281/Group_3646_ptqpn7.png')] bg-cover bg-center md:bg-top bg-no-repeat px-4 pt-24 pb-12">
      <div className="relative z-10 w-full max-w-md mt-4">
        <Tabs defaultValue="login" className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl overflow-hidden pt-4 px-3 max-h-[calc(100vh-8rem)] flex flex-col">
          <TabsList className="flex justify-center bg-white/5 p-1 rounded-t-xl border-b border-white/10">
            <TabsTrigger
              value="signup"
              className="flex-1 text-center py-3 px-4 font-semibold rounded-lg text-white/70 data-[state=active]:bg-[#F58120] data-[state=active]:text-white transition-all hover:text-white"
            >
              Signup
            </TabsTrigger>
            <TabsTrigger
              value="login"
              className="flex-1 text-center py-3 px-4 font-semibold rounded-lg text-white/70 data-[state=active]:bg-[#F58120] data-[state=active]:text-white transition-all hover:text-white"
            >
              Login
            </TabsTrigger>
          </TabsList>

          {/* Signup Tab */}
          <TabsContent value="signup" className="p-6 overflow-y-auto flex-1 min-h-0">
            <Card className="shadow-none border-0 bg-transparent">
              <CardHeader className="mb-4 text-center">
                <CardTitle className="text-2xl font-semibold text-white">Signup</CardTitle>
                <CardDescription className="text-white/70">Create a new account and click signup when you're done.</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="signup-name" className="text-white font-semibold">Name</Label>
                  <Input
                    onChange={(e) => changeInputHandler(e, "signup")}
                    value={signupInput.name}
                    name="name"
                    type="text"
                    placeholder="eg. Akshay"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-email" className="text-white font-semibold">Email</Label>
                  <Input
                    onChange={(e) => changeInputHandler(e, "signup")}
                    value={signupInput.email}
                    name="email"
                    type="email"
                    placeholder="eg. akshay@lms.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-school-code" className="text-white font-semibold">School Code</Label>
                  <Input
                    id="signup-school-code"
                    onChange={(e) => changeInputHandler(e, "signup")}
                    value={signupInput.schoolCode}
                    name="schoolCode"
                    type="text"
                    placeholder="eg. RW1234"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-class" className="text-white font-semibold">Student Class</Label>
                  <Select 
                    value={signupInput.studentClass} 
                    onValueChange={(value) => setSignupInput({ ...signupInput, studentClass: value })}
                  >
                    <SelectTrigger className="!bg-white/10 !border-white/20 !text-white focus:!border-[#F58120] focus:!ring-[#F58120] data-[placeholder]:!text-white/50 [&>span]:!text-white [&>svg]:!text-white">
                      <SelectValue placeholder="Select your grade" />
                    </SelectTrigger>
                    <SelectContent className="!bg-gray-800 !border-white/20 !text-white">
                      <SelectItem value="3-5" className="!text-white hover:!bg-gray-700 focus:!bg-gray-700 focus:!text-white [&>span]:!text-white">Grade 3 to 5</SelectItem>
                      <SelectItem value="6-8" className="!text-white hover:!bg-gray-700 focus:!bg-gray-700 focus:!text-white [&>span]:!text-white">Grade 6 to 8</SelectItem>
                      <SelectItem value="9-12" className="!text-white hover:!bg-gray-700 focus:!bg-gray-700 focus:!text-white [&>span]:!text-white">Grade 9 to 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-level" className="text-white font-semibold">Level</Label>
                  <Select 
                    value={signupInput.level} 
                    onValueChange={(value) => setSignupInput({ ...signupInput, level: value })}
                  >
                    <SelectTrigger className="!bg-white/10 !border-white/20 !text-white focus:!border-[#F58120] focus:!ring-[#F58120] data-[placeholder]:!text-white/50 [&>span]:!text-white [&>svg]:!text-white">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent className="!bg-gray-800 !border-white/20 !text-white">
                      <SelectItem value="Basic" className="!text-white hover:!bg-gray-700 focus:!bg-gray-700 focus:!text-white [&>span]:!text-white">Basic</SelectItem>
                      {/* TODO: Uncomment below line to show Advance option in the future */}
                      {/* <SelectItem value="Advance" className="!text-white hover:!bg-gray-700 focus:!bg-gray-700 focus:!text-white [&>span]:!text-white">Advance</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="signup-password" className="text-white font-semibold">Password</Label>
                  <Input
                    onChange={(e) => changeInputHandler(e, "signup")}
                    value={signupInput.password}
                    name="password"
                    type="password"
                    placeholder="eg. xyz"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>
              </CardContent>

              <CardFooter className="mt-4">
                <Button
                  disabled={registerIsLoading}
                  onClick={() => handleRegistration("signup")}
                  className="w-full bg-[#F58120] text-white hover:bg-[#F58120]/90 transition-colors font-semibold"
                >
                  {registerIsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                    </>
                  ) : (
                    "Signup"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Login Tab */}
          <TabsContent value="login" className="p-6">
            <Card className="shadow-none border-0 bg-transparent">
              <CardHeader className="mb-4 text-center">
                <CardTitle className="text-2xl font-semibold text-white">Login</CardTitle>
                <CardDescription className="text-white/70">Login with your email and password.</CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="login-email" className="text-white font-semibold">Email</Label>
                  <Input
                    onChange={(e) => changeInputHandler(e, "login")}
                    value={loginInput.email}
                    name="email"
                    type="email"
                    placeholder="eg. akshay@lms.com"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-white font-semibold">Password</Label>
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-[#F58120] hover:text-orange-400 hover:underline font-medium transition-colors"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <Input
                    onChange={(e) => changeInputHandler(e, "login")}
                    value={loginInput.password}
                    name="password"
                    type="password"
                    placeholder="eg. xyz"
                    required
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#F58120] focus:ring-[#F58120]"
                  />
                </div>
              </CardContent>

              <CardFooter className="mt-4">
                <Button
                  disabled={loginIsLoading}
                  onClick={() => handleRegistration("login")}
                  className="w-full bg-[#F58120] text-white hover:bg-[#F58120]/90 transition-colors font-semibold"
                >
                  {loginIsLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;
