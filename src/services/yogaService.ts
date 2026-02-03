import { apiClient, ApiResult } from './apiClient';
import { YogaClass } from '../types/yogaClasses';

export const yogaService = {
  // Get yoga classes with filters
  getClasses: async (filters = {}): Promise<ApiResult<YogaClass[]>> => {
    return apiClient.get('/user/yoga-classes', { params: filters });
  },

  // Get class details by ID
  getClassById: async (id: string | number): Promise<ApiResult<YogaClass>> => {
    const response = await apiClient.get<{ data: YogaClass }>(`/user/yoga-classes/${id}`);
    
    if (response.data?.data) {
      return {
        success: true,
        data: response.data.data
      };
    }
    
    return {
      success: false,
      error: 'Class not found'
    };
  },

  // Book a yoga class
  bookClass: async (classId: string | number, userId: string | number): Promise<ApiResult<any>> => {
    return apiClient.post('/user/yoga-classes/book', {
      class_id: classId,
      user_id: userId
    });
  },

  // Cancel yoga class booking
  cancelBooking: async (bookingId: string | number): Promise<ApiResult<any>> => {
    return apiClient.delete(`/user/yoga-classes/bookings/${bookingId}`);
  },

  // Get user's yoga class bookings
  getUserBookings: async (userId: string | number, page: number = 1, limit: number = 20): Promise<ApiResult<any>> => {
    return apiClient.get('/user/yoga-booking', {
      params: { user_id: userId, page, limit }
    });
  },
};
