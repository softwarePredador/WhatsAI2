import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private activeConversations: Map<string, Set<string>> = new Map(); // socketId -> Set<conversationId>

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle client joining instance room
      socket.on('join_instance', (instanceId: string) => {
        socket.join(`instance_${instanceId}`);
        console.log(`Client ${socket.id} joined instance room: ${instanceId}`);
      });

      // Handle client leaving instance room
      socket.on('leave_instance', (instanceId: string) => {
        socket.leave(`instance_${instanceId}`);
        console.log(`Client ${socket.id} left instance room: ${instanceId}`);
      });

      // Handle conversation open/close tracking
      socket.on('conversation_opened', (conversationId: string) => {
        if (!this.activeConversations.has(socket.id)) {
          this.activeConversations.set(socket.id, new Set());
        }
        this.activeConversations.get(socket.id)!.add(conversationId);
        console.log(`👀 Client ${socket.id} opened conversation: ${conversationId}`);
      });

      socket.on('conversation_closed', (conversationId: string) => {
        if (this.activeConversations.has(socket.id)) {
          this.activeConversations.get(socket.id)!.delete(conversationId);
          console.log(`👋 Client ${socket.id} closed conversation: ${conversationId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        // Clean up active conversations for this socket
        this.activeConversations.delete(socket.id);
      });
    });
  }

  emitToInstance(instanceId: string, event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.to(`instance_${instanceId}`).emit(event, data);
  }

  emitToAll(event: string, data: any): void {
    if (!this.io) {
      console.warn('Socket.IO not initialized');
      return;
    }

    this.io.emit(event, data);
  }

  getConnectedClients(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  /**
   * Verifica se uma conversa está atualmente ativa/aberta em algum cliente
   */
  isConversationActive(conversationId: string): boolean {
    const values = Array.from(this.activeConversations.values());
    for (const activeConversations of values) {
      if (activeConversations.has(conversationId)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Retorna quantos clientes têm a conversa ativa
   */
  getActiveClientsForConversation(conversationId: string): number {
    let count = 0;
    const values = Array.from(this.activeConversations.values());
    for (const activeConversations of values) {
      if (activeConversations.has(conversationId)) {
        count++;
      }
    }
    return count;
  }
}