import { DashboardMetrics, MessageChartData, InstanceStatusData, CostData, UserActivityData, ActivityLog, DashboardFilters } from '../types/dashboard';

class DashboardService {
  private baseUrl = '/api/dashboard';

  async getMetrics(token: string, filters?: Partial<DashboardFilters>): Promise<DashboardMetrics> {
    const params = new URLSearchParams();

    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    if (filters?.instanceId) {
      params.append('instanceId', filters.instanceId);
    }

    const response = await fetch(`${this.baseUrl}/metrics?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard metrics');
    }

    return response.json();
  }

  async getMessageChart(token: string, filters?: Partial<DashboardFilters>): Promise<MessageChartData[]> {
    const params = new URLSearchParams();

    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    if (filters?.instanceId) {
      params.append('instanceId', filters.instanceId);
    }

    const response = await fetch(`${this.baseUrl}/messages/chart?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch message chart data');
    }

    return response.json();
  }

  async getInstanceStatus(): Promise<InstanceStatusData[]> {
    const response = await fetch(`${this.baseUrl}/instances/status`);
    if (!response.ok) {
      throw new Error('Failed to fetch instance status data');
    }

    return response.json();
  }

  async getCostData(filters?: Partial<DashboardFilters>): Promise<CostData[]> {
    const params = new URLSearchParams();

    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    const response = await fetch(`${this.baseUrl}/costs?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch cost data');
    }

    return response.json();
  }

  async getUserActivity(filters?: Partial<DashboardFilters>): Promise<UserActivityData[]> {
    const params = new URLSearchParams();

    if (filters?.dateRange) {
      params.append('startDate', filters.dateRange.start.toISOString());
      params.append('endDate', filters.dateRange.end.toISOString());
    }

    const response = await fetch(`${this.baseUrl}/users/activity?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user activity data');
    }

    return response.json();
  }

  async getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
    const response = await fetch(`${this.baseUrl}/activity?limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch activity log');
    }

    return response.json();
  }

  // Admin functions
  async getAllUsers() {
    const response = await fetch('/api/admin/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    return response.json();
  }

  async updateUser(userId: string, data: any) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    return response.json();
  }

  async deleteUser(userId: string) {
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    return response.json();
  }
}

export const dashboardService = new DashboardService();