import { Loader2 } from 'lucide-react'
import React from 'react'

const LoadingSpinner = () => {
    return (
        <div className="relative overflow-hidden w-full min-h-screen bg-black bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center md:bg-top bg-no-repeat">
            {/* Simple Header - Static logo without routing - Hidden on mobile, shown on desktop */}
            <div className='hidden md:block h-16 md:h-20 bg-transparent absolute z-50 top-0 left-0 right-0'>
                <div className="px-4 sm:px-6 md:px-[6.125rem] mx-auto flex items-center justify-center h-full">
                    <div className="flex items-center justify-center">
                        <img 
                            src="https://res.cloudinary.com/dmlk8egiw/image/upload/v1762944292/Group_3645_vhtdrw.png"
                            alt="Robowunder Logo"
                            className="h-12 md:h-14 w-auto object-contain lg:h-16 xl:h-14 max-w-[280px]"
                        />
                    </div>
                </div>
            </div>
            
            {/* Loading Content - Less padding on mobile (no header), full padding on desktop (with header) */}
            <div className="relative flex items-center justify-center min-h-screen pt-4 md:pt-24">
                <div className="relative z-10 flex flex-col items-center justify-center">
                    {/* Glassmorphism Loading Card */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-2xl p-12 flex flex-col items-center justify-center">
                        {/* Spinner */}
                        <div className="relative">
                            {/* Outer Glow Ring */}
                            <div className="absolute inset-0 rounded-full bg-[#F58120]/20 blur-xl animate-pulse"></div>
                            {/* Spinner Icon */}
                            <Loader2 className="animate-spin h-16 w-16 text-[#F58120] relative z-10" />
                        </div>
                        
                        {/* Loading Text */}
                        <p className="mt-6 text-lg font-semibold text-white">
                            Loading, Please wait...
                        </p>
                        
                        {/* Animated Dots */}
                        <div className="flex gap-2 mt-4">
                            <div className="w-2 h-2 bg-[#F58120] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-[#F58120] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-[#F58120] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoadingSpinner