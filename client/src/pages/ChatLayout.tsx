import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ConversationList } from '../components/ConversationList';
import { ChatPage } from './ChatPage';
import { MessageSquare } from 'lucide-react';
import { useInstanceStore } from '../features/instances/store/instanceStore';
import { userAuthStore } from '../features/auth/store/authStore';

export const ChatLayout: React.FC = () => {
  const { instanceId, conversationId } = useParams<{ 
    instanceId?: string; 
    conversationId?: string; 
  }>();
  const navigate = useNavigate();
  const { instances, fetchInstances } = useInstanceStore();
  const token = userAuthStore((state) => state.token);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se não tiver instanceId mas tiver conversationId
    if (!instanceId && conversationId) {
      // Buscar instanceId da primeira instância conectada
      if (instances.length === 0 && token) {
        fetchInstances(token).then(() => setLoading(false));
      } else {
        setLoading(false);
        const firstInstance = instances.find(i => i.status === 'connected') || instances[0];
        if (firstInstance) {
          navigate(`/chat/${firstInstance.id}/${conversationId}`, { replace: true });
        } else {
          navigate('/instances', { replace: true });
        }
      }
    } else {
      setLoading(false);
    }
  }, [instanceId, conversationId, instances, token, fetchInstances, navigate]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-100 dark:bg-gray-900">
      {/* Sidebar - Lista de Conversas */}
      <div className={`w-full lg:w-80 lg:flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
        conversationId ? 'hidden lg:block' : 'block'
      }`}>
        <ConversationList />
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${
        conversationId ? 'block' : 'hidden lg:flex'
      }`}>
        {conversationId ? (
          <ChatPage />
        ) : (
          /* Empty State - Nenhuma conversa selecionada */
          <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center max-w-sm mx-auto">
              <div className="mx-auto h-24 w-24 text-gray-300 dark:text-gray-600 mb-6">
                <MessageSquare className="h-full w-full" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                Bem-vindo ao WhatsAI Chat
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Selecione uma conversa na barra lateral para começar a conversar, ou inicie uma nova conversa.
              </p>
              <div className="text-sm text-gray-400 dark:text-gray-500">
                <p>💡 Dicas:</p>
                <ul className="mt-2 space-y-1 text-left">
                  <li>• Use a busca para encontrar conversas rapidamente</li>
                  <li>• Mensagens em tempo real via WebSocket</li>
                  <li>• Suporte a grupos e conversas individuais</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};