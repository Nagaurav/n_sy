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
    } else if (error.request) {
      console.error('API Request Error:', error.request);
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
    return {
      success: false,
      error:
        error.response.data?.message ||
        error.response.data?.error ||
        'Something went wrong',
    };
  }
  if (error?.request) {
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
    };
  }
  return {
    success: false,
    error: error?.message || 'An unexpected error occurred.',
  };
};

// Generic HTTP methods
export const apiClient = {
  get: async <T = any>(
    endpoint: string,
    config?: any,
  ): Promise<ApiResult<T>> => {
    try {
      const response = await api.get<T>(endpoint, config);
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
      const response = await api.post<T>(endpoint, data, config);
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
      const response = await api.put<T>(endpoint, data, config);
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
      const response = await api.delete<T>(endpoint, config);
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
