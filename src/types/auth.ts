// Authentication related types
export interface User {
  user_id: number; // API returns user_id as number
  _id?: string; // Keep for backward compatibility
  phone: string;
  first_name: string; // API uses snake_case
  last_name: string; // API uses snake_case
  firstName?: string; // Keep for backward compatibility
  lastName?: string; // Keep for backward compatibility
  email: string;
  password?: string; // API includes this
  dob?: string;
  gender?: string;
  city?: string;
  location_latitude?: string;
  location_longitude?: string;
  profileImage?: string;
  profile_picture_url?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  phone: string;
  otp: string;
}

export interface SignupData {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  isRegistered?: boolean;
}

export interface SignupResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
