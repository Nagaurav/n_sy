export interface Professional {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  bio?: string;
  profile_picture?: string;
  experience_years?: number;
  specialization?: string;
  languages?: string[];
  rating?: number;
  review_count?: number;
  is_available?: boolean;
  created_at: string;
  updated_at: string;
  // Add other professional fields as needed
}
