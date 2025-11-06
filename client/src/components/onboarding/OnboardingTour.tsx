import React, { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { onboardingService } from '../../services/onboarding';

interface OnboardingTourProps {
  run: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ run, onComplete, onSkip }) => {
  const [stepIndex, setStepIndex] = useState(0);

  const steps: Step[] = [
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">🎉 Bem-vindo ao WhatsAI!</h2>
          <p className="text-lg mb-4">
            Gerencie múltiplas contas WhatsApp em um só lugar.
          </p>
          <p className="text-sm text-base-content/60">
            Vamos fazer um tour rápido de 5 minutos para você conhecer tudo.
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="create-instance"]',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">📱 Conecte seu WhatsApp</h3>
          <p>
            Clique aqui para adicionar sua primeira conexão WhatsApp. É super rápido!
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="instances-list"]',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">📋 Suas Instâncias</h3>
          <p>
            Aqui você verá todas as suas conexões WhatsApp. Você pode ter múltiplas contas!
          </p>
        </div>
      ),
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-tour="chat-area"]',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">💬 Área de Chat</h3>
          <p>
            Aqui você conversa com seus contatos. Interface igual ao WhatsApp Web!
          </p>
        </div>
      ),
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '[data-tour="templates"]',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">📝 Templates</h3>
          <p>
            Crie respostas rápidas com variáveis para agilizar seu atendimento.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="campaigns"]',
      content: (
        <div>
          <h3 className="text-xl font-bold mb-2">📢 Campanhas</h3>
          <p>
            Envie mensagens em massa para seus contatos de forma organizada.
          </p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">✅ Tudo Pronto!</h2>
          <p className="text-lg mb-4">
            Agora você já conhece o básico do WhatsAI.
          </p>
          <p className="text-sm text-base-content/60">
            Comece conectando sua primeira conta WhatsApp!
          </p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
  ];

  const handleJoyrideCallback = async (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      // Tour completed or skipped
      if (status === STATUS.FINISHED) {
        await onboardingService.complete();
        onComplete();
      } else if (status === STATUS.SKIPPED) {
        await onboardingService.skip();
        onSkip();
      }
    } else if (type === EVENTS.STEP_AFTER && action !== ACTIONS.PREV) {
      // Move to next step
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
      
      // Update step in backend
      await onboardingService.updateStep(index + 1);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: 'hsl(var(--s))', // Use DaisyUI success color
          zIndex: 10000,
          textColor: 'hsl(var(--bc))', // Use DaisyUI base-content
          backgroundColor: 'hsl(var(--b1))', // Use DaisyUI base-100
        },
        tooltip: {
          borderRadius: 12,
          padding: 20,
        },
        buttonNext: {
          backgroundColor: 'hsl(var(--s))', // success color
          borderRadius: 8,
          padding: '8px 16px',
        },
        buttonBack: {
          color: 'hsl(var(--bc) / 0.6)', // base-content with opacity
          marginRight: 8,
        },
        buttonSkip: {
          color: 'hsl(var(--bc) / 0.5)', // base-content with more opacity
        },
      }}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular Tutorial',
      }}
    />
  );
};

export default OnboardingTour;
