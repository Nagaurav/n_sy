// api.ts - API Configuration
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_CONFIG = {
  // Base URLs for different environments
  BASE_URL: {
    development: 'http://88.222.241.179:7000/api/v1', // Your development API URL
    staging: 'http://88.222.241.179:7000/api/v1', // Your staging API URL
    production: 'http://88.222.241.179:7000/api/v1', // Your production API URL
  },
  
  // Current environment
  ENV: 'development', // Change this to 'staging' or 'production' as needed
  
  // API Timeout
  TIMEOUT: 10000, // 10 seconds
  
  // Headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  } as Record<string, string>,
  
  // Pagination defaults
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
  },
  
  // Endpoints
  ENDPOINTS: {
    // Booking endpoints
    BOOKING: {
      CREATE: '/booking/create',
      CALCULATE_PRICE: '/booking/calculate-price',
      PAYMENT_STATUS: '/booking/payment-status',
      USER_BOOKINGS: '/booking/user',
      PROFESSIONAL_BOOKINGS: '/booking/professional',
      BOOKING_DETAILS: '/booking/details',
      CANCEL_BOOKING: '/booking/cancel',
      PAYMENT_ANALYTICS: '/booking/analytics/payments',
      PHONEPE_WEBHOOK: '/booking/phonepe/webhook',
    },
    
    // Auth endpoints
    AUTH: {
      LOGIN: '/user/login',
      SIGNUP: '/user/auth/signup',
      LOGOUT: '/user/logout',
      REFRESH_TOKEN: '/user/refresh',
      VERIFY_OTP: '/user/otp/verifyotp',
      SEND_OTP: '/user/otp/sendotp',
    },
    
    // Professional endpoints
    PROFESSIONAL: {
      LIST: '/user/professionals',
      DETAILS: '/user/professionals',
      SEARCH: '/user/professionals/search',
      AVAILABLE_SLOTS: '/user/professionals/slots',
      FILTER: '/professional/filter',
    },

    // Professional Slot Management endpoints
    PROFESSIONAL_SLOTS: {
      CREATE: '/professional/slot/create',
      GET_ALL: '/professional/slot/get',
      GET_BY_ID: '/professional/slot/get',
      UPDATE: '/professional/slot/update',
      DELETE: '/professional/slot/delete',
    },
    
    // User endpoints
    USER: {
      PROFILE: '/user/profile',
      UPDATE_PROFILE: '/user/profile',
      HEALTH_RECORDS: '/user/health-records',
      GET_USER_BY_ID: '/user/:id',
      PROFESSIONALS: '/user/professionals',
      PROFESSIONALS_SEARCH: '/user/professionals/search',
      CONSULTATION_BOOKING: '/user/consultation-booking',
      GET_CONSULTATION_BOOKINGS: '/user/consultation-bookings',
      GET_CONSULTATION_BOOKING_DETAILS: '/user/consultation-booking/:booking_id',
      CANCEL_CONSULTATION_BOOKING: '/user/consultation-booking/:booking_id/cancel',
    },

    // Customer Support endpoints
    CUSTOMER_SUPPORT: {
      CREATE: '/user/customer-support/create',
      GET_BY_USER: '/user/customer-support',
    },

    // FAQ endpoints
    FAQ: {
      ADMIN_ADD: '/admin/faq/add',
      PROFESSIONAL_GET: '/professional/faq/get',
      USER_GET: '/user/faq/get',
    },

    // Yoga Classes endpoints
    YOGA_CLASSES: {
      LIST: '/user/yoga-classes',
      DETAILS: '/user/yoga-classes',
      BOOK: '/user/yoga-classes/book',
      MY_CLASSES: '/user/yoga-classes/my-classes',
    },

    // Payment endpoints
    PAYMENT: {
      PROCESS: '/payment/process',
      METHODS: '/payment/methods',
      HISTORY: '/payment/history',
      DETAILS: '/payment/details',
      REFUND: '/payment/refund',
      VALIDATE_METHOD: '/payment/validate-method',
      REMOVE_METHOD: '/payment/methods/:methodId',
    },

                 // Article endpoints (consolidated from Blog + Article)
             ARTICLE: {
               LIST: '/articles',
               DETAIL: '/articles/:id',
             },
  },
};

// Query parameter types for better type safety
export interface YogaClassesQueryParams {
  page?: number;
  limit?: number;
  city?: string;
  group_online?: boolean;
  group_offline?: boolean;
  one_to_one_online?: boolean;
  one_to_one_offline?: boolean;
  home_visit?: boolean;
  min_price?: number;
  max_price?: number;
  disease?: string;
  is_disease_specific?: boolean;
  gender_focus?: 'all' | 'male' | 'female';
  duration?: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR';
  sort_by?: 'price_low_to_high' | 'price_high_to_low' | 'near_to_far' | 'far_to_near';
  latitude?: number;
  longitude?: number;
  allow_mid_month_entry?: boolean;
  languages?: string;
}

export interface ProfessionalsQueryParams {
  page?: number;
  limit?: number;
  category?: string;
  expertise?: string;
  city?: string;
  online?: boolean;
  in_person?: boolean;
  home_visit?: boolean;
  min_rating?: number;
  sort_by?: 'rating' | 'experience' | 'price_low_to_high' | 'price_high_to_low';
}

export interface ProfessionalFilterQueryParams {
  page?: number;
  limit?: number;
  is_online: boolean; // Required parameter for API
  duration?: number;
  category?: string;
  expertise?: string;
  city?: string;
  min_rating?: number;
  max_price?: number;
  min_price?: number;
  gender?: 'all' | 'male' | 'female';
  languages?: string;
  sort_by?: 'rating' | 'experience' | 'price_low_to_high' | 'price_high_to_low' | 'distance';
  latitude?: number;
  longitude?: number;
  availability?: 'available_now' | 'available_today' | 'available_this_week';
  service_type?: 'consultation' | 'therapy' | 'class' | 'workshop';
}

export interface ProfessionalSlotsQueryParams {
  page?: number;
  limit?: number;
  professional_id?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  is_available?: boolean;
  slot_type?: 'online' | 'offline' | 'home_visit';
  time_slot?: string;
}

export interface CustomerSupportQueryParams {
  page?: number;
  limit?: number;
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'technical' | 'billing' | 'booking' | 'general' | 'complaint' | 'feedback';
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status';
}

export interface FAQQueryParams {
  page?: number;
  limit?: number;
  category?: 'general' | 'booking' | 'payment' | 'technical' | 'professional' | 'yoga' | 'wellness';
  search?: string;
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'category';
  is_active?: boolean;
  is_featured?: boolean;
}

// PhonePe payment response types
export interface PhonePeStatusResponse {
  success: boolean;
  data?: {
    status: string;
    message: string;
    transactionId?: string;
  };
  message?: string;
}

export interface PhonePeVerifyResponse {
  success: boolean;
  data?: {
    verified: boolean;
    message: string;
  };
  message?: string;
}

// FAQ response type
export interface FAQResponse {
  success: boolean;
  data?: Array<{
    id: string;
    question: string;
    answer: string;
    category: string;
    is_active: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
  }>;
  message?: string;
}

// Helper function to get current base URL
export const getBaseUrl = (): string => {
  return API_CONFIG.BASE_URL[API_CONFIG.ENV as keyof typeof API_CONFIG.BASE_URL];
};

// Helper function to get full endpoint URL
export const getEndpointUrl = (endpoint: string): string => {
  return `${getBaseUrl()}${endpoint}`;
};

// Helper function to build query string from parameters
export const buildQueryString = (params: Record<string, any>): string => {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      // Convert booleans to strings for backend compatibility
      if (typeof value === 'boolean') {
        queryParams.append(key, value.toString());
      } else {
        queryParams.append(key, value.toString());
      }
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Helper function to get auth token
export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to set auth token
export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

// Helper function to remove auth token
export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

// Enhanced API request function with better error handling
export const makeApiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'GET',
  body?: any,
  queryParams?: Record<string, any>,
  headers?: Record<string, string>
): Promise<any> => {
  try {
    let url = getEndpointUrl(endpoint);
    
    // Add query parameters if provided
    if (queryParams && Object.keys(queryParams).length > 0) {
      url += buildQueryString(queryParams);
    }
    
    const requestHeaders = {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...headers,
    };

    // Add auth token if available (except for auth endpoints)
    if (!endpoint.includes('/otp/') && !endpoint.includes('/login') && !endpoint.includes('/signup')) {
      const token = await getAuthToken();
      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }
    }

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    console.log(`API Request: ${method} ${url}`, { body, queryParams });

    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`API Response: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API Request Error:', error);
    
    // Handle specific error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }
    
    if (error.message.includes('Network request failed')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}; 