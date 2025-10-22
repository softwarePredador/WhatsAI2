import { Request, Response } from 'express';
import { ConversationService } from '../../services/conversation-service';
import { z } from 'zod';

const sendMessageSchema = z.object({
  remoteJid: z.string().min(1, 'Número do destinatário é obrigatório'),
  content: z.string().min(1, 'Conteúdo da mensagem é obrigatório')
});

const getMessagesSchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  offset: z.string().optional().transform(val => val ? parseInt(val) : 0)
});

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  async getConversations(req: Request, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;
      const { instanceId: queryInstanceId } = req.query;
      
      // Use instanceId from params or query, support both
      const targetInstanceId = instanceId || queryInstanceId as string;
      
      if (targetInstanceId) {
        // Get conversations for specific instance
        const conversations = await this.conversationService.getConversationsByInstance(targetInstanceId);
        res.json({
          success: true,
          data: conversations
        });
      } else {
        // Get all conversations (could be implemented for admin users)
        res.json({
          success: true,
          data: []
        });
      }
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  async getConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
        });
        return;
      }

      const conversation = await this.conversationService.getConversationById(conversationId);

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversa não encontrada'
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
        message: 'Erro interno do servidor'
      });
    }
  }

  async getConversationMessages(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;
      const { limit, offset } = getMessagesSchema.parse(req.query);

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
        });
        return;
      }

      const conversation = await this.conversationService.getConversationMessages(conversationId, limit, offset);

      if (!conversation) {
        res.status(404).json({
          success: false,
          message: 'Conversa não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          conversation: {
            id: conversation.id,
            remoteJid: conversation.remoteJid,
            contactName: conversation.contactName,
            contactPicture: conversation.contactPicture,
            isGroup: conversation.isGroup,
            unreadCount: conversation.unreadCount,
            isPinned: conversation.isPinned,
            isArchived: conversation.isArchived
          },
          messages: conversation.messages.reverse() // Reverse to show oldest first
        }
      });
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
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
            message: 'Conversa não encontrada'
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

          const message = await this.conversationService.sendMessage(
            conversation.instanceId, 
            remoteJid, 
            content
          );
          console.log('✅ [sendMessage] Mensagem enviada com sucesso:', message.id);

          res.json({
            success: true,
            data: {
              message: {
                id: message.id,
                content: message.content,
                fromMe: message.fromMe,
                timestamp: message.timestamp,
                messageType: message.messageType
              }
            }
          });
          return;
        } catch (validationError) {
          console.log('❌ [sendMessage] Erro de validação:', validationError);
          res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            error: validationError
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
            data: {
              message: {
                id: message.id,
                content: message.content,
                fromMe: message.fromMe,
                timestamp: message.timestamp,
                messageType: message.messageType
              }
            }
          });
          return;
        } catch (validationError) {
          console.log('❌ [sendMessage] Erro de validação:', validationError);
          res.status(400).json({
            success: false,
            message: 'Dados inválidos',
            error: validationError
          });
          return;
        }
      }

      console.log('❌ [sendMessage] Nem conversationId nem instanceId fornecidos');
      res.status(400).json({
        success: false,
        message: 'ID da instância ou conversa é obrigatório'
      });
    } catch (error: any) {
      console.error('❌ [sendMessage] Erro interno:', error);
      
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
        message: 'Erro ao enviar mensagem'
      });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
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
        message: 'Erro interno do servidor'
      });
    }
  }

  async pinConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
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
        message: 'Erro interno do servidor'
      });
    }
  }

  async unpinConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
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
        message: 'Erro interno do servidor'
      });
    }
  }

  async archiveConversation(req: Request, res: Response): Promise<void> {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        res.status(400).json({
          success: false,
          message: 'ID da conversa é obrigatório'
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
        message: 'Erro interno do servidor'
      });
    }
  }

  async getArchivedConversations(req: Request, res: Response): Promise<void> {
    try {
      const { instanceId } = req.params;

      if (!instanceId) {
        res.status(400).json({
          success: false,
          message: 'ID da instância é obrigatório'
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
        message: 'Erro interno do servidor'
      });
    }
  }
}