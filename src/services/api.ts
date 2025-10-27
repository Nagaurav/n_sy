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
import { YogaClass, YogaClassesFilters, PaginationInfo } from '../types/yogaClasses';
import {
  CreateBookingRequest,
  UpdateBookingRequest,
  BookingResponse,
  AppointmentsResponse,
  ProfessionalsResponse,
  SlotsResponse,
  Professional,
  TimeSlot,
  ProfessionalFilters
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

  // --- NEW GENERIC GET METHOD ---
  public async get<T = any>(endpoint: string, config?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, config);
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

  // User Related APIs (Auth required)
  public async getUserProfile(userId: string): Promise<ApiResponse<{ user: User }>> {
    return this.get<{ user: User }>(`/user/${userId}`);
  }

  public async updateUserProfile(
    userId: string,
    userData: Partial<User>,
  ): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>(`/user/${userId}`, 'PUT', userData);
  }

  // Consultation Booking & Payment APIs (Auth required)
  public async getUserAppointments(userId: string): Promise<ApiResponse<AppointmentsResponse>> {
    return this.get<AppointmentsResponse>(`/user/consultation-booking/user/${userId}`);
  }

  public async createConsultationBooking(bookingData: CreateBookingRequest): Promise<ApiResponse<BookingResponse>> {
    return this.request<BookingResponse>('/user/consultation-booking/create', 'POST', bookingData);
  }
  
  public async getPaymentStatus(bookingId: string): Promise<ApiResponse<any>> {
    return this.get<any>(`/user/consultation-booking/payment-status/${bookingId}`);
  }

  public async getConsultationBookingById(bookingId: string): Promise<ApiResponse<BookingResponse>> {
    return this.get<BookingResponse>(`/user/consultation-booking/details/${bookingId}`);
  }

  public async cancelConsultationBooking(bookingId: string): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(`/user/consultation-booking/cancel/${bookingId}`, 'PUT');
  }

  // Professional APIs (Auth required)
  public async getAllProfessionals(): Promise<ApiResponse<ProfessionalsResponse>> {
    return this.get<ProfessionalsResponse>('/user/professional/all');
  }

  public async getProfessionalById(professionalId: string): Promise<ApiResponse<{ professional: Professional }>> {
    return this.get<{ professional: Professional }>(`/user/professional/${professionalId}`);
  }

  public async searchProfessionalsWithFilters(filters: ProfessionalFilters): Promise<ApiResponse<ProfessionalsResponse>> {
    const queryParams = new URLSearchParams();
    
    // Map filter parameters to match the API expected format
    const apiFilters = {
      city: filters.city,
      state: filters.state,
      gender: filters.gender,
      language: filters.language,
      role: filters.role,
      speciality_id: filters.speciality_id,
      min_price: filters.min_price,
      max_price: filters.max_price,
      page: filters.page || 1,
      limit: filters.limit || 10,
      search_query: filters.search_query,
      is_online: filters.is_online,
      sort_by: filters.sort_by
    };

    // Add non-empty filter parameters to the query
    Object.entries(apiFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Convert boolean values to strings
        const paramValue = typeof value === 'boolean' ? String(value) : String(value);
        queryParams.append(key, paramValue);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/user/professional/getProfessional${queryString ? `?${queryString}` : ''}`;
    
    return this.get<ProfessionalsResponse>(endpoint);
  }

  // Slot APIs (Auth required)
  public async getAvailableSlots(professionalId: string, date?: string): Promise<ApiResponse<SlotsResponse>> {
    // Use the correct endpoint: /professional/slot/get/:id
    return this.get<SlotsResponse>(`/professional/slot/get/${professionalId}`);
  }

  // Categories API (Auth required)
  public async getWellnessCategories(): Promise<ApiResponse<{ categories: any[] }>> {
    return this.get<{ categories: any[] }>('/categories');
  }

  // Next Appointment API (Auth required)
  public async getNextAppointment(userId: string): Promise<ApiResponse<{ appointment: any }>> {
    return this.get<{ appointment: any }>(`/user/consultation-booking/next/${userId}`);
  }

  // Customer Support APIs (Auth required)
  public async submitSupportTicket(userId: string, subject: string, message: string): Promise<ApiResponse<any>> {
    const payload = { 
      user_id: parseInt(userId, 10), 
      subject, 
      message 
    };
    return this.request<any>('/user/customer-support/create', 'POST', payload);
  }

  public async getUserSupportTickets(userId: string): Promise<ApiResponse<{ tickets: any[] }>> {
    return this.get<{ tickets: any[] }>(`/user/customer-support/${userId}`);
  }

  // FAQ API (Auth required)
  public async getFaqs(): Promise<ApiResponse<{ data: any[] }>> {
    return this.get<{ data: any[] }>('/user/faq/get');
  }

  // Yoga Classes API (Auth required)
  public async getYogaClasses(filters: YogaClassesFilters = {}): Promise<ApiResponse<{
    data: YogaClass[];
    pagination: PaginationInfo;
  }>> {
    return this.get<{
      data: YogaClass[];
      pagination: PaginationInfo;
    }>('/user/yoga-classes', { params: filters });
  }
}

export const apiService = ApiService.getInstance();