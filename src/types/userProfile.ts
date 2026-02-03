// Interface for the nested user_health object
export interface UserHealthProfile {
  id: number;
  blood_group: string; // "O_POSITIVE"
  marital_status: string; // "SINGLE"
  height: number | null; // 
  weight: number | null; // 
  emergency_contact_name: string;
  emergency_contact_phone: string;
  is_active: boolean;
  notifications_enabled: boolean;
  newsletter_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Interface for the main user object in response
export interface UserProfileData {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string; // ISO Date String
  gender: string;
  city: string;
  address?: string; // ✅ Correct (Matches your backend update)
  pin_code?: string; // ✅ Correct (Matches your backend update)
  location_latitude: number | null; // 👈 Change to number
  location_longitude: number | null; // 👈 Change to number
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  user_health: UserHealthProfile; // Nested object
}

// Interface for the full API response
export interface UserProfileApiResponse {
  msg: string;
  user: UserProfileData;
}
