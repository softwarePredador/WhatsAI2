import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Archive, Pin, MoreVertical, Check, Mail, CheckCheck, Image, Music, Video, FileText, MapPin, User } from 'lucide-react';
import { userAuthStore } from '../features/auth/store/authStore';
import { conversationService } from '../services/conversationService';
import { socketService } from '../services/socketService';
import { getDisplayName } from '../utils/contact-display';
import { useTheme } from '../hooks/useTheme';

interface ConversationSummary {
  id: string;
  remoteJid: string;
  contactName: string | null;
  contactPicture?: string;
  isGroup: boolean;
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount: number;
  isPinned: boolean;
  isArchived: boolean;
  lastMessagePreview?: {
    content: string;
    fromMe: boolean;
    timestamp: Date;
    messageType: string;
    senderName?: string;
    status?: 'PENDING' | 'SERVER_ACK' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
  };
}

export const ConversationList: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme === 'dark';
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Usar o store de autenticação global
  const token = userAuthStore((state) => state.token);
  const logout = userAuthStore((state) => state.logout);

  useEffect(() => {
    loadConversations();
  }, [instanceId]);

  // ✨ WebSocket: Escutar atualizações de conversas em tempo real
  useEffect(() => {
    if (!instanceId) return;

    console.log('🔌 [ConversationList] Conectando WebSocket para instanceId:', instanceId);
    console.log('🔌 [ConversationList] Socket conectado?', socketService.isConnected);
    console.log('🔌 [ConversationList] Token disponível?', !!token);

    // 🔌 Fazer join na sala da instância para receber eventos
    socketService.joinInstance(instanceId);
    console.log(`🔌 [ConversationList] Fez join na sala instance_${instanceId}`);

    const handleConversationUpdated = (updatedConversation: any) => {
      console.log('🔔 [ConversationList] RECEBEU EVENTO conversation:updated:', updatedConversation);
      console.log('🔔 [ConversationList] ID da conversa recebida:', updatedConversation.id);
      console.log('🔔 [ConversationList] lastMessage:', updatedConversation.lastMessage);
      console.log('🔔 [ConversationList] lastMessagePreview:', updatedConversation.lastMessagePreview);
      console.log('🔔 [ConversationList] lastMessageAt:', updatedConversation.lastMessageAt);
      console.log('🔔 [ConversationList] instanceId atual:', instanceId);
      console.log('🔔 [ConversationList] Socket conectado?', socketService.isConnected);
      
      // Normalizar os dados recebidos
      const normalizedConversation: ConversationSummary = {
        ...updatedConversation,
        lastMessageAt: updatedConversation.lastMessageAt ? new Date(updatedConversation.lastMessageAt) : undefined,
        lastMessagePreview: updatedConversation.lastMessagePreview ? {
          ...updatedConversation.lastMessagePreview,
          timestamp: new Date(updatedConversation.lastMessagePreview.timestamp)
        } : undefined
      };
      
      setConversations(prevConversations => {
        console.log('🔔 [ConversationList] Conversas na lista:', prevConversations.map(c => ({ id: c.id, remoteJid: c.remoteJid })));
        
        // Encontrar e atualizar a conversa na lista
        const index = prevConversations.findIndex(c => c.id === normalizedConversation.id);
        console.log('🔔 [ConversationList] Procurando conversa com ID:', normalizedConversation.id);
        console.log('🔔 [ConversationList] IDs das conversas na lista:', prevConversations.map(c => c.id));
        console.log('🔔 [ConversationList] Índice encontrado:', index);
        
        if (index !== -1) {
          console.log(`🔔 [ConversationList] Atualizando conversa existente (index ${index})`);
          // Atualizar conversa existente
          const updated = [...prevConversations];
          updated[index] = {
            ...updated[index],
            ...normalizedConversation
          };
          
          // Reordenar por lastMessageAt (mais recente primeiro)
          return updated.sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
        } else {
          console.log('🔔 [ConversationList] Adicionando nova conversa');
          // Nova conversa - adicionar no início
          return [normalizedConversation, ...prevConversations];
        }
      });
    };

    // Listener para quando conversa é marcada como lida
    const handleConversationRead = (data: { conversationId: string; unreadCount: number }) => {
      console.log('� [ConversationList] Conversa marcada como lida:', data);
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === data.conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    };

    console.log('🔌 [ConversationList] Registrando listeners');
    console.log('🔌 [ConversationList] Status do socket:', socketService.isConnected ? 'CONECTADO' : 'DESCONECTADO');
    socketService.on('conversation:updated', handleConversationUpdated);
    socketService.on('conversation:read', handleConversationRead);
    console.log('🔌 [ConversationList] Listeners registrados com sucesso');

    return () => {
      console.log('🔌 [ConversationList] Removendo listeners e deixando sala');
      socketService.off('conversation:updated', handleConversationUpdated);
      socketService.off('conversation:read', handleConversationRead);
      socketService.leaveInstance(instanceId);
    };
  }, [instanceId]);

  // ✨ Recarregar conversas quando a página fica visível novamente (usuário volta para a lista)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Quando o usuário volta para a aba, recarregar as conversas para atualizar contadores
        loadConversations();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [instanceId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 [ConversationList] loadConversations chamado');
      console.log('🔍 [ConversationList] instanceId da URL:', instanceId);
      
      if (!token) {
        console.log('❌ Nenhum token encontrado, redirecionando para login...');
        logout();
        navigate('/login');
        return;
      }
      
      const url = instanceId 
        ? `/api/conversations?instanceId=${instanceId}`
        : '/api/conversations';
        
      console.log('🔍 [loadConversations] URL construída:', url);
      console.log('🔍 [loadConversations] instanceId da URL:', instanceId);
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.log('❌ Token expirado, redirecionando para login...');
        logout();
        navigate('/login');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversas carregadas:', data.data?.length || 0);
        
        // Debug: verificar se as conversas têm lastMessage ou lastMessagePreview
        if (data.data && data.data.length > 0) {
          console.log('🔍 Primeira conversa (debug):', {
            id: data.data[0].id,
            contactName: data.data[0].contactName,
            lastMessage: data.data[0].lastMessage,
            lastMessagePreview: data.data[0].lastMessagePreview,
            lastMessageAt: data.data[0].lastMessageAt
          });
        }
        
        setConversations(data.data || []);
      } else {
        console.error('❌ Erro na resposta:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    (conversation.contactName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    conversation.remoteJid.includes(searchTerm)
  );

  const formatTime = (date?: Date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return messageDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    } else {
      return messageDate.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      });
    }
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // Helper para ícone de tipo de mensagem
  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType.toUpperCase()) {
      case 'IMAGE':
        return <Image className="h-4 w-4 inline mr-1" />;
      case 'AUDIO':
      case 'PTT':
        return <Music className="h-4 w-4 inline mr-1" />;
      case 'VIDEO':
        return <Video className="h-4 w-4 inline mr-1" />;
      case 'DOCUMENT':
        return <FileText className="h-4 w-4 inline mr-1" />;
      case 'LOCATION':
        return <MapPin className="h-4 w-4 inline mr-1" />;
      case 'CONTACT':
        return <User className="h-4 w-4 inline mr-1" />;
      default:
        return null;
    }
  };

  // Helper para ícone de status de leitura
  const getStatusIcon = (status?: string) => {
    if (!status || status === 'PENDING') return <Check className="h-3 w-3 inline" />;
    if (status === 'SERVER_ACK' || status === 'DELIVERY_ACK') return <CheckCheck className="h-3 w-3 inline" />;
    if (status === 'READ' || status === 'PLAYED') return <CheckCheck className="h-3 w-3 inline text-blue-500" />;
    return <Check className="h-3 w-3 inline" />;
  };

  const handleMarkAsRead = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) return;
    
    try {
      await conversationService.markAsRead(conversationId, token);
      // Atualizar a conversa localmente
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAsUnread = async (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) return;
    
    try {
      await conversationService.markAsUnread(conversationId, token);
      // Atualizar a conversa localmente
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: Math.max(1, conv.unreadCount) }
            : conv
        )
      );
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b bg-base-100 border-base-300`}>
        <div className="flex items-center justify-between">
          <h1 className={`text-xl font-semibold text-base-content`}>
            Conversas
          </h1>
          <div className="flex items-center space-x-1">
            <button className={`p-2 rounded-full hover:bg-base-200 transition-colors`}>
              <Archive className={`h-5 w-5 text-base-content/60`} />
            </button>
            <button className={`p-2 rounded-full hover:bg-base-200 transition-colors`}>
              <MoreVertical className={`h-5 w-5 text-base-content/60`} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversas..."
            className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary border-base-300 bg-base-100 text-base-content placeholder-base-content/50`}
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className={`text-center mt-8 p-4 text-base-content/60`}>
            {searchTerm ? (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-base-content/30" />
                <p>Nenhuma conversa encontrada para "{searchTerm}"</p>
              </div>
            ) : (
              <div>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-base-content/30" />
                <p>Nenhuma conversa ainda</p>
                <p className="text-sm mt-2">Suas conversas aparecerão aqui quando você receber ou enviar mensagens.</p>
              </div>
            )}
          </div>
        ) : (
          <div className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/chat/${instanceId}/${conversation.id}`}
                className={`group block transition-colors hover:bg-base-200`}
              >
                <div className="p-4">
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      {conversation.contactPicture ? (
                        <img
                          src={conversation.contactPicture}
                          alt={conversation.contactName || 'Contato'}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-primary-content font-medium text-lg">
                            {(conversation.contactName || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.isPinned && (
                        <Pin className="absolute -top-1 -right-1 h-4 w-4 text-warning" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-medium truncate text-base-content`}>
                          {getDisplayName({
                            nickname: (conversation as any).nickname,
                            contactName: conversation.contactName,
                            remoteJid: conversation.remoteJid
                          })}
                          {conversation.isGroup && (
                            <span className="ml-1 text-xs text-base-content/60">(Grupo)</span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs text-base-content/60`}>
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-content bg-primary rounded-full min-w-[20px]">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                          {/* Action buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {conversation.unreadCount > 0 ? (
                              <button
                                onClick={(e) => handleMarkAsRead(e, conversation.id)}
                                className={`p-1 rounded hover:bg-base-300`}
                                title="Marcar como lida"
                              >
                                <Check className="h-4 w-4 text-success" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleMarkAsUnread(e, conversation.id)}
                                className={`p-1 rounded hover:bg-base-300`}
                                title="Marcar como não lida"
                              >
                                <Mail className="h-4 w-4 text-primary" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        {(() => {
                          // Priorizar lastMessagePreview (mais completo)
                          if (conversation.lastMessagePreview?.content) {
                            const preview = conversation.lastMessagePreview;
                            const messageTypeIcon = getMessageTypeIcon(preview.messageType);
                            
                            return (
                              <p className={`text-sm truncate text-base-content/70 flex items-center`}>
                                {/* Status de leitura (só para mensagens enviadas) */}
                                {preview.fromMe && (
                                  <span className="mr-1">{getStatusIcon(preview.status)}</span>
                                )}
                                
                                {/* Nome do remetente em grupos (só para mensagens recebidas) - BOLD como WhatsApp */}
                                {!preview.fromMe && conversation.isGroup && preview.senderName && (
                                  <span className="font-semibold">{preview.senderName}:&nbsp;</span>
                                )}
                                
                                {/* "Você:" para mensagens enviadas */}
                                {preview.fromMe && (
                                  <span className="text-primary">Você:&nbsp;</span>
                                )}
                                
                                {/* Ícone de tipo de mensagem */}
                                {messageTypeIcon && <span className="mr-1">{messageTypeIcon}</span>}
                                
                                {/* Conteúdo da mensagem */}
                                <span className="truncate">{truncateMessage(preview.content)}</span>
                              </p>
                            );
                          }
                          
                          // Fallback para lastMessage
                          if (conversation.lastMessage) {
                            return (
                              <p className={`text-sm truncate text-base-content/70`}>
                                {truncateMessage(conversation.lastMessage)}
                              </p>
                            );
                          }

                          // Nenhuma mensagem disponível
                          return (
                            <p className={`text-sm italic text-base-content/50`}>
                              Nenhuma mensagem
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};