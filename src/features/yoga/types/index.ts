// Yoga Booking Flow Types

export interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  format: string;
}

export interface Professional {
  _id: string;
  name: string;
  expertise: string[];
  rating: number;
  experience: string;
  languages: string[];
  location: string;
  profileImage?: string;
  isOnline: boolean;
  responseTime: string;
  bio?: string;
  services?: Service[];
  priceRange?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  processingFee?: number;
}

export interface DateOption {
  id: string;
  label: string;
  date: Date;
  isAvailable: boolean;
}

export interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
}

// Legacy Yoga Class Types (for backward compatibility)
export interface YogaClass {
  _id: string;
  title: string;
  description: string;
  duration: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS';
  days: string;
  start_time: string;
  end_time: string;
  group_online: boolean;
  group_offline: boolean;
  one_to_one_online: boolean;
  one_to_one_offline: boolean;
  home_visit: boolean;
  languages: string;
  is_disease_specific: boolean;
  disease: string;
  price_home_visit: number;
  price_one_to_one_online: number;
  price_one_to_one_offline: number;
  price_group_online: number;
  price_group_offline: number;
  max_participants_online: number;
  max_participants_offline: number;
  allow_mid_month_entry: boolean;
  gender_focus: string;
  location: string;
  city: string;
  time_slot: string;
  latitude: number;
  longitude: number;
  created_at: string;
  instructor?: {
    name: string;
    rating: number;
    experience: string;
  };
} 