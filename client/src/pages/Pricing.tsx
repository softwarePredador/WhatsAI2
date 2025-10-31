/**
 * Pricing Page
 * Página de planos e preços com integração Stripe
 */

import { useState } from 'react';
import { Check, Loader2, Zap } from 'lucide-react';
import { billingService, PLANS, Plan } from '../services/billing';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async (plan: Plan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.id === 'free') {
      // Plano Free não precisa de pagamento
      return;
    }

    try {
      setLoading(plan.id);
      await billingService.redirectToCheckout(plan.priceId);
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error);
      alert(error.response?.data?.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comece grátis e escale conforme seu negócio cresce
          </p>
          <div className="mt-6 inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
            <Zap className="w-4 h-4 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-sm font-medium text-green-800 dark:text-green-200">
              14 dias de teste grátis em todos os planos pagos
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-xs font-bold rounded-bl-lg">
                  MAIS POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-extrabold text-gray-900 dark:text-white">
                      R$ {plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="ml-2 text-gray-500 dark:text-gray-400">/mês</span>
                    )}
                  </div>
                  {plan.id !== 'free' && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Teste grátis por 14 dias
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.id || (user?.plan === plan.id.toUpperCase())}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white'
                  } ${
                    loading === plan.id || user?.plan === plan.id.toUpperCase()
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  {loading === plan.id ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processando...
                    </span>
                  ) : user?.plan === plan.id.toUpperCase() ? (
                    'Plano Atual'
                  ) : plan.id === 'free' ? (
                    'Começar Grátis'
                  ) : (
                    'Assinar Agora'
                  )}
                </button>

                {/* Features List */}
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 dark:text-gray-300 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Como funciona o teste grátis?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Você tem 14 dias para testar qualquer plano pago sem custo. Após o período de
                teste, sua assinatura será automaticamente convertida para o plano escolhido.
                Você pode cancelar a qualquer momento durante o período de teste.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Posso trocar de plano depois?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                Mudanças de plano são proporcionais ao tempo restante do ciclo de cobrança.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Como posso cancelar minha assinatura?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Você pode cancelar sua assinatura a qualquer momento através do portal de
                gerenciamento ou entrando em contato com nosso suporte. Não há multas ou taxas
                de cancelamento.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Quais formas de pagamento são aceitas?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Aceitamos cartões de crédito (Visa, Mastercard, American Express, etc.) através
                do Stripe, nossa plataforma de pagamentos segura.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de empresas que confiam no WhatsAI para automatizar suas
            comunicações
          </p>
          <button
            onClick={() => handleSubscribe(PLANS[1])} // STARTER plan
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors"
          >
            Começar Teste Grátis
          </button>
        </div>
      </div>
    </div>
  );
}
