import { Menu, LogOut, ChevronDown } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { Link, useNavigate } from 'react-router-dom';
import { useLogoutUserMutation } from '@/features/api/authApi';
import { useGetSettingsQuery } from '@/features/api/settingsApi';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';


const Navbar = () => {
  const { user } = useSelector(store => store.auth);
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const { data: settingsData } = useGetSettingsQuery();
  const navigate = useNavigate();
  const [logoImageLoaded, setLogoImageLoaded] = useState(false);
  const [profileImageLoaded, setProfileImageLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Initialize from localStorage to prevent flickering
  const [cachedSettings, setCachedSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('app_settings');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  
  const settings = settingsData?.settings || cachedSettings;
  const companyName = settings?.companyName || '';
  const logoUrl = settings?.logoUrl || '';

  // Bot icon URL from Figma
  const botIconUrl = "https://res.cloudinary.com/dmlk8egiw/image/upload/v1762943081/Mask_group_umuqm2.png";
  
  // Logo image URL
  const logoButtonUrl = "https://res.cloudinary.com/dmlk8egiw/image/upload/v1762944292/Group_3645_vhtdrw.png";

  // Cache settings to localStorage when received
  useEffect(() => {
    if (settingsData?.settings) {
      try {
        localStorage.setItem('app_settings', JSON.stringify(settingsData.settings));
        setCachedSettings(settingsData.settings);
      } catch (error) {
        console.error('Failed to cache settings:', error);
      }
    }
  }, [settingsData]);

  // Preload logo button image
  useEffect(() => {
    const img = new Image();
    img.src = logoButtonUrl;
    img.onload = () => setLogoImageLoaded(true);
    img.onerror = () => {
      setLogoImageLoaded(false);
      console.error('Failed to load Robowunder logo button');
    };
  }, [logoButtonUrl]);

  // Preload profile image
  useEffect(() => {
    if (user?.photoUrl) {
      setProfileImageLoaded(false);
      const img = new Image();
      img.src = user.photoUrl;
      img.onload = () => setProfileImageLoaded(true);
      img.onerror = () => setProfileImageLoaded(false);
    }
  }, [user?.photoUrl]);

  const logoutHandler = async () => {
    await logoutUser();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message || "User Log out.");
      navigate("/login")
    }
  }, [isSuccess]);

  return (
    <div className='h-16 md:h-20 bg-transparent absolute z-50 top-0 left-0 right-0'>
      {/* Desktop - Keep original design unchanged, responsive only for mobile/tablet */}
      <div className="px-4 sm:px-6 md:px-[6.125rem] mx-auto hidden md:grid grid-cols-3 items-center gap-4">
        {/* Left Navigation - HOME, MY LEARNING, PROFILE */}
        <div className="flex items-center gap-6 md:gap-8 justify-start pt-4 md:pt-6">
          {/* HOME always goes to home page */}
          <Link 
            to="/"
            className="text-white hover:text-orange-500 transition-colors duration-200 font-semibold text-[14px] whitespace-nowrap"
          >
            HOME
          </Link>
          {/* Before login: MY LEARNING and PROFILE go to login page | After login: Links go to actual pages */}
          <Link 
            to={user ? "/my-learning" : "/login"}
            className="text-white hover:text-orange-500 transition-colors duration-200 font-semibold text-[14px] whitespace-nowrap"
          >
            MY LEARNING
          </Link>
          <Link 
            to={user ? "/profile" : "/login"}
            className="text-white hover:text-orange-500 transition-colors duration-200 font-semibold text-[14px] whitespace-nowrap"
          >
            PROFILE
          </Link>
        </div>

        {/* Center - Robowunder Logo Button */}
        <div className="flex items-center justify-center align-items-flex-start">
          <button
            onClick={() => navigate("/")}
            className="relative transition-all duration-300 hover:scale-105 group cursor-pointer"
          >
            {/* Logo Image from Cloudinary - Desktop: original size */}
            <img 
              src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762944292/Group_3645_vhtdrw.png"
              alt="Robowunder Logo"
              className="h-12 md:h-14 w-auto object-contain lg:h-16 xl:h-14 max-w-[280px]"
            />
          </button>
        </div>

        {/* Right Section - SIGNUP/LOGIN (before login) | LOGOUT + Bot Dropdown (after login) */}
        <div className="flex items-center gap-3 md:gap-4 justify-end pt-4 md:pt-6">
          {/* Before Login: Show SIGNUP and LOGIN buttons */}
          {!user && (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-white hover:text-orange-500 hover:bg-transparent font-semibold px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-[14px] whitespace-nowrap"
              >
                SIGNUP
              </Button>

              <Button 
                variant="ghost" 
                onClick={() => navigate("/login")}
                className="text-white hover:text-orange-500 hover:bg-transparent font-semibold px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-[14px] whitespace-nowrap"
              >
                LOGIN
              </Button>
            </>
          )}

          {/* After Login: Show LOGOUT button and Bot Dropdown */}
          {user && (
            <>
              {/* Logout Button */}
              <Button 
                variant="ghost" 
                onClick={logoutHandler}
                className="text-white hover:text-orange-500 hover:bg-transparent font-semibold px-3 md:px-4 py-2 rounded-lg transition-all duration-300 text-[14px] whitespace-nowrap"
              >
                LOGOUT
              </Button>

              {/* Bot Icon Dropdown - Shows My Learning and Edit Profile - Desktop: original size */}
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center cursor-pointer group px-2 py-1 rounded-lg hover:bg-white/10 transition-all duration-300">
                    <img 
                      src={botIconUrl} 
                      alt="Bot" 
                      className="h-7 md:h-8 w-7 md:w-8 object-contain hover:opacity-80 transition-opacity duration-200"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2 p-2 bg-gray-800 border-gray-700 text-white shadow-xl" align="end">
                  <DropdownMenuLabel className="text-white font-semibold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200 text-white" onClick={() => setDropdownOpen(false)}>
                      <Link to="/my-learning" className="flex items-center w-full gap-2 font-medium">
                        📚 My Learning
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200 text-white" onClick={() => setDropdownOpen(false)}>
                      <Link to="/profile" className="flex items-center w-full gap-2 font-medium">
                        ✏️ Edit Profile
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  {
                    user.role === "instructor" && (
                      <>
                        <DropdownMenuSeparator className="bg-gray-700 my-2" />
                        <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-gray-700 focus:bg-gray-700 transition-colors duration-200 text-white" onClick={() => setDropdownOpen(false)}>
                          <Link to="/admin/dashboard" className="flex items-center w-full gap-2 font-medium text-orange-400">
                            🎯 Dashboard
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )
                  }
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="flex md:hidden items-center justify-between px-3 sm:px-4 h-full bg-transparent">
        <div className='flex items-center gap-2' onClick={() => navigate("/")}>
          <button
            onClick={() => navigate("/")}
            className="relative transition-all duration-300 hover:scale-105 cursor-pointer"
          >
            {/* Logo Image from Cloudinary */}
            <img 
              src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762944292/Group_3645_vhtdrw.png"
              alt="Robowunder Logo"
              className="h-10 sm:h-12 w-auto object-contain max-w-[160px] sm:max-w-[200px]"
            />
          </button>
        </div>
        <MobileNavbar />
      </div>
    </div>
  );
};

export default Navbar


const MobileNavbar = () => {
  const { user } = useSelector(store => store.auth);
  const [logoutUser, { data, isSuccess }] = useLogoutUserMutation();
  const { data: settingsData } = useGetSettingsQuery();
  const navigate = useNavigate();
  
  const settings = settingsData?.settings;
  const companyName = settings?.companyName || '';
  
  const logoutHandler = async () => {
    await logoutUser();
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data.message || "User Log out.");
      navigate("/login")
    }
  }, [isSuccess]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          size="icon" 
          className="focus:ring-0 focus:outline-none border-0 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-300 bg-white/10 hover:bg-white/20" 
          variant="outline"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col bg-gray-900 border-l border-gray-800">
        <SheetHeader className="flex flex-row items-center justify-between mt-2 pb-4 border-b border-gray-800">
          <SheetTitle className="text-xl font-bold text-white">
            {companyName || 'Menu'}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Navigation menu for accessing courses, profile, and other features
          </SheetDescription>
        </SheetHeader>
        
        {user ? (
          <>
            {/* User Info Section */}
            <div className="flex items-center gap-3 mt-6 p-4 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
              <Avatar className="h-12 w-12 ring-2 ring-orange-500/50">
                <AvatarImage 
                  src={user?.photoUrl || "https://github.com/shadcn.png"} 
                  alt={user?.name || "User"}
                />
                <AvatarFallback className="bg-orange-500 text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-white truncate">{user?.name}</span>
                <span className="text-xs text-gray-400 truncate">{user?.email}</span>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="flex flex-col space-y-2 mt-6">
              <SheetClose asChild>
                <Link 
                  to="/"
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-orange-500 hover:bg-gray-800 rounded-xl font-medium transition-all duration-200"
                >
                  🏠 <span>Home</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/my-learning" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-orange-500 hover:bg-gray-800 rounded-xl font-medium transition-all duration-200"
                >
                  📚 <span>My Learning</span>
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link 
                  to="/profile" 
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-orange-500 hover:bg-gray-800 rounded-xl font-medium transition-all duration-200"
                >
                  ✏️ <span>Edit Profile</span>
                </Link>
              </SheetClose>
              {user.role === "instructor" && (
                <SheetClose asChild>
                  <Link 
                    to="/admin/dashboard" 
                    className="flex items-center gap-3 px-4 py-3 text-orange-400 hover:bg-gray-800 rounded-xl font-medium transition-all duration-200"
                  >
                    🎯 <span>Dashboard</span>
                  </Link>
                </SheetClose>
              )}
            </nav>
            
            {/* Logout Button */}
            <Button 
              onClick={logoutHandler} 
              variant="outline" 
              className="flex items-center justify-center gap-2 mt-auto border-2 border-red-600/50 text-red-400 hover:bg-red-600/20 hover:border-red-600 font-semibold py-3 rounded-xl transition-all duration-300 shadow-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </>
        ) : (
          <nav className="flex flex-col space-y-3 mt-6">
            <SheetClose asChild>
              <Button 
                onClick={() => navigate("/login")} 
                variant="outline"
                className="bg-gray-800 border-2 border-gray-700 text-white hover:bg-gray-700 hover:border-gray-600 font-semibold py-3 rounded-xl transition-all duration-300"
              >
                Login
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button 
                onClick={() => navigate("/login")}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl shadow-lg transition-all duration-300"
              >
                Join Now
              </Button>
            </SheetClose>
          </nav>
        )}
      </SheetContent>
    </Sheet>)
}
