// Booking and consultation related types
export interface Professional {
  _id: string;
  professional_id?: number; // For API compatibility
  firstName: string;
  lastName: string;
  first_name?: string; // API compatibility
  last_name?: string; // API compatibility
  specialization: string;
  speciality?: string; // API compatibility
  experience: number;
  rating?: number;
  average_rating?: number; // API compatibility
  total_reviews?: number;
  availability: boolean;
  is_online?: boolean;
  profileImage?: string;
  profile_picture_url?: string; // API compatibility
  min_session_price?: number;
  city?: string;
  description?: string;
  gender?: 'male' | 'female' | 'other';
  languages?: string[];
}

export interface TimeSlot {
  _id: string;
  professional_id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  duration: number;
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
  user_id: string;
  professional_id: string;
  slot_id: string;
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
  booking: ConsultationBooking;
}

export interface AppointmentsResponse {
  appointments: ConsultationBooking[];
}

export interface ProfessionalsResponse {
  professionals: Professional[];
}

export interface SlotsResponse {
  slots: TimeSlot[];
}

// Filter and Sort interfaces
export interface ProfessionalFilters {
  category_id?: string;
  search_query?: string;
  is_online?: boolean;
  duration?: number;
  min_price?: number;
  max_price?: number;
  gender?: 'male' | 'female' | 'other';
  language_id?: string;
  sort_by?: 'rating' | 'price_asc' | 'price_desc' | 'reviews';
  city?: string;
  page?: number;
  limit?: number;
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
