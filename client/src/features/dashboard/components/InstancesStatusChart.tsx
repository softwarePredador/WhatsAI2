import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { InstanceStatusData } from '../types/dashboard';

interface InstancesStatusChartProps {
  data: InstanceStatusData[];
  loading?: boolean;
}

export const InstancesStatusChart: React.FC<InstancesStatusChartProps> = ({
  data,
  loading = false
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-6 h-6 text-success" />;
      case 'offline':
        return <WifiOff className="w-6 h-6 text-error" />;
      case 'connecting':
        return <RefreshCw className="w-6 h-6 text-warning animate-spin" />;
      default:
        return <Wifi className="w-6 h-6 text-base-content/50" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-success';
      case 'offline':
        return 'bg-error';
      case 'connecting':
        return 'bg-warning';
      default:
        return 'bg-base-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'connecting':
        return 'Conectando';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* Donut Chart Visual */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-bold text-base-content">{total}</div>
            <div className="text-sm text-base-content/60">Instâncias</div>
          </div>

          {/* Donut segments */}
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="24"
              className="text-base-200"
            />
            {data.map((item, index) => {
              const circumference = 2 * Math.PI * 80;
              const offset = data
                .slice(0, index)
                .reduce((sum, prev) => sum + prev.percentage, 0);
              const strokeDasharray = `${
                (item.percentage / 100) * circumference
              } ${circumference}`;
              const strokeDashoffset = -(offset / 100) * circumference;

              return (
                <circle
                  key={item.status}
                  cx="96"
                  cy="96"
                  r="80"
                  fill="none"
                  strokeWidth="24"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className={
                    item.status === 'online'
                      ? 'text-success'
                      : item.status === 'offline'
                      ? 'text-error'
                      : 'text-warning'
                  }
                  stroke="currentColor"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between p-3 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(item.status)}
              <div>
                <div className="font-medium text-base-content">
                  {getStatusLabel(item.status)}
                </div>
                <div className="text-sm text-base-content/60">
                  {item.count} instância{item.count !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-base-content">
                {item.percentage.toFixed(0)}%
              </div>
              <div
                className={`w-2 h-8 rounded-full ${getStatusColor(
                  item.status
                )}`}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {data.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
          <WifiOff className="w-12 h-12 mb-3" />
          <p>Nenhuma instância encontrada</p>
          <p className="text-sm mt-1">Crie sua primeira instância para começar</p>
        </div>
      )}
    </div>
  );
};
