import { BaseService } from '../base/BaseService';

export interface Booking {
  id: string;
  userId: string;
  professionalId: string;
  professionalName: string;
  serviceType: 'consultation' | 'yoga_class' | 'therapy' | 'workshop';
  serviceId: string;
  serviceName: string;
  slotId?: string;
  startTime: string;
  endTime: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rejected';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentId?: string;
  isRescheduled: boolean;
  rescheduledFrom?: string;
  cancellationReason?: string;
  cancellationDate?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface CreateBookingInput {
  userId: string;
  professionalId: string;
  serviceType: 'consultation' | 'yoga_class' | 'therapy' | 'workshop';
  serviceId: string;
  slotId?: string;
  startTime: string;
  endTime: string;
  date: string;
  paymentMethod: string;
  couponCode?: string;
  metadata?: Record<string, any>;
}

export interface RescheduleBookingInput {
  bookingId: string;
  newSlotId: string;
  newStartTime: string;
  newEndTime: string;
  newDate: string;
  reason?: string;
}

export class BookingService extends BaseService {
  private static instance: BookingService;

  private constructor() {
    super('/bookings');
  }

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  // Create a new booking
  async createBooking(bookingData: CreateBookingInput): Promise<{
    success: boolean;
    data?: Booking;
    paymentUrl?: string;
    message?: string;
  }> {
    return this.post<Booking>('', bookingData);
  }

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<{
    success: boolean;
    data?: Booking;
    message?: string;
  }> {
    return this.get<Booking>(`/${bookingId}`);
  }

  // Get user's bookings
  async getUserBookings(
    userId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: 'upcoming' | 'completed' | 'cancelled' | 'all';
      sortBy?: 'date_asc' | 'date_desc';
    }
  ): Promise<{
    success: boolean;
    data?: Booking[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<Booking[]>(`/user/${userId}`, params);
  }

  // Get professional's bookings
  async getProfessionalBookings(
    professionalId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: 'upcoming' | 'completed' | 'cancelled' | 'all';
      sortBy?: 'date_asc' | 'date_desc';
    }
  ): Promise<{
    success: boolean;
    data?: Booking[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<Booking[]>(`/professional/${professionalId}`, params);
  }

  // Cancel a booking
  async cancelBooking(
    bookingId: string,
    reason: string
  ): Promise<{
    success: boolean;
    data?: {
      booking: Booking;
      refundAmount?: number;
      refundStatus?: 'pending' | 'processed' | 'failed';
    };
    message?: string;
  }> {
    return this.post<{
      booking: Booking;
      refundAmount?: number;
      refundStatus?: 'pending' | 'processed' | 'failed';
    }>(`/${bookingId}/cancel`, { reason });
  }

  // Reschedule a booking
  async rescheduleBooking(
    bookingId: string,
    rescheduleData: RescheduleBookingInput
  ): Promise<{
    success: boolean;
    data?: {
      oldBooking: Booking;
      updatedBooking: Booking;
    };
    message?: string;
  }> {
    return this.post<{
      oldBooking: Booking;
      updatedBooking: Booking;
    }>(`/${bookingId}/reschedule`, rescheduleData);
  }

  // Check booking availability
  async checkAvailability(
    professionalId: string,
    serviceId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<{
    success: boolean;
    data?: {
      isAvailable: boolean;
      conflictingBookings?: Array<{
        id: string;
        startTime: string;
        endTime: string;
      }>;
      suggestedSlots?: Array<{
        date: string;
        startTime: string;
        endTime: string;
      }>;
    };
    message?: string;
  }> {
    return this.get(`/availability/check`, {
      professionalId,
      serviceId,
      date,
      startTime,
      endTime,
    });
  }

  // Get booking analytics
  async getBookingAnalytics(
    userId: string,
    type: 'user' | 'professional',
    period: 'day' | 'week' | 'month' | 'year' | 'custom',
    startDate?: string,
    endDate?: string
  ): Promise<{
    success: boolean;
    data?: {
      totalBookings: number;
      completed: number;
      cancelled: number;
      upcoming: number;
      totalRevenue?: number;
      averageRating?: number;
      byServiceType?: Record<string, number>;
      byStatus?: Record<string, number>;
      timeline?: Array<{
        date: string;
        count: number;
      }>;
    };
    message?: string;
  }> {
    return this.get(`/analytics/${type}/${userId}`, {
      period,
      startDate,
      endDate,
    });
  }
}
