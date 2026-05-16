import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SCHOOL_CODE_API = "/api/v1/school-code";

export const schoolCodeApi = createApi({
  reducerPath: "schoolCodeApi",
  baseQuery: fetchBaseQuery({
    baseUrl: SCHOOL_CODE_API,
    credentials: "include",
  }),
  tagTypes: ["SchoolCodes"],
  endpoints: (builder) => ({
    getSchoolCodes: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ["SchoolCodes"],
    }),
    createSchoolCode: builder.mutation({
      query: (body) => ({
        url: "",
        method: "POST",
        body,
      }),
      invalidatesTags: ["SchoolCodes"],
    }),
    updateSchoolCode: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["SchoolCodes"],
    }),
    deleteSchoolCode: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["SchoolCodes"],
    }),
  }),
});

export const {
  useGetSchoolCodesQuery,
  useCreateSchoolCodeMutation,
  useUpdateSchoolCodeMutation,
  useDeleteSchoolCodeMutation,
} = schoolCodeApi;

