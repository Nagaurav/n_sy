// apiHelpers.ts
// Utility functions for API calls
import { makeApiRequest, API_CONFIG } from '../config/api';

// Profile API service
export const profileApi = {
  // Get user profile
  async getProfile(): Promise<any> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE, 'GET');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }
  },

  // Update user profile
  async updateProfile(profileData: any): Promise<any> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.UPDATE_PROFILE, 'PUT', profileData);
      return response.data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }
  },

  // Get user by ID (public endpoint - no auth required)
  async getUserById(userId: string): Promise<any> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.GET_USER_BY_ID.replace(':id', userId),
        'GET'
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
  },

  // Get user payment methods
  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.PAYMENT.METHODS, 'GET');
      return response.data || [];
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  },

  // Remove user payment method
  async removePaymentMethod(methodId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PAYMENT.REMOVE_METHOD.replace(':methodId', methodId),
        'DELETE'
      );
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error removing payment method:', error);
      throw new Error(`Failed to remove payment method: ${error.message}`);
    }
  }
};

// Generic API helper with error handling
export const apiHelper = {
  // Make API request with error handling
  async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any): Promise<any> {
    try {
      return await makeApiRequest(endpoint, method, data);
    } catch (error: any) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  },

  // Handle API errors consistently
  handleError(error: any, context: string): string {
    if (error.message?.includes('Network')) {
      return 'Network error. Please check your internet connection.';
    }
    if (error.message?.includes('401')) {
      return 'Authentication failed. Please login again.';
    }
    if (error.message?.includes('403')) {
      return 'Access denied. You do not have permission for this action.';
    }
    if (error.message?.includes('404')) {
      return 'Resource not found.';
    }
    if (error.message?.includes('500')) {
      return 'Server error. Please try again later.';
    }
    return error.message || `Error in ${context}`;
  }
};
