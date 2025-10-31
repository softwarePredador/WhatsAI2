/**
 * Subscription Dashboard
 * Página de gerenciamento de assinatura
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Loader2,
  ArrowUpCircle,
  ArrowDownCircle,
} from 'lucide-react';
import { billingService, Subscription as SubscriptionType, Invoice, PLANS } from '../services/billing';
import { useAuth } from '../hooks/useAuth';

export default function Subscription() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionType | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados da assinatura
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subData, invoiceData] = await Promise.all([
        billingService.getSubscription(),
        billingService.getInvoices(),
      ]);

      setSubscription(subData);
      setInvoices(invoiceData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      setError('Não foi possível carregar os dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você terá acesso até o final do período pago.')) {
      return;
    }

    try {
      setActionLoading(true);
      await billingService.cancelSubscription();
      await loadSubscriptionData();
      
      // Atualizar plano do usuário
      if (user) {
        updateUser({ ...user, plan: 'FREE' });
      }
      
      alert('Assinatura cancelada com sucesso. Você terá acesso até o final do período pago.');
    } catch (err) {
      console.error('Erro ao cancelar:', err);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setActionLoading(true);
      await billingService.reactivateSubscription();
      await loadSubscriptionData();
      alert('Assinatura reativada com sucesso!');
    } catch (err) {
      console.error('Erro ao reativar:', err);
      alert('Erro ao reativar assinatura. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePlan = async (newPlanId: string) => {
    if (!confirm('Deseja mudar de plano? A mudança será aplicada imediatamente.')) {
      return;
    }

    try {
      setActionLoading(true);
      await billingService.changePlan(newPlanId);
      await loadSubscriptionData();
      alert('Plano alterado com sucesso!');
    } catch (err) {
      console.error('Erro ao mudar plano:', err);
      alert('Erro ao mudar de plano. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      await billingService.redirectToPortal();
    } catch (err) {
      console.error('Erro ao abrir portal:', err);
      alert('Erro ao abrir portal de pagamento. Tente novamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Ativo' },
      trialing: { icon: Calendar, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300', label: 'Período de Teste' },
      canceled: { icon: XCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Cancelado' },
      past_due: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300', label: 'Pagamento Pendente' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </span>
    );
  };

  const getInvoiceStatusBadge = (status: string) => {
    const statusConfig = {
      paid: { color: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300', label: 'Pago' },
      open: { color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300', label: 'Pendente' },
      void: { color: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300', label: 'Cancelado' },
      uncollectible: { color: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300', label: 'Não Coletável' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.open;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const currentPlan = PLANS.find(p => p.id === user?.plan) || PLANS[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Erro ao Carregar</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={loadSubscriptionData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Minha Assinatura
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie sua assinatura e histórico de pagamentos
          </p>
        </div>

        {/* Current Plan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Plano {currentPlan.name}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {currentPlan.price === 0 ? 'Sem cobrança' : `R$ ${currentPlan.price}/mês`}
              </p>
            </div>
            {subscription && (
              <div className="mt-4 md:mt-0">
                {getStatusBadge(subscription.status)}
              </div>
            )}
          </div>

          {/* Plan Features */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Instâncias</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlan.features.find(f => f.includes('instância'))?.match(/\d+/)?.[0] || '0'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Mensagens/Mês</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlan.features.find(f => f.includes('mensagens'))?.match(/[\d.]+k?/)?.[0] || '0'}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-5 h-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Contatos</h3>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentPlan.features.find(f => f.includes('contatos'))?.match(/[\d.]+k?/)?.[0] || '0'}
              </p>
            </div>
          </div>

          {/* Subscription Details */}
          {subscription && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {subscription.trialEnd && new Date(subscription.trialEnd) > new Date() && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Teste grátis até</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(subscription.trialEnd)}
                    </p>
                  </div>
                )}
                {subscription.currentPeriodEnd && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {subscription.cancelAtPeriodEnd ? 'Acesso até' : 'Próxima cobrança'}
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {actionLoading ? 'Processando...' : 'Cancelar Assinatura'}
                  </button>
                )}

                {subscription.cancelAtPeriodEnd && (
                  <button
                    onClick={handleReactivateSubscription}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {actionLoading ? 'Processando...' : 'Reativar Assinatura'}
                  </button>
                )}

                <button
                  onClick={handleManageBilling}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {actionLoading ? 'Abrindo...' : 'Gerenciar Pagamento'}
                </button>

                {currentPlan.id === 'FREE' && (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Fazer Upgrade
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Free Plan CTA */}
          {!subscription && currentPlan.id === 'FREE' && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Pronto para mais recursos?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Faça upgrade e desbloqueie todo o potencial do WhatsAI
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Ver Planos
              </button>
            </div>
          )}
        </div>

        {/* Change Plan Section */}
        {subscription && currentPlan.id !== 'FREE' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Mudar de Plano
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {PLANS.filter(p => p.id !== 'FREE').map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 ${
                    plan.id === currentPlan.id
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    {plan.price}
                    <span className="text-sm text-gray-600 dark:text-gray-400">/mês</span>
                  </p>
                  {plan.id === currentPlan.id ? (
                    <div className="text-center py-2 text-sm font-medium text-blue-600">
                      Plano Atual
                    </div>
                  ) : (
                    <button
                      onClick={() => handleChangePlan(plan.priceId)}
                      disabled={actionLoading}
                      className={`w-full py-2 rounded-lg font-medium transition-colors ${
                        plan.id > currentPlan.id
                          ? 'bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white flex items-center justify-center'
                      }`}
                    >
                      {plan.id > currentPlan.id ? (
                        <>
                          <ArrowUpCircle className="w-4 h-4 mr-1" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="w-4 h-4 mr-1" />
                          Downgrade
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Histórico de Faturas
          </h2>
          {invoices.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 text-center py-8">
              Nenhuma fatura encontrada
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Data
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Número
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Valor
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {formatDate(invoice.created)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {invoice.number || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="py-3 px-4">
                        {getInvoiceStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4">
                        {invoice.invoicePdf && (
                          <a
                            href={invoice.invoicePdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
