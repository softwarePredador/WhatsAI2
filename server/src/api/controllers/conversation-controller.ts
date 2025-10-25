import { Request, Response } from 'express';
import { ConversationService } from '../../services/conversation-service';
import { z } from 'zod';
import { prisma } from '../../database/prisma';
import { MediaStorageService } from '../../services/media-storage';
import multer from 'multer';

const sendMessageSchema = z.object({
  remoteJid: z.string().min(1, 'Número do destinatário é obrigatório'),
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório')
});

const sendMediaSchema = z.object({
  remoteJid: z.string().min(1, 'Número do destinatário é obrigatório'),
  mediaUrl: z.string().min(1, 'URL da mídia é obrigatória'),
  mediaType: z.enum(['image', 'video', 'audio', 'document', 'sticker']),
  caption: z.string().optional(),
  fileName: z.string().optional()
});

const getMessagesSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

export class ConversationController {
  private conversationService: ConversationService;
  private mediaStorageService: MediaStorageService;

  constructor() {
    this.conversationService = new ConversationService();

    // Initialize DigitalOcean Spaces service
    const spacesConfig = {
      accessKeyId: process.env['DO_SPACES_ACCESS_KEY'] || '',
      secretAccessKey: process.env['DO_SPACES_SECRET_KEY'] || '',
      region: process.env['DO_SPACES_REGION'] || 'sfo3',
      bucket: process.env['DO_SPACES_BUCKET'] || 'whatsais3',
      endpoint: process.env['DO_SPACES_ENDPOINT'] || 'https://sfo3.digitaloceanspaces.com'
    };

    console.log('🔧 [ConversationController] Spaces config:', {
      hasAccessKey: !!spacesConfig.accessKeyId,
      hasSecretKey: !!spacesConfig.secretAccessKey,
      region: spacesConfig.region,
      bucket: spacesConfig.bucket,
      endpoint: spacesConfig.endpoint
    });

    this.mediaStorageService = new MediaStorageService(spacesConfig);
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [getConversations] Request completo:');
      console.log('  - URL:', req.url);
      console.log('  - Method:', req.method);
      console.log('  - Params:', JSON.stringify(req.params));
      console.log('  - Query:', JSON.stringify(req.query));
      console.log('  - Headers:', JSON.stringify(req.headers.authorization ? 'Bearer token presente' : 'Sem auth'));

      const { instanceId } = req.params;
      const { instanceId: queryInstanceId } = req.query;

      console.log('🔍 [getConversations] instanceId from params:', instanceId);
      console.log('🔍 [getConversations] instanceId from query:', queryInstanceId);

      // Use instanceId from params or query, support both
      const targetInstanceId = instanceId || queryInstanceId as string;

      console.log('🔍 [getConversations] Target instanceId:', targetInstanceId);

      // 🔄 Map evolutionInstanceName to database instanceId if needed
      let dbInstanceId = targetInstanceId;
      if (targetInstanceId && targetInstanceId.startsWith('whatsai_')) {
        console.log('🔄 [getConversations] Detectado evolutionInstanceName, fazendo mapeamento...');
        const instance = await this.conversationService.getInstanceByEvolutionName(targetInstanceId);
        if (instance) {
          dbInstanceId = instance.id;
          console.log('✅ [getConversations] Mapeamento realizado:', targetInstanceId, '→', dbInstanceId);
        } else {
          console.log('❌ [getConversations] Instância não encontrada para evolutionInstanceName:', targetInstanceId);
        }
      }

      if (dbInstanceId) {
        // Get conversations for specific instance
        console.log('🔍 [getConversations] Buscando conversas para instance:', dbInstanceId);
        const conversations = await this.conversationService.getConversationsByInstance(dbInstanceId);
        console.log(`📋 [getConversations] Retornando ${conversations.length} conversas para instance ${dbInstanceId}`);
        if (conversations.length > 0) {
          console.log(`📝 [getConversations] Primeira conversa:`, JSON.stringify(conversations[0], null, 2));
        }
        res.json({
          success: true,
          data: conversations
        });
      } else {
        console.log('⚠️ [getConversations] Nenhum instanceId fornecido, retornando lista vazia');
        // Get all conversations (could be implemented for admin users)
        res.json({
          success: true,
          data: []
        });
      }
    } catch (error) {
      console.error('❌ Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getConversationById(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      const conversation = await this.conversationService.getConversationById(conversationId);

      if (!conversation) {
        res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: conversation
      });
    } catch (error) {
      console.error('Error getting conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    return this.getConversationById(req, res);
  }

  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { limit, offset } = getMessagesSchema.parse(req.query);

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      const conversationWithMessages = await this.conversationService.getConversationMessages(conversationId, limit, offset);

      if (!conversationWithMessages) {
        res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          conversation: {
            id: conversationWithMessages.id,
            remoteJid: conversationWithMessages.remoteJid,
            contactName: conversationWithMessages.contactName,
            contactPicture: conversationWithMessages.contactPicture,
            isGroup: conversationWithMessages.isGroup,
            unreadCount: conversationWithMessages.unreadCount,
            isPinned: conversationWithMessages.isPinned,
            isArchived: conversationWithMessages.isArchived
          },
          messages: conversationWithMessages.messages.reverse() // Reverse to show oldest first
        }
      });
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { limit, offset } = getMessagesSchema.parse(req.query);

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      const messages = await this.conversationService.getConversationMessages(conversationId, limit, offset);

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      console.log('🔍 [sendMessage] Recebendo requisição:', {
        params: req.params,
        body: req.body,
        url: req.url
      });

      const { conversationId, instanceId } = req.params;

      // Se chamado via /conversations/:conversationId/messages
      if (conversationId && !instanceId) {
        // Buscar a conversa para obter o instanceId
        const conversation = await this.conversationService.getConversationById(conversationId);
        if (!conversation) {
          console.log('❌ [sendMessage] Conversa não encontrada:', conversationId);
          res.status(404).json({
            success: false,
            error: 'Conversa não encontrada'
          });
          return;
        }

        try {
          const { remoteJid, content } = sendMessageSchema.parse(req.body);
          console.log('✅ [sendMessage] Dados validados:', {
            instanceId: conversation.instanceId,
            conversationId,
            remoteJid,
            content
          });

          const message = await this.conversationService.sendMessage(conversation.instanceId, remoteJid, content);
          console.log('✅ [sendMessage] Mensagem enviada com sucesso:', message.id);

          res.json({
            success: true,
            data: message
          });
          return;
        } catch (validationError) {
          console.log('❌ [sendMessage] Erro de validação:', validationError);
          res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            details: validationError
          });
          return;
        }
      }

      // Se chamado via /conversations/instance/:instanceId/send
      if (instanceId) {
        try {
          const { remoteJid, content } = sendMessageSchema.parse(req.body);
          console.log('✅ [sendMessage] Dados validados:', { instanceId, remoteJid, content });

          const message = await this.conversationService.sendMessage(instanceId, remoteJid, content);
          console.log('✅ [sendMessage] Mensagem enviada com sucesso:', message.id);

          res.json({
            success: true,
            data: message
          });
          return;
        } catch (validationError) {
          console.log('❌ [sendMessage] Erro de validação:', validationError);
          res.status(400).json({
            success: false,
            error: 'Dados inválidos',
            details: validationError
          });
          return;
        }
      }

      console.log('❌ [sendMessage] Nem conversationId nem instanceId fornecidos');
      res.status(400).json({
        success: false,
        error: 'ID da instância ou conversa é obrigatório'
      });
    } catch (error: any) {
      console.error('❌ [sendMessage] Erro interno:', error);

      // Verificar se é erro de WhatsApp não encontrado
      if (error.message && error.message.includes('não possui WhatsApp')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mensagem'
      });
    }
  }

  async sendMediaMessage(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = (req as any).user?.id;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      // Verificar se a conversa existe e pertence ao usuário
      const conversation = await this.conversationService.getConversationById(conversationId);

      if (!conversation) {
        console.log('❌ [sendMediaMessage] Conversa não encontrada:', conversationId);
        res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Verificar se a conversa pertence ao usuário (através da instância)
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: conversation.instanceId }
      });

      if (!instance || instance.userId !== userId) {
        console.log('❌ [sendMediaMessage] Acesso negado à conversa:', conversationId);
        res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
        return;
      }

      const validatedData = sendMediaSchema.parse(req.body);
      const { remoteJid, mediaUrl, mediaType, caption, fileName } = validatedData;

      console.log('✅ [sendMediaMessage] Dados validados:', {
        conversationId,
        remoteJid,
        mediaType,
        hasCaption: !!caption,
        fileName
      });

      // Usar o método atômico do conversation service
      const message = await this.conversationService.sendMediaMessageAtomic(
        conversation.instanceId,
        remoteJid,
        mediaUrl,
        mediaType,
        caption,
        fileName
      );

      console.log('✅ [sendMediaMessage] Mídia enviada com sucesso:', message.id);

      res.status(200).json({
        success: true,
        data: message
      });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.log('❌ [sendMediaMessage] Erro de validação:', error.errors);
        res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: error.errors
        });
        return;
      }

      console.error('❌ [sendMediaMessage] Erro interno:', error);

      // Verificar se é erro de WhatsApp não encontrado
      if (error.message && error.message.includes('não possui WhatsApp')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erro ao enviar mídia'
      });
    }
  }

  async uploadAndSendMediaMessage(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const userId = req.userId;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Usuário não autenticado'
        });
        return;
      }

      // Verificar se a conversa existe e pertence ao usuário
      const conversation = await this.conversationService.getConversationById(conversationId);

      if (!conversation) {
        console.log('❌ [uploadAndSendMediaMessage] Conversa não encontrada:', conversationId);
        res.status(404).json({
          success: false,
          error: 'Conversa não encontrada'
        });
        return;
      }

      // Verificar se a conversa pertence ao usuário (através da instância)
      const instance = await prisma.whatsAppInstance.findUnique({
        where: { id: conversation.instanceId }
      });

      if (!instance || instance.userId !== userId) {
        console.log('❌ [uploadAndSendMediaMessage] Acesso negado à conversa:', conversationId);
        res.status(403).json({
          success: false,
          error: 'Acesso negado'
        });
        return;
      }

      // Verificar se a conversa tem uma instância válida
      if (!conversation.instanceId) {
        console.log('❌ [uploadAndSendMediaMessage] Conversa sem instância válida:', conversationId);
        res.status(400).json({
          success: false,
          error: 'Conversa não tem uma instância válida'
        });
        return;
      }

      // Verificar se há arquivo no upload
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Arquivo não encontrado no upload'
        });
        return;
      }

      const { buffer, originalname, mimetype, size } = req.file;
      const { caption } = req.body;

      console.log('✅ [uploadAndSendMediaMessage] Arquivo recebido:', {
        conversationId,
        fileName: originalname,
        mimeType: mimetype,
        size,
        hasCaption: !!caption
      });

      // Determinar tipo de mídia baseado no mime type
      const mediaType = this.getMediaTypeFromMimeType(mimetype);

      // Upload para DigitalOcean Spaces e enviar mensagem
      console.log('🚀 [uploadAndSendMediaMessage] Iniciando upload e envio:', {
        conversationId,
        instanceId: conversation.instanceId,
        remoteJid: conversation.remoteJid,
        mediaType,
        fileName: originalname
      });

      const result = await this.mediaStorageService.uploadAndSendMedia({
        file: buffer,
        fileName: originalname,
        contentType: mimetype,
        conversationId,
        mediaType,
        caption,
        instanceId: conversation.instanceId,
        remoteJid: conversation.remoteJid
      });

      console.log('✅ [uploadAndSendMediaMessage] Upload e envio concluídos:', {
        messageId: result.message.id,
        fileUrl: result.upload.url
      });

      res.status(200).json({
        success: true,
        data: {
          message: result.message,
          upload: {
            url: result.upload.url,
            cdnUrl: this.mediaStorageService.getCdnUrl(result.upload.key),
            fileName: originalname,
            size: result.upload.size
          }
        }
      });

    } catch (error: any) {
      console.error('❌ [uploadAndSendMediaMessage] Erro interno:', error);

      // Verificar se é erro de WhatsApp não encontrado
      if (error.message && error.message.includes('não possui WhatsApp')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload e enviar mídia'
      });
    }
  }

  private getMediaTypeFromMimeType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'sticker' {
    if (mimeType.startsWith('image/')) {
      return mimeType === 'image/webp' ? 'sticker' : 'image';
    }
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'document';
  }

  async markConversationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      await this.conversationService.markConversationAsRead(conversationId);

      res.json({
        success: true,
        message: 'Conversa marcada como lida'
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async markConversationAsUnread(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      await this.conversationService.markConversationAsUnread(conversationId);

      res.json({
        success: true,
        message: 'Conversa marcada como não lida'
      });
    } catch (error) {
      console.error('Error marking conversation as unread:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async getArchivedConversations(req: Request, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;

      if (!instanceId) {
        res.status(400).json({
          success: false,
          error: 'ID da instância é obrigatório'
        });
        return;
      }

      const conversations = await this.conversationService.getArchivedConversations(instanceId);

      res.json({
        success: true,
        data: conversations
      });
    } catch (error) {
      console.error('Error getting archived conversations:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async pinConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      await this.conversationService.pinConversation(conversationId);

      res.json({
        success: true,
        message: 'Conversa fixada'
      });
    } catch (error) {
      console.error('Error pinning conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async unpinConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      await this.conversationService.unpinConversation(conversationId);

      res.json({
        success: true,
        message: 'Conversa desfixada'
      });
    } catch (error) {
      console.error('Error unpinning conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }

  async archiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          error: 'ID da conversa é obrigatório'
        });
        return;
      }

      await this.conversationService.archiveConversation(conversationId);

      res.json({
        success: true,
        message: 'Conversa arquivada'
      });
    } catch (error) {
      console.error('Error archiving conversation:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  }
}