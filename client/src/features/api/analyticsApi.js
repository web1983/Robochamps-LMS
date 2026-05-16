import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const ANALYTICS_API = "/api/v1/analytics";

export const analyticsApi = createApi({
  reducerPath: "analyticsApi",
  tagTypes: ['Analytics'],
  baseQuery: fetchBaseQuery({
    baseUrl: ANALYTICS_API,
    credentials: "include",
  }),
  endpoints: (builder) => ({
    getDashboardStats: builder.query({
      query: () => ({
        url: "/stats",
        method: "GET",
      }),
      providesTags: ['Analytics']
    }),
    getUserGrowth: builder.query({
      query: (period = "month") => ({
        url: `/user-growth?period=${period}`,
        method: "GET",
      }),
    }),
    getStudentsMarks: builder.query({
      query: () => ({
        url: "/students-marks",
        method: "GET",
      }),
      providesTags: ['Analytics']
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetUserGrowthQuery,
  useGetStudentsMarksQuery
} = analyticsApi;

