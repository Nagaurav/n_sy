import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { YogaClass } from '../types/yogaClasses';
import { Professional, ProfessionalAuthProfile } from '../types/professional';
import { YogaPlanResponse } from '../types/yogaPlan';
import { TimeSlot } from '../types/booking';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://88.222.241.179:7000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30000, // 30 seconds
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Get yoga classes with filters
  getYogaClasses: async (filters = {}) => {
    try {
      const response = await api.get('/user/yoga-classes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching yoga classes:', error);
      throw error;
    }
  },

  // Get class details by ID
  getClassById: async (id: string | number): Promise<YogaClass> => {
    try {
      const response = await api.get<{ data: YogaClass }>(`/user/yoga-classes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching class with ID ${id}:`, error);
      throw error;
    }
  },

  // Get professional profile by ID
  getProfessionalProfile: async (id: string | number): Promise<Professional> => {
    try {
      console.log(`🔍 Fetching professional with ID: ${id}`);
      const response = await api.get<{ data: Professional }>(`/professional/auth/getProfessional/${id}`);
      console.log('✅ Professional data received:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error(`❌ Error fetching professional with ID ${id}:`, {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
      });
      
      // Provide a more user-friendly error message
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (!error.response) {
        throw new Error('Cannot connect to the server. Please check your network connection.');
      } else if (error.response.status === 404) {
        throw new Error('Professional not found.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw error;
      }
    }
  },

  // Get professional yoga plan/slots by ID
  getProfessionalSlots: async (id: string | number): Promise<YogaPlanResponse> => {
    try {
      console.log(`🔍 Fetching professional slots for ID: ${id}`);
      const response = await api.get<YogaPlanResponse>(`/professional/slot/get/${id}`);
      console.log('✅ Professional slots received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(`❌ Error fetching professional slots for ID ${id}:`, {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        },
        response: {
          status: error.response?.status,
          data: error.response?.data,
        },
      });
      
      if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
      throw error;
    }
  },

  // Get all available time slots for a professional
  getAllAvailableSlots: async (professionalId: string | number): Promise<TimeSlot[]> => {
    try {
      console.log(`🔍 Fetching available slots for professional ID: ${professionalId}`);
      
      // Call the API endpoint with the correct URL and query parameter
      const response = await api.get<{
        success: boolean;
        message: string;
        total: number;
        pagination: {
          currentPage: number;
          totalPages: number;
          perPage: number;
        };
        slots: Array<{
          id: number;
          date: string;
          start_time: string;
          end_time: string;
          is_online: boolean;
          price_online_15min: number | null;
          price_online_30min: number | null;
          price_online_60min: number | null;
          price_offline_15min: number | null;
          price_offline_30min: number | null;
          price_offline_60min: number | null;
          slot_duration_15min: boolean;
          slot_duration_30min: boolean;
          slot_duration_60min: boolean;
        }>;
      }>('/user/check-slot/checkAvailability', {
        params: {
          professional_id: professionalId
        }
      });
      
      console.log('📦 Raw API response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data?.success === true && Array.isArray(response.data.slots)) {
        const slots = response.data.slots;
        console.log(`✅ Successfully fetched ${slots.length} slots`);
        
        // Map the API response to our TimeSlot interface
        return slots.map((slot): TimeSlot => ({
          id: slot.id,
          date: slot.date,
          start_time: slot.start_time,
          end_time: slot.end_time,
          is_online: slot.is_online,
          // Pricing information
          price_online_15min: slot.price_online_15min,
          price_online_30min: slot.price_online_30min,
          price_online_60min: slot.price_online_60min,
          price_offline_15min: slot.price_offline_15min,
          price_offline_30min: slot.price_offline_30min,
          price_offline_60min: slot.price_offline_60min,
          // Duration flags
          slot_duration_15min: slot.slot_duration_15min,
          slot_duration_30min: slot.slot_duration_30min,
          slot_duration_60min: slot.slot_duration_60min,
          // Legacy fields
          is_available: true,
          price: slot.price_online_15min || 0, // Default to first available price
          duration: 15, // Default duration, can be overridden based on selection
          professional_id: professionalId
        }));
      }
      
      console.warn('⚠️ Unexpected response format or no slots found');
      return [];
      
    } catch (error: any) {
      console.error(`❌ Error fetching available slots:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      // Return empty array for any error
      return [];
    }
  },

  // Create a booking and initiate payment
  createBookingAndInitiatePayment: async (params: {
    userId: string | number;
    professionalId: string | number;
    slotId: string | number;
    serviceType?: 'yoga_class' | 'consultation' | 'membership';
    serviceId?: string;
    couponCode?: string;
    duration: number; // in minutes
    metadata?: Record<string, any>;
  }) => {
    try {
      // Prepare the payload according to the API requirements
      const payload: any = {
        user_id: Number(params.userId),
        professional_id: Number(params.professionalId),
        duration: params.duration || 30,
        coupon_code: params.couponCode || undefined,
      };

      // Include slot_id only if it's a valid numeric ID
      const numericSlot = Number(params.slotId);
      if (Number.isFinite(numericSlot)) {
        payload.slot_id = numericSlot;
      }

      console.log('Creating booking with payload:', JSON.stringify(payload, null, 2));
      
      // Use the correct consultation booking endpoint for all bookings (as requested)
      const endpoint = '/user/consultation-booking/create';
      
      console.log(`Using endpoint: ${endpoint} for service type: ${params.serviceType}`);
      const response = await api.post(endpoint, {
        ...payload,
        service_type: params.serviceType || 'yoga_class', // Ensure service_type is included
        service_id: params.serviceId || 'yoga_plan_custom', // Use provided serviceId or default
        duration: params.duration || 30, // Ensure duration is included
      });
      
      if (!response.data) {
        throw new Error('No data received from booking service');
      }
      
      // Handle the API response format
      if (response.data.msg === 'Booking created successfully' && response.data.payment_url) {
        return {
          success: true,
          paymentUrl: response.data.payment_url,
          bookingId: response.data.data.booking_id,
          transactionId: response.data.data.payment_id,
          amount: response.data.data.final_amount,
          ...response.data.data
        };
      }
      
      throw new Error(response.data.msg || 'Failed to create booking and initiate payment');
    } catch (error: any) {
      console.error('Error creating booking:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data
        }
      });
      
      // Extract error message from response if available
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to create booking. Please try again.';
      
      throw new Error(errorMessage);
    }
  },
  
  // Get payment status for a booking
  getBookingPaymentStatus: async (bookingId: string | number) => {
    try {
      const response = await api.get(`/user/consultation-booking/payment-status/${bookingId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting booking payment status:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      throw new Error(error.response?.data?.message || 'Failed to get booking payment status');
    }
  },

  getPaymentStatus: async (paymentId: string) => {
    try {
      const response = await api.get(`/payments/status/${paymentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting payment status:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
        }
      });
      throw new Error(error.response?.data?.message || 'Failed to get payment status');
    }
  },

  verifyPayment: async (paymentId: string) => {
    try {
      const response = await api.post(`/payments/verify/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  }

};

export default apiService;
