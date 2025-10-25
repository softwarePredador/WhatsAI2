import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((...args: any[]) => void)[]> = new Map();

  connect(token?: string): void {
    if (this.socket?.connected) {
      return;
    }

    // Backend WebSocket runs on port 3001, API proxy handles HTTP requests
    const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    this.socket = io(SERVER_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('🔗 Connected to WebSocket server');
      
      // Registrar listeners pendentes (evitar duplicatas)
      this.listeners.forEach((callbacks, event) => {
        callbacks.forEach(callback => {
          // Verificar se já não está registrado
          const socketListeners = (this.socket as any).listeners(event) || [];
          const isAlreadyRegistered = socketListeners.some((listener: any) => listener === callback);
          
          if (!isAlreadyRegistered) {
            this.socket!.on(event, callback);
          }
        });
      });
      console.log(`🔗 Registered ${this.listeners.size} event listeners`);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ WebSocket connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Join instance room
  joinInstance(instanceId: string): void {
    if (this.socket) {
      const room = `instance_${instanceId}`;
      this.socket.emit('join_instance', instanceId);
      console.log(`📱 [socketService] Joining room: ${room} (instanceId: ${instanceId})`);
    }
  }

  // Leave instance room
  leaveInstance(instanceId: string): void {
    if (this.socket) {
      this.socket.emit('leave_instance', instanceId);
      console.log(`👋 Left instance room: ${instanceId}`);
    }
  }

  // Conversation tracking methods
  openConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('conversation_opened', conversationId);
      console.log(`👀 Opened conversation: ${conversationId}`);
    }
  }

  closeConversation(conversationId: string): void {
    if (this.socket) {
      this.socket.emit('conversation_closed', conversationId);
      console.log(`👋 Closed conversation: ${conversationId}`);
    }
  }

  // Event listeners
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: (...args: any[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit custom events
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  get isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();