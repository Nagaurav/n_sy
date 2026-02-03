import { apiClient, ApiResult } from './apiClient';

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface SignupData {
  phone: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: any;
  };
  message?: string;
}

export const authService = {
  // User login
  login: async (credentials: LoginCredentials): Promise<ApiResult<{ token: string; user: any }>> => {
    const response = await apiClient.post<AuthResponse>('/user/auth/login', credentials);
    
    if (response.success && response.data?.success && response.data.data?.token && response.data.data?.user) {
      return {
        success: true,
        data: {
          token: response.data.data.token,
          user: response.data.data.user,
        },
      };
    }

    return {
      success: false,
      error: response.data?.message || 'Login failed. Please try again.',
    };
  },

  // User signup
  signup: async (payload: SignupData): Promise<ApiResult<{ token: string; user: any }>> => {
    const response = await apiClient.post<AuthResponse>('/user/auth/signup', payload);
    const data = response.data;

    if (data?.success && data.data?.token && data.data?.user) {
      return {
        success: true,
        data: {
          token: data.data.token,
          user: data.data.user,
        },
      };
    }

    return {
      success: false,
      error: data?.message || 'Signup failed. Please try again.',
    };
  },

  // Send OTP
  sendOTP: async (phoneNumber: string): Promise<ApiResult<any>> => {
    return apiClient.post('/user/otp/sendotp', { phone: phoneNumber });
  },

  // Verify OTP
  verifyOTP: async (phoneNumber: string, code: string | number): Promise<ApiResult<any>> => {
    const payload = {
      phone: phoneNumber,
      code: typeof code === 'string' ? parseInt(code, 10) : code,
    };
    return apiClient.post('/user/otp/verifyotp', payload);
  },

  // Get current user profile
  getCurrentUser: async (userId: string): Promise<ApiResult<any>> => {
    return apiClient.get(`/user/profile/${userId}`);
  },

  // Update user profile
  updateProfile: async (userId: string, profileData: any): Promise<ApiResult<any>> => {
    return apiClient.post(`/user/profile/update/${userId}`, profileData);
  },
};
