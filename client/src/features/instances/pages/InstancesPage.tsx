import { useEffect, useState } from "react";
import { userAuthStore } from "../../auth/store/authStore";
import { useInstanceStore } from "../store/instanceStore";
import InstanceCard from "../components/InstanceCard";
import CreateInstanceModal from "../components/CreateInstanceModal";
import QRCodeModal from "../components/QRCodeModal";
import { WhatsAppInstance, CreateInstancePayload } from "../types/instanceTypes";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { UserSettings, DEFAULT_SETTINGS, STORAGE_KEY } from "../../../types/settings";

export default function InstancesPage() {
  const { token } = userAuthStore();
  const {
    instances,
    loading,
    fetchInstances,
    fetchInstancesSilent,
    createInstance,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    fetchInstance
  } = useInstanceStore();

  // Carregar configurações do usuário
  const [settings] = useLocalStorage<UserSettings>(STORAGE_KEY, DEFAULT_SETTINGS);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInstanceForQR, setSelectedInstanceForQR] = useState<WhatsAppInstance | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // Fetch inicial
  useEffect(() => {
    if (token) {
      fetchInstances(token);
    }
  }, [token, fetchInstances]);

  // Auto-refresh baseado nas configurações do usuário
  useEffect(() => {
    // Se auto-refresh estiver desabilitado, não fazer nada
    if (!token || !settings.autoRefresh.enabled) {
      console.log('🛑 [InstancesPage] Auto-refresh disabled by user settings');
      return;
    }

    const intervalMs = settings.autoRefresh.interval * 1000; // Converter segundos para milissegundos
    console.log(`🔄 [InstancesPage] Starting auto-refresh every ${settings.autoRefresh.interval}s (${intervalMs}ms)`);

    const intervalId = setInterval(async () => {
      console.log('🔄 [InstancesPage] Auto-syncing instances with Evolution API...');
      setIsAutoRefreshing(true);
      
      try {
        // Use fetchInstancesSilent for background updates
        // This won't show loading spinner or recreate components
        await fetchInstancesSilent(token);
      } catch (error) {
        console.error('❌ [InstancesPage] Error syncing instances:', error);
      } finally {
        setIsAutoRefreshing(false);
      }
    }, intervalMs); // Intervalo dinâmico baseado nas configurações

    return () => {
      console.log('🛑 [InstancesPage] Stopping auto-refresh');
      clearInterval(intervalId);
    };
  }, [token, fetchInstancesSilent, settings.autoRefresh.enabled, settings.autoRefresh.interval]);

  const handleCreateInstance = async (payload: CreateInstancePayload) => {
    if (!token) return;
    await createInstance(payload, token);
  };

  const handleConnect = async (instanceId: string) => {
    if (!token) return;
    await connectInstance(instanceId, token);
    
    // Fetch updated instance and show QR code
    await fetchInstance(instanceId, token);
    const updatedInstance = instances.find((inst: WhatsAppInstance) => inst.id === instanceId);
    if (updatedInstance?.qrCode) {
      setSelectedInstanceForQR(updatedInstance);
    }
  };

  const handleDisconnect = async (instanceId: string) => {
    if (!token) return;
    await disconnectInstance(instanceId, token);
  };

  const handleDelete = async (instanceId: string) => {
    if (!token) return;
    await deleteInstance(instanceId, token);
  };

  const handleViewQR = (instance: WhatsAppInstance) => {
    setSelectedInstanceForQR(instance);
  };

  const handleRefreshQR = async (instanceId: string) => {
    if (!token) return;
    await fetchInstance(instanceId, token);
  };

  return (
    <div className="min-h-screen bg-base-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">
              Instâncias WhatsApp
            </h1>
            <p className="text-base-content/70 mt-2 flex items-center gap-2">
              Gerencie suas conexões WhatsApp
              {settings.autoRefresh.enabled ? (
                <span className="flex items-center gap-1 text-xs">
                  {isAutoRefreshing ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 animate-spin text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-primary animate-pulse">Atualizando...</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-success">Auto-refresh: {settings.autoRefresh.interval}s</span>
                    </>
                  )}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-base-content/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Auto-refresh desativado
                </span>
              )}
            </p>
          </div>
          
          <button
            className="btn btn-primary gap-2"
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Instância
          </button>
        </div>

        {/* Stats - usando componentes DaisyUI stats com visual neutro */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total de Instâncias */}
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Total</div>
              <div className="stat-value text-primary text-4xl">{instances.length}</div>
              <div className="stat-desc text-base-content/50 text-sm">Todas as suas conexões</div>
            </div>
          </div>

          {/* Conectadas */}
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Conectadas</div>
              <div className="stat-value text-success text-4xl">
                {instances.filter((i: WhatsAppInstance) => i.status === "connected" && i.connected).length}
              </div>
              <div className="stat-desc text-base-content/50 text-sm">Online agora</div>
            </div>
          </div>

          {/* Conectando */}
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Conectando</div>
              <div className="stat-value text-warning text-4xl">
                {instances.filter((i: WhatsAppInstance) => i.status === "connecting").length}
              </div>
              <div className="stat-desc text-base-content/50 text-sm">Aguardando QR Code</div>
            </div>
          </div>

          {/* Desconectadas */}
          <div className="stats shadow bg-base-100">
            <div className="stat">
              <div className="stat-figure">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <line x1="15" y1="9" x2="9" y2="15" strokeWidth={2} strokeLinecap="round" />
                  <line x1="9" y1="9" x2="15" y2="15" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </div>
              <div className="stat-title text-base-content/60 text-sm">Desconectadas</div>
              <div className="stat-value text-error text-4xl">
                {instances.filter((i: WhatsAppInstance) => i.status === "disconnected" || i.status === "error").length}
              </div>
              <div className="stat-desc text-base-content/50 text-sm">Offline</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && instances.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {/* Empty State */}
        {!loading && instances.length === 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-base-content/20 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h2 className="text-2xl font-bold">Nenhuma instância criada</h2>
              <p className="text-base-content/60 max-w-md mt-2">
                Crie sua primeira instância WhatsApp para começar a gerenciar suas conexões.
              </p>
              <button
                className="btn btn-primary mt-6"
                onClick={() => setIsCreateModalOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Criar Primeira Instância
              </button>
            </div>
          </div>
        )}

        {/* Instances Grid */}
        {!loading && instances.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((instance: WhatsAppInstance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                onDelete={handleDelete}
                onViewQR={handleViewQR}
                loading={loading}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <CreateInstanceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateInstance}
          loading={loading}
        />

        <QRCodeModal
          instance={selectedInstanceForQR}
          onClose={() => setSelectedInstanceForQR(null)}
          onRefresh={handleRefreshQR}
        />
      </div>
    </div>
  );
}
