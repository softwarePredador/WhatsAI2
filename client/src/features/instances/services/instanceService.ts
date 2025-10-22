import axios from "axios";
import { 
  WhatsAppInstance, 
  CreateInstancePayload, 
  InstanceResponse, 
  InstanceListResponse 
} from "../types/instanceTypes";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const instanceService = {
  /**
   * Get all instances for the authenticated user
   */
  async getInstances(token: string): Promise<WhatsAppInstance[]> {
    try {
      const response = await axios.get<InstanceListResponse>(
        `${API_URL}/instances`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to fetch instances");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to fetch instances";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Get a specific instance by ID
   */
  async getInstance(instanceId: string, token: string): Promise<WhatsAppInstance> {
    try {
      const response = await axios.get<InstanceResponse>(
        `${API_URL}/instances/${instanceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to fetch instance");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to fetch instance";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(payload: CreateInstancePayload, token: string): Promise<WhatsAppInstance> {
    try {
      const response = await axios.post<InstanceResponse>(
        `${API_URL}/instances`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create instance");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || error.response?.data?.message || "Failed to create instance";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Connect an instance to WhatsApp (generate QR code)
   */
  async connectInstance(instanceId: string, token: string): Promise<WhatsAppInstance> {
    try {
      const response = await axios.post<InstanceResponse>(
        `${API_URL}/instances/${instanceId}/connect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to connect instance");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to connect instance";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Disconnect an instance from WhatsApp
   */
  async disconnectInstance(instanceId: string, token: string): Promise<void> {
    try {
      const response = await axios.post(
        `${API_URL}/instances/${instanceId}/disconnect`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to disconnect instance");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to disconnect instance";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Delete an instance
   */
  async deleteInstance(instanceId: string, token: string): Promise<void> {
    try {
      const response = await axios.delete(
        `${API_URL}/instances/${instanceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to delete instance");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to delete instance";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Get QR code for an instance
   */
  async getQRCode(instanceId: string, token: string): Promise<string | null> {
    try {
      const response = await axios.get<InstanceResponse>(
        `${API_URL}/instances/${instanceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to get QR code");
      }

      return response.data.data.qrCode || null;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to get QR code";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Sync all instances status with Evolution API
   */
  async syncAllInstancesStatus(token: string): Promise<WhatsAppInstance[]> {
    try {
      const response = await axios.post<InstanceListResponse>(
        `${API_URL}/instances/sync-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to sync instances status");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to sync instances status";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Refresh a specific instance status from Evolution API
   */
  async refreshInstanceStatus(instanceId: string, token: string): Promise<WhatsAppInstance> {
    try {
      const response = await axios.post<InstanceResponse>(
        `${API_URL}/instances/${instanceId}/refresh-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to refresh instance status");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to refresh instance status";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Send a message via WhatsApp instance
   */
  async sendMessage(instanceId: string, number: string, text: string, token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/instances/${instanceId}/send-message`,
        {
          number,
          text
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to send message");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.error || "Failed to send message";
        throw new Error(message);
      }
      throw error;
    }
  }
};
