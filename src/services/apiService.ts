import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';
import { YogaClass } from '../types/yogaClasses';
import { Professional } from '../types/professional';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://88.222.241.179:7000/api/v1',
  timeout: 15000, // 15 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API methods
export const apiService = {
  // Get yoga classes with filters
  getYogaClasses: async (filters = {}) => {
    try {
      const response = await api.get('/user/yoga-classes', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Error fetching yoga classes:', error);
      throw error;
    }
  },

  // Get class details by ID
  getClassById: async (id: string | number): Promise<YogaClass> => {
    try {
      const response = await api.get<{ data: YogaClass }>(`/user/yoga-classes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Error fetching class with ID ${id}:`, error);
      throw error;
    }
  },

  // Get professional profile by ID
  getProfessionalProfile: async (id: string | number): Promise<Professional> => {
    try {
      console.log(`🔍 Fetching professional with ID: ${id}`);
      const response = await api.get<{ data: Professional }>(`/professional/auth/getProfessional/${id}`);
      console.log('✅ Professional data received:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error(`❌ Error fetching professional with ID ${id}:`, {
        message: error.message,
        code: error.code,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL,
          headers: error.config?.headers,
        },
        response: {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        },
      });
      
      // Provide a more user-friendly error message
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. Please check your internet connection.');
      } else if (!error.response) {
        throw new Error('Cannot connect to the server. Please check your network connection.');
      } else if (error.response.status === 404) {
        throw new Error('Professional not found.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw error;
      }
    }
  }
};

export default apiService;
