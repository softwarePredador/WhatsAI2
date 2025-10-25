import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { userAuthStore } from "../features/auth/store/authStore";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
const token = userAuthStore((state) => state.token);
const checkAuth = userAuthStore((state) => state.checkAuth);
const location = useLocation();
const [isChecking, setIsChecking] = useState(true);

  console.log('🔒 [ProtectedRoute] Verificando acesso para:', location.pathname);
  console.log('🔒 [ProtectedRoute] Token existe?', !!token);

  useEffect(() => {
    console.log('🔒 [ProtectedRoute] useEffect - Chamando checkAuth()');
    checkAuth().finally(() => {
      setIsChecking(false);
      console.log('🔒 [ProtectedRoute] checkAuth() concluído');
    });
  }, []);

  // Esperar verificação de autenticação antes de redirecionar
  if (isChecking) {
    console.log('⏳ [ProtectedRoute] Aguardando verificação de token...');
    return <div className="flex items-center justify-center min-h-screen">
      <span className="loading loading-spinner loading-lg"></span>
    </div>;
  }

  if (!token) {
    console.log('🚫 [ProtectedRoute] SEM TOKEN - Redirecionando para /login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  console.log('✅ [ProtectedRoute] Token OK - Renderizando children');
  return <>{children}</>;
}