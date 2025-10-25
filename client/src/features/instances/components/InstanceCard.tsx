import { WhatsAppInstance, InstanceStatus } from "../types/instanceTypes";
import { memo, useState } from "react";
import { Link } from "react-router-dom";

interface InstanceCardProps {
  instance: WhatsAppInstance;
  onConnect: (instanceId: string) => void;
  onDisconnect: (instanceId: string) => void;
  onDelete: (instanceId: string) => void;
  onViewQR: (instance: WhatsAppInstance) => void;
  onSendMessage?: (instance: WhatsAppInstance) => void;
  loading?: boolean;
}

const statusConfig: Record<InstanceStatus, { label: string; colorClass: string; badgeClass: string }> = {
  pending: { 
    label: "Pendente", 
    colorClass: "text-gray-500", 
    badgeClass: "badge-ghost" 
  },
  disconnected: { 
    label: "Desconectado", 
    colorClass: "text-error", 
    badgeClass: "badge-error" 
  },
  connecting: { 
    label: "Conectando", 
    colorClass: "text-warning", 
    badgeClass: "badge-warning" 
  },
  connected: { 
    label: "Conectado", 
    colorClass: "text-success", 
    badgeClass: "badge-success" 
  },
  error: { 
    label: "Erro", 
    colorClass: "text-error", 
    badgeClass: "badge-error" 
  }
};

function InstanceCard({ 
  instance, 
  onConnect, 
  onDisconnect, 
  onDelete, 
  onViewQR,
  onSendMessage,
  loading = false 
}: InstanceCardProps) {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Safe status handling with fallback
  const safeStatus = (instance.status as InstanceStatus) || "pending";
  const statusInfo = statusConfig[safeStatus] || statusConfig.pending;
  const isConnected = instance.status === "connected" && instance.connected;
  const isConnecting = instance.status === "connecting";
  const hasQRCode = instance.qrCode && isConnecting;

  const handleDisconnect = () => {
    setShowDisconnectModal(false);
    onDisconnect(instance.id);
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    onDelete(instance.id);
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all rounded-2xl border border-base-300">
      <div className="card-body p-6">
        {/* Header com Badge de Status e Menu */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-base-content mb-1 truncate">{instance.name}</h2>
            <p className="text-xs text-base-content/50 truncate font-mono">
              {instance.evolutionInstanceName}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`badge ${statusInfo.badgeClass} gap-2 px-3 py-3 font-medium`}>
              {isConnected && (
                <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              )}
              {statusInfo.label}
            </div>

            {/* Dropdown Menu */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300">
                {isConnected && (
                  <li>
                    <button 
                      onClick={() => setShowDisconnectModal(true)}
                      className="text-warning hover:bg-warning/10"
                      disabled={loading}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Desconectar
                    </button>
                  </li>
                )}
                <li>
                  <button 
                    onClick={() => setShowDeleteModal(true)}
                    className="text-error hover:bg-error/10"
                    disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Deletar Instância
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Informações de Conexão */}
        {(instance.connectedAt || instance.lastSeen) && (
          <div className="bg-base-200 rounded-lg p-3 space-y-1.5 mb-4">
            {instance.connectedAt && (
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-base-content/70">Conectado em:</span>
                <span className="font-medium text-base-content ml-auto">{formatDate(instance.connectedAt)}</span>
              </div>
            )}
            
            {instance.lastSeen && (
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-base-content/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-base-content/70">Última atividade:</span>
                <span className="font-medium text-base-content ml-auto">{formatDate(instance.lastSeen)}</span>
              </div>
            )}
          </div>
        )}

        {/* Alerta de QR Code */}
        {hasQRCode && (
          <div className="alert alert-info mb-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">QR Code pronto para escaneamento</span>
          </div>
        )}

        {/* Botões de Ação - Apenas ações principais */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {/* Conectando - Ver QR */}
          {isConnecting && (
            <button 
              className="btn btn-info btn-sm col-span-2"
              onClick={() => onViewQR(instance)}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Ver QR Code
            </button>
          )}

          {/* Desconectado - Conectar */}
          {!isConnected && !isConnecting && (
            <button 
              className="btn btn-success btn-sm col-span-2"
              onClick={() => onConnect(instance.id)}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Conectar WhatsApp
                </>
              )}
            </button>
          )}

          {/* Conectado - Apenas ações principais (Chat e Enviar) */}
          {isConnected && (
            <>
              <Link 
                to={`/chat/${instance.id}`}
                className="btn btn-primary btn-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Abrir Chat
              </Link>

              {onSendMessage && (
                <button 
                  className="btn btn-accent btn-sm"
                  onClick={() => onSendMessage(instance)}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Mensagem
                </button>
              )}
            </>
          )}
        </div>

        {/* Modal de Confirmação - Desconectar */}
        {showDisconnectModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg mb-4">Desconectar WhatsApp</h3>
              <p className="py-4">
                Tem certeza que deseja desconectar a instância <strong>{instance.name}</strong>?
                <br />
                <span className="text-sm text-base-content/60 mt-2 block">
                  Você precisará escanear o QR Code novamente para reconectar.
                </span>
              </p>
              <div className="modal-action">
                <button 
                  className="btn btn-ghost"
                  onClick={() => setShowDisconnectModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Sim, Desconectar'
                  )}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowDisconnectModal(false)}></div>
          </div>
        )}

        {/* Modal de Confirmação - Deletar */}
        {showDeleteModal && (
          <div className="modal modal-open">
            <div className="modal-box">
              <h3 className="font-bold text-lg text-error mb-4">⚠️ Deletar Instância</h3>
              <p className="py-4">
                Tem certeza que deseja deletar permanentemente a instância <strong>{instance.name}</strong>?
                <br />
                <span className="text-sm text-error mt-2 block font-semibold">
                  ⚠️ Esta ação não pode ser desfeita! Todas as conversas e mensagens serão perdidas.
                </span>
              </p>
              <div className="modal-action">
                <button 
                  className="btn btn-ghost"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-error"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Sim, Deletar Permanentemente'
                  )}
                </button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
// Only re-render if instance data actually changes
export default memo(InstanceCard, (prevProps, nextProps) => {
  return (
    prevProps.instance.id === nextProps.instance.id &&
    prevProps.instance.status === nextProps.instance.status &&
    prevProps.instance.connected === nextProps.instance.connected &&
    prevProps.instance.qrCode === nextProps.instance.qrCode &&
    prevProps.instance.name === nextProps.instance.name &&
    prevProps.loading === nextProps.loading
  );
});
