// Booking and consultation related types
import { Professional } from './professional'; // <--- Add this import

export interface Speciality {
  speciality_id: number;
  name: string;
  image_url: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface TimeSlot {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  is_online: boolean;
  // Pricing information
  price_online_15min: number | null;
  price_online_30min: number | null;
  price_online_60min: number | null;
  price_offline_15min: number | null;
  price_offline_30min: number | null;
  price_offline_60min: number | null;
  // Duration flags
  slot_duration_15min: boolean;
  slot_duration_30min: boolean;
  slot_duration_60min: boolean;
  // Legacy fields for backward compatibility
  is_available?: boolean;
  price?: number;
  duration?: number;
  professional_id?: string | number;
  professional_name?: string;
  mode?: 'online' | 'offline';
}

export interface ConsultationBooking {
  // API Response Fields (snake_case from backend)
  booking_id?: number;
  professional_name?: string;
  booking_status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  payment_status?: 'PENDING' | 'COMPLETED';
  mode?: 'online' | 'offline';
  amount?: number;
  transaction_id?: string;
  
  // Core fields (both API and legacy)
  user_id: number | string;
  professional_id: number | string;
  date: string;
  time: string; // Already formatted as "09:00 - 09:15"
  duration: number;
  coupon_code?: string;
  
  // Legacy fields for backward compatibility (camelCase)
  _id?: string;
  slot_id?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBookingRequest {
  user_id: number | string;
  professional_id: number | string;
  slot_id: number | string;
  duration: number;
  coupon_code?: string;
}

export interface UpdateBookingRequest {
  slot_id?: string;
  duration?: number;
  status?: string;
  notes?: string;
}

export interface BookingResponse {
  msg: string;
  data: {
    booking_id: number;
    user_id: number;
    professional_id: number;
    coupon_code: string | null;
    date: string;
    time: string;
    mode: 'online' | 'offline';
    duration: number;
    payment_id: string;
    final_amount: number;
    original_amount: number;
    discount_amount: number;
  };
  payment_url: string;
}

export interface AppointmentsResponse {
  appointments: ConsultationBooking[];
}

export interface ProfessionalResponse {
  success: boolean;
  message: string;
  data: Professional;
}

export interface ProfessionalsResponse {
  success: boolean;
  message: string;
  data: {
    professionals: Professional[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

export interface SlotsResponse {
  slots?: TimeSlot[];
  data?: TimeSlot[] | any;
}

// Date Time Selection Types
export interface AvailableSlot {
  id: number;
  date: string; // ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
  start_time: string; // ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
  end_time: string;   // ISO "YYYY-MM-DDTHH:mm:ss.sssZ"
  is_online: boolean;
  price_online_15min: number | null;
  price_online_30min: number | null;
  price_online_60min: number | null;
  slot_duration_15min: boolean;
  slot_duration_30min: boolean;
  slot_duration_60min: boolean;
  price_offline_15min: number | null;
  price_offline_30min: number | null;
  price_offline_60min: number | null;
  // Optional duration in minutes (mapped from TimeSlot.duration or derived on the client)
  duration?: number;
}

export interface FormattedAvailableSlot extends AvailableSlot {
  displayStartTime: string; // e.g., "10:00 AM"
  displayEndTime: string;   // e.g., "10:15 AM"
  isSelected?: boolean;
}

export interface AvailabilityListResponse {
  success: boolean;
  message: string;
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    perPage: number;
  };
  slots: AvailableSlot[];
}

export interface SectionData {
  title: string; // The date string (YYYY-MM-DD or formatted)
  data: FormattedAvailableSlot[]; // Slots for that date
  formattedDate?: string; // Formatted date string (e.g., 'Monday, January 1, 2023')
  dateLabel?: string; // Short date label (e.g., 'Today', 'Tomorrow', 'Monday')
}

// Filter and Sort interfaces
export interface ProfessionalFilters {
  category_id?: string;
  search_query?: string;
  is_online?: boolean;
  duration?: number;
  min_price?: number;
  max_price?: number;
  gender?: 'male' | 'female' | 'other' | string;
  language?: string;
  language_id?: string;
  sort_by?: 'rating' | 'price_asc' | 'price_desc' | 'reviews' | string;
  city?: string;
  state?: string;
  role?: string;
  speciality_id?: string;
  page?: number;
  limit?: number;
  debug?: boolean;
}

export interface FilterModalState {
  category_id?: string;
  is_online?: boolean;
  min_price: number;
  max_price: number;
  gender?: 'male' | 'female' | 'other';
  sort_by: 'rating' | 'price_asc' | 'price_desc' | 'reviews';
  city?: string;
  role?: string;
}

// 🟢 Unified Payment Parameters for both Consultation and Yoga Bookings
export interface BookingPaymentParams {
  userId: string | number;
  professionalId: string | number;
  serviceType: 'consultation' | 'yoga_class'; // 🟢 The Switch
  amount: number;
  duration?: number; // Duration in minutes for consultations
  couponCode?: string;
  
  // 🟢 Optionals based on type
  slotId?: number;       // For Consultations
  yogaPlanId?: number;   // For Yoga
  deliveryMode?: string; // For Yoga (e.g., 'GROUP_ONLINE')
}

// 🟢 Unified Appointment Structure for UI Display
export interface UnifiedAppointment {
  id: string; // Unique UI ID (e.g., "yoga-5", "consult-10")
  reference_id: number; // Database ID
  type: 'consultation' | 'yoga_class';
  status: string;
  payment_status: string;
  amount: number;
  date: string;
  time: string; // Time slot or schedule time
  title: string;
  subtitle: string;
  imageUrl?: string;
  professional?: any;
  yoga_plan?: any; // Extra details for Yoga
}
