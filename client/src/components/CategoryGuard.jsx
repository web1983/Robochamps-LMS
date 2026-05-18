import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/select-category"];

const CategoryGuard = ({ children }) => {
  const { user, isAuthenticated } = useSelector((store) => store.auth);
  const location = useLocation();

  const isPublic = PUBLIC_PATHS.some((path) => location.pathname.startsWith(path));
  const isAdmin = location.pathname.startsWith("/admin");

  if (
    isAuthenticated &&
    user?.role === "student" &&
    !user?.category &&
    !isPublic &&
    !isAdmin
  ) {
    return <Navigate to="/select-category" replace />;
  }

  return children;
};

export default CategoryGuard;
