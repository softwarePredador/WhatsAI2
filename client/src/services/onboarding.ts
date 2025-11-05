import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface OnboardingStatus {
  onboardingCompleted: boolean;
  onboardingStep: number;
}

export interface OnboardingResponse {
  success: boolean;
  message?: string;
  data?: OnboardingStatus;
  error?: string;
}

class OnboardingService {
  /**
   * Get current onboarding status
   */
  async getStatus(): Promise<OnboardingStatus> {
    const token = localStorage.getItem('token');
    const response = await axios.get<OnboardingResponse>(
      `${API_URL}/api/onboarding/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get onboarding status');
    }

    return response.data.data;
  }

  /**
   * Update onboarding step
   */
  async updateStep(step: number): Promise<OnboardingStatus> {
    const token = localStorage.getItem('token');
    const response = await axios.put<OnboardingResponse>(
      `${API_URL}/api/onboarding/step`,
      { step },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to update onboarding step');
    }

    return response.data.data;
  }

  /**
   * Mark onboarding as completed
   */
  async complete(): Promise<OnboardingStatus> {
    const token = localStorage.getItem('token');
    const response = await axios.post<OnboardingResponse>(
      `${API_URL}/api/onboarding/complete`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to complete onboarding');
    }

    return response.data.data;
  }

  /**
   * Skip onboarding
   */
  async skip(): Promise<OnboardingStatus> {
    const token = localStorage.getItem('token');
    const response = await axios.post<OnboardingResponse>(
      `${API_URL}/api/onboarding/skip`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to skip onboarding');
    }

    return response.data.data;
  }
}

export const onboardingService = new OnboardingService();
