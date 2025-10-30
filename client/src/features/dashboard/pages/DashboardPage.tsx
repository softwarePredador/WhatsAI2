import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { MetricsCards } from '../components/MetricsCards';
import { MessagesChart } from '../components/MessagesChart';
import { InstancesStatusChart } from '../components/InstancesStatusChart';
import { InstancesList } from '../components/InstancesList';
import { dashboardService } from '../services/dashboardService';
import { DashboardMetrics, MessageChartData, InstanceStatusData } from '../types/dashboard';
import { userAuthStore } from '../../auth/store/authStore';

export const DashboardPage: React.FC = () => {
  const { token } = userAuthStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [messageChartData, setMessageChartData] = useState<MessageChartData[]>([]);
  const [instanceStatusData, setInstanceStatusData] = useState<InstanceStatusData[]>([]);
  const [instancesList, setInstancesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [instancesLoading, setInstancesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('list');

  useEffect(() => {
    const loadData = async () => {
      if (!token) return;

      try {
        setLoading(true);
        setChartLoading(true);
        setStatusLoading(true);
        setInstancesLoading(true);

        // Load metrics, chart data, instance status and instances list in parallel
        const [metricsData, chartData, statusData, instances] = await Promise.all([
          dashboardService.getMetrics(token),
          dashboardService.getMessageChart(token),
          dashboardService.getInstanceStatus(token),
          dashboardService.getInstancesList(token)
        ]);

        setMetrics(metricsData);
        setMessageChartData(chartData);
        setInstanceStatusData(statusData);
        setInstancesList(instances);
        setError(null);
      } catch (err) {
        setError('Erro ao carregar dados do dashboard');
        console.error('Dashboard data error:', err);
      } finally {
        setLoading(false);
        setChartLoading(false);
        setStatusLoading(false);
        setInstancesLoading(false);
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-base-content">Status das Instâncias</h3>
              
              {/* View Toggle */}
              <div className="join">
                <button
                  className={`join-item btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </button>
                <button
                  className={`join-item btn btn-sm ${viewMode === 'chart' ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setViewMode('chart')}
                >
                  Gráfico
                </button>
              </div>
            </div>

            {viewMode === 'chart' ? (
              <InstancesStatusChart data={instanceStatusData} loading={statusLoading} />
            ) : (
              <InstancesList instances={instancesList} loading={instancesLoading} />
            )}
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