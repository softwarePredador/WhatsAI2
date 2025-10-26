import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { instanceService } from '../services/instanceService';
import { userAuthStore } from '../../auth/store/authStore';
import { WhatsAppInstance, SendMessagePayload } from '../types/instanceTypes';
import toast from 'react-hot-toast';

interface SendMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  instance: WhatsAppInstance | null;
}

function SendMessageModal({ isOpen, onClose, instance }: SendMessageModalProps) {
  const { token } = userAuthStore();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SendMessagePayload>({
    number: '',
    text: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!instance || !token) {
      toast.error('Instância ou token não encontrado');
      return;
    }

    if (instance.status !== 'connected') {
      toast.error('Instância não está conectada');
      return;
    }

    // Evitar múltiplas submissões
    if (isLoading) {
      return;
    }

    // Validar campos
    if (!formData.number.trim()) {
      toast.error('Digite o número do destinatário');
      return;
    }

    if (!formData.text.trim()) {
      toast.error('Digite o texto da mensagem');
      return;
    }

    setIsLoading(true);
    
    try {
      await instanceService.sendMessage(
        instance.id,
        formData.number,
        formData.text,
        token
      );

      toast.success('Mensagem enviada com sucesso!');
      
      // Reset form
      setFormData({ number: '', text: '' });
      onClose();
      
      // Redirecionar para o chat da instância
      navigate(`/chat/${instance.id}`);
    } catch (error) {
      console.error('❌ [SendMessageModal] Erro ao enviar mensagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar mensagem';
      console.log('❌ [SendMessageModal] Mensagem de erro:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ number: '', text: '' });
      onClose();
    }
  };

  if (!isOpen || !instance) return null;

  return (
    <div className="fixed inset-0 bg-base-300 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl max-w-md w-full border border-base-300">
        {/* Header */}
        <div className="p-6 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-base-content">
                Enviar Mensagem
              </h2>
              <p className="text-sm text-base-content/60 mt-1">
                Via: {instance.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Instance Status */}
          <div className="mt-3 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              instance.status === 'connected' ? 'bg-success' : 
              instance.status === 'connecting' ? 'bg-warning' : 'bg-error'
            }`}></div>
            <span className="text-sm capitalize">{instance.status}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Número de Telefone
              </label>
              <input
                type="tel"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                placeholder="+5511999999999"
                className="input input-bordered w-full"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-base-content/50 mt-1">
                Formato: +55 + DDD + número (ex: +5511999999999)
              </p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Mensagem
              </label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                placeholder="Digite sua mensagem aqui..."
                className="textarea textarea-bordered w-full h-24 resize-none"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-base-content/50 mt-1">
                {formData.text.length}/1000 caracteres
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 btn btn-ghost"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || instance.status !== 'connected'}
              className="flex-1 btn btn-primary border-0"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Enviando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Enviar Mensagem
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SendMessageModal;