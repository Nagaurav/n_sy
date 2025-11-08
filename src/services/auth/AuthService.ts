import { BaseService } from '../base/BaseService';
import { setAuthToken, removeAuthToken } from '../../config/api';

export interface User {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'user' | 'professional' | 'admin' | 'super_admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profilePicture?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  preferences?: {
    language?: string;
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    os: string;
    fcmToken?: string;
  };
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'professional';
  acceptTerms: boolean;
  professionalDetails?: {
    specializations: string[];
    experience: number;
    qualifications: string[];
    services: string[];
  };
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: number;
  };
  message?: string;
}

export class AuthService extends BaseService {
  private static instance: AuthService;

  private constructor() {
    super('/auth');
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // User login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.post<{
        user: User;
        token: string;
        refreshToken: string;
        expiresIn: number;
      }>('/login', credentials);

      if (response.success && response.data) {
        await setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'An error occurred during login. Please try again.',
      };
    }
  }

  // User registration
  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await this.post<{
        user: User;
        token: string;
        refreshToken: string;
        expiresIn: number;
      }>('/register', userData);

      if (response.success && response.data) {
        await setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'An error occurred during registration. Please try again.',
      };
    }
  }

  // Logout
  async logout(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Call the logout API if needed
      await this.post('/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear the local auth state
      await removeAuthToken();
      return { success: true, message: 'Logged out successfully' };
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{
    success: boolean;
    data?: User;
    message?: string;
  }> {
    return this.get<User>('/me');
  }

  // Update user profile
  async updateProfile(
    userId: string,
    profileData: Partial<Omit<User, 'id' | 'email' | 'role' | 'createdAt' | 'updatedAt'>>
  ): Promise<{
    success: boolean;
    data?: User;
    message?: string;
  }> {
    return this.put<User>(`/profile/${userId}`, profileData);
  }

  // Change password
  async changePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.post('/change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  }

  // Check if the current token is valid
  async isAuthenticated(): Promise<boolean> {
    try {
      // Try to get the current user
      const response = await this.getCurrentUser();
      return response.success && !!response.data;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  // Request password reset
  async forgotPassword(email: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.post('/forgot-password', { email });
  }

  // Reset password with token
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.post('/reset-password', {
      token,
      newPassword,
      confirmPassword,
    });
  }

  // Verify email
  async verifyEmail(token: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.post('/verify-email', { token });
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.post('/resend-verification', { email });
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<{
    success: boolean;
    data?: {
      token: string;
      refreshToken: string;
      expiresIn: number;
    };
    message?: string;
  }> {
    return this.post<{
      token: string;
      refreshToken: string;
      expiresIn: number;
    }>('/refresh-token', { refreshToken });
  }

  // Get user profile with health information
  async getUserProfile(userId: string): Promise<{
    success: boolean;
    data?: User & {
      user_health?: {
        blood_group?: string;
        height?: number;
        weight?: number;
        allergies?: string[];
        medical_conditions?: string[];
        medications?: Array<{
          name: string;
          dosage: string;
          frequency: string;
          start_date: string;
          end_date?: string;
        }>;
        emergency_contact?: {
          name: string;
          relationship: string;
          phone: string;
          email?: string;
        };
        last_checkup_date?: string;
        blood_pressure?: string;
        blood_sugar_level?: string;
        cholesterol_level?: string;
        bmi?: number;
      };
    };
    message?: string;
  }> {
    try {
      const response = await this.get<User>(`/user/profile/${userId}`);
      return response;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        message: 'Failed to fetch user profile. Please try again.'
      };
    }
  }
}
