import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const INSTRUCTOR_API = "/api/v1/user/";

export const instructorApi = createApi({
  reducerPath: "instructorApi",
  tagTypes: ["Instructors"],
  baseQuery: fetchBaseQuery({
    baseUrl: INSTRUCTOR_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    // Get all instructors
    getAllInstructors: builder.query({
      query: () => ({
        url: "all-instructors",
        method: "GET",
      }),
      providesTags: ["Instructors"],
    }),

    // Create new instructor
    createInstructor: builder.mutation({
      query: (instructorData) => ({
        url: "create-instructor",
        method: "POST",
        body: instructorData,
      }),
      invalidatesTags: ["Instructors"],
    }),

    // Update instructor password
    updateInstructorPassword: builder.mutation({
      query: ({ instructorId, newPassword }) => ({
        url: `instructor/${instructorId}/password`,
        method: "PUT",
        body: { newPassword },
      }),
      invalidatesTags: ["Instructors"],
    }),

    // Delete instructor
    deleteInstructor: builder.mutation({
      query: (instructorId) => ({
        url: `instructor/${instructorId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Instructors"],
    }),
  }),
});

export const {
  useGetAllInstructorsQuery,
  useCreateInstructorMutation,
  useUpdateInstructorPasswordMutation,
  useDeleteInstructorMutation,
} = instructorApi;

