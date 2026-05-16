import Navbar from '@/components/Navbar'
import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'

const MainLayout = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  return (
    <div className="bg-black w-full min-h-screen">
        <Navbar/>
        <div className={isAdminPage ? 'pt-20' : ''}>
            <Outlet/>
        </div>
    </div>
  )
}

export default MainLayout