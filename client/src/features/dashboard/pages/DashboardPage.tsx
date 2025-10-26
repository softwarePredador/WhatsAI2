import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricsCards } from '../components/MetricsCards';
import { MessagesChart } from '../components/MessagesChart';
import { dashboardService } from '../services/dashboardService';
import { DashboardMetrics, MessageChartData } from '../types/dashboard';
import { userAuthStore } from '../../auth/store/authStore';

export const DashboardPage: React.FC = () => {
  const { token } = userAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [messageChartData, setMessageChartData] = useState<MessageChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setChartLoading(true);

        // Load metrics and chart data in parallel
        const [metricsData, chartData] = await Promise.all([
          dashboardService.getMetrics(token),
          dashboardService.getMessageChart(token)
        ]);

        setMetrics(metricsData);
        setMessageChartData(chartData);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
        setChartLoading(false);
      }
    };

    loadData();
  }, [token]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 rounded-xl text-primary-content">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Dashboard WhatsAI</h2>
          <p className="text-primary-content/80">
            Monitore o desempenho do seu sistema de mensagens WhatsApp em tempo real.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Metrics Cards */}
        <MetricsCards
          metrics={metrics || {
            totalMessages: 0,
            activeInstances: 0,
            totalUsers: 0,
            deliveryRate: 0,
            storageUsed: 0,
            costs: {
              evolutionApi: 0,
              storage: 0,
              total: 0
            }
          }}
          loading={loading}
        />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MessagesChart data={messageChartData} loading={chartLoading} />

          <div className="bg-base-100 p-6 rounded-xl border border-base-300">
            <h3 className="text-lg font-semibold mb-4 text-base-content">Status das Instâncias</h3>
            <div className="h-64 flex items-center justify-center text-base-content/50">
              <p>Gráfico será implementado na próxima etapa</p>
            </div>
          </div>
        </div>

        {/* Activity Feed Placeholder */}
        <div className="bg-base-100 p-6 rounded-xl border border-base-300">
          <h3 className="text-lg font-semibold mb-4 text-base-content">Atividades Recentes</h3>
          <div className="space-y-3">
            <div className="h-16 flex items-center justify-center text-base-content/50">
              <p>Feed de atividades será implementado na próxima etapa</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;