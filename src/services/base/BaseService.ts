import { makeApiRequest } from '../../config/api';
import { API_CONFIG } from '../../config/api';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class BaseService {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  protected async request<T = any>(
    endpoint: string,
    method: HttpMethod = 'GET',
    data?: any,
    queryParams?: Record<string, any>,
    customHeaders: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await makeApiRequest(
        `${this.basePath}${endpoint}`,
        method,
        data,
        queryParams,
        {
          ...customHeaders,
        }
      );

      return response as ApiResponse<T>;
    } catch (error: any) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  protected async get<T = any>(
    endpoint: string,
    queryParams?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'GET', undefined, queryParams, headers);
  }

  protected async post<T = any>(
    endpoint: string,
    data?: any,
    queryParams?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'POST', data, queryParams, headers);
  }

  protected async put<T = any>(
    endpoint: string,
    data?: any,
    queryParams?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PUT', data, queryParams, headers);
  }

  protected async delete<T = any>(
    endpoint: string,
    queryParams?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'DELETE', undefined, queryParams, headers);
  }

  protected async patch<T = any>(
    endpoint: string,
    data?: any,
    queryParams?: Record<string, any>,
    headers?: Record<string, string>
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, 'PATCH', data, queryParams, headers);
  }
}
