import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const Course = ({ course }) => {
  const navigate = useNavigate();
  const { user } = useSelector(store => store.auth);

  const getCategoryLabel = (category) => {
    const categoryMap = {
      'grade_3_5_basic': 'Grade 3-5 (Basic)',
      'grade_6_8_basic': 'Grade 6-8 (Basic)',
      'grade_9_12_basic': 'Grade 9-12 (Basic)',
      'grade_3_5_advance': 'Grade 3-5 (Advance)',
      'grade_6_8_advance': 'Grade 6-8 (Advance)',
      'grade_9_12_advance': 'Grade 9-12 (Advance)'
    };
    return categoryMap[category] || category;
  };

  const handleCardClick = () => {
    navigate(`/course/${course._id}`);
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-2xl border-2 border-white/10 cursor-pointer bg-white/5 backdrop-blur-sm hover:border-orange-500/50 hover:bg-white/10 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-2"
    >
        {/* Orange Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"></div>
        
        {/* Course Image */}
        <div className="relative h-52 overflow-hidden bg-black/20">
          <img 
            src={course?.courseThumbnail || "https://via.placeholder.com/400x225?text=No+Image"}
            alt={course?.courseTitle || "Course"}
            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500" 
          />
          
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          {/* Level Badge */}
          {course?.courseLevel && (
            <div className="absolute top-4 right-4 z-10 pointer-events-none">
              <div className="bg-[#F58120] text-white px-3 py-1.5 text-xs font-semibold shadow-xl border-0 rounded-md">
                {course.courseLevel}
              </div>
            </div>
          )}

          {/* Category Badge - Bottom */}
          {course?.category && (
            <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
              <div className="bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 text-xs font-semibold shadow-lg border border-white/30 rounded-md">
                {getCategoryLabel(course.category)}
              </div>
            </div>
          )}
        </div>

        <CardContent className="relative p-6 space-y-4 bg-transparent">
            {/* Title & Subtitle */}
            <div className="space-y-3">
              <h2 className="font-semibold text-white text-lg leading-tight line-clamp-2 group-hover:text-orange-400 transition-colors duration-300">
                {course?.courseTitle || "Course Title"}
              </h2>
              
              {course?.subTitle && (
                <p className="text-sm text-white/70 line-clamp-2 leading-relaxed">
                  {course.subTitle}
                </p>
              )}
            </div>

            {/* Student Info */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              <Avatar className="h-10 w-10 ring-2 ring-orange-500/30 ring-offset-2 ring-offset-black/50 group-hover:ring-orange-500 transition-all duration-300">
                <AvatarImage src={user?.photoUrl} alt={user?.name || "Student"} />
                <AvatarFallback className="bg-[#F58120] text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "ST"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/50 font-medium uppercase tracking-wide">Student</p>
                <p className="font-semibold text-sm text-white truncate">
                  {user?.name || "Student"}
                </p>
              </div>
            </div>

            {/* Hover Action Hint */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
              <div className="bg-[#F58120] text-white rounded-full p-2 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
        </CardContent>
    </Card>
  )
}

export default Course