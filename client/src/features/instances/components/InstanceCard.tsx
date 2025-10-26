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

const statusConfig: Record<InstanceStatus, { label: string; colorClass: string; badgeClass: string; icon: string }> = {
  pending: { 
    label: "Pendente", 
    colorClass: "text-base-content/60", 
    badgeClass: "badge-ghost",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  disconnected: { 
    label: "Desconectado", 
    colorClass: "text-error", 
    badgeClass: "badge-error",
    icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
  },
  connecting: { 
    label: "Conectando", 
    colorClass: "text-warning", 
    badgeClass: "badge-warning",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
  },
  connected: { 
    label: "Conectado", 
    colorClass: "text-success", 
    badgeClass: "badge-success",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  },
  error: { 
    label: "Erro", 
    colorClass: "text-error", 
    badgeClass: "badge-error",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
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
    <div className="group card bg-base-100/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl border border-base-300/50 hover:border-base-300 hover:bg-base-100 hover:scale-[1.02]">
      <div className="card-body p-6">
        {/* Header com Badge de Status e Menu */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-10 h-10 flex items-center justify-center">
                <span className="text-sm font-bold">{instance.name.charAt(0).toUpperCase()}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-base-content mb-1 truncate">{instance.name}</h2>
              <p className="text-xs text-base-content/50 truncate font-mono">
                {instance.evolutionInstanceName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`badge ${statusInfo.badgeClass} gap-1 px-2 py-1 font-medium text-xs`}>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={statusInfo.icon} />
                </svg>
                {isConnected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse flex-shrink-0"></div>
                )}
              </div>
              <span className="ml-0.5">{statusInfo.label}</span>
            </div>

            {/* Dropdown Menu */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-sm btn-circle hover:bg-base-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </label>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300/50 backdrop-blur-sm">
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
          <div className="bg-base-200/50 rounded-xl p-4 space-y-3 mb-4">
            {instance.connectedAt && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-base-content/70 block text-xs">Conectado em</span>
                  <span className="font-medium text-base-content">{formatDate(instance.connectedAt)}</span>
                </div>
              </div>
            )}
            
            {instance.lastSeen && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-info/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-base-content/70 block text-xs">Última atividade</span>
                  <span className="font-medium text-base-content">{formatDate(instance.lastSeen)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerta de QR Code */}
        {hasQRCode && (
          <div className="alert alert-info mb-4 py-3 border border-info/20 bg-info/10">
            <div className="w-6 h-6 rounded-full bg-info/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-info" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01M12 12h4.01M12 15h4.01M12 21h4.01" />
              </svg>
            </div>
            <span className="text-sm font-medium">QR Code pronto para escaneamento</span>
          </div>
        )}

        {/* Botões de Ação - Apenas ações principais */}
        <div className="flex gap-2 mt-4">
          {/* Conectando - Ver QR */}
          {isConnecting && (
            <button
              className="btn btn-info btn-sm flex-1 gap-2 hover:scale-105 transition-transform"
              onClick={() => onViewQR(instance)}
              disabled={loading}
            >
              <div className="w-5 h-5 rounded-full bg-info-content/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              Ver QR Code
            </button>
          )}

          {/* Desconectado - Conectar */}
          {!isConnected && !isConnecting && (
            <button
              className="btn btn-success btn-sm flex-1 gap-2 hover:scale-105 transition-transform"
              onClick={() => onConnect(instance.id)}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <div className="w-5 h-5 rounded-full bg-primary-content/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
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
                className="btn btn-primary btn-sm flex-1 gap-2 hover:scale-105 transition-transform"
              >
                <div className="w-5 h-5 rounded-full bg-primary-content/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                Abrir Chat
              </Link>

              {onSendMessage && (
                <button
                  className="btn btn-primary btn-sm flex-1 gap-2 hover:scale-105 transition-transform"
                  onClick={() => onSendMessage(instance)}
                  disabled={loading}
                >
                  <div className="w-5 h-5 rounded-full bg-primary-content/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
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
