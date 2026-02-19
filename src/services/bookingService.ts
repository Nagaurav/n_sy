import { apiClient, ApiResult } from './apiClient';
import { BookingPaymentParams, UnifiedAppointment } from '../types/booking';
import { TimeSlot, ProfessionalFilters, ProfessionalsResponse } from '../types/booking';

// Re-export BookingPaymentParams for convenience
export type { BookingPaymentParams } from '../types/booking';

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

  // Get available time slots for consultation booking
  getAvailableSlots: async (professionalId: string | number): Promise<ApiResult<TimeSlot[]>> => {
    const response = await apiClient.get('/user/check-slot/checkAvailability', {
      params: { 
        professional_id: professionalId,
        limit: 1000 // Load sufficient slots for upcoming weeks
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
      success: false,
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

  // Check slot availability before booking
  checkSlotAvailability: async (slotId: string | number, professionalId: string | number): Promise<ApiResult<{ available: boolean; reason?: string }>> => {
    try {
      // Get all available slots for the professional
      const response = await apiClient.get('/user/check-slot/checkAvailability', {
        params: { 
          professional_id: professionalId,
          // 🟢 FIX 1: Add limit to fetch ALL slots, not just the first 10
          limit: 1000
        }
      });

      // 🟢 FIX 2: Read 'slots', not 'data'
      // The backend returns { success: true, slots: [...], pagination: ... }
      const availableSlots = response.data?.slots || [];
      
      const targetSlot = availableSlots.find((slot: any) => 
        slot.id === Number(slotId) || slot.slot_id === Number(slotId)
      );

      return {
        success: true,
        data: {
          available: !!targetSlot,
          reason: targetSlot ? undefined : 'This time slot is no longer available'
        }
      };
    } catch (error: any) {
      console.error('Error checking slot availability:', error);
      // If we can't check availability, assume it's not available to be safe
      return {
        success: true,
        data: {
          available: false,
          reason: 'Unable to verify slot availability. Please try again.'
        }
      };
    }
  },

  // ✅ 1. Unified Booking Action
  createBookingAndInitiatePayment: async (params: BookingPaymentParams): Promise<ApiResult<any>> => {
    
    // 🧘 YOGA FLOW
    if (params.serviceType === 'yoga_class') {
      const payload = {
        yoga_plan_id: Number(params.yogaPlanId),
        mode: params.deliveryMode || 'GROUP_ONLINE',
        coupon_code: params.couponCode
      };
      
      // First create the yoga booking
      const bookingResponse = await apiClient.post('/user/yoga-booking/book', payload);
      
      // Then get the payment URL for the created booking
      if (bookingResponse.data?.data?.id) {
        const bookingId = bookingResponse.data.data.id;
        console.log(`🔗 Getting payment URL for yoga booking: ${bookingId}`);
        
        const paymentResponse = await apiClient.get(`/user/yoga-booking/${bookingId}/payment-url`);
        
        if (paymentResponse.data?.payment_url) {
          // Merge the payment URL into the booking response
          return {
            success: true,
            data: {
              ...bookingResponse.data,
              payment_url: paymentResponse.data.payment_url,
              transaction_id: paymentResponse.data.transaction_id || paymentResponse.data.payment_id
            }
          };
        }
      }
      
      // Return booking response even if payment URL fails
      return bookingResponse;
    }

    // 👨‍⚕️ CONSULTATION FLOW (Default)
    const payload = {
      user_id: Number(params.userId),
      professional_id: Number(params.professionalId),
      duration: params.duration || 30, // Use actual duration from params
      coupon_code: params.couponCode,
      slot_id: Number(params.slotId)
    };
    
    // First create the booking
    const bookingResponse = await apiClient.post('/user/consultation-booking/create', payload);
    
    // Then get the payment URL for the created booking
    if (bookingResponse.data?.data?.booking_id) {
      const bookingId = bookingResponse.data.data.booking_id;
      console.log(`🔗 Getting payment URL for consultation booking: ${bookingId}`);
      
      const paymentResponse = await apiClient.get(`/user/consultation-booking/${bookingId}/payment-url`);
      
      if (paymentResponse.data?.payment_url) {
        // Merge the payment URL into the booking response
        return {
          success: true,
          data: {
            ...bookingResponse.data,
            payment_url: paymentResponse.data.payment_url,
            transaction_id: paymentResponse.data.transaction_id || paymentResponse.data.payment_id
          }
        };
      }
    }

    // Return booking response even if payment URL fails
    return bookingResponse;
  },

  // ✅ 2. Unified List Fetching (Merge 2 APIs) - WITH PROFESSIONAL DETAILS JOIN
  getAllUserBookings: async (userId: string | number): Promise<ApiResult<UnifiedAppointment[]>> => {
    try {
      // Fetch consultations with error handling
      let consultRes = null;
      try {
        consultRes = await apiClient.get(`/user/consultation-booking/user/${userId}?limit=50`);
        console.log('✅ [bookingService] Consultation API success');
      } catch (consultError: any) {
        console.warn('⚠️ [bookingService] Consultation API failed:', consultError.message);
        consultRes = { success: false, error: consultError.message, data: null };
      }

      // Fetch yoga bookings with error handling
      let yogaRes = null;
      try {
        yogaRes = await apiClient.get(`/user/yoga-booking?limit=50`);
        console.log('✅ [bookingService] Yoga API success');
      } catch (yogaError: any) {
        console.warn('⚠️ [bookingService] Yoga API failed:', yogaError.message);
        yogaRes = { success: false, error: yogaError.message, data: null };
      }

      const unifiedList: UnifiedAppointment[] = [];

      // A. Process Consultations
      if (consultRes.success && consultRes.data) {
        console.log('🔍 [bookingService] Consultation API response:', consultRes.data);
        
        // Handle different response structures
        let consultList = [];
        if (Array.isArray(consultRes.data)) {
          consultList = consultRes.data;
        } else if (consultRes.data?.data && Array.isArray(consultRes.data.data)) {
          consultList = consultRes.data.data;
        } else if (consultRes.data?.appointments && Array.isArray(consultRes.data.appointments)) {
          consultList = consultRes.data.appointments;
        }
        
        console.log('📋 [bookingService] Processed consultation list:', consultList.length, 'items');

        // 🆕 STEP 1: Extract unique professional IDs for speciality fetching
        const professionalIds = [...new Set(
          consultList
            .map((item: any) => item.professional_id || item.professional?.id)
            .filter((id: any) => id != null)
        )] as number[];

        console.log('🎯 [bookingService] Found professional IDs:', professionalIds);

        // 🆕 STEP 2: Fetch professional details if we have IDs
        const professionalDetails: { [key: number]: any } = {};
        if (professionalIds.length > 0) {
          try {
            console.log('🔄 [bookingService] Fetching professional details for speciality_id...');
            
            // Fetch details for each professional
            for (const profId of professionalIds) {
              try {
                const profRes = await apiClient.get(`/user/professional/getProfessional?professional_id=${profId}`);
                console.log(`🔍 [bookingService] Professional API response for ${profId}:`, profRes);
                
                if (profRes.success && profRes.data?.data?.[0]) {
                  const professional = profRes.data.data[0];
                  console.log(`👤 [bookingService] Professional object for ${profId}:`, professional);
                  console.log(`🏥 [bookingService] speciality_new for ${profId}:`, professional.speciality_new);
                  console.log(`🏥 [bookingService] speciality_id for ${profId}:`, professional.speciality_id);
                  console.log(`🏥 [bookingity] speciality for ${profId}:`, professional.speciality);
                  
                  professionalDetails[profId] = {
                    speciality_id: professional.speciality_new?.speciality_id || professional.speciality_id,
                    speciality_name: professional.speciality_new?.name || professional.speciality,
                  };
                  console.log(`✅ [bookingService] Got speciality data for professional ${profId}:`, professionalDetails[profId]);
                } else {
                  console.warn(`⚠️ [bookingService] No professional data found for ${profId}`);
                }
              } catch (profError: any) {
                console.warn(`⚠️ [bookingService] Failed to fetch professional ${profId}:`, profError.message);
              }
            }
          } catch (error) {
            console.warn('⚠️ [bookingService] Professional details fetch failed:', error);
          }
        }
        
        consultList.forEach((item: any, index: number) => {
          const professionalId = item.professional_id || item.professional?.id;
          const profDetails = professionalId ? professionalDetails[professionalId] : null;
          
          const bookingId = item.booking_id || item.id || item._id || `consult-${index}-${Date.now()}`;
          unifiedList.push({
            id: `consult-${bookingId}`,
            reference_id: item.booking_id || item.id || item._id,
            type: 'consultation',
            status: item.booking_status || item.status,
            payment_status: item.payment_status,
            amount: item.final_amount || item.amount,
            date: item.slot?.date || item.date,
            time: item.time || item.slot?.time || 'Scheduled',
            title: item.professional_name || `Dr. ${item.professional?.first_name} ${item.professional?.last_name}` || 'Consultation',
            subtitle: profDetails?.speciality_name || item.professional?.speciality_new?.name || item.professional?.speciality_name || item.professional?.speciality || item.professional?.role || 'Medical Consultation',
            imageUrl: item.professional?.photo_url,
            professional: item.professional
          });
        });
      }

      // B. Process Yoga
      if (yogaRes.success && yogaRes.data) {
        console.log('🔍 [bookingService] Yoga API response:', yogaRes.data);
        
        // Handle different response structures
        let yogaList = [];
        if (Array.isArray(yogaRes.data)) {
          yogaList = yogaRes.data;
        } else if (yogaRes.data?.data && Array.isArray(yogaRes.data.data)) {
          yogaList = yogaRes.data.data;
        } else if (yogaRes.data?.bookings && Array.isArray(yogaRes.data.bookings)) {
          yogaList = yogaRes.data.bookings;
        }
        
        console.log('📋 [bookingService] Processed yoga list:', yogaList.length, 'items');
        
        yogaList.forEach((item: any, index: number) => {
          const yogaId = item.id || item.booking_id || item._id || `yoga-${index}-${Date.now()}`;
          unifiedList.push({
            id: `yoga-${yogaId}`,
            reference_id: item.id || item.booking_id || item._id,
            type: 'yoga_class',
            status: item.status || item.booking_status,
            payment_status: item.payment_transaction?.status || item.payment_status || 'PENDING',
            amount: item.final_amount || item.amount,
            date: item.start_date || item.date,
            time: item.start_time || item.time || 'Scheduled',
            title: item.yoga_plan?.title || item.title || 'Yoga Session',
            subtitle: (item.mode || item.session_mode || 'Class').replace(/_/g, ' '),
            imageUrl: item.professional?.photo_url,
            yoga_plan: item.yoga_plan,
            professional: item.professional
          });
        });
      }

      // Sort Newest First
      unifiedList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('🎯 [bookingService] Final unified list:', unifiedList.length, 'items');
      console.log('📋 [bookingService] Sample items:', unifiedList.slice(0, 2));

      return { success: true, data: unifiedList };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Get user appointments (legacy - for backward compatibility)
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
