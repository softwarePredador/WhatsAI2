import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { chartTheme, formatHour } from '../utils/chartTheme';

interface PeakHoursChartProps {
  data: { hour: number; count: number }[];
  loading: boolean;
}

export const PeakHoursChart: React.FC<PeakHoursChartProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-base-100 p-6 rounded-xl border border-base-300">
        <h3 className="text-lg font-semibold mb-4 text-base-content">Horários de Pico</h3>
        <div className="h-64 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-base-100 p-6 rounded-xl border border-base-300">
        <h3 className="text-lg font-semibold mb-4 text-base-content">Horários de Pico</h3>
        <div className="h-64 flex items-center justify-center text-base-content/50">
          <p>Nenhum dado disponível nos últimos 7 dias</p>
        </div>
      </div>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    hourLabel: formatHour(item.hour)
  }));

  return (
    <div className="bg-base-100 p-6 rounded-xl border border-base-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-base-content">Horários de Pico</h3>
        <span className="badge badge-primary">Últimos 7 dias</span>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid 
              strokeDasharray={chartTheme.grid.strokeDasharray} 
              stroke={chartTheme.grid.stroke} 
            />
            <XAxis 
              dataKey="hourLabel" 
              tick={chartTheme.axis.tick}
            />
            <YAxis 
              tick={chartTheme.axis.tick}
              label={{ 
                value: 'Mensagens', 
                angle: -90, 
                position: 'insideLeft', 
                style: { 
                  textAnchor: 'middle', 
                  fill: chartTheme.axis.label.fill 
                } 
              }}
            />
            <Tooltip 
              contentStyle={chartTheme.tooltip.contentStyle}
              labelStyle={chartTheme.tooltip.labelStyle}
              formatter={(value: number) => [`${value} mensagens`, 'Total']}
            />
            <Bar 
              dataKey="count" 
              fill={chartTheme.colors.primary}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Hours Summary */}
      <div className="mt-4">
        <p className="text-xs text-base-content/60 mb-2">Top 5 Horários:</p>
        <div className="flex flex-wrap gap-2">
          {data.slice(0, 5).map((item, index) => (
            <div key={item.hour} className="badge badge-outline gap-2">
              <span className="font-semibold">#{index + 1}</span>
              <span>{formatHour(item.hour)}</span>
              <span className="text-base-content font-medium">({item.count})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
