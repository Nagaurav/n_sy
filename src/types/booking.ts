// Booking and consultation related types
export interface Speciality {
  speciality_id: number;
  name: string;
  image_url: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  // API Response Fields
  professional_id: number;
  first_name: string;
  last_name: string;
  role: string;
  city: string;
  state: string;
  gender: string;
  language: string;
  speciality_new: Speciality;
  work_arrangement: string;
  is_verified: boolean;
  
  // Backward compatibility fields
  _id?: string;
  firstName?: string;
  lastName?: string;
  specialization?: string;
  speciality?: string;
  experience?: number;
  rating?: number;
  availability?: boolean;
  is_online?: boolean;
  profileImage?: string;
  profile_picture_url?: string;
  min_session_price?: number;
  description?: string;
  languages?: string[];
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
  _id: string;
  user_id: string;
  professional_id: string;
  slot_id: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  coupon_code?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
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
}
