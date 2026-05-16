import { Button } from '@/components/ui/button'
import React from 'react'
import { Award, Sparkles, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useGetCertificateStatusQuery } from '@/features/api/enrollmentApi'

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useSelector(store => store.auth);
  const { data: certificateData } = useGetCertificateStatusQuery(undefined, {
    skip: !user || user?.role !== 'student'
  });

  const scrollToCourses = () => {
    const coursesSection = document.getElementById('courses-section');
    if (coursesSection) {
      coursesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePlayButtonClick = () => {
    if (!user) {
      // If user is not logged in, navigate to login page
      navigate('/login');
    } else {
      // If user is logged in, scroll to courses section
      scrollToCourses();
    }
  };

  return (
    <>
      {/* Certificate Banner - Show if eligible */}
      {certificateData?.eligible && certificateData?.certificateData && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 py-4">
          <div className="max-w-7xl mx-auto px-6 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-white animate-pulse" />
              <div>
                <h3 className="text-white font-bold text-lg">🎉 Congratulations!</h3>
                <p className="text-amber-100 text-sm">You've earned your Robowunder Championship Certificate!</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/my-learning')}
              className="bg-white text-amber-700 hover:bg-amber-50 font-semibold shadow-lg"
            >
              View Certificate
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="relative overflow-hidden w-full h-auto bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat min-h-[600px] md:h-auto">
        {/* Hero Content - Desktop: Keep original design, responsive only for mobile/tablet */}
        <div className="relative px-4 sm:px-6 md:pl-[6.125rem] md:pr-0 mx-auto pt-20 sm:pt-24 md:pt-32 lg:pt-40 pb-24 sm:pb-16 md:pb-24 lg:pb-32 z-10">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:items-stretch">
            {/* Left Content */}
            <div className="text-center lg:text-left space-y-6 sm:space-y-7 md:space-y-8">
              {/* Robowunder Title */}
              <div className="space-y-3 sm:space-y-4">
                <h1 
                  className="text-3xl sm:text-4xl md:text-[52.577px] font-semibold leading-tight md:leading-normal text-[#F58120]"
                >
                  Robowunder
                </h1>
                <h2 
                  className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl md:text-[80.749px] font-semibold text-white leading-tight md:leading-[98.456%]"
                >
                  International Robotic Championship
                </h2>
              </div>

              {/* Description */}
              <p 
                className="text-base sm:text-lg md:text-[29.07px] text-white max-w-2xl mx-auto lg:mx-0 font-extralight leading-normal"
              >
                Join the ultimate robotics challenge! Master robotics concepts, complete hands-on projects, and showcase your skills in the championship.
              </p>

             

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 sm:gap-5 md:gap-6 pt-2 sm:pt-3 md:pt-4">
                <div className="text-center lg:text-left">
                  <div 
                    className="text-xl sm:text-2xl md:text-[43.384px] font-semibold text-white leading-tight md:leading-[98.456%]"
                  >
                    5k+
                  </div>
                  <div 
                    className="text-xs sm:text-sm md:text-[19.68px] text-white mt-1 font-extralight leading-normal"
                  >
                    Participants
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div 
                    className="text-xl sm:text-2xl md:text-[43.384px] font-semibold text-white leading-tight md:leading-[98.456%]"
                  >
                    50+
                  </div>
                  <div 
                    className="text-xs sm:text-sm md:text-[19.68px] text-white mt-1 font-extralight leading-normal"
                  >
                    Robotic Project
                  </div>
                </div>
                <div className="text-center lg:text-left">
                  <div 
                    className="text-xl sm:text-2xl md:text-[43.384px] font-semibold text-white leading-tight md:leading-[98.456%]"
                  >
                    2026
                  </div>
                  <div 
                    className="text-xs sm:text-sm md:text-[19.68px] text-white mt-1 font-extralight leading-normal"
                  >
                    Championship Year
                  </div>
                </div>
              </div>

             

              {/* VR Glasses Section */}
              <div className="pt-6 sm:pt-7 md:pt-8">
                <div className="flex flex-col items-start gap-3 sm:gap-4">
                  {/* VR Glasses Image with Play Button */}
                  <div className="relative flex items-center gap-2 sm:gap-3 md:gap-4 w-full justify-start md:justify-center lg:justify-start">
                    <img 
                      src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762949100/image_scodlx.png"
                      alt="VR Experience"
                      className="w-auto h-auto max-w-[60%] sm:max-w-[50%] md:max-w-full object-contain"
                    />
                    {/* Play Button - Positioned on right of VR image - Desktop: original position */}
                    <button
                      onClick={handlePlayButtonClick}
                      className="relative cursor-pointer hover:scale-110 transition-transform duration-300 -ml-10 sm:-ml-6 md:-ml-[58px] focus:outline-none bg-transparent border-0 p-0"
                    >
                      <img 
                        src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762949099/Play_Button_vutznp.png"
                        alt="Play"
                        className="w-auto h-auto max-w-[20%] sm:max-w-[18%] md:max-w-full object-contain"
                      />
                    </button>
                  </div>
                  
                  {/* Text after VR Glasses */}
                  <div className="w-full text-left">
                    <h3 
                      className="text-sm sm:text-base md:text-[19.25px] font-semibold text-white uppercase leading-normal"
                    >
                      LEARN. BUILD. TEST. COMPETE.
                    </h3>
                    <p 
                      className="text-xs sm:text-sm md:text-[15.4px] text-white mt-1 sm:mt-2 font-light leading-normal"
                    >
                      Your complete robotics journey starts here — with RoboWonder!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - Student Image - Hidden on mobile, visible on desktop */}
            <div className="hidden lg:flex relative w-full h-full flex-col justify-end items-end overflow-hidden">
              <div className="relative w-full max-w-none">
                <img 
                  src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762949257/Untitled_design_68_1_mzww74.png"
                  alt="Student Building Robot"
                  className="w-full h-auto max-w-full object-contain relative"
                />
                {/* Black Gradient Overlay at Bottom - Desktop: original height */}
                <div className="absolute bottom-0 left-0 right-0 h-32 lg:h-40 pointer-events-none z-10 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.2)_20%,rgba(0,0,0,0.4)_40%,rgba(0,0,0,0.7)_65%,rgba(0,0,0,0.9)_85%,black_100%)]"></div>
                {/* Additional blur overlay - Desktop: original height */}
                <div className="absolute bottom-0 left-0 right-0 h-16 lg:h-20 bg-black/90 pointer-events-none z-10"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Center Button with Hover Tooltip */}
        <div className="absolute -bottom-2 md:bottom-12 left-1/2 transform -translate-x-1/2 z-20 flex flex-col items-center">
          {/* Hover Tooltip - Shows on hover */}
          <div className="group relative">
            <button
              onClick={handlePlayButtonClick}
              className="relative transition-transform duration-300 hover:scale-110 focus:outline-none z-20"
            >
              {/* Button Image */}
              <img 
                src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1763010632/button_1_cmvzaa.png"
                alt="Start Learning Button"
                className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-contain cursor-pointer"
              />
              
              {/* Hover Tooltip Circle - Shows above button */}
              <div className="absolute left-1/2 transform -translate-x-1/2 mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-30 bottom-[43px]">
                <div className="bg-[#F58120] rounded-full flex flex-col items-center justify-center shadow-lg whitespace-nowrap w-[106px] h-[106px]">
                  <span className="text-black font-bold text-[20px] md:text-base leading-tight">Start</span>
                  <span className="text-black font-bold text-[20px] md:text-base leading-tight">Learning</span>
                </div>
                {/* Tooltip Arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[#F58120]"></div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default HeroSection
