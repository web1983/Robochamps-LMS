
import './App.css'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import HeroSection from './pages/student/HeroSection'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Courses from './pages/student/Courses'
import MyLearning from './pages/student/MyLearning'
import Profile from './pages/student/Profile'
import UploadVideo from './pages/student/UploadVideo'
import CourseDetail from './pages/student/CourseDetail'
import VideoPlayer from './pages/student/VideoPlayer'
import MCQTest from './pages/student/MCQTest'
import Slidebar from './pages/admin/Slidebar'
import Dashboard from './pages/admin/Dashboard'
import CourseTable from './pages/admin/course/CourseTable'
import AddCourse from './pages/admin/course/AddCourse'
import EditCourse from './pages/admin/course/EditCourse'
import CourseTest from './pages/admin/test/CourseTest'
import MarksManagement from './pages/admin/marks/MarksManagement'
import CreateUser from './pages/admin/user/CreateUser'
import UserManagement from './pages/admin/user/UserManagement'
import InstructorTab from './pages/admin/InstructorTab'
import LiveCourses from './pages/admin/course/LiveCourses'
import SchoolCodes from './pages/admin/SchoolCodes'
import Settings from './pages/admin/settings/Settings'
import GenerateCertificate from './pages/admin/certificate/GenerateCertificate'
import StudentVideos from './pages/admin/StudentVideos'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'
import SEOHead from './components/SEOHead'
import ErrorBoundary from './components/ErrorBoundary'

const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element:(
          <>
            <HeroSection />
            <Courses/>
          </>
        ),
      },
      {
        path:"login",
        element:<Login/>
      },
      {
        path:"forgot-password",
        element:<ForgotPassword/>
      },
      {
        path:"reset-password",
        element:<ResetPassword/>
      },
      {
        path:"my-learning",
        element:<MyLearning/>
      },
      {
        path:"profile",
        element:<Profile/>
      },
      {
        path:"upload-video",
        element:<UploadVideo/>
      },
      {
        path:"course/:courseId",
        element:<CourseDetail/>
      },
      {
        path:"course/:courseId/video",
        element: (
          <ErrorBoundary>
            <VideoPlayer/>
          </ErrorBoundary>
        )
      },
      {
        path:"course/:courseId/test",
        element:<MCQTest/>
      },


      // admin routes start from here
      {
        path:"admin",
        element: (
          <ProtectedRoute allowedRoles={['instructor']}>
            <Slidebar/>
          </ProtectedRoute>
        ),
        children:[
          {
            path:"dashboard",
            element:<Dashboard/>
          },
          {
            path:"course",
            element:<CourseTable/>
          },
          {
            path:"live-courses",
            element:<LiveCourses/>
          },
          {
            path:"course/create",
            element:<AddCourse/>
          },
          {
            path:"course/:courseId",
            element:<EditCourse/>
          },
          {
            path:"test",
            element:<CourseTest/>
          },
          {
            path:"marks",
            element:<MarksManagement/>
          },
          {
            path:"users",
            element:<CreateUser/>
          },
          {
            path:"manage-users",
            element:<UserManagement/>
          },
          {
            path:"instructors",
            element:<InstructorTab/>
          },
          {
            path:"school-codes",
            element:<SchoolCodes/>
          },
          {
            path:"generate-certificate",
            element:<GenerateCertificate/>
          },
          {
            path:"settings",
            element:<Settings/>
          },
          {
            path:"student-videos",
            element:<StudentVideos/>
          },
        ]
      },

      // Catch-all route for undefined paths (404)
      {
        path:"*",
        element:<NotFound/>
      }

    ],
    
  },
]);

function App() {
  return (
    <main>
      <SEOHead />
      <RouterProvider router={appRouter} />
      {/* <Navbar />
      <HeroSection />
      <Login /> */}
    </main>
  )
}

export default App
