import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = "/api/v1/course";

export const courseApi = createApi({
  reducerPath: "courseApi",
  tagTypes:['Refetch_Creator_Course'],
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: ({ courseTitle, category }) => ({
        url: "",
        method: "POST",
        body: { courseTitle, category },
      }),
      invalidatesTags:['Refetch_Creator_Course']
    }),
    getCreatorCourse: builder.query({
      query: () => ({
        url: "",
        method: "GET"
      }),
      providesTags:['Refetch_Creator_Course']
    }),
    getPublishedCourses: builder.query({
      query: () => ({
        url: "/published",
        method: "GET"
      })
    }),
    getLiveCourses: builder.query({
      query: () => ({
        url: "/live",
        method: "GET"
      })
    }),
    getPublishedCoursesByCategory: builder.query({
      query: () => ({
        url: "/published/filtered",
        method: "GET"
      })
    }),
    getLiveCoursesByCategory: builder.query({
      query: () => ({
        url: "/live/filtered",
        method: "GET"
      })
    }),
    getCourseById: builder.query({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "GET"
      })
    }),
    editCourse: builder.mutation({
      query: ({ formData, courseId }) => ({
      url:`/${courseId}`,
      method:"PUT",
      body:formData
    }),
      invalidatesTags:['Refetch_Creator_Course']
    }),
    deleteCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}`,
        method: "DELETE"
      }),
      invalidatesTags:['Refetch_Creator_Course']
    }),
    togglePublishCourse: builder.mutation({
      query: ({ courseId, publish }) => ({
        url: `/${courseId}/publish?publish=${publish}`,
        method: "PATCH"
      }),
      invalidatesTags:['Refetch_Creator_Course']
    }),
    toggleLiveCourse: builder.mutation({
      query: ({ courseId, live }) => ({
        url: `/${courseId}/live?live=${live}`,
        method: "PATCH"
      }),
      invalidatesTags:['Refetch_Creator_Course']
    }),
  }),
});

export const { 
  useCreateCourseMutation, 
  useGetCreatorCourseQuery, 
  useGetPublishedCoursesQuery, 
  useGetLiveCoursesQuery,
  useGetPublishedCoursesByCategoryQuery,
  useGetLiveCoursesByCategoryQuery,
  useGetCourseByIdQuery,
  useEditCourseMutation,
  useDeleteCourseMutation,
  useTogglePublishCourseMutation,
  useToggleLiveCourseMutation
} = courseApi;
