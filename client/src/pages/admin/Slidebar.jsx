import {
  ChartNoAxesColumn,
  SquareLibrary,
  ClipboardList,
  UserPlus,
  UserCog,
  Settings,
  Trophy,
  Users,
  Radio,
  KeyRound,
  Award,
  Video,
} from 'lucide-react'
import React from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

const navLinks = [
  { to: 'dashboard', label: 'Dashboard', icon: ChartNoAxesColumn },
  { to: 'course', label: 'Courses', icon: SquareLibrary },
  { to: 'live-courses', label: 'Live Courses', icon: Radio },
  { to: 'test', label: 'Course Test', icon: ClipboardList },
  { to: 'marks', label: 'Marks', icon: Trophy },
  { to: 'users', label: 'Create User', icon: UserPlus },
  { to: 'manage-users', label: 'Manage Users', icon: UserCog },
  { to: 'student-videos', label: 'Student Videos', icon: Video },
  { to: 'instructors', label: 'Instructors', icon: Users },
  { to: 'school-codes', label: 'School Codes', icon: KeyRound },
  { to: 'generate-certificate', label: 'Certificates', icon: Award },
  { to: 'settings', label: 'Settings', icon: Settings },
]

const Slidebar = () => {
  const location = useLocation()

  const isActive = (to) => location.pathname.includes(to)

  return (
    <div className="admin-theme relative min-h-screen w-full overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('https://res.cloudinary.com/dmlk8egiw/image/upload/v1763026348/Robowunder_Banner_1_qxdhb7.jpg')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black" />
      </div>

      <div className="relative flex min-h-screen">
        <aside className="hidden h-screen w-72 flex-col border-r border-white/10 bg-white/5 px-6 py-8 backdrop-blur-2xl lg:flex">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F58120]/20 text-[#F58120]">
              <ChartNoAxesColumn size={24} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">Robowunder</p>
              <p className="text-xl font-semibold">Admin Panel</p>
            </div>
          </div>
          <nav className="space-y-2">
            {navLinks.map(({ to, label, icon }) => {
              const Icon = icon;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                    isActive(to)
                      ? 'bg-[#F58120] text-white shadow-[0_15px_35px_rgba(245,129,32,0.35)]'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="relative z-10 flex-1">
          <div className="sticky top-0 z-20 border-b border-white/10 bg-black/70 px-4 py-4 backdrop-blur-2xl lg:hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Robowunder</p>
                <p className="text-lg font-semibold">Admin Panel</p>
              </div>
            </div>
            <div className="mt-4 flex w-full gap-3 overflow-x-auto">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive(to)
                      ? 'bg-[#F58120] text-white shadow-[0_10px_25px_rgba(245,129,32,0.35)]'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="relative z-10 px-4 py-8 md:px-10 md:py-12">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Slidebar