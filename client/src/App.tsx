import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AuthContainer from './features/auth/components/AuthContainer';
import AuthCard from './features/auth/components/AuthCard';
import { LoginPage } from './pages/LoginPage';
import RegisterForm from './features/auth/components/RegisterForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { userAuthStore } from './features/auth/store/authStore';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import InstancesPage from './features/instances/pages/InstancesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { ChatLayout } from './pages/ChatLayout';
import { useTheme } from './hooks/useTheme';
import { socketService } from './services/socketService';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';

function RegisterPage() {
  return (
    <AuthContainer>
      <AuthCard
        title="Crie sua conta"
        subtitle="Comece a usar o WhatsAI"
        footerText="Já tem uma conta?"
        linkText="Entrar"
        linkTo="/login"
      >
        <RegisterForm />
      </AuthCard>
    </AuthContainer>
  );
}

const AppLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  console.log('🌐 [AppLayout] Renderizando rota:', location.pathname);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Background for dark and light modes - only shown on non-homepage routes */}
      {!isHomePage && (
        <>
        <div className="fixed inset-0 -z-10 h-full w-full bg-base-100 [background:radial-gradient(125%_125%_at_50%_10%,hsl(var(--b1))_40%,hsl(var(--p))_100%)]"></div>
        </>
      )}

      <Header />
      <main className="flex-grow w-full">
        {/* Use Outlet instead of nested Routes */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};


export function App() {
  // Aplicar tema globalmente
  useTheme();

  const token = userAuthStore((state) => state.token);

  // 🔌 Conectar WebSocket globalmente quando o app inicia
  useEffect(() => {
    if (token) {
      console.log('🔌 [App] Conectando WebSocket globalmente');
      socketService.connect(token);

      return () => {
        console.log('🔌 [App] Desconectando WebSocket');
        socketService.disconnect();
      };
    }
  }, [token]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000, // 4 segundos para dar tempo de ler
          success: {
            style: {
              background: '#10b981',
              color: 'white',
            },
          },
          error: {
            style: {
              background: '#ef4444',
              color: 'white',
            },
            duration: 6000, // Erros ficam mais tempo visíveis
          },
        }}
      />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
              />
            <Route
              path="/instances"
              element={
                <ProtectedRoute>
                  <InstancesPage />
                </ProtectedRoute>
              }
              />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
              />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
              />
            <Route
              path="/chat/:instanceId"
              element={
                <ProtectedRoute>
                  <ChatLayout />
                </ProtectedRoute>
              }
              />
            <Route
              path="/chat/:instanceId/:conversationId"
              element={
                <ProtectedRoute>
                  <ChatLayout />
                </ProtectedRoute>
              }
              />
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}