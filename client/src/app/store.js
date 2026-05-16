import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { authApi } from "@/features/api/authApi";
import { courseApi } from "@/features/api/CourseApi";
import { enrollmentApi } from "@/features/api/enrollmentApi";
import { analyticsApi } from "@/features/api/analyticsApi";
import { settingsApi } from "@/features/api/settingsApi";
import { instructorApi } from "@/features/api/instructorApi";
import { schoolCodeApi } from "@/features/api/schoolCodeApi";

export const appStore = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      courseApi.middleware, 
      enrollmentApi.middleware,
      analyticsApi.middleware,
      settingsApi.middleware,
      instructorApi.middleware,
      schoolCodeApi.middleware
    ),
});

const initializeApp = async () => {
  // Silently check if user is logged in on app load
  // 401 errors are expected if not logged in - this is normal behavior
  await appStore.dispatch(authApi.endpoints.loadUser.initiate({}, {forceRefetch:true}));
}

initializeApp();