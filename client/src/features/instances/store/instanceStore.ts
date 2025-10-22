import { create } from "zustand";
import { WhatsAppInstance, CreateInstancePayload } from "../types/instanceTypes";
import { instanceService } from "../services/instanceService";
import { toast } from "react-hot-toast";
import { UserSettings, STORAGE_KEY } from "../../../types/settings";

// Helper para verificar se notificações estão habilitadas
const shouldShowNotification = (type: 'instanceStatus' | 'qrCodeReady'): boolean => {
  try {
    const settingsStr = localStorage.getItem(STORAGE_KEY);
    if (!settingsStr) return true; // Default: mostrar notificações
    
    const settings: UserSettings = JSON.parse(settingsStr);
    return settings.notifications[type] ?? true;
  } catch {
    return true; // Em caso de erro, mostrar notificações
  }
};

// Helper para enviar push notification
const sendPushNotification = (title: string, body: string) => {
  try {
    const settingsStr = localStorage.getItem(STORAGE_KEY);
    if (!settingsStr) return;
    
    const settings: UserSettings = JSON.parse(settingsStr);
    if (!settings.notifications.push) return;
    
    // Verificar suporte a notificações
    if (!('Notification' in window)) return;
    
    // Enviar notificação se permissão concedida
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: 'whatsai-instance', // Evita notificações duplicadas
      });
    } else if (Notification.permission === 'default') {
      // Pedir permissão
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'whatsai-instance',
          });
        }
      });
    }
  } catch (error) {
    console.error('❌ Erro ao enviar push notification:', error);
  }
};

interface InstanceState {
  instances: WhatsAppInstance[];
  selectedInstance: WhatsAppInstance | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchInstances: (token: string) => Promise<void>;
  fetchInstancesSilent: (token: string) => Promise<void>;
  fetchInstance: (instanceId: string, token: string) => Promise<void>;
  createInstance: (payload: CreateInstancePayload, token: string) => Promise<WhatsAppInstance | null>;
  connectInstance: (instanceId: string, token: string) => Promise<void>;
  disconnectInstance: (instanceId: string, token: string) => Promise<void>;
  deleteInstance: (instanceId: string, token: string) => Promise<void>;
  selectInstance: (instance: WhatsAppInstance | null) => void;
  clearError: () => void;
  updateInstanceInList: (updatedInstance: WhatsAppInstance) => void;
}

export const useInstanceStore = create<InstanceState>((set, get) => ({
  instances: [],
  selectedInstance: null,
  loading: false,
  error: null,

  fetchInstances: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const instances = await instanceService.getInstances(token);
      set({ instances, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch instances";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
    }
  },

  fetchInstancesSilent: async (token: string) => {
    // Silent fetch - no loading state, no error toast
    try {
      const instances = await instanceService.getInstances(token);
      
      // Only update instances that have changed to avoid re-renders
      const { instances: currentInstances } = get();
      
      // Check if there are any changes
      const hasChanges = instances.some((newInst) => {
        const oldInst = currentInstances.find(inst => inst.id === newInst.id);
        return !oldInst || 
               oldInst.status !== newInst.status || 
               oldInst.connected !== newInst.connected ||
               oldInst.qrCode !== newInst.qrCode;
      });
      
      if (hasChanges || instances.length !== currentInstances.length) {
        console.log('🔄 [Store] Instances updated silently');
        set({ instances });
      }
    } catch (error) {
      // Silent fail - don't show error to user
      console.error('❌ [Store] Silent fetch error:', error);
    }
  },

  fetchInstance: async (instanceId: string, token: string) => {
    set({ loading: true, error: null });
    try {
      const instance = await instanceService.getInstance(instanceId, token);
      set({ selectedInstance: instance, loading: false });
      
      // Update in the instances list if exists
      const { instances } = get();
      const updatedInstances = instances.map(inst => 
        inst.id === instance.id ? instance : inst
      );
      set({ instances: updatedInstances });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch instance";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
    }
  },

  createInstance: async (payload: CreateInstancePayload, token: string) => {
    set({ loading: true, error: null });
    try {
      const newInstance = await instanceService.createInstance(payload, token);
      
      // Add to the list
      const { instances } = get();
      set({ 
        instances: [...instances, newInstance], 
        loading: false 
      });
      
      if (shouldShowNotification('instanceStatus')) {
        toast.success("Instância criada com sucesso!");
      }
      sendPushNotification('WhatsAI', `Instância "${newInstance.name}" criada com sucesso!`);
      return newInstance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create instance";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
      return null;
    }
  },

  connectInstance: async (instanceId: string, token: string) => {
    set({ loading: true, error: null });
    try {
      const updatedInstance = await instanceService.connectInstance(instanceId, token);
      
      // Update in list and selected
      get().updateInstanceInList(updatedInstance);
      
      if (get().selectedInstance?.id === instanceId) {
        set({ selectedInstance: updatedInstance });
      }
      
      set({ loading: false });
      if (shouldShowNotification('qrCodeReady')) {
        toast.success("Conectando instância... QR Code gerado!");
      }
      sendPushNotification('QR Code Pronto', 'Escaneie o QR Code para conectar sua instância do WhatsApp');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect instance";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
    }
  },

  disconnectInstance: async (instanceId: string, token: string) => {
    set({ loading: true, error: null });
    try {
      await instanceService.disconnectInstance(instanceId, token);
      
      // Refresh the instance to get updated status
      await get().fetchInstance(instanceId, token);
      
      if (shouldShowNotification('instanceStatus')) {
        toast.success("Instância desconectada com sucesso!");
      }
      sendPushNotification('WhatsAI', 'Instância desconectada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to disconnect instance";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
    }
  },

  deleteInstance: async (instanceId: string, token: string) => {
    set({ loading: true, error: null });
    try {
      await instanceService.deleteInstance(instanceId, token);
      
      // Remove from list
      const { instances } = get();
      const updatedInstances = instances.filter(inst => inst.id !== instanceId);
      set({ instances: updatedInstances, loading: false });
      
      // Clear selected if it was the deleted one
      if (get().selectedInstance?.id === instanceId) {
        set({ selectedInstance: null });
      }
      
      if (shouldShowNotification('instanceStatus')) {
        toast.success("Instância deletada com sucesso!");
      }
      sendPushNotification('WhatsAI', 'Instância deletada');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete instance";
      set({ error: errorMessage, loading: false });
      if (shouldShowNotification('instanceStatus')) {
        toast.error(errorMessage);
      }
    }
  },

  selectInstance: (instance: WhatsAppInstance | null) => {
    set({ selectedInstance: instance });
  },

  clearError: () => {
    set({ error: null });
  },

  updateInstanceInList: (updatedInstance: WhatsAppInstance) => {
    const { instances } = get();
    const updatedInstances = instances.map(inst =>
      inst.id === updatedInstance.id ? updatedInstance : inst
    );
    set({ instances: updatedInstances });
  }
}));
