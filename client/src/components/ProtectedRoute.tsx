import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { userAuthStore } from "../features/auth/store/authStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
const token = userAuthStore((state) => state.token);
const checkAuth = userAuthStore((state) => state.checkAuth);

  useEffect(() => {
   checkAuth()
  }, []);

  if (!token) {
    return <Navigate to="/login"/>;
  }
  return <>{children}</>;
}