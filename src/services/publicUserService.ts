// publicUserService.ts
// Public user service for SamyaYog app
import { makeApiRequest, API_CONFIG } from '../config/api';

// Types
export interface PublicUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  city?: string;
  state?: string;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
}

export interface PublicUserResponse {
  success: boolean;
  message: string;
  data: PublicUser;
}

export interface PublicUsersResponse {
  success: boolean;
  message: string;
  data: PublicUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UserSearchParams {
  query?: string;
  city?: string;
  state?: string;
  is_online?: boolean;
  page?: number;
  limit?: number;
  sort_by?: 'name' | 'created_at' | 'last_seen';
  sort_order?: 'asc' | 'desc';
}

class PublicUserService {
  // Get public user by ID
  async getUserById(userId: string): Promise<PublicUser | null> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.GET_USER_BY_ID.replace(':id', userId),
        'GET'
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching user by ID:', error);
      return null;
    }
  }

  // Get multiple users by IDs
  async getUsersByIds(userIds: string[]): Promise<PublicUser[]> {
    try {
      const queryParams = new URLSearchParams();
      userIds.forEach(id => queryParams.append('ids', id));
      
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.GET_USER_BY_ID + '?' + queryParams.toString(),
        'GET'
      );
      
      if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data : [response.data];
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching users by IDs:', error);
      return [];
    }
  }

  // Get public users with filters
  async getPublicUsers(filters: UserSearchParams = {}): Promise<PublicUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.query) queryParams.append('query', filters.query);
      if (filters.city) queryParams.append('city', filters.city);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.is_online !== undefined) queryParams.append('is_online', filters.is_online.toString());
      if (filters.page) queryParams.append('page', filters.page.toString());
      if (filters.limit) queryParams.append('limit', filters.limit.toString());
      if (filters.sort_by) queryParams.append('sort_by', filters.sort_by);
      if (filters.sort_order) queryParams.append('sort_order', filters.sort_order);

      const url = API_CONFIG.ENDPOINTS.USER.PROFESSIONALS + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const response = await makeApiRequest(url, 'GET');
      
      return response;
    } catch (error: any) {
      console.error('Error fetching public users:', error);
      return {
        success: false,
        message: 'Failed to fetch public users',
        data: []
      };
    }
  }

  // Search public users
  async searchPublicUsers(searchParams: UserSearchParams = {}): Promise<PublicUsersResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (searchParams.query) queryParams.append('query', searchParams.query);
      if (searchParams.city) queryParams.append('city', searchParams.city);
      if (searchParams.state) queryParams.append('state', searchParams.state);
      if (searchParams.is_online !== undefined) queryParams.append('is_online', searchParams.is_online.toString());
      if (searchParams.page) queryParams.append('page', searchParams.page.toString());
      if (searchParams.limit) queryParams.append('limit', searchParams.limit.toString());
      if (searchParams.sort_by) queryParams.append('sort_by', searchParams.sort_by);
      if (searchParams.sort_order) queryParams.append('sort_order', searchParams.sort_order);

      const url = API_CONFIG.ENDPOINTS.USER.PROFESSIONALS_SEARCH + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const response = await makeApiRequest(url, 'GET');
      
      return response;
    } catch (error: any) {
      console.error('Error searching public users:', error);
      return {
        success: false,
        message: 'Failed to search public users',
        data: []
      };
    }
  }
}

export const publicUserService = new PublicUserService();
