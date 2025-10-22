import { BrowserRouter, Routes, Route, Link, useLocation, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import AuthContainer from './features/auth/components/AuthContainer';
import AuthCard from './features/auth/components/AuthCard';
import { LoginPage } from './pages/LoginPage';
import RegisterForm from './features/auth/components/RegisterForm';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { userAuthStore } from './features/auth/store/authStore';
import { useInstanceStore } from './features/instances/store/instanceStore';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import InstancesPage from './features/instances/pages/InstancesPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import { useTheme } from './hooks/useTheme';

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

function DashboardPage() {
  const user = userAuthStore((state) => state.user);
  const token = userAuthStore((state) => state.token);
  const logout = userAuthStore((state) => state.logout);
  const { instances, fetchInstances } = useInstanceStore();

  // Fetch instances on component mount
  useEffect(() => {
    if (token) {
      fetchInstances(token);
    }
  }, [token, fetchInstances]);

  // Calculate statistics
  const totalInstances = instances.length;
  const connectedInstances = instances.filter(inst => inst.status === 'connected').length;

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header com boas-vindas */}
        <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-300 p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-base-content mb-2">
                Olá, {user?.name || 'Usuário'}! 👋
              </h1>
              <p className="text-base-content/70">
                Bem-vindo ao seu painel de gerenciamento WhatsAI
              </p>
            </div>
          </div>
        </div>

        {/* Card de informações do usuário */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-300 p-6">
            <h2 className="text-xl font-semibold text-base-content mb-4">
              Informações da Conta
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-base-content/60">Nome</p>
                <p className="text-lg font-medium text-base-content">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-base-content/60">Email</p>
                <p className="text-lg font-medium text-base-content">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Atalhos Rápidos */}
          <div className="card bg-base-100 shadow-xl rounded-2xl border border-base-300 p-6">
            <h2 className="text-xl font-semibold text-base-content mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Criar Nova Instância */}
              <Link
                to="/instances"
                className="btn btn-ghost flex flex-col items-center justify-center p-4 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all hover:scale-105 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-base-content text-center">Nova Instância</span>
              </Link>

              {/* Ver Instâncias */}
              <Link
                to="/instances"
                className="btn btn-ghost flex flex-col items-center justify-center p-4 bg-success/10 hover:bg-success/20 rounded-lg transition-all hover:scale-105 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-success mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="text-sm font-medium text-base-content text-center">Minhas Instâncias</span>
              </Link>

              {/* Atualizar Página */}
              <button
                onClick={() => {
                  if (token) fetchInstances(token);
                }}
                className="btn btn-ghost flex flex-col items-center justify-center p-4 bg-info/10 hover:bg-info/20 rounded-lg transition-all hover:scale-105 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-info mb-2 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm font-medium text-base-content text-center">Atualizar Dados</span>
              </button>

              {/* Sair */}
              <button
                onClick={() => logout()}
                className="btn btn-ghost flex flex-col items-center justify-center p-4 bg-error/10 hover:bg-error/20 rounded-lg transition-all hover:scale-105 group"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-error mb-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-sm font-medium text-base-content text-center">Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Grid de estatísticas detalhadas - mantém gradientes coloridos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total de Instâncias */}
          <div className="stats shadow-xl bg-base-100 rounded-2xl border border-base-300">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Total</div>
              <div className="stat-value text-primary text-4xl">{totalInstances}</div>
              <div className="stat-desc text-base-content/50 text-sm">Instâncias criadas</div>
            </div>
          </div>

          {/* Conectadas */}
          <div className="stats shadow-xl bg-base-100 rounded-2xl border border-base-300">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Conectadas</div>
              <div className="stat-value text-success text-4xl">{connectedInstances}</div>
              <div className="stat-desc text-base-content/50 text-sm">Online agora</div>
            </div>
          </div>

          {/* Conectando */}
          <div className="stats shadow-xl bg-base-100 rounded-2xl border border-base-300">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Conectando</div>
              <div className="stat-value text-warning text-4xl">{instances.filter(inst => inst.status === 'connecting').length}</div>
              <div className="stat-desc text-base-content/50 text-sm">Aguardando QR Code</div>
            </div>
          </div>

          {/* Desconectadas */}
     <div className="stats shadow-xl bg-base-100 rounded-2xl border border-base-300">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <line x1="15" y1="9" x2="9" y2="15" strokeWidth={2} strokeLinecap="round" />
                  <line x1="9" y1="9" x2="15" y2="15" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Desconectadas</div>
              <div className="stat-value text-error text-4xl">{instances.filter(inst => inst.status === 'disconnected' || inst.status === 'error').length}</div>
              <div className="stat-desc text-base-content/50 text-sm">Offline</div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">
            {totalInstances === 0 ? 'Pronto para começar?' : 'Continue gerenciando'}
          </h2>
          <p className="mb-6 opacity-90">
            {totalInstances === 0 
              ? 'Crie sua primeira instância WhatsApp e comece a gerenciar suas mensagens de forma profissional.'
              : 'Gerencie suas instâncias WhatsApp e acompanhe suas conexões em tempo real.'}
          </p>
          <Link 
            to="/instances"
            className="btn btn-neutral w-fit"
          >
            {totalInstances === 0 ? 'Criar Instância WhatsApp' : 'Ver Minhas Instâncias'}
          </Link>
        </div>
      </div>
    </div>
  );
}

const AppLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Background for dark and light modes - only shown on non-homepage routes */}
      {!isHomePage && (
        <>
        <div className="fixed inset-0 -z-10 h-full w-full bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]"></div>
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
  
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 1000,
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
          },
        }}
      />
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<HomePage />} />
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
            <Route path="*" element={<HomePage />} />
          </Route>
        </Routes>
    </BrowserRouter>
  );
}