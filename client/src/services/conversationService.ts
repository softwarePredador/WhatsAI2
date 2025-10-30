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
  },

  /**
   * Archive a conversation
   */
  async archiveConversation(conversationId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to archive conversation");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to archive conversation";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Unarchive a conversation
   */
  async unarchiveConversation(conversationId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}/unarchive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to unarchive conversation");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to unarchive conversation";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Clear all messages from a conversation
   */
  async clearConversationMessages(conversationId: string, token: string): Promise<number> {
    try {
      const response = await axios.delete<ApiResponse<{ deletedCount: number }>>(
        `${API_URL}/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to clear conversation messages");
      }

      return response.data.data.deletedCount;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to clear conversation messages";
        throw new Error(message);
      }
      throw error;
    }
  },

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, token: string): Promise<void> {
    try {
      const response = await axios.delete<ApiResponse<null>>(
        `${API_URL}/conversations/${conversationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to delete conversation");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || "Failed to delete conversation";
        throw new Error(message);
      }
      throw error;
    }
  }
};