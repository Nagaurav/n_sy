// consultationBookingService.ts
// Consultation booking service for SamyaYog app
import { makeApiRequest, API_CONFIG } from '../config/api';

// Types
export interface ConsultationBookingRequest {
  user_id: number;           // number
  professional_id: number;    // number
  slot_id: number;           // number, required field
  consultation_type: 'online' | 'offline' | 'home_visit';
  consultation_date: string;
  consultation_time: string;
  duration: number;
  total_amount: string;       // Changed to string to match backend
  payment_method: 'online' | 'offline' | 'wallet';
  special_instructions?: string;
  health_concerns?: string;
  emergency_contact?: string;
  is_urgent?: boolean;
  preferred_language?: string;
  coupon_code?: string;      // optional field
}

export interface ConsultationBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking_id: string;
    status: string;
    created_at: string;
  };
}

export interface ConsultationBooking {
  booking_id: string;
  user_id: number;           // number
  professional_id: number;    // number
  professional_details: {
    name: string;
    speciality: string;
    avatar_url?: string;
  };
  consultation_type: string;
  consultation_date: string;
  consultation_time: string;
  duration: number;
  total_amount: string;       // Changed to string to match backend
  payment_status: string;
  status: string;
  special_instructions?: string;
  health_concerns?: string;
  emergency_contact?: string;
  is_urgent: boolean;
  preferred_language?: string;
  created_at: string;
  updated_at: string;
}

class ConsultationBookingService {
  // Create a new consultation booking
  async createConsultationBooking(bookingData: ConsultationBookingRequest): Promise<ConsultationBookingResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.CONSULTATION_BOOKING,
        'POST',
        bookingData
      );
      
      return response;
    } catch (error: any) {
      console.error('Error creating consultation booking:', error);
      throw new Error(`Failed to create consultation booking: ${error.message}`);
    }
  }

  // Get consultation bookings for a user
  async getUserConsultationBookings(userId: number, filters?: {  // Changed from string to number
    status?: string;
    consultation_type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: ConsultationBooking[] }> {
    try {
      let url = API_CONFIG.ENDPOINTS.USER.GET_CONSULTATION_BOOKINGS.replace(':user_id', userId.toString());
      
      if (filters) {
        const queryParams = new URLSearchParams();
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.consultation_type) queryParams.append('consultation_type', filters.consultation_type);
        if (filters.page) queryParams.append('page', filters.page.toString());
        if (filters.limit) queryParams.append('limit', filters.limit.toString());
        
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
      }

      const response = await makeApiRequest(url, 'GET');
      
      return {
        success: response.success,
        data: response.data || []
      };
    } catch (error: any) {
      console.error('Error fetching consultation bookings:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get consultation booking details by ID
  async getConsultationBookingDetails(bookingId: string): Promise<ConsultationBooking | null> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.GET_CONSULTATION_BOOKING_DETAILS.replace(':booking_id', bookingId),
        'GET'
      );
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error fetching consultation booking details:', error);
      return null;
    }
  }

  // Cancel a consultation booking
  async cancelConsultationBooking(bookingId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.CANCEL_CONSULTATION_BOOKING.replace(':booking_id', bookingId),
        'PUT',
        { reason }
      );
      
      return {
        success: response.success,
        message: response.message
      };
    } catch (error: any) {
      console.error('Error cancelling consultation booking:', error);
      throw new Error(`Failed to cancel consultation booking: ${error.message}`);
    }
  }

  // Get consultation bookings by status
  async getConsultationBookingsByStatus(userId: string, status: string): Promise<ConsultationBooking[]> {
    try {
      const response = await this.getUserConsultationBookings(userId, { status });
      return response.data;
    } catch (error: any) {
      console.error('Error fetching consultation bookings by status:', error);
      return [];
    }
  }

  // Get consultation bookings by date range
  async getConsultationBookingsByDateRange(userId: string, startDate: string, endDate: string): Promise<ConsultationBooking[]> {
    try {
      const response = await this.getUserConsultationBookings(userId);
      const bookings = response.data;
      
      return bookings.filter(booking => {
        const bookingDate = new Date(booking.consultation_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return bookingDate >= start && bookingDate <= end;
      });
    } catch (error: any) {
      console.error('Error fetching consultation bookings by date range:', error);
      return [];
    }
  }
}

export const consultationBookingService = new ConsultationBookingService();
