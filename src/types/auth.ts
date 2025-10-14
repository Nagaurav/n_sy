// Authentication related types
export interface User {
  _id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string;
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
