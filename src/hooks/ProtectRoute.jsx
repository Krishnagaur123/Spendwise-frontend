// ProtectedRoute — redirects unauthenticated users to /login.
// Token presence is the only check here; expiry is caught by the axios 401 interceptor.
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
