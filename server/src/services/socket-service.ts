import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';

export class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;

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

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
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
}