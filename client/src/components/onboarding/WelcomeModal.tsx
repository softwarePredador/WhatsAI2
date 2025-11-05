import React from 'react';
import { X, Sparkles, MessageSquare, Zap, Users } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
  onSkip: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onStartTour,
  onSkip,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8 transform transition-all">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo ao WhatsAI! 🎉
            </h2>
            <p className="text-lg text-gray-600">
              Gerencie múltiplas contas WhatsApp em um só lugar
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Multi-Instância</h3>
              <p className="text-sm text-gray-600">
                Conecte quantas contas quiser
              </p>
            </div>

            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-3">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Templates</h3>
              <p className="text-sm text-gray-600">
                Respostas rápidas automáticas
              </p>
            </div>

            <div className="text-center p-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mb-3">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Campanhas</h3>
              <p className="text-sm text-gray-600">
                Envios em massa organizados
              </p>
            </div>
          </div>

          {/* Video or Image Placeholder */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 mb-8 text-center">
            <div className="aspect-video bg-white/50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600">
                  Vídeo de boas-vindas (30 segundos)
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Em breve: Tour visual do produto
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartTour}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              🚀 Iniciar Tour Guiado (5 min)
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Explorar Por Conta
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mt-4">
            Você pode retomar o tour a qualquer momento nas configurações
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
