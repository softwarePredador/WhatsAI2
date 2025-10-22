import { create } from "zustand";
import { WhatsAppInstance, CreateInstancePayload } from "../types/instanceTypes";
import { instanceService } from "../services/instanceService";
import { toast } from "react-hot-toast";

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
      toast.error(errorMessage);
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
      toast.error(errorMessage);
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
      
      toast.success("Instância criada com sucesso!");
      return newInstance;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create instance";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
      toast.success("Conectando instância... QR Code gerado!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect instance";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },

  disconnectInstance: async (instanceId: string, token: string) => {
    set({ loading: true, error: null });
    try {
      await instanceService.disconnectInstance(instanceId, token);
      
      // Refresh the instance to get updated status
      await get().fetchInstance(instanceId, token);
      
      toast.success("Instância desconectada com sucesso!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to disconnect instance";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
      
      toast.success("Instância deletada com sucesso!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete instance";
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
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
