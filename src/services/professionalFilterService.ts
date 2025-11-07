// professionalFilterService.ts - USING MOCK DATA ONLY
import { 
  makeApiRequest, 
  API_CONFIG, 
  ProfessionalFilterQueryParams 
} from '../config/api';

// Types for professional filter API
export interface Professional {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  category: string;
  expertise: string[];
  experience_years: number;
  rating: number;
  total_reviews: number;
  is_online: boolean;
  is_offline: boolean;
  is_home_visit: boolean;
  consultation_fee: number;
  duration: number; // in minutes
  languages: string[];
  city: string;
  location: string;
  latitude?: number;
  longitude?: number;
  bio: string;
  education: string[];
  certifications: string[];
  specializations: string[];
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  working_hours: {
    start_time: string;
    end_time: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ProfessionalFilterResponse {
  success: boolean;
  message: string;
  data: Professional[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters_applied: {
    is_online?: boolean;
    duration?: number;
    category?: string;
    city?: string;
    min_rating?: number;
    price_range?: {
      min: number;
      max: number;
    };
  };
}

class ProfessionalFilterService {
  // Mock data for professionals
  private mockProfessionals: Professional[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+91-9876543210',
      avatar: 'https://via.placeholder.com/100',
      category: 'yoga',
      expertise: ['Hatha Yoga', 'Vinyasa Flow', 'Meditation', 'Pranayama'],
        experience_years: 8,
        rating: 4.8,
        total_reviews: 156,
        is_online: true,
        is_offline: true,
      is_home_visit: true,
      consultation_fee: 1200,
        duration: 60,
      languages: ['English', 'Hindi'],
        city: 'Mumbai',
      location: 'Andheri West, Mumbai',
        latitude: 19.1197,
        longitude: 72.8464,
      bio: 'Certified yoga instructor with 8+ years of experience in various yoga styles. Specializes in stress relief and flexibility improvement.',
      education: ['Bachelor in Yoga Science', 'Master in Alternative Medicine'],
      certifications: ['RYT-500', 'Prenatal Yoga Certification'],
      specializations: ['Stress Management', 'Weight Loss', 'Flexibility'],
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      },
      working_hours: {
        start_time: '06:00',
        end_time: '20:00',
      },
      created_at: '2023-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Dr. Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '+91-9876543211',
      avatar: 'https://via.placeholder.com/100',
      category: 'ayurveda',
      expertise: ['Panchakarma', 'Herbal Medicine', 'Diet Consultation', 'Detoxification'],
      experience_years: 12,
      rating: 4.6,
      total_reviews: 89,
      is_online: false,
      is_offline: true,
      is_home_visit: true,
      consultation_fee: 1500,
      duration: 90,
      languages: ['Hindi', 'English', 'Sanskrit'],
      city: 'Delhi',
      location: 'Connaught Place, Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      bio: 'Traditional Ayurvedic practitioner with deep knowledge of ancient healing methods. Expert in Panchakarma and herbal treatments.',
      education: ['Bachelor of Ayurvedic Medicine', 'Master in Panchakarma'],
      certifications: ['BAMS', 'Panchakarma Specialist'],
      specializations: ['Digestive Disorders', 'Skin Problems', 'Joint Pain'],
        availability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: false,
          sunday: false,
        },
        working_hours: {
          start_time: '09:00',
          end_time: '18:00',
        },
      created_at: '2022-06-20T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '3',
      name: 'Dr. Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91-9876543212',
      avatar: 'https://via.placeholder.com/100',
      category: 'dietician',
      expertise: ['Weight Management', 'Sports Nutrition', 'Diabetes Care', 'Prenatal Nutrition'],
      experience_years: 6,
        rating: 4.9,
        total_reviews: 234,
      is_online: true,
      is_offline: true,
      is_home_visit: false,
      consultation_fee: 1000,
      duration: 45,
      languages: ['English', 'Hindi', 'Punjabi'],
      city: 'Bangalore',
      location: 'Koramangala, Bangalore',
      latitude: 12.9716,
      longitude: 77.5946,
      bio: 'Registered dietitian specializing in personalized nutrition plans. Expert in weight management and sports nutrition.',
      education: ['Bachelor in Nutrition', 'Master in Clinical Nutrition'],
      certifications: ['RD', 'Sports Nutrition Certification'],
      specializations: ['Weight Loss', 'Muscle Building', 'Diabetes Management'],
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false,
      },
      working_hours: {
        start_time: '08:00',
        end_time: '19:00',
      },
      created_at: '2023-03-10T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '4',
      name: 'Dr. Amit Patel',
      email: 'amit.patel@example.com',
      phone: '+91-9876543213',
      avatar: 'https://via.placeholder.com/100',
      category: 'mental_health',
      expertise: ['Anxiety', 'Depression', 'Stress Management', 'Cognitive Behavioral Therapy'],
      experience_years: 10,
      rating: 4.7,
      total_reviews: 178,
      is_online: true,
      is_offline: false,
      is_home_visit: false,
      consultation_fee: 1800,
      duration: 60,
      languages: ['English', 'Hindi', 'Gujarati'],
      city: 'Pune',
      location: 'Koregaon Park, Pune',
      latitude: 18.5204,
      longitude: 73.8567,
      bio: 'Licensed clinical psychologist with expertise in anxiety, depression, and stress management. Uses evidence-based therapeutic approaches.',
      education: ['Master in Clinical Psychology', 'PhD in Psychology'],
      certifications: ['Licensed Clinical Psychologist', 'CBT Certification'],
      specializations: ['Anxiety Disorders', 'Depression', 'Work Stress'],
      availability: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: false,
        sunday: false,
      },
      working_hours: {
        start_time: '10:00',
        end_time: '18:00',
      },
      created_at: '2021-08-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '5',
      name: 'Dr. Meera Singh',
      email: 'meera.singh@example.com',
      phone: '+91-9876543214',
      avatar: 'https://via.placeholder.com/100',
      category: 'homeopathy',
      expertise: ['Chronic Diseases', 'Skin Problems', 'Child Care', 'Women Health'],
      experience_years: 15,
      rating: 4.5,
      total_reviews: 312,
        is_online: false,
        is_offline: true,
        is_home_visit: true,
      consultation_fee: 800,
      duration: 30,
      languages: ['Hindi', 'English', 'Punjabi'],
      city: 'Chennai',
      location: 'T Nagar, Chennai',
      latitude: 13.0827,
      longitude: 80.2707,
      bio: 'Senior homeopathic physician with 15 years of experience. Specializes in chronic diseases and pediatric care.',
      education: ['Bachelor of Homeopathic Medicine', 'Master in Homeopathy'],
      certifications: ['BHMS', 'Pediatric Homeopathy'],
      specializations: ['Chronic Pain', 'Skin Disorders', 'Child Health'],
        availability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: false,
        },
        working_hours: {
        start_time: '09:00',
        end_time: '17:00',
      },
      created_at: '2020-12-05T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
    {
      id: '6',
      name: 'Dr. Arjun Reddy',
      email: 'arjun.reddy@example.com',
      phone: '+91-9876543215',
      avatar: 'https://via.placeholder.com/100',
      category: 'meditation',
      expertise: ['Mindfulness', 'Transcendental Meditation', 'Breathing Techniques', 'Stress Relief'],
      experience_years: 7,
      rating: 4.8,
      total_reviews: 145,
        is_online: true,
      is_offline: true,
        is_home_visit: false,
      consultation_fee: 1200,
        duration: 45,
      languages: ['English', 'Hindi', 'Telugu'],
      city: 'Hyderabad',
      location: 'Banjara Hills, Hyderabad',
      latitude: 17.3850,
      longitude: 78.4867,
      bio: 'Certified meditation instructor and mindfulness coach. Helps individuals achieve mental clarity and emotional balance.',
      education: ['Master in Psychology', 'Meditation Teacher Training'],
      certifications: ['Mindfulness Teacher', 'TM Instructor'],
      specializations: ['Stress Reduction', 'Focus Improvement', 'Emotional Balance'],
        availability: {
          monday: true,
          tuesday: true,
          wednesday: true,
          thursday: true,
          friday: true,
          saturday: true,
          sunday: true,
        },
        working_hours: {
        start_time: '06:00',
        end_time: '21:00',
      },
      created_at: '2023-05-20T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    },
  ];

  // Get filtered professionals with real API integration
  async getFilteredProfessionals(params: ProfessionalFilterQueryParams): Promise<ProfessionalFilterResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PROFESSIONAL.FILTER,
        'GET',
        undefined,
        params
      );

      if (response.success && response.data) {
        return {
          success: true,
          message: 'Professionals filtered successfully',
          data: response.data.professionals || response.data,
          pagination: {
            page: response.data.page || params.page || 1,
            limit: response.data.limit || params.limit || 10,
            total: response.data.total || response.data.count || 0,
            pages: response.data.total_pages || Math.ceil((response.data.total || response.data.count || 0) / (response.data.limit || params.limit || 10)),
          },
          filters_applied: {
            is_online: params.is_online,
            duration: params.duration,
            category: params.category,
            city: params.city,
            min_rating: params.min_rating,
            price_range: params.min_price && params.max_price ? {
              min: params.min_price,
              max: params.max_price,
            } : undefined,
          },
        };
      } else {
        // Fallback to mock data if API fails
        return this.getFilteredProfessionalsMock(params);
      }
    } catch (error: any) {
      console.error('Error fetching filtered professionals:', error);
      
      // Return mock data as fallback
      return this.getFilteredProfessionalsMock(params);
    }
  }

  // Mock implementation as fallback
  private async getFilteredProfessionalsMock(params: ProfessionalFilterQueryParams): Promise<ProfessionalFilterResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredProfessionals = [...this.mockProfessionals];
    
    // Apply filters
    if (params.is_online !== undefined) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.is_online === params.is_online);
    }
    
    if (params.duration) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.duration === params.duration);
    }
    
    if (params.category) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.category === params.category);
    }
    
    if (params.city) {
      filteredProfessionals = filteredProfessionals.filter(prof => 
        prof.city.toLowerCase().includes(params.city!.toLowerCase())
      );
    }
    
    if (params.min_rating) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.rating >= params.min_rating!);
    }
    
    if (params.min_price) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.consultation_fee >= params.min_price!);
    }
    
    if (params.max_price) {
      filteredProfessionals = filteredProfessionals.filter(prof => prof.consultation_fee <= params.max_price!);
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProfessionals = filteredProfessionals.slice(startIndex, endIndex);
    
    return {
      success: true,
      message: 'Professionals filtered successfully (Fallback Data)',
      data: paginatedProfessionals,
      pagination: {
        page,
        limit,
        total: filteredProfessionals.length,
        pages: Math.ceil(filteredProfessionals.length / limit),
      },
      filters_applied: {
        is_online: params.is_online,
        duration: params.duration,
        category: params.category,
        city: params.city,
        min_rating: params.min_rating,
        price_range: params.min_price && params.max_price ? {
          min: params.min_price,
          max: params.max_price,
        } : undefined,
      },
    };
  }

  // All other methods now use mock data
  async getOnlineProfessionals(params: Omit<ProfessionalFilterQueryParams, 'is_online'> = {}): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, is_online: true });
  }

  async getProfessionalsByDuration(
    duration: number, 
    params: Omit<ProfessionalFilterQueryParams, 'duration'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, duration });
  }

  async getProfessionalsByCategory(
    category: string, 
    params: Omit<ProfessionalFilterQueryParams, 'category'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, category });
  }

  async getProfessionalsByCity(
    city: string, 
    params: Omit<ProfessionalFilterQueryParams, 'city'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, city });
  }

  async getProfessionalsByRating(
    minRating: number, 
    params: Omit<ProfessionalFilterQueryParams, 'min_rating'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, min_rating: minRating });
  }

  async getProfessionalsByPriceRange(
    minPrice: number, 
    maxPrice: number, 
    params: Omit<ProfessionalFilterQueryParams, 'min_price' | 'max_price'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, min_price: minPrice, max_price: maxPrice });
  }

  async getProfessionalsByGender(
    gender: 'all' | 'male' | 'female', 
    params: Omit<ProfessionalFilterQueryParams, 'gender'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, gender });
  }

  async getProfessionalsByLanguages(
    languages: string, 
    params: Omit<ProfessionalFilterQueryParams, 'languages'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, languages });
  }

  async getProfessionalsByAvailability(
    availability: 'available_now' | 'available_today' | 'available_this_week', 
    params: Omit<ProfessionalFilterQueryParams, 'availability'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, availability });
  }

  async getProfessionalsByServiceType(
    serviceType: 'consultation' | 'therapy' | 'class' | 'workshop', 
    params: Omit<ProfessionalFilterQueryParams, 'service_type'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, service_type: serviceType });
  }

  async getProfessionalsNearLocation(
    latitude: number, 
    longitude: number, 
    params: Omit<ProfessionalFilterQueryParams, 'latitude' | 'longitude' | 'sort_by'> = {}
  ): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ 
      ...params, 
      latitude, 
      longitude, 
      sort_by: 'distance' 
    });
  }

  async getProfessionalsByRatingSort(params: Omit<ProfessionalFilterQueryParams, 'sort_by'> = {}): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, sort_by: 'rating' });
  }

  async getProfessionalsByExperienceSort(params: Omit<ProfessionalFilterQueryParams, 'sort_by'> = {}): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, sort_by: 'experience' });
  }

  async getProfessionalsByPriceLowToHigh(params: Omit<ProfessionalFilterQueryParams, 'sort_by'> = {}): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, sort_by: 'price_low_to_high' });
  }

  async getProfessionalsByPriceHighToLow(params: Omit<ProfessionalFilterQueryParams, 'sort_by'> = {}): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals({ ...params, sort_by: 'price_high_to_low' });
  }

  // Utility methods
  isProfessionalAvailableNow(professional: Professional): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    if (!professional.availability[dayName as keyof typeof professional.availability]) {
      return false;
    }
    
    const startTime = professional.working_hours.start_time;
    const endTime = professional.working_hours.end_time;
    
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    
    return currentTime >= startMinutes && currentTime <= endMinutes;
  }

  getNextAvailableTime(professional: Professional): string | null {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Check next 7 days
    for (let i = 0; i < 7; i++) {
      const checkDay = (dayOfWeek + i) % 7;
      const dayName = dayNames[checkDay];
      
      if (professional.availability[dayName as keyof typeof professional.availability]) {
        if (i === 0) {
          // Today - check if still available today
          const currentTime = now.getHours() * 60 + now.getMinutes();
          const endMinutes = parseInt(professional.working_hours.end_time.split(':')[0]) * 60 + 
                           parseInt(professional.working_hours.end_time.split(':')[1]);
          
          if (currentTime < endMinutes) {
            return `Today at ${professional.working_hours.start_time}`;
          }
        } else {
          // Future day
          const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          return `${dayLabels[checkDay]} at ${professional.working_hours.start_time}`;
        }
      }
    }
    
    return null;
  }

  formatConsultationFee(professional: Professional): string {
    return `₹${professional.consultation_fee}`;
  }

  formatDuration(professional: Professional): string {
    if (professional.duration < 60) {
      return `${professional.duration} minutes`;
    } else if (professional.duration === 60) {
      return '1 hour';
    } else {
      const hours = Math.floor(professional.duration / 60);
      const minutes = professional.duration % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
    }
  }

  getRatingDisplay(professional: Professional): string {
    return `${professional.rating} (${professional.total_reviews} reviews)`;
  }

  getExpertiseDisplay(professional: Professional): string {
    return professional.expertise.slice(0, 3).join(', ');
  }

  getLanguagesDisplay(professional: Professional): string {
    return professional.languages.slice(0, 2).join(', ');
  }

  offersServiceType(professional: Professional, serviceType: string): boolean {
    const serviceTypeMap: { [key: string]: boolean } = {
      'online': professional.is_online,
      'offline': professional.is_offline,
      'home_visit': professional.is_home_visit,
    };
    
    return serviceTypeMap[serviceType] || false;
  }

  getDistanceFromUser(
    professional: Professional, 
    userLatitude: number, 
    userLongitude: number
  ): number | null {
    if (!professional.latitude || !professional.longitude) {
      return null;
    }
    
    const R = 6371; // Earth's radius in kilometers
    const dLat = (professional.latitude - userLatitude) * Math.PI / 180;
    const dLon = (professional.longitude - userLongitude) * Math.PI / 180;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLatitude * Math.PI / 180) * Math.cos(professional.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  // Mock data method (kept for compatibility)
  async getFilteredProfessionalsMock(params: ProfessionalFilterQueryParams): Promise<ProfessionalFilterResponse> {
    return this.getFilteredProfessionals(params);
  }
}

export const professionalFilterService = new ProfessionalFilterService(); 