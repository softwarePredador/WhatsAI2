import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Phone, Video, MoreVertical, ArrowLeft, Search } from 'lucide-react';
import { userAuthStore } from '../features/auth/store/authStore';
import { conversationService } from '../services/conversationService';
import { socketService } from '../services/socketService';

interface Message {
  id: string;
  content: string;
  fromMe: boolean;
  timestamp: Date;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  status?: 'sent' | 'delivered' | 'read';
}

interface Conversation {
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
}

export const ChatPage: React.FC = () => {
  const { instanceId, conversationId } = useParams<{ instanceId: string; conversationId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Usar o store de autenticação global
  const token = userAuthStore((state) => state.token);
  const logout = userAuthStore((state) => state.logout);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      loadConversation();
      loadMessages();
      
      // 🔗 Conectar ao WebSocket e notificar conversa aberta
      socketService.connect(token || undefined);
      if (instanceId) {
        socketService.joinInstance(instanceId);
      }
      socketService.openConversation(conversationId);
      
      // 📱 Cleanup: notificar quando a conversa for fechada
      return () => {
        socketService.closeConversation(conversationId);
        if (instanceId) {
          socketService.leaveInstance(instanceId);
        }
      };
    }
  }, [conversationId, instanceId, token]);

  // 🔗 Setup WebSocket listeners for real-time updates
  useEffect(() => {
    if (!conversationId) return;

    // Listen for new messages in this conversation
    const handleNewMessage = (data: { conversationId: string; message: any }) => {
      if (data.conversationId === conversationId) {
        const newMessage: Message = {
          id: data.message.id,
          content: data.message.content,
          fromMe: data.message.fromMe,
          timestamp: new Date(data.message.timestamp),
          messageType: data.message.messageType || 'text',
          status: data.message.fromMe ? 'sent' : undefined
        };
        
        setMessages(prev => [...prev, newMessage]);
        console.log(`📩 Nova mensagem recebida via WebSocket para conversa ${conversationId}`);
      }
    };

    // Listen for conversation updates
    const handleConversationUpdate = (conversation: Conversation) => {
      if (conversation.id === conversationId) {
        setConversation(conversation);
        console.log(`🔄 Conversa ${conversationId} atualizada via WebSocket`);
      }
    };

    socketService.on('message:received', handleNewMessage);
    socketService.on('conversation:updated', handleConversationUpdate);

    return () => {
      socketService.off('message:received', handleNewMessage);
      socketService.off('conversation:updated', handleConversationUpdate);
    };
  }, [conversationId]);

  // ✨ Marcar como lida após um tempo ativo na conversa
  useEffect(() => {
    if (!conversation || !conversationId || !token || conversation.unreadCount === 0) {
      return;
    }

    // Marcar como lida após 3 segundos de permanência na conversa
    const timeoutId = setTimeout(async () => {
      if (conversation.unreadCount > 0) {
        try {
          await conversationService.markAsRead(conversationId, token);
          console.log(`📖 Conversa ${conversationId} marcada como lida após permanência ativa`);
          setConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
        } catch (error) {
          console.error('❌ Erro ao marcar conversa como lida:', error);
        }
      }
    }, 3000); // 3 segundos

    return () => clearTimeout(timeoutId);
  }, [conversation?.id, conversation?.unreadCount, conversationId, token]);

  // ✨ Marcar como lida quando a página fica visível novamente (usuário volta para a aba)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && conversation && conversation.unreadCount > 0 && conversationId && token) {
        // Quando o usuário volta para a aba, marcar como lida se houver mensagens não lidas
        conversationService.markAsRead(conversationId, token)
          .then(() => {
            console.log(`📖 Conversa ${conversationId} marcada como lida (foco na aba)`);
            setConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
          })
          .catch(error => {
            console.error('❌ Erro ao marcar como lida (foco na aba):', error);
          });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversation, conversationId, token]);

  const loadConversation = async () => {
    try {
      if (!token) {
        logout();
        navigate('/login');
        return;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setConversation(data.data);
        
        // ✨ NÃO marcar automaticamente como lida apenas por carregar a conversa
        // A marcação como lida acontece via WebSocket quando mensagens chegam 
        // e a conversa está ativa, ou via visibility change quando usuário volta à aba
        console.log(`📱 Conversa carregada: ${data.data?.contactName || data.data?.remoteJid} (unreadCount: ${data.data?.unreadCount || 0})`);
      }
    } catch (error) {
      console.error('Erro ao carregar conversa:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        logout();
        navigate('/login');
        return;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Dados recebidos do backend:', data);
        // O backend retorna data.data.messages, não data.data
        const messages = data.data?.messages || [];
        // Converter timestamps string para Date
        const processedMessages = messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(processedMessages);
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || sending) return;

    setSending(true);
    try {
      if (!token) {
        logout();
        navigate('/login');
        return;
      }
      
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          remoteJid: conversation.remoteJid,
          content: newMessage.trim()
        })
      });

      if (response.status === 401) {
        logout();
        navigate('/login');
        return;
      }

      if (response.ok) {
        await response.json();
        
        // Adicionar mensagem localmente
        const tempMessage: Message = {
          id: Date.now().toString(),
          content: newMessage.trim(),
          fromMe: true,
          timestamp: new Date(),
          messageType: 'text',
          status: 'sent'
        };
        
        setMessages(prev => [...prev, tempMessage]);
        setNewMessage('');
        
        // ✨ Marcar como lida quando o usuário envia uma mensagem (se ainda não estava lida)
        if (conversation && conversation.unreadCount > 0 && conversationId) {
          try {
            await conversationService.markAsRead(conversationId, token);
            console.log(`📖 Conversa ${conversationId} marcada como lida após envio de mensagem`);
            
            // Atualizar o estado local
            setConversation(prev => prev ? { ...prev, unreadCount: 0 } : null);
          } catch (error) {
            console.error('❌ Erro ao marcar conversa como lida após envio:', error);
            // Não bloquear o envio se falhar
          }
        }
      } else {
        // Tentar obter mensagem de erro específica do backend
        try {
          const errorData = await response.json();
          const errorMessage = errorData.message || 'Erro ao enviar mensagem';
          alert(errorMessage);
        } catch {
          alert('Erro ao enviar mensagem');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Verifique sua conexão.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Conversa não encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            A conversa solicitada não existe ou foi removida.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="relative">
                {conversation.contactPicture ? (
                  <img
                    src={conversation.contactPicture}
                    alt={conversation.contactName || 'Contato'}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {(conversation.contactName || '?').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>
              <div>
                <h2 className="font-medium text-gray-900 dark:text-gray-100">
                  {conversation.contactName || 'Contato sem nome'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {conversation.isGroup ? 'Grupo' : 'Online'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Phone className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Video className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Search className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <MoreVertical className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm mt-2">Envie a primeira mensagem para iniciar a conversa!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.fromMe
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-end space-x-1 mt-1">
                  <span className={`text-xs ${
                    message.fromMe ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>
                  {message.fromMe && message.status && (
                    <div className="flex space-x-1">
                      <div className={`w-1 h-1 rounded-full ${
                        message.status === 'sent' ? 'bg-blue-200' :
                        message.status === 'delivered' ? 'bg-blue-200' :
                        'bg-blue-200'
                      }`} />
                      {message.status !== 'sent' && (
                        <div className={`w-1 h-1 rounded-full ${
                          message.status === 'delivered' ? 'bg-blue-200' : 'bg-blue-200'
                        }`} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite uma mensagem..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};