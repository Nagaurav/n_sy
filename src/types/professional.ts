export interface Professional {
  // Core properties
  id: string;
  name: string;
  title: string;
  description: string;
  bio?: string; // Added for bio property
  price: number;
  rating?: number;
  experience?: number;
  specialization?: string[];
  specializations?: string[]; // Alias for specialization
  expertise?: string[]; // Alias for specialization
  languages?: string[];
  
  // Availability
  isOnline?: boolean;
  isOffline?: boolean;
  isHomeVisit?: boolean;
  
  // Location
  location?: {
    city: string;
    latitude: number;
    longitude: number;
  };
  
  // Categories
  category?: string;
  categories?: string[];
  
  // For backward compatibility with existing code
  experience_years?: number;
  total_reviews?: number;
  is_online?: boolean;
  is_offline?: boolean;
  is_home_visit?: boolean;
  
  // Additional metadata
  imageUrl?: string;
  coverPhotoUrl?: string;
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  
  // Social and contact
  email?: string;
  phone?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
  };
  
  // Stats
  totalSessions?: number;
  responseRate?: number;
  responseTime?: string;
}
