import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config';
import { store } from '../store';
import { signOutAsync } from '../store/authSlice';

// Central Axios instance with interceptors
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || 'https://samya-be.oetech.co/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// --- REQUEST INTERCEPTOR: Dynamically inject token from Redux store ---
api.interceptors.request.use(
  async (config) => {
    // Get token directly from Redux store
    // Redux persistence should ensure token is available after rehydration
    const state = store.getState();
    const token = state.auth?.token;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- RESPONSE INTERCEPTOR: Handle auth errors (401/403) and logout ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Handle both 401 (Unauthorized) and 403 (Forbidden) with 'Invalid token' message
      const isAuthError = error.response.status === 401 || 
                         (error.response.status === 403 && 
                          error.response.data?.message?.includes('Invalid token'));
      
      // Handle authentication errors (401 Unauthorized only)
      if (isAuthError) {
        // Check if this is not an auth-related endpoint (login, signup, OTP, etc.)
        const isAuthEndpoint = originalRequest?.url?.includes('/auth/') ||
                              originalRequest?.url?.includes('/otp/') ||
                              originalRequest?.url?.includes('/signup');
        
        if (!isAuthEndpoint) {
          console.log('🔒 Authentication Failed/Expired (401): Logging out...');
          
          // Dispatch logout action to clear Redux state and AsyncStorage
          // This will automatically clear the token from Redux, which the interceptor reads
          try {
            await store.dispatch(signOutAsync() as any);
            console.log('✅ User logged out successfully');
          } catch (logoutError) {
            console.error('❌ Error during logout:', logoutError);
          }
          
          // Return a user-friendly error
          return Promise.reject(new Error('Session Expired. Please log in again.'));
        }
      }
      
      // Handle 403 Forbidden separately (permission denied, not auth failure)
      if (error.response.status === 403) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'Access denied. You do not have permission to access this resource.';
        console.warn('⚠️ 403 Forbidden (not logging out):', errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      // Handle 409 Conflict (duplicate booking, slot already taken, etc.)
      if (error.response.status === 409) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'This slot is already booked or no longer available. Please choose a different time.';
        console.warn('⚠️ 409 Conflict:', errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
      
      // Handle 400 Bad Request
      if (error.response.status === 400) {
        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           'Invalid request. Please check your booking details and try again.';
        console.warn('⚠️ 400 Bad Request:', errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
    } else if (error.request) {
      // Handle network errors (status 0)
      if (error.request?.readyState === 4 && error.request?.status === 0) {
        console.error('🌐 Network Error: Unable to reach server. Check your internet connection.');
        return Promise.reject(new Error('Network error: Unable to connect to server. Please check your internet connection and try again.'));
      } else {
        console.error('API Request Error:', error.request);
      }
    } else {
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  },
);

// Generic API result type
export type ApiResult<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Generic error handler
export const buildApiErrorResponse = <T = any>(error: any): ApiResult<T> => {
  if (error?.response) {
    const status = error.response.status;
    
    // Handle server errors (502, 503, 504) with specific messages
    if (status === 502) {
      return {
        success: false,
        error: 'Server is temporarily unavailable. Please try again in a few moments.',
      };
    }
    if (status === 503) {
      return {
        success: false,
        error: 'Server is under maintenance. Please try again later.',
      };
    }
    if (status === 504) {
      return {
        success: false,
        error: 'Request timed out. Please check your connection and try again.',
      };
    }
    
    // Handle other HTTP errors
    return {
      success: false,
      error:
        error.response.data?.message ||
        error.response.data?.error ||
        `Server error (${status}). Please try again.`,
    };
  }
  if (error?.request) {
    // Better handling for network errors
    if (error?.request?.readyState === 4 && error?.request?.status === 0) {
      return {
        success: false,
        error: 'Unable to connect to server. Please check your internet connection and try again.',
      };
    }
    return {
      success: false,
      error: 'Network error. Please check your internet connection and try again.',
    };
  }
  return {
    success: false,
    error: error?.message || 'An unexpected error occurred.',
  };
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second base delay
  retryableErrors: [502, 503, 504, 'ECONNABORTED', 'NETWORK_ERROR', 0], // Added status 0 for network errors
};

// Retry helper function with exponential backoff
const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  retries: number = 0
): Promise<T> => {
  try {
    return await requestFn();
  } catch (error: any) {
    const status = error?.response?.status;
    const isRetryable = RETRY_CONFIG.retryableErrors.includes(status) || 
                       RETRY_CONFIG.retryableErrors.includes(error?.code) ||
                       error?.message?.includes('Network Error') ||
                       error?.message?.includes('Unable to connect') ||
                       (error?.request?.readyState === 4 && error?.request?.status === 0);

    if (isRetryable && retries < RETRY_CONFIG.maxRetries) {
      const delay = RETRY_CONFIG.retryDelay * Math.pow(2, retries); // Exponential backoff
      console.log(`🔄 Retrying request in ${delay}ms (attempt ${retries + 1}/${RETRY_CONFIG.maxRetries}) - Status: ${status || 'Network Error'}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(requestFn, retries + 1);
    }
    
    throw error;
  }
};

// Generic HTTP methods
export const apiClient = {
  get: async <T = any>(
    endpoint: string,
    config?: any,
  ): Promise<ApiResult<T>> => {
    try {
      const response = await retryRequest(async () => api.get<T>(endpoint, config));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error in GET request:', error);
      return buildApiErrorResponse(error);
    }
  },

  post: async <T = any>(
    endpoint: string,
    data?: any,
    config?: any,
  ): Promise<ApiResult<T>> => {
    try {
      const response = await retryRequest(async () => api.post<T>(endpoint, data, config));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error in POST request:', error);
      return buildApiErrorResponse(error);
    }
  },

  put: async <T = any>(
    endpoint: string,
    data?: any,
    config?: any,
  ): Promise<ApiResult<T>> => {
    try {
      const response = await retryRequest(async () => api.put<T>(endpoint, data, config));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error in PUT request:', error);
      return buildApiErrorResponse(error);
    }
  },

  delete: async <T = any>(
    endpoint: string,
    config?: any,
  ): Promise<ApiResult<T>> => {
    try {
      const response = await retryRequest(async () => api.delete<T>(endpoint, config));
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Error in DELETE request:', error);
      return buildApiErrorResponse(error);
    }
  },
};

export default api;
