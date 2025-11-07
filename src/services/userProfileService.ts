// userProfileService.ts
// User profile service for SamyaYog app
import { makeApiRequest, API_CONFIG } from '../config/api';

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data: UserProfile;
}

class UserProfileService {
  // Get current user profile
  async getUserProfile(): Promise<UserProfile> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE, 'GET');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }
  }

  // Update current user profile
  async updateUserProfile(profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.UPDATE_PROFILE, 'PUT', profileData);
      return response;
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }
  }

  // Get user by ID (public endpoint)
  async getUserById(userId: string): Promise<UserProfile | null> {
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

  // Update user avatar
  async updateAvatar(avatarFile: any): Promise<{ success: boolean; message: string; avatar_url?: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE + '/avatar', 'PUT', formData);
      
      return {
        success: response.success,
        message: response.message,
        avatar_url: response.data?.avatar_url
      };
    } catch (error: any) {
      console.error('Error updating avatar:', error);
      throw new Error(`Failed to update avatar: ${error.message}`);
    }
  }

  // Delete user account
  async deleteAccount(reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE, 'DELETE', { reason });
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  // Get user preferences
  async getUserPreferences(): Promise<any> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE + '/preferences', 'GET');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching user preferences:', error);
      return {};
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences: any): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.USER.PROFILE + '/preferences', 'PUT', preferences);
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error updating user preferences:', error);
      throw new Error(`Failed to update preferences: ${error.message}`);
    }
  }
}

export const userProfileService = new UserProfileService();
