// Dashboard Types
export interface DashboardMetrics {
  totalMessages: number;
  activeInstances: number;
  totalUsers: number;
  deliveryRate: number;
  storageUsed: number;
  costs: {
    evolutionApi: number;
    storage: number;
    total: number;
  };
}

export interface MessageChartData {
  date: string;
  messages: number;
  delivered: number;
  failed: number;
}

export interface InstanceStatusData {
  status: 'online' | 'offline' | 'connecting';
  count: number;
  percentage: number;
}

export interface CostData {
  month: string;
  evolutionApi: number;
  storage: number;
  total: number;
}

export interface UserActivityData {
  date: string;
  activeUsers: number;
  newUsers: number;
}

export interface DashboardFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  instanceId?: string;
  userId?: string;
}

export interface ActivityLog {
  id: string;
  type: 'message' | 'instance' | 'user' | 'system';
  description: string;
  timestamp: Date;
  userId?: string;
  instanceId?: string;
  metadata?: Record<string, any>;
}