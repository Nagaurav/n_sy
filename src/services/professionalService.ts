import { apiClient, ApiResult } from './apiClient';
import { Professional, ProfessionalAuthProfile } from '../types/professional';
import { YogaPlanResponse } from '../types/yogaPlan';

export const professionalService = {
  // Get professional profile by ID
  getProfile: async (id: string | number): Promise<ApiResult<Professional>> => {
    console.log(`🔍 Fetching professional with ID: ${id}`);

    const response = await apiClient.get<{ success: boolean; data: Professional }>(
      `/user/professional/getProfessional/${id}`,
    );

    console.log('✅ Professional data received:', response.data);

    if (!response.data?.success || !response.data.data) {
      return {
        success: false,
        error: 'Failed to load professional profile'
      };
    }

    return {
      success: true,
      data: response.data.data
    };
  },

  // Get professional yoga plan/slots by ID
  getSlots: async (id: string | number): Promise<ApiResult<YogaPlanResponse>> => {
    console.log(`🔍 Fetching professional slots for ID: ${id}`);
    const response = await apiClient.get<YogaPlanResponse>(`/professional/slot/get/${id}`);
    console.log('✅ Professional slots received:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  },

  // Get professional reviews
  getReviews: async (professionalId: string | number, page: number = 1, limit: number = 10): Promise<ApiResult<any>> => {
    return apiClient.get('/user/professional-review/professional', {
      params: { professional_id: professionalId, page, limit }
    });
  },

  // Search professionals (alias for bookingService.searchProfessionals for consistency)
  search: async (filters: any): Promise<ApiResult<any>> => {
    return apiClient.get('/professional/filter', { params: filters });
  },
};
