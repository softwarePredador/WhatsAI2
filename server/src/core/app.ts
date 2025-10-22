import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { env } from '../config/env';
import { apiRoutes } from '../api/routes';
import { SocketService } from '../services/socket-service';

export class App {
  private app: express.Application;
  private server: ReturnType<typeof createServer>;
  private socketService: SocketService;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.socketService = SocketService.getInstance();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    
    // CORS configuration
    this.app.use(cors({
      origin: '*', // In production, specify your frontend domain
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Serve static files (for test client)
    this.app.use('/static', express.static('public'));
    this.app.get('/test', (req, res) => {
      res.sendFile('test-client.html', { root: '.' });
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'WhatsAI Multi-Instance Manager',
        version: '1.0.0'
      });
    });

    // API routes
    this.app.use('/api', apiRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found'
      });
    });
  }

  private setupWebSocket(): void {
    this.socketService.initialize(this.server);
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      
      if (res.headersSent) {
        return next(err);
      }

      res.status(500).json({
        success: false,
        error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message
      });
    });
  }

  public async start(): Promise<void> {
    const port = env.PORT;

    return new Promise((resolve) => {
      this.server.listen(port, () => {
        console.log('🚀 WhatsAI Multi-Instance Manager Started');
        console.log(`📡 Server running on port ${port}`);
        console.log(`🌍 Environment: ${env.NODE_ENV}`);
        console.log(`🔗 Evolution API URL: ${env.EVOLUTION_API_URL}`);
        console.log(`💡 WebSocket server initialized`);
        console.log(`📱 Ready to manage WhatsApp instances!`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.close(() => {
        console.log('Server stopped');
        resolve();
      });
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public getServer(): any {
    return this.server;
  }
}