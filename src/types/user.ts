export interface User {
  id?: number;
  _id?: number | string; // For backward compatibility
  user_id?: number; // Primary ID from API
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | string;
  photo_url?: string;
  
  // Health information
  blood_group?: string;
  height?: number;
  weight?: number;
  marital_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  
  // Preferences
  is_active?: boolean;
  notifications_enabled?: boolean;
  newsletter_enabled?: boolean;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // For backward compatibility with existing code
  [key: string]: any;
}
