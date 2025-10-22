import React from 'react';
import { useParams } from 'react-router-dom';
import { ConversationList } from '../components/ConversationList';
import { ChatPage } from './ChatPage';
import { MessageSquare } from 'lucide-react';

export const ChatLayout: React.FC = () => {
  const { instanceId, conversationId } = useParams<{ 
    instanceId: string; 
    conversationId?: string; 
  }>();

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