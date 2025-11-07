// src/services/authService.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

// Base API URL - using the actual working API
const API_BASE_URL = 'http://88.222.241.179:7000/api/v1';

interface SignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface SendOTPRequest {
  phone: string;
}

interface OTPResponse {
  success: boolean;
  message: string;
  userExists?: boolean;
  data?: { otp?: string };
}

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    refreshToken?: string;
  };
  token?: string;
  refreshToken?: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface AuthConfig {
  baseURL: string;
  endpoints: {
    AUTH: {
      SEND_OTP: string;
      VERIFY_OTP: string;
      SIGNUP: string;
      LOGOUT: string;
      REFRESH_TOKEN: string;
      USER: string;
    };
  };
  DEFAULT_HEADERS: Record<string, string>;
}

const API_CONFIG: AuthConfig = {
  baseURL: API_BASE_URL,
  endpoints: {
    AUTH: {
      SEND_OTP: '/auth/send-otp',
      VERIFY_OTP: '/auth/verify-otp',
      SIGNUP: '/auth/signup',
      LOGOUT: '/auth/logout',
      REFRESH_TOKEN: '/auth/refresh-token',
      USER: '/auth/user',
    },
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
  },
};

const getEndpointUrl = (path: string): string => `${API_CONFIG.baseURL}${path}`;

export class AuthService {
  private async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('token');
  }

  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    body?: object,
  ): Promise<T> {
    try {
      const token = await this.getToken();

      const response = await fetch(getEndpointUrl(endpoint), {
        method,
        headers: {
          ...API_CONFIG.DEFAULT_HEADERS,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Request failed: ${response.status} - ${errorText}`);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      console.error('AuthService request error:', error);
      throw error instanceof Error ? error : new Error('Unknown network error');
    }
  }

  async signup(payload: SignupRequest): Promise<AuthResponse> {
    return this.makeRequest<AuthResponse>(
      API_CONFIG.endpoints.AUTH.SIGNUP,
      'POST',
      payload,
    );
  }

  async sendOTP(payload: SendOTPRequest): Promise<OTPResponse> {
    return this.makeRequest<OTPResponse>(
      API_CONFIG.endpoints.AUTH.SEND_OTP,
      'POST',
      payload,
    );
  }

  async verifyOTP(payload: { phone: string; otp: string }): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>(
      API_CONFIG.endpoints.AUTH.VERIFY_OTP,
      'POST',
      payload,
    );
    
    // Store token if verification is successful
    if (response.success && response.data?.token) {
      await AsyncStorage.setItem('token', response.data.token);
      if (response.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.makeRequest(API_CONFIG.endpoints.AUTH.LOGOUT, 'POST');
    } finally {
      await AsyncStorage.multiRemove(['token', 'refreshToken']);
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) throw new Error('No refresh token found');

    const response = await this.makeRequest<AuthResponse>(
      API_CONFIG.endpoints.AUTH.REFRESH_TOKEN,
      'POST',
      { refreshToken },
    );

    if (response.data?.token) {
      await AsyncStorage.setItem('token', response.data.token);
    } else if (response.token) {
      await AsyncStorage.setItem('token', response.token);
    }
    
    if (response.data?.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    } else if (response.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.refreshToken);
    }

    return response;
  }

  async getCurrentUser(): Promise<UserProfile> {
    return this.makeRequest<UserProfile>(
      API_CONFIG.endpoints.AUTH.USER,
      'GET',
    );
  }

  async testOTPFormats(): Promise<
    Array<{
      format: string;
      status?: number;
      data?: string;
      success: boolean;
      error?: string;
    }>
  > {
    const testPhone = '9876543210';
    const testOTP = '123456';

    const formats = [
      { name: 'otp_code only', body: { phone: testPhone, otp_code: testOTP } },
      { name: 'otp only', body: { phone: testPhone, otp: testOTP } },
      { name: 'both fields', body: { phone: testPhone, otp: testOTP, otp_code: testOTP } },
    ];

    const results = [];

    for (const format of formats) {
      try {
        const response = await fetch(getEndpointUrl(API_CONFIG.endpoints.AUTH.VERIFY_OTP), {
          method: 'POST',
          headers: API_CONFIG.DEFAULT_HEADERS,
          body: JSON.stringify(format.body),
        });

        const data = await response.text();

        results.push({
          format: format.name,
          status: response.status,
          data,
          success: response.ok,
        });
      } catch (error: unknown) {
        results.push({
          format: format.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}

export const authService = new AuthService();
