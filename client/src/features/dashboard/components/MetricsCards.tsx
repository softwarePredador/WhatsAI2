import React from 'react';
import { DashboardMetrics } from '../types/dashboard';
import { MessageSquare, Smartphone, Users, TrendingUp, HardDrive, DollarSign } from 'lucide-react';

interface MetricsCardsProps {
  metrics: DashboardMetrics;
  loading?: boolean;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, color }) => {
  return (
    <div className={`bg-base-100 p-6 rounded-xl border border-base-300 shadow-sm hover:shadow-md transition-shadow ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base-content/70 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-base-content mt-1">{value}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-success' : 'text-error'
            }`}>
              <TrendingUp size={14} className={`mr-1 ${!trend.isPositive ? 'rotate-180' : ''}`} />
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className="text-base-content/50">
          {icon}
        </div>
      </div>
    </div>
  );
};

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-base-100 p-6 rounded-xl border border-base-300 animate-pulse">
            <div className="h-4 bg-base-300 rounded mb-2"></div>
            <div className="h-8 bg-base-300 rounded mb-2"></div>
            <div className="h-3 bg-base-300 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatStorage = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }

    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      <MetricCard
        title="Total de Mensagens"
        value={formatNumber(metrics.totalMessages)}
        icon={<MessageSquare size={24} />}
        trend={{ value: 12.5, isPositive: true }}
        color=""
      />

      <MetricCard
        title="Instâncias Ativas"
        value={metrics.activeInstances}
        icon={<Smartphone size={24} />}
        trend={{ value: 8.2, isPositive: true }}
        color=""
      />

      <MetricCard
        title="Total de Usuários"
        value={metrics.totalUsers}
        icon={<Users size={24} />}
        trend={{ value: 5.1, isPositive: true }}
        color=""
      />

      <MetricCard
        title="Taxa de Entrega"
        value={`${metrics.deliveryRate.toFixed(1)}%`}
        icon={<TrendingUp size={24} />}
        trend={{ value: 2.3, isPositive: true }}
        color=""
      />

      <MetricCard
        title="Armazenamento"
        value={formatStorage(metrics.storageUsed)}
        icon={<HardDrive size={24} />}
        trend={{ value: 15.7, isPositive: false }}
        color=""
      />

      <MetricCard
        title="Custos Totais"
        value={formatCurrency(metrics.costs.total)}
        icon={<DollarSign size={24} />}
        trend={{ value: 7.8, isPositive: false }}
        color=""
      />
    </div>
  );
};

export default MetricsCards;