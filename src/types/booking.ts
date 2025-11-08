export interface Professional {
  id: number;
  name: string;
  specialization?: string;
  rating?: number;
  image_url?: string;
}

export interface Booking {
  id: string;
  user_id: string;
  professional_id: string;
  professional?: Professional;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  scheduled_date: string;
  scheduled_time: string;
  consultation_mode: 'ONLINE' | 'OFFLINE' | 'HOME_VISIT';
  consultation_fee: number;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  created_at: string;
  updated_at: string;
  // Additional fields that might come from the API
  booking_id?: string;
  booking_status?: string;
  professional_name?: string;
  date?: string;
  time?: string;
  mode?: string;
  amount?: number;
  coupon_code?: string;
  transaction_id?: string;
}

export interface BookingRequest {
  professional_id: string;
  user_id: string;
  date: string;
  time: string;
  mode: 'ONLINE' | 'OFFLINE' | 'HOME_VISIT';
  payment_method: string;
  coupon_code?: string;
  notes?: string;
}

export interface BookingResponse {
  success: boolean;
  message?: string;
  data?: Booking | Booking[];
  error?: string;
}
