import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://88.222.241.179:7000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface OTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  isRegistered?: boolean;
}

interface SignupResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
}

class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  private authToken: string | null = null;

  private constructor() {
    this.baseUrl = API_BASE_URL || 'http://88.222.241.179:7000/api/v1';
    this.loadToken();
  }

  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem('@Auth:token');
      if (token) {
        this.setAuthToken(token);
      }
    } catch (error) {
      console.error('Failed to load auth token', error);
    }
  }

  public setAuthToken(token: string | null) {
    this.authToken = token;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers: Record<string, string> = {},
    requiresAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth header if required and token exists
    if (requiresAuth && this.authToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Something went wrong',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
      };
    }
  }

  // OTP Related APIs
  public async sendOTP(phoneNumber: string): Promise<ApiResponse<OTPResponse>> {
    return this.request<OTPResponse>('/user/otp/sendotp', 'POST', { phone: phoneNumber });
  }

  public async verifyOTP(phoneNumber: string, code: string): Promise<ApiResponse<OTPResponse>> {
    return this.request<OTPResponse>('/otp/verifyotp', 'POST', {
      phone: phoneNumber,
      code: parseInt(code, 10),
    });
  }

  // Auth Related APIs
  public async signup(userData: {
    phone: string;
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<ApiResponse<SignupResponse>> {
    return this.request<SignupResponse>('/auth/signup', 'POST', userData);
  }

  // User Related APIs
  public async getUserProfile(userId: string): Promise<ApiResponse<{ user: any }>> {
    return this.request<{ user: any }>(`/user/${userId}`, 'GET');
  }

  public async updateUserProfile(
    userId: string,
    userData: Partial<{
      firstName: string;
      lastName: string;
      email: string;
      // Add other updatable user fields here
    }>,
  ): Promise<ApiResponse<{ user: any }>> {
    return this.request<{ user: any }>(`/user/${userId}`, 'PUT', userData);
  }

  // Appointment Related APIs
  public async getUserAppointments(userId: string): Promise<ApiResponse<{ appointments: any[] }>> {
    return this.request<{ appointments: any[] }>(`/user/consultation-booking/user/${userId}`, 'GET');
  }

  public async bookAppointment(
    userId: string,
    appointmentData: {
      // Define your appointment data structure here
      date: string;
      time: string;
      serviceId: string;
      // Add other required fields
    },
  ): Promise<ApiResponse<{ appointment: any }>> {
    return this.request<{ appointment: any }>(
      '/appointments',
      'POST',
      { ...appointmentData, userId },
    );
  }

  // Add more user-specific API methods as needed
}

export const apiService = ApiService.getInstance();
