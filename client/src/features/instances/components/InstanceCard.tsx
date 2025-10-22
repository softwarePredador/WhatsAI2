import { WhatsAppInstance, InstanceStatus } from "../types/instanceTypes";
import { memo } from "react";
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
  // Safe status handling with fallback
  const safeStatus = (instance.status as InstanceStatus) || "pending";
  const statusInfo = statusConfig[safeStatus] || statusConfig.pending;
  const isConnected = instance.status === "connected" && instance.connected;
  const isConnecting = instance.status === "connecting";
  const hasQRCode = instance.qrCode && isConnecting;

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja deletar a instância "${instance.name}"?`)) {
      onDelete(instance.id);
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Nunca";
    return new Date(date).toLocaleString("pt-BR");
  };

  return (
    <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow rounded-2xl border border-base-300">
      <div className="card-body">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="card-title text-base-content mb-2 truncate">{instance.name}</h2>
            <p className="text-sm text-base-content/60 truncate">
              ID: {instance.evolutionInstanceName}
            </p>
          </div>
          <div className={`badge ${statusInfo.badgeClass} badge-lg flex-shrink-0`}>
            {statusInfo.label}
          </div>
        </div>

        {/* Connection Info */}
        <div className="divider my-2"></div>
        <div className="space-y-2 text-sm">
          {isConnected && (
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-success font-medium">Online</span>
            </div>
          )}
          
          {instance.connectedAt && (
            <div>
              <span className="text-base-content/60">Conectado em: </span>
              <span className="font-medium text-base-content">{formatDate(instance.connectedAt)}</span>
            </div>
          )}
          
          {instance.lastSeen && (
            <div>
              <span className="text-base-content/60">Última atividade: </span>
              <span className="font-medium">{formatDate(instance.lastSeen)}</span>
            </div>
          )}

          {hasQRCode && (
            <div className="alert alert-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span>QR Code disponível!</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="card-actions justify-end mt-4">
          {isConnecting && (
            <button 
              className="btn btn-info btn-sm border-0"
              onClick={() => onViewQR(instance)}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Ver QR Code
            </button>
          )}

          {!isConnected && !isConnecting && (
            <button 
              className="btn btn-success btn-sm border-0"
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
                  Conectar
                </>
              )}
            </button>
          )}

          {isConnected && (
            <>
              <Link 
                to={`/chat/${instance.id}`}
                className="btn btn-accent btn-sm border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Chat
              </Link>
              {onSendMessage && (
                <button 
                  className="btn btn-primary btn-sm border-0"
                  onClick={() => onSendMessage(instance)}
                  disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Mensagem
                </button>
              )}
              <button 
                className="btn btn-warning btn-sm border-0"
                onClick={() => onDisconnect(instance.id)}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    Desconectar
                  </>
                )}
              </button>
            </>
          )}

          <button 
            className="btn btn-error btn-sm border-0"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Deletar
              </>
            )}
          </button>
        </div>
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
