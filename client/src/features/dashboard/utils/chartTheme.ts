/**
 * Shared chart theme configuration for consistent styling across all dashboard charts
 * Uses CSS variables to support both light and dark themes
 */

export const chartTheme = {
  // Grid styling
  grid: {
    stroke: 'hsl(var(--bc) / 0.1)', // base-content with 10% opacity
    strokeDasharray: '3 3',
  },
  
  // Axis styling
  axis: {
    tick: {
      fontSize: 12,
      fill: 'hsl(var(--bc) / 0.7)', // base-content with 70% opacity
    },
    label: {
      fill: 'hsl(var(--bc) / 0.7)',
      fontSize: 12,
    },
  },
  
  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: 'hsl(var(--b1))', // base-100
      border: '1px solid hsl(var(--bc) / 0.2)',
      borderRadius: '0.5rem',
      color: 'hsl(var(--bc))',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    labelStyle: {
      color: 'hsl(var(--p))', // primary
      fontWeight: 'bold',
    },
  },
  
  // Chart colors - using DaisyUI theme colors
  colors: {
    primary: '#3b82f6', // Blue - for main data
    success: '#10b981', // Green - for positive/delivered data
    error: '#ef4444', // Red - for errors/failed data
    warning: '#f59e0b', // Orange - for warnings
    secondary: '#8b5cf6', // Purple - for secondary data
    info: '#06b6d4', // Cyan - for informational data
  },
};

/**
 * Format hour to HH:00 format
 */
export const formatHour = (hour: number): string => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

/**
 * Format date to pt-BR short format (DD/MM)
 */
export const formatDateShort = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

/**
 * Format month to pt-BR format (mmm yyyy)
 */
export const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};

/**
 * Format currency to BRL
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};
