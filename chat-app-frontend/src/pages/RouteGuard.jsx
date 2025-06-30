import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// login/register 
export function ProtectedAuthRoute({ children }) {
    const { isLoggedIn } = useAuth();
    if (isLoggedIn) return <Navigate to="/profile" replace />;
    return children;
}

// chat/profile
export function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}
