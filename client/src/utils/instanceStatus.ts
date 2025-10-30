/**
 * Utility functions for normalizing and handling instance status
 * 
 * The backend may return status in different cases (CONNECTED, connected, etc.)
 * These utilities ensure consistent comparison regardless of case
 */

export type NormalizedStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'QRCODE' | 'PENDING' | 'ERROR';

/**
 * Normalize status to uppercase for consistent comparison
 */
export const normalizeStatus = (status: string): string => {
  return status.toUpperCase();
};

/**
 * Check if instance is connected
 */
export const isConnected = (status: string): boolean => {
  return normalizeStatus(status) === 'CONNECTED';
};

/**
 * Check if instance is connecting
 */
export const isConnecting = (status: string): boolean => {
  return normalizeStatus(status) === 'CONNECTING';
};

/**
 * Check if instance is disconnected
 */
export const isDisconnected = (status: string): boolean => {
  return normalizeStatus(status) === 'DISCONNECTED';
};

/**
 * Check if instance needs QR code
 */
export const needsQRCode = (status: string): boolean => {
  return normalizeStatus(status) === 'QRCODE' || normalizeStatus(status) === 'CONNECTING';
};

/**
 * Get user-friendly status label in Portuguese
 */
export const getStatusLabel = (status: string): string => {
  const normalized = normalizeStatus(status);
  
  const labels: Record<string, string> = {
    'CONNECTED': 'Online',
    'DISCONNECTED': 'Offline',
    'CONNECTING': 'Conectando',
    'QRCODE': 'Aguardando QR',
    'PENDING': 'Pendente',
    'ERROR': 'Erro'
  };
  
  return labels[normalized] || status;
};

/**
 * Get status color class for badges
 */
export const getStatusColor = (status: string): string => {
  const normalized = normalizeStatus(status);
  
  const colors: Record<string, string> = {
    'CONNECTED': 'badge-success',
    'DISCONNECTED': 'badge-error',
    'CONNECTING': 'badge-warning',
    'QRCODE': 'badge-info',
    'PENDING': 'badge-ghost',
    'ERROR': 'badge-error'
  };
  
  return colors[normalized] || 'badge-ghost';
};

/**
 * Get status background color for indicators
 */
export const getStatusBgColor = (status: string): string => {
  const normalized = normalizeStatus(status);
  
  const colors: Record<string, string> = {
    'CONNECTED': 'bg-success',
    'DISCONNECTED': 'bg-error',
    'CONNECTING': 'bg-warning',
    'QRCODE': 'bg-info',
    'PENDING': 'bg-base-300',
    'ERROR': 'bg-error'
  };
  
  return colors[normalized] || 'bg-base-300';
};
