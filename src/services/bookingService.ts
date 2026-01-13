import { apiClient, ApiResult } from './apiClient';
import { TimeSlot, ProfessionalFilters, ProfessionalsResponse } from '../types/booking';

export interface BookingData {
  user_id: number;
  professional_id: number;
  slot_id?: number;
  duration: number;
  coupon_code?: string;
}

export interface PriceCalculationParams {
  slotId: string | number;
  duration: number;
  couponCode?: string;
  userId?: string | number;
}

export interface BookingPrice {
  original_amount: number;
  discount_amount: number;
  final_amount: number;
}

export interface BookingPaymentParams {
  userId: string | number;
  professionalId: string | number;
  slotId: string | number;
  duration: number;
  couponCode?: string;
  metadata?: Record<string, any>;
}

export const bookingService = {
  // Search professionals with filters
  searchProfessionals: async (filters: ProfessionalFilters): Promise<ApiResult<ProfessionalsResponse>> => {
    const queryParams = new URLSearchParams();

    const apiFilters: Record<string, any> = {
      city: filters.city,
      state: filters.state,
      gender: filters.gender,
      language: filters.language,
      role: filters.role,
      speciality_id: filters.speciality_id,
      min_price: filters.min_price,
      max_price: filters.max_price,
      page: filters.page || 1,
      limit: filters.limit || 10,
      search_query: filters.search_query,
      is_online: filters.is_online,
      sort_by: filters.sort_by,
      category_id: filters.category_id,
    };

    Object.entries(apiFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // 🛑 FIX: Skip price filters entirely to prevent backend crash
        if (key === 'min_price' || key === 'max_price') {
          return; // Don't add price parameters to query
        }
        const paramValue = typeof value === 'boolean' ? String(value) : String(value);
        queryParams.append(key, paramValue);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/user/professional/getProfessional${queryString ? `?${queryString}` : ''}`;

    console.log('🔍 [bookingService] Search professionals endpoint:', endpoint);
    console.log('📋 [bookingService] Query params:', Object.fromEntries(queryParams));

    return apiClient.get<ProfessionalsResponse>(endpoint);
  },

  // Get available time slots for a professional
  getAvailableSlots: async (professionalId: string | number): Promise<ApiResult<TimeSlot[]>> => {
    const response = await apiClient.get('/user/check-slot/checkAvailability', {
      params: { 
        professional_id: professionalId,
        limit: 500 // 🟢 Request 500 slots to ensure we cover upcoming weeks
      }
    });

    if (response.success && response.data?.success === true && Array.isArray(response.data.slots)) {
      const slots = response.data.slots;
      
      // Map the API response to our TimeSlot interface
      const mappedSlots = slots.map((slot: any): TimeSlot => ({
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_online: slot.is_online,
        price_online_15min: slot.price_online_15min,
        price_online_30min: slot.price_online_30min,
        price_online_60min: slot.price_online_60min,
        price_offline_15min: slot.price_offline_15min,
        price_offline_30min: slot.price_offline_30min,
        price_offline_60min: slot.price_offline_60min,
        slot_duration_15min: slot.slot_duration_15min,
        slot_duration_30min: slot.slot_duration_30min,
        slot_duration_60min: slot.slot_duration_60min,
        is_available: true,
        price: slot.price_online_15min || 0,
        duration: 15,
        professional_id: professionalId
      }));

      return {
        success: true,
        data: mappedSlots
      };
    }

    return {
      success: true,
      data: []
    };
  },

  // Calculate booking price
  calculatePrice: async (params: PriceCalculationParams): Promise<ApiResult<BookingPrice>> => {
    const safeDuration = Number.isFinite(params.duration) && params.duration > 0
      ? Math.round(params.duration)
      : 60;

    const payload: any = {
      slot_id: Number(params.slotId),
      duration: safeDuration,
      coupon_code: params.couponCode || undefined,
      user_id: params.userId !== undefined && params.userId !== null
        ? Number(params.userId)
        : undefined,
    };

    const response = await apiClient.post('/user/consultation-booking/calculate-price', payload);
    const data = response.data;

    const priceData: any = data?.data && typeof data.data === 'object' ? data.data : data;

    if (!priceData ||
        (typeof priceData.final_amount !== 'number' && typeof priceData.original_amount !== 'number')) {
      return {
        success: false,
        error: data?.message || 'Failed to calculate price. Please try again.',
      };
    }

    const original = typeof priceData.original_amount === 'number'
      ? priceData.original_amount
      : priceData.final_amount;
    const final = typeof priceData.final_amount === 'number'
      ? priceData.final_amount
      : original;
    const discount = typeof priceData.discount_amount === 'number'
      ? priceData.discount_amount
      : original - final;

    return {
      success: true,
      data: {
        original_amount: original,
        discount_amount: discount,
        final_amount: final,
      },
    };
  },

  // Create booking and initiate payment
  createBookingAndInitiatePayment: async (params: BookingPaymentParams): Promise<ApiResult<any>> => {
    const payload: any = {
      user_id: Number(params.userId),
      professional_id: Number(params.professionalId),
      duration: params.duration || 30,
      coupon_code: params.couponCode || undefined,
    };

    const numericSlot = Number(params.slotId);
    if (Number.isFinite(numericSlot)) {
      payload.slot_id = numericSlot;
    }

    const response = await apiClient.post('/user/consultation-booking/create', payload);

    if (!response.data) {
      return {
        success: false,
        error: 'No data received from booking service'
      };
    }

    // Handle the API response format where payment_url is at the root level
    if (response.data.payment_url) {
      return {
        success: true,
        data: {
          payment_url: response.data.payment_url,
          booking_id: response.data.data?.booking_id,
          ...(response.data.data || {}),
          payment_id: response.data.data?.payment_id || `TXN_${Date.now()}`,
          final_amount: response.data.data?.final_amount || 0,
          original_amount: response.data.data?.original_amount || 0,
          discount_amount: response.data.data?.discount_amount || 0
        }
      };
    }

    // Fallback to check if payment_url is inside data object
    if (response.data.data?.payment_url) {
      return {
        success: true,
        data: {
          payment_url: response.data.data.payment_url,
          booking_id: response.data.data.booking_id,
          ...response.data.data,
          payment_id: response.data.data.payment_id || `TXN_${Date.now()}`,
          final_amount: response.data.data.final_amount || 0,
          original_amount: response.data.data.original_amount || 0,
          discount_amount: response.data.data.discount_amount || 0
        }
      };
    }

    return {
      success: false,
      error: 'No payment URL received from booking service'
    };
  },

  // Get user appointments
  getUserAppointments: async (userId: string, pagination?: { limit?: number; offset?: number }) => {
    const config = pagination
      ? { params: { limit: pagination.limit, offset: pagination.offset } }
      : undefined;

    return apiClient.get(`/user/consultation-booking/user/${userId}`, config);
  },

  // Get next appointment
  getNextAppointment: async (userId: string | number) => {
    const response = await apiClient.get(`/user/consultation-booking/user/${userId}`);
    
    if (response.data?.data && Array.isArray(response.data.data)) {
      const appointments = response.data.data;
      const now = new Date();
      
      // Find next upcoming appointment (confirmed status and future date)
      const sortedAppointments = appointments
        .filter((apt: any) => apt.booking_status === 'CONFIRMED')
        .sort((a: any, b: any) => {
          const dateA = new Date(`${a.date} ${a.time?.split(' - ')[0] || '00:00'}`);
          const dateB = new Date(`${b.date} ${b.time?.split(' - ')[0] || '00:00'}`);
          return dateA.getTime() - dateB.getTime();
        });
      
      const upcomingAppointment = sortedAppointments.find((apt: any) => {
        const appointmentDateTime = new Date(`${apt.date} ${apt.time?.split(' - ')[0] || '00:00'}`);
        return appointmentDateTime > now;
      });
      
      return {
        success: true,
        data: {
          appointment: upcomingAppointment || null
        },
      };
    }
    
    return {
      success: true,
      data: {
        appointment: null
      },
    };
  },

  // ✅ FIX: Added missing getBookingDetails method
  getBookingDetails: async (bookingId: string | number) => {
    return apiClient.get(`/user/consultation-booking/details/${bookingId}`);
  },
};
