import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  ApiResponse, 
  OTPResponse, 
  SignupResponse, 
  SignupData,
  User 
} from '../types/auth';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingResponse,
  AppointmentsResponse,
  ProfessionalsResponse,
  SlotsResponse,
  Professional,
  TimeSlot
} from '../types/booking';

const API_BASE_URL = 'http://88.222.241.179:7000/api/v1';

class ApiService {
  private static instance: ApiService;
  private axiosInstance: AxiosInstance;
  private authToken: string | null = null;

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadToken();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        if (this.authToken && config.headers) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling common errors
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - trigger logout
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  private async handleUnauthorized() {
    // Clear stored auth data
    this.authToken = null;
    try {
      await AsyncStorage.multiRemove(['@Auth:user', '@Auth:token']);
      // You can dispatch a logout action here if you have access to the store
      console.log('User session expired. Please login again.');
    } catch (error) {
      console.error('Failed to clear auth data', error);
    }
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

  public getAuthToken(): string | null {
    return this.authToken;
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
    additionalHeaders: Record<string, string> = {},
    requiresAuth: boolean = true,
  ): Promise<ApiResponse<T>> {
    try {
      const config: AxiosRequestConfig = {
        method,
        url: endpoint,
        data: body,
        headers: additionalHeaders,
      };

      // For endpoints that don't require auth, temporarily remove the token
      if (!requiresAuth && this.authToken) {
        const tempToken = this.authToken;
        this.authToken = null;
        const response = await this.axiosInstance.request<T>(config);
        this.authToken = tempToken;
        
        return {
          success: true,
          data: response.data,
        };
      }

      const response = await this.axiosInstance.request<T>(config);

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error:', error);
      
      if (error.response) {
        // Server responded with error status
        return {
          success: false,
          error: error.response.data?.message || error.response.data?.error || 'Something went wrong',
        };
      } else if (error.request) {
        // Network error
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      } else {
        // Other error
        return {
          success: false,
          error: error.message || 'An unexpected error occurred.',
        };
      }
    }
  }

  // OTP Related APIs (No auth required)
  public async sendOTP(phoneNumber: string): Promise<ApiResponse<OTPResponse>> {
    return this.request<OTPResponse>('/user/otp/sendotp', 'POST', { phone: phoneNumber }, {}, false);
  }

  public async verifyOTP(phoneNumber: string, code: string): Promise<ApiResponse<OTPResponse>> {
    return this.request<OTPResponse>('/user/otp/verifyotp', 'POST', {
      phone: phoneNumber,
      code: parseInt(code, 10),
    }, {}, false);
  }

  // Auth Related APIs (No auth required)
  public async signup(userData: SignupData): Promise<ApiResponse<SignupResponse>> {
    return this.request<SignupResponse>('/user/auth/signup', 'POST', userData, {}, false);
  }

  // User Related APIs (Auth required - user_id automatically scoped via token)
  public async getUserProfile(userId: string): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/user/${userId}`, 'GET');
  }

  public async updateUserProfile(
    userId: string,
    userData: Partial<User>,
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/user/${userId}`, 'PUT', userData);
  }

  // Consultation Booking APIs (Auth required - user_id scoped)
  public async getUserAppointments(userId: string): Promise<ApiResponse<AppointmentsResponse>> {
    return this.request<AppointmentsResponse>(`/user/consultation-booking/user/${userId}`, 'GET');
  }

  public async createConsultationBooking(bookingData: CreateBookingRequest): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>('/user/consultation-booking/create', 'POST', bookingData);
  }

  public async getConsultationBookingById(bookingId: string): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>(`/user/consultation-booking/${bookingId}`, 'GET');
  }

  public async updateConsultationBooking(
    bookingId: string,
    updateData: UpdateBookingRequest
  ): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>(`/user/consultation-booking/${bookingId}`, 'PUT', updateData);
  }

  public async cancelConsultationBooking(bookingId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/user/consultation-booking/${bookingId}`, 'DELETE');
  }

  // Professional APIs (Auth required)
  public async getAllProfessionals(): Promise<ApiResponse<ProfessionalsResponse>> {
    return this.request<ProfessionalsResponse>('/user/professional/all', 'GET');
  }

  public async getProfessionalById(professionalId: string): Promise<ApiResponse<{ professional: Professional }>> {
    return this.request<{ professional: Professional }>(`/user/professional/${professionalId}`, 'GET');
  }

  // Slot APIs (Auth required)
  public async getAvailableSlots(professionalId: string, date: string): Promise<ApiResponse<SlotsResponse>> {
    return this.request<SlotsResponse>(`/user/slot/professional/${professionalId}/date/${date}`, 'GET');
  }

  // Categories API (Auth required)
  public async getWellnessCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.request<{ categories: any[] }>('/categories', 'GET');
  }

  // Next Appointment API (Auth required)
  public async getNextAppointment(userId: string): Promise<ApiResponse<{ appointment: any }>> {
    return this.request<{ appointment: any }>(`/user/consultation-booking/next/${userId}`, 'GET');
  }

  // Search Professionals API (Auth required)
  public async searchProfessionals(searchQuery: string): Promise<ApiResponse<ProfessionalsResponse>> {
    return this.request<ProfessionalsResponse>(`/user/professional/filter?search_query=${encodeURIComponent(searchQuery)}`, 'GET');
  }

  // Filter Professionals by Category API (Auth required)
  public async getProfessionalsByCategory(categoryId: string): Promise<ApiResponse<ProfessionalsResponse>> {
    return this.request<ProfessionalsResponse>(`/user/professional/category/${categoryId}`, 'GET');
  }

  // Enhanced Search Professionals with Filters API (Auth required)
  public async searchProfessionalsWithFilters(filters: any): Promise<ApiResponse<ProfessionalsResponse>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/user/professional/filter${queryString ? `?${queryString}` : ''}`;
    
    return this.request<ProfessionalsResponse>(endpoint, 'GET');
  }

  // Add more user-specific API methods as needed
}

export const apiService = ApiService.getInstance();
