import { apiClient } from './apiClient';
import type { DietPlan } from '../types/diet';

interface ApiResult<T> {
  success?: boolean;
  data?: T;
  msg?: string;
}

export const dietService = {
  // Get diet plan by Booking ID (Matches your backend route)
  getDietPlanByBooking: async (bookingId: string | number): Promise<ApiResult<{ data: DietPlan }>> => {
    return apiClient.get(`/user/diet-plan/booking/${bookingId}`);
  },

  // Get specific diet plan by ID
  getDietPlanById: async (id: string | number): Promise<ApiResult<{ data: DietPlan }>> => {
    return apiClient.get(`/user/diet-plan/${id}`);
  }
};
