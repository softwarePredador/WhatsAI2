import { useNavigate } from "react-router-dom";
import AuthCard from "../features/auth/components/AuthCard";
import AuthContainer from "../features/auth/components/AuthContainer";
import LoginForm from "../features/auth/components/LoginForm";
import { useEffect } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <AuthContainer>
      <AuthCard
       title="Bem-vindo de volta"
       subtitle="Faça login para continuar"
       footerText="Não tem uma conta?"
       linkText="Cadastre-se"
       linkTo="/register"
      >
        <LoginForm />
      </AuthCard>
    </AuthContainer>
  );
}