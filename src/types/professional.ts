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
  CONTRACT = 'contract'
}

export enum ProfessionalRole {
  YOGA_TEACHER = 'yoga_teacher',
  NUTRITIONIST = 'nutritionist',
  PERSONAL_TRAINER = 'personal_trainer',
  THERAPIST = 'therapist',
  OTHER = 'other'
}

export interface Professional {
  // Core fields
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  
  // Profile fields
  bio?: string;
  about?: string;
  profile_picture?: string;
  photo_url?: string;
  experience_years?: number;
  specialization?: string;
  languages?: string[];
  language?: string;
  rating?: number;
  review_count?: number;
  is_available?: boolean;
  
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
  work_arrangement?: WorkArrangement;
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
  created_at: string;
  updated_at: string;
}
