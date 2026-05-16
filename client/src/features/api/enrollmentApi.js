import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ENROLLMENT_API = "/api/v1/enrollment";

export const enrollmentApi = createApi({
  reducerPath: "enrollmentApi",
  tagTypes: ['Enrollment'],
  baseQuery: fetchBaseQuery({
    baseUrl: ENROLLMENT_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getMyEnrollments: builder.query({
      query: () => ({
        url: "/my-enrollments",
        method: "GET",
      }),
      providesTags: ['Enrollment']
    }),
    getCertificateStatus: builder.query({
      query: () => ({
        url: "/certificate-status",
        method: "GET",
      }),
      providesTags: ['Enrollment']
    }),
    enrollCourse: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/enroll`,
        method: "POST",
      }),
      invalidatesTags: ['Enrollment']
    }),
    getEnrollmentStatus: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/status`,
        method: "GET",
      }),
      providesTags: ['Enrollment']
    }),
    markVideoWatched: builder.mutation({
      query: (courseId) => ({
        url: `/${courseId}/video-watched`,
        method: "PATCH",
      }),
      invalidatesTags: ['Enrollment']
    }),
    getTestQuestions: builder.query({
      query: (courseId) => ({
        url: `/${courseId}/test`,
        method: "GET",
      }),
    }),
    submitTest: builder.mutation({
      query: ({ courseId, answers }) => ({
        url: `/${courseId}/test/submit`,
        method: "POST",
        body: { answers },
      }),
      invalidatesTags: ['Enrollment']
    }),
  }),
});

export const {
  useGetMyEnrollmentsQuery,
  useGetCertificateStatusQuery,
  useEnrollCourseMutation,
  useGetEnrollmentStatusQuery,
  useMarkVideoWatchedMutation,
  useGetTestQuestionsQuery,
  useSubmitTestMutation,
} = enrollmentApi;

