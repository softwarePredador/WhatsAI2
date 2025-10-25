import { Request, Response } from 'express';
import { z } from 'zod';
import { EvolutionApiService } from '../../services/evolution-api';
import { WhatsAppInstanceService } from '../../services/instance-service';
import { SocketService } from '../../services/socket-service';

// Validation schemas
const createInstanceSchema = z.object({
  name: z.string().min(1),
  token: z.string().optional(),
  webhook: z.string().url().optional(),
});

const sendMessageSchema = z.object({
  number: z.string().min(1),
  text: z.string().min(1),
});

export class WhatsAppInstanceController {
  private evolutionApi: EvolutionApiService;
  private instanceService: WhatsAppInstanceService;
  private socketService: SocketService;

  constructor() {
    this.evolutionApi = new EvolutionApiService();
    this.instanceService = new WhatsAppInstanceService();
    this.socketService = SocketService.getInstance();
  }

  createInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.userId;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const validatedData = createInstanceSchema.parse(req.body);
      
      const instance = await this.instanceService.createInstance({
        name: validatedData.name,
        userId, // Add userId to instance
        ...(validatedData.webhook && { webhook: validatedData.webhook }),
        ...(validatedData.token && { token: validatedData.token })
      });
      
      res.status(201).json({
        success: true,
        data: instance,
        message: 'Instance created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('Error creating instance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create instance'
      });
    }
  };

  listInstances = async (req: Request, res: Response): Promise<void> => {
    try {
      const instances = await this.instanceService.getAllInstances();
      
      res.json({
        success: true,
        data: instances
      });
    } catch (error) {
      console.error('Error listing instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list instances'
      });
    }
  };

  listEvolutionInstances = async (req: Request, res: Response): Promise<void> => {
    try {
      const instances = await this.evolutionApi.fetchInstances();
      
      res.json({
        success: true,
        data: instances,
        count: instances.length
      });
    } catch (error) {
      console.error('Error listing Evolution API instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to list Evolution API instances'
      });
    }
  };

  getInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      const instance = await this.instanceService.getInstanceById(instanceId);
      
      if (!instance) {
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      res.json({
        success: true,
        data: instance
      });
    } catch (error) {
      console.error('Error getting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get instance'
      });
    }
  };

  deleteInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }
      
      await this.instanceService.deleteInstance(instanceId);
      
      res.json({
        success: true,
        message: 'Instance deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete instance'
      });
    }
  };

  connectInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      console.log('🎯 [DEBUG Controller] Connect instance request for:', instanceId);
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }
      
      const result = await this.instanceService.connectInstance(instanceId);
      
      console.log('📤 [DEBUG Controller] Sending response to frontend');
      console.log('📦 [DEBUG Controller] Response keys:', Object.keys(result || {}));
      
      res.json({
        success: true,
        data: result,
        message: 'Instance connection initiated'
      });
    } catch (error) {
      console.error('❌ [DEBUG Controller] Error connecting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to connect instance'
      });
    }
  };

  disconnectInstance = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }
      
      await this.instanceService.disconnectInstance(instanceId);
      
      res.json({
        success: true,
        message: 'Instance disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting instance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect instance'
      });
    }
  };

  getQRCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }
      
      const qrCode = await this.instanceService.getQRCode(instanceId);
      
      if (!qrCode) {
        res.status(404).json({
          success: false,
          error: 'QR code not available'
        });
        return;
      }

      res.json({
        success: true,
        data: qrCode
      });
    } catch (error) {
      console.error('Error getting QR code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get QR code'
      });
    }
  };

  sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      // Validate that instance exists
      const instances = await this.instanceService.getAllInstances();
      const instance = instances.find(inst => inst.id === instanceId);
      
      if (!instance) {
        console.error(`❌ [sendMessage] Instance ${instanceId} not found in database`);
        res.status(404).json({
          success: false,
          error: 'Instance not found'
        });
        return;
      }

      const validatedData = sendMessageSchema.parse(req.body);
      
      const result = await this.instanceService.sendMessage(
        instanceId,
        validatedData.number,
        validatedData.text
      );
      
      res.json({
        success: true,
        data: result,
        message: 'Message sent successfully'
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
        return;
      }

      console.error('Error sending message:', error);
      
      // Verificar se é erro de WhatsApp não encontrado
      if (error.message && error.message.includes('não possui WhatsApp')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  };

  refreshInstanceStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { instanceId } = req.params;
      
      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'Instance ID is required'
        });
        return;
      }

      console.log('🔄 [RefreshStatus] Syncing status for instance:', instanceId);
      
      await this.instanceService.refreshInstanceStatus(instanceId);
      const instance = await this.instanceService.getInstanceById(instanceId);
      
      console.log('✅ [RefreshStatus] Status synced:', instance?.status);
      
      res.json({
        success: true,
        data: instance,
        message: 'Instance status refreshed'
      });
    } catch (error) {
      console.error('❌ [RefreshStatus] Error refreshing status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh instance status'
      });
    }
  };

  syncAllInstancesStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('🔄 [SyncAll] Syncing all instances status...');
      
      const instances = await this.instanceService.getAllInstances();
      
      // Refresh status for each instance
      await Promise.all(
        instances.map(instance => 
          this.instanceService.refreshInstanceStatus(instance.id)
        )
      );
      
      // Get updated instances
      const updatedInstances = await this.instanceService.getAllInstances();
      
      console.log('✅ [SyncAll] All instances synced');
      
      res.json({
        success: true,
        data: updatedInstances,
        message: 'All instances status synced'
      });
    } catch (error) {
      console.error('❌ [SyncAll] Error syncing instances:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sync instances status'
      });
    }
  };
}