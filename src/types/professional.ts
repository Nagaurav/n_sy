export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say'
}

export enum WorkArrangement {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  FREELANCE = 'freelance',
  CONTRACT = 'contract',
  ONLINE = 'ONLINE',      // 🆕 Backend work arrangement types
  OFFLINE = 'OFFLINE',    // 🆕 Backend work arrangement types
  HYBRID = 'HYBRID'       // 🆕 Backend work arrangement types
}

export enum ProfessionalRole {
  YOGA_TEACHER = 'yoga_teacher',
  YOGA_INSTRUCTOR = 'yoga_instructor', // 👈 New from your data
  YOGA_THERAPIST = 'yoga_therapist',   // 👈 New from your data
  CENTER_OWNER = 'center_owner',       // 👈 New from your data
  NUTRITIONIST = 'nutritionist',
  PERSONAL_TRAINER = 'personal_trainer',
  THERAPIST = 'therapist',
  OTHER = 'other'
}

export interface SpecialityNew {
  speciality_id: number;
  name: string;
  image_url?: string | null;
}

export interface Professional {
  // Core fields
  id: number;
  user_id: number;
  professional_id?: number; // Backend often uses professional_id as primary key
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  
  // Profile fields
  bio?: string;
  about?: string;
  profile_picture?: string;
  photo_url?: string;          // ✅ Backend sends this, not profile_picture
  experience_years?: number;
  specialization?: string; // Legacy field used by UI
  speciality?: string; // Alias for specialization
  speciality_new?: SpecialityNew; // New nested speciality object from backend
  languages?: string[];
  language?: string;
  rating?: number;             // ✅ Backend rating field
  review_count?: number;       // ✅ Backend review count field
  is_available?: boolean;      // ✅ Backend availability field
  is_verified?: boolean;
  starting_price?: number;     // 🆕 Calculated field from backend
  
  // Location fields
  city?: string;
  state?: string;
  address?: string;
  pin_code?: string;
  pinCode?: string;
  location_latitude?: string | null;
  location_longitude?: string | null;
  location?: {
    latitude?: string | null;
    longitude?: string | null;
  };
  
  // Additional fields
  dob?: string;
  gender?: Gender;
  role?: ProfessionalRole;
  work_arrangement?: WorkArrangement | string; // ✅ Supports enum values and backend string values ('ONLINE', 'OFFLINE', 'HYBRID')
  adhaar_number?: string;
  adhaarNumber?: string;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Aliases for camelCase support
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  profileImage?: string;
}

export interface ProfessionalAuthProfile {
  professional_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  dob: string; // ISO Date String
  pin_code: string;
  address: string;
  city: string;
  state: string;
  gender: Gender;
  location_latitude: string | null;
  location_longitude: string | null;
  adhaar_number: string;
  photo_url: string | null;
  role: ProfessionalRole;
  about: string;
  work_arrangement: WorkArrangement;
  language: string;
  // Optional specialization fields for UI convenience
  specialization?: string;
  speciality?: string;
  speciality_new_name?: string;
  // ✅ ADD THESE NEW FIELDS
  rating?: number;
  review_count?: number;
  starting_price?: number;
  experience_years?: number;
  created_at: string;
  updated_at: string;
}
