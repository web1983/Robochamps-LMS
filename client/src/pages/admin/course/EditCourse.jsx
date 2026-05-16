import { Button } from '@/components/ui/button'
import React from 'react'
import { Link } from 'react-router-dom'
import CourseTab from './CourseTab'
import { accentButton, mutedText } from '../theme'

const EditCourse = () => {
  return (
    <div className='space-y-6 text-white'>
        <div className='flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
            <div>
              <h1 className='text-3xl font-semibold'>Edit Course Details</h1>
              <p className={mutedText}>Update course content, media, and assessments.</p>
            </div>
            <Link to="lecture">
            <Button className={accentButton}>Go to lectures page</Button>
            </Link>
        </div>

        <CourseTab/>

    </div>
  )
}

export default EditCourse