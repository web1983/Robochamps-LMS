import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SETTINGS_API = "/api/v1/settings";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  tagTypes: ['Settings'],
  baseQuery: fetchBaseQuery({
    baseUrl: SETTINGS_API,
    credentials: "include",
  }),
  keepUnusedDataFor: 3600, // Cache for 1 hour
  refetchOnMountOrArgChange: 300, // Refetch if data is older than 5 minutes
  refetchOnFocus: false, // Don't refetch when window regains focus
  refetchOnReconnect: false, // Don't refetch on network reconnect
  endpoints: (builder) => ({
    getSettings: builder.query({
      query: () => ({
        url: "",
        method: "GET",
      }),
      providesTags: ['Settings']
    }),
    updateSettings: builder.mutation({
      query: (formData) => ({
        url: "",
        method: "PUT",
        body: formData,
      }),
      invalidatesTags: ['Settings']
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation
} = settingsApi;

