import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import { API_CONFIG } from '../config/api';
import { getAuthToken } from '../utils/auth';

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Extend InternalAxiosRequestConfig to ensure compatibility with axios interceptors
interface ApiRequestConfig extends Omit<AxiosRequestConfig, 'headers'> {
  retryCount?: number;
  cancelTokenSource?: CancelTokenSource;
  _retry?: boolean;
  headers?: Record<string, string>;
}

// Create axios instance with base config
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    ...API_CONFIG.DEFAULT_HEADERS,
  },
  withCredentials: true, // Important for cookies, authorization headers with HTTPS
});

// Flag to prevent multiple token refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback);
};

// Request interceptor for API calls
apiClient.interceptors.request.use(
  async (config) => {
    const typedConfig = config as ApiRequestConfig;
    // Add request start time for logging
    (typedConfig as any).metadata = { startTime: new Date() };
    
    // Ensure headers exist
    typedConfig.headers = typedConfig.headers || {};
    
    // Add auth token if available
    const token = await getAuthToken();
    if (token) {
      typedConfig.headers = {
        ...typedConfig.headers,
        Authorization: `Bearer ${token}`
      };
    }
    
    return typedConfig as any; // Cast to any to avoid type issues with axios internals
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
apiClient.interceptors.response.use(
  (response) => {
    // Log successful request duration
    if ((response.config as any).metadata?.startTime) {
      const endTime = new Date();
      const startTime = (response.config as any).metadata.startTime;
      console.debug(`API Request ${response.config.url} took ${endTime.getTime() - startTime.getTime()}ms`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ApiRequestConfig;
    
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      return Promise.reject(new ApiError('Network Error. Please check your connection.', 0, 'NETWORK_ERROR'));
    }

    const { status, data } = error.response;
    const errorMessage = (data as any)?.message || error.message;
    
    // Handle 401 Unauthorized - try to refresh token
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If token is being refreshed, wait for it to complete
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token: string) => {
            // Create new headers object to avoid mutating the original
            const newHeaders = {
              ...originalRequest.headers,
              Authorization: `Bearer ${token}`
            };
            resolve(apiClient({
              ...originalRequest,
              headers: newHeaders
            }));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Create new headers object to avoid mutating the original
          const newHeaders = {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`
          };
          
          onRefreshed(newToken);
          return apiClient({
            ...originalRequest,
            headers: newHeaders
          });
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Redirect to login or handle session expiration
        window.location.href = '/login';
        return Promise.reject(new ApiError('Session expired. Please login again.', 401, 'SESSION_EXPIRED'));
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error statuses
    const apiError = new ApiError(
      errorMessage,
      status,
      (data as any)?.code || 'API_ERROR',
      data
    );
    
    console.error(`API Error [${status}]:`, apiError.message, data);
    return Promise.reject(apiError);
  }
);

// Generic function to make API requests with retry logic
export const makeApiRequest = async <T>(
  url: string,
  method: HttpMethod,
  data?: any,
  config: ApiRequestConfig = {}
): Promise<T> => {
  const { retryCount = 3, ...axiosConfig } = config;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const response = await apiClient.request<T>({
        url,
        method,
        data,
        ...axiosConfig,
      });
      return response.data;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry for these status codes
      const status = (error as ApiError)?.status;
      if (status && [400, 401, 403, 404, 422].includes(status)) {
        break;
      }
      
      // Exponential backoff
      if (attempt < retryCount) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30s delay
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Unknown error occurred');
};

// Helper function for GET requests
export const apiGet = <T>(
  url: string, 
  params?: any, 
  config: Omit<ApiRequestConfig, 'params'> = {}
): Promise<T> => {
  return makeApiRequest<T>(url, 'GET', undefined, { ...config, params });
};

// Helper function for POST requests
export const apiPost = <T>(
  url: string, 
  data?: any, 
  config: ApiRequestConfig = {}
): Promise<T> => {
  return makeApiRequest<T>(url, 'POST', data, config);
};

// Helper function for PUT requests
export const apiPut = <T>(
  url: string, 
  data?: any, 
  config: ApiRequestConfig = {}
): Promise<T> => {
  return makeApiRequest<T>(url, 'PUT', data, config);
};

// Helper function for DELETE requests
export const apiDelete = <T>(
  url: string, 
  config: ApiRequestConfig = {}
): Promise<T> => {
  return makeApiRequest<T>(url, 'DELETE', undefined, config);
};

// Helper function for PATCH requests
export const apiPatch = <T>(
  url: string, 
  data?: any, 
  config: ApiRequestConfig = {}
): Promise<T> => {
  return makeApiRequest<T>(url, 'PATCH', data, config);
};

// Create a cancel token source
export const createCancelToken = (): CancelTokenSource => {
  return axios.CancelToken.source();
};

// Cancel a request
export const cancelRequest = (source: CancelTokenSource, message?: string) => {
  source.cancel(message || 'Request cancelled by the user');
};
