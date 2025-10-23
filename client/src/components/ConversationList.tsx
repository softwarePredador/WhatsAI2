import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Search, MessageSquare, Archive, Pin, MoreVertical, Check, Mail } from 'lucide-react';
import { userAuthStore } from '../features/auth/store/authStore';
import { conversationService } from '../services/conversationService';
import { socketService } from '../services/socketService';

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
  };
}

export const ConversationList: React.FC = () => {
  const { instanceId } = useParams<{ instanceId: string }>();
  const navigate = useNavigate();
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

    const handleConversationUpdated = (updatedConversation: ConversationSummary) => {
      console.log('🔔 [ConversationList] Conversa atualizada via WebSocket:', updatedConversation);
      
      setConversations(prevConversations => {
        // Encontrar e atualizar a conversa na lista
        const index = prevConversations.findIndex(c => c.id === updatedConversation.id);
        
        if (index !== -1) {
          // Atualizar conversa existente
          const updated = [...prevConversations];
          updated[index] = {
            ...updated[index],
            ...updatedConversation
          };
          
          // Reordenar por lastMessageAt (mais recente primeiro)
          return updated.sort((a, b) => {
            const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
            const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
            return timeB - timeA;
          });
        } else {
          // Nova conversa - adicionar no início
          return [updatedConversation, ...prevConversations];
        }
      });
    };

    // Conectar ao WebSocket quando tiver instanceId
    socketService.joinInstance(instanceId);
    socketService.on('conversation:updated', handleConversationUpdated);

    return () => {
      socketService.off('conversation:updated', handleConversationUpdated);
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
      
      if (!token) {
        console.log('❌ Nenhum token encontrado, redirecionando para login...');
        logout();
        navigate('/login');
        return;
      }
      
      const url = instanceId 
        ? `/api/conversations?instanceId=${instanceId}`
        : '/api/conversations';
        
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Conversas
          </h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Archive className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8 p-4">
            {searchTerm ? (
              <div>
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma conversa encontrada para "{searchTerm}"</p>
              </div>
            ) : (
              <div>
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma conversa ainda</p>
                <p className="text-sm mt-2">Suas conversas aparecerão aqui quando você receber ou enviar mensagens.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => (
              <Link
                key={conversation.id}
                to={`/chat/${instanceId}/${conversation.id}`}
                className="group block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                        <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                          <span className="text-white font-medium text-lg">
                            {(conversation.contactName || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {conversation.isPinned && (
                        <Pin className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {conversation.contactName || conversation.remoteJid}
                          {conversation.isGroup && (
                            <span className="ml-1 text-xs text-gray-500">(Grupo)</span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-500 rounded-full min-w-[20px]">
                              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                            </span>
                          )}
                          {/* Action buttons */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {conversation.unreadCount > 0 ? (
                              <button
                                onClick={(e) => handleMarkAsRead(e, conversation.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="Marcar como lida"
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleMarkAsUnread(e, conversation.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title="Marcar como não lida"
                              >
                                <Mail className="h-4 w-4 text-blue-600" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-1">
                        {conversation.lastMessagePreview ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {conversation.lastMessagePreview.fromMe && (
                              <span className="text-blue-500">Você: </span>
                            )}
                            {truncateMessage(conversation.lastMessagePreview.content)}
                          </p>
                        ) : conversation.lastMessage ? (
                          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            {truncateMessage(conversation.lastMessage)}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                            Nenhuma mensagem
                          </p>
                        )}
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