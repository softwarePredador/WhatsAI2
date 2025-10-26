import { Request, Response } from 'express';
import { WhatsAppInstanceController } from '../../api/controllers/instance-controller';
import { EvolutionApiService } from '../../services/evolution-api';
import { WhatsAppInstanceService } from '../../services/instance-service';
import { SocketService } from '../../services/socket-service';

// Mock dos serviços
jest.mock('../../services/evolution-api');
jest.mock('../../services/instance-service');
jest.mock('../../services/socket-service');

describe('WhatsAppInstanceController', () => {
  let controller: WhatsAppInstanceController;
  let mockRequest: any;
  let mockResponse: any;
  let mockEvolutionApi: any;
  let mockInstanceService: any;
  let mockSocketService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    mockEvolutionApi = {
      fetchInstances: jest.fn()
    };

    mockInstanceService = {
      createInstance: jest.fn(),
      getAllInstances: jest.fn(),
      getInstanceById: jest.fn(),
      deleteInstance: jest.fn(),
      connectInstance: jest.fn(),
      disconnectInstance: jest.fn(),
      getQRCode: jest.fn(),
      sendMessage: jest.fn(),
      refreshInstanceStatus: jest.fn()
    };

    mockSocketService = {
      getInstance: jest.fn().mockReturnValue({
        emitToInstance: jest.fn()
      })
    };

    // Mock constructors
    (EvolutionApiService as any).mockImplementation(() => mockEvolutionApi);
    (WhatsAppInstanceService as any).mockImplementation(() => mockInstanceService);
    (SocketService.getInstance as any).mockReturnValue(mockSocketService);

    // Criar controller
    controller = new WhatsAppInstanceController();

    // Setup request/response mocks
    mockRequest = {
      params: {},
      body: {},
      userId: 'user-123'
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  describe('createInstance', () => {
    test('should create instance successfully', async () => {
      const instanceData = {
        name: 'Test Instance',
        webhook: 'https://example.com/webhook',
        token: 'test-token'
      };

      const createdInstance = {
        id: 'instance-123',
        name: 'Test Instance',
        webhook: 'https://example.com/webhook',
        token: 'test-token',
        userId: 'user-123',
        apiKey: 'api-key',
        serverUrl: 'https://api.example.com',
        status: 'DISCONNECTED',
        connected: false,
        evolutionInstanceName: 'test-instance',
        qrCode: null,
        lastSeen: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = instanceData;
      mockInstanceService.createInstance.mockResolvedValue(createdInstance);

      await controller.createInstance(mockRequest, mockResponse);

      expect(mockInstanceService.createInstance).toHaveBeenCalledWith({
        name: 'Test Instance',
        userId: 'user-123',
        webhook: 'https://example.com/webhook',
        token: 'test-token'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: createdInstance,
        message: 'Instance created successfully'
      });
    });

    test('should return 401 when userId is not provided', async () => {
      mockRequest.userId = undefined;
      mockRequest.body = { name: 'Test Instance' };

      await controller.createInstance(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized'
      });
    });

    test('should handle validation errors', async () => {
      mockRequest.body = { name: '' }; // Invalid name

      await controller.createInstance(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.any(Array)
      });
    });
  });

  describe('getInstance', () => {
    test('should get instance successfully', async () => {
      const instance = { id: 'instance-123', name: 'Test Instance' };
      mockRequest.params = { instanceId: 'instance-123' };

      mockInstanceService.getInstanceById.mockResolvedValue(instance);

      await controller.getInstance(mockRequest, mockResponse);

      expect(mockInstanceService.getInstanceById).toHaveBeenCalledWith('instance-123');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: instance
      });
    });

    test('should return 404 when instance is not found', async () => {
      mockRequest.params = { instanceId: 'non-existent' };
      mockInstanceService.getInstanceById.mockResolvedValue(null);

      await controller.getInstance(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Instance not found'
      });
    });
  });

  describe('sendMessage', () => {
    test('should send message successfully', async () => {
      const instances = [{ id: 'instance-123', name: 'Test Instance' }];
      const messageData = { number: '5511999999999', text: 'Hello World' };
      const sendResult = { messageId: 'msg-123', status: 'sent' };

      mockRequest.params = { instanceId: 'instance-123' };
      mockRequest.body = messageData;
      mockInstanceService.getAllInstances.mockResolvedValue(instances);
      mockInstanceService.sendMessage.mockResolvedValue(sendResult);

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockInstanceService.sendMessage).toHaveBeenCalledWith('instance-123', '5511999999999', 'Hello World');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: sendResult,
        message: 'Message sent successfully'
      });
    });

    test('should return 404 when instance is not found', async () => {
      mockRequest.params = { instanceId: 'non-existent' };
      mockRequest.body = { number: '5511999999999', text: 'Hello' };
      mockInstanceService.getAllInstances.mockResolvedValue([]);

      await controller.sendMessage(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Instance not found'
      });
    });
  });
});