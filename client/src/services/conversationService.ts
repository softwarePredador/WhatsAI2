import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export interface ConversationSummary {
  id: string;
  remoteJid: string;
  contactName?: string | null;
  contactPicture?: string;
  isGroup: boolean;
  lastMessage?: string | null;
  lastMessageAt?: Date | null;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  lastMessagePreview?: {
    content: string;
    fromMe: boolean;
    timestamp: Date;
    messageType: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const conversationService = {
  /**
   * Get all conversations for a specific instance
   */
  async getConversations(instanceId: string, token: string): Promise<ConversationSummary[]> {
    try {
      const response = await axios.get<ApiResponse<ConversationSummary[]>>(
        `${API_URL}/conversations?instanceId=${instanceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to fetch conversations");
      }

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to fetch conversations";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Mark a conversation as read
   */
  async markAsRead(conversationId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to mark conversation as read");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to mark conversation as read";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Mark a conversation as unread
   */
  async markAsUnread(conversationId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}/unread`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to mark conversation as unread");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to mark conversation as unread";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Send a message to a conversation
   */
  async sendMessage(conversationId: string, content: string, token: string): Promise<void> {
    try {
      const response = await axios.post<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}/messages`,
        { content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to send message";
        throw new Error(message);
      }
      throw error;
    }
  }
};