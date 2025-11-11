import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CostData } from '../types/dashboard';
import { chartTheme, formatMonth, formatCurrency } from '../utils/chartTheme';

interface CostsChartProps {
  data: CostData[];
  loading: boolean;
}

export const CostsChart: React.FC<CostsChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-base-100 p-6 rounded-xl border border-base-300">
        <h3 className="text-lg font-semibold mb-4 text-base-content">Custos Mensais</h3>
        <div className="h-64 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-base-100 p-6 rounded-xl border border-base-300">
        <h3 className="text-lg font-semibold mb-4 text-base-content">Custos Mensais</h3>
        <div className="h-64 flex items-center justify-center text-base-content/50">
          <p>Nenhum dado de custo disponível</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    monthLabel: formatMonth(item.month)
  }));

  return (
    <div className="bg-base-100 p-6 rounded-xl border border-base-300">
      <h3 className="text-lg font-semibold mb-4 text-base-content">Custos Mensais</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray={chartTheme.grid.strokeDasharray} 
              stroke={chartTheme.grid.stroke}
            />
            <XAxis 
              dataKey="monthLabel" 
              tick={chartTheme.axis.tick}
            />
            <YAxis 
              tick={chartTheme.axis.tick}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip 
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="evolutionApi" 
              name="Evolution API"
              stroke={chartTheme.colors.secondary}
              strokeWidth={2}
              dot={{ fill: chartTheme.colors.secondary, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="storage" 
              name="Armazenamento"
              stroke={chartTheme.colors.info}
              strokeWidth={2}
              dot={{ fill: chartTheme.colors.info, r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              name="Total"
              stroke={chartTheme.colors.success}
              strokeWidth={3}
              dot={{ fill: chartTheme.colors.success, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-base-content/60">Último Mês</p>
          <p className="text-lg font-semibold text-base-content">
            {formatCurrency(data[data.length - 1]?.total || 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-base-content/60">Média</p>
          <p className="text-lg font-semibold text-base-content">
            {formatCurrency(data.reduce((sum, d) => sum + d.total, 0) / data.length)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-base-content/60">Total (6 meses)</p>
          <p className="text-lg font-semibold text-base-content">
            {formatCurrency(data.reduce((sum, d) => sum + d.total, 0))}
          </p>
        </div>
      </div>
    </div>
  );
};
