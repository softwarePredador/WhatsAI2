// Endpoint de teste para forçar atualização do QR Code
import { Request, Response } from 'express';
import { WhatsAppInstanceService } from '../../../services/instance-service';

const instanceService = new WhatsAppInstanceService();

export async function forceQRCodeUpdate(req: Request, res: Response) {
  try {
    const instanceId = req.params['instanceId'] as string;
    
    if (!instanceId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Instance ID is required' 
      });
    }
    
    console.log(`🔧 [forceQRCodeUpdate] Forcing QR update for instance: ${instanceId}`);
    
    // Get instance
    const instance = await instanceService.getInstanceById(instanceId);
    if (!instance) {
      return res.status(404).json({ 
        success: false, 
        message: 'Instance not found' 
      });
    }
    
    console.log(`📱 [forceQRCodeUpdate] Instance found: ${instance.name} (${instance.status})`);
    
    // Force get QR code from Evolution API
    const evolutionApi = (instanceService as any).evolutionApi;
    
    try {
      const qrData = await evolutionApi.getQRCode(instance.evolutionInstanceName);
      console.log(`🔍 [forceQRCodeUpdate] QR Data obtained:`, qrData);
      
      if (qrData && qrData.base64) {
        // Update instance with QR code
        const updateData = {
          qrCode: qrData.base64,
          lastSeen: new Date()
        };
        
        const repository = (instanceService as any).repository;
        await repository.update(instanceId, updateData);
        
        console.log(`✅ [forceQRCodeUpdate] QR Code updated in database`);
        
        return res.json({
          success: true,
          message: 'QR Code updated successfully',
          data: {
            instanceId,
            qrCode: qrData.base64,
            hasQRCode: true
          }
        });
      } else {
        return res.json({
          success: false,
          message: 'No QR Code available from Evolution API',
          data: { qrData }
        });
      }
    } catch (qrError: any) {
      console.error(`❌ [forceQRCodeUpdate] Error getting QR:`, qrError);
      return res.status(500).json({
        success: false,
        message: 'Error getting QR Code from Evolution API',
        error: qrError?.message || 'Unknown error'
      });
    }
    
  } catch (error: any) {
    console.error(`❌ [forceQRCodeUpdate] General error:`, error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error?.message || 'Unknown error'
    });
  }
}