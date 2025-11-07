// yogaClassesService.ts
import { getEndpointUrl, getAuthToken, API_CONFIG } from '../config/api';

// Types for Yoga Classes API
export interface YogaPackage {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  duration: number; // in days
  sessionsCount: number;
  features: string[];
  instructor: {
    id: string;
    name: string;
    image: string;
    rating: number;
    experience: number;
  };
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  mode: 'online' | 'offline' | 'hybrid';
  location?: {
    city: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  schedule: {
    days: string[];
    time: string;
    timezone: string;
  };
  maxParticipants?: number;
  currentParticipants?: number;
  isPopular?: boolean;
  isRecommended?: boolean;
  image: string;
  tags: string[];
}

export interface YogaClassesFilters {
  mode?: 'online' | 'offline';
  group_online?: boolean;
  group_offline?: boolean;
  city?: string;
  latitude?: number;
  longitude?: number;
  price_min?: number;
  price_max?: number;
  disease?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  category?: string;
  sort?: 'price_low_to_high' | 'price_high_to_low' | 'near_to_far' | 'popular' | 'newest';
  page?: number;
  limit?: number;
}

export interface YogaClassesResponse {
  success: boolean;
  message: string;
  data: {
    packages: YogaPackage[];
    pagination: {
      current_page: number;
      total_pages: number;
      total_items: number;
      items_per_page: number;
      has_next: boolean;
      has_prev: boolean;
    };
  };
}

export interface BookingRequest {
  packageId: string;
  paymentMethod: 'upi' | 'card' | 'wallet' | 'netbanking';
  paymentDetails: any;
}

export interface BookingResponse {
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    package: YogaPackage;
    paymentStatus: 'pending' | 'completed' | 'failed';
    bookingDetails: {
      startDate: string;
      endDate: string;
      sessions: any[];
    };
  };
}

class YogaClassesService {
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    headers?: Record<string, string>
  ): Promise<any> {
    try {
      const url = getEndpointUrl(endpoint);
      const token = await getAuthToken();
      
      const requestHeaders: Record<string, string> = {
        ...API_CONFIG.DEFAULT_HEADERS,
        ...headers,
      };

      if (token) {
        requestHeaders.Authorization = `Bearer ${token}`;
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('YogaClassesService API Error:', error);
      throw new Error(error.message || 'Network request failed');
    }
  }

  // Get Yoga Classes packages with filters
  async getYogaClasses(filters: YogaClassesFilters = {}): Promise<YogaClassesResponse> {
    // Use mock data as requested by user
    return this.getYogaClassesMock(filters);
  }

  // Get package details by ID
  async getPackageDetails(packageId: string): Promise<{ success: boolean; data: YogaPackage }> {
    try {
      const endpoint = `/api/v1/user/yoga-classes/${packageId}`;
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch package details: ${error.message}`);
    }
  }

  // Book a yoga package
  async bookPackage(request: BookingRequest): Promise<BookingResponse> {
    try {
      const endpoint = '/api/v1/user/yoga-classes/book';
      const response = await this.makeRequest(endpoint, 'POST', request);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to book package: ${error.message}`);
    }
  }

  // Get user's booked packages
  async getMyBookings(): Promise<{ success: boolean; data: any[] }> {
    try {
      const endpoint = '/api/v1/user/yoga-classes/my-bookings';
      const response = await this.makeRequest(endpoint);
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch bookings: ${error.message}`);
    }
  }

  // Mock methods for development/testing
  async getYogaClassesMock(filters: YogaClassesFilters = {}): Promise<YogaClassesResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockPackages: YogaPackage[] = [
      {
        id: '1',
        title: 'Beginner Yoga Foundation',
        description: 'Perfect for those new to yoga. Learn basic poses and breathing techniques.',
        price: 999,
        originalPrice: 1499,
        duration: 30,
        sessionsCount: 12,
        features: [
          'Basic asanas',
          'Breathing exercises',
          'Meditation basics',
          'Flexibility training'
        ],
        instructor: {
          id: 'instructor_1',
          name: 'Priya Sharma',
          image: 'https://example.com/instructor1.jpg',
          rating: 4.8,
          experience: 5
        },
        category: 'Hatha Yoga',
        level: 'beginner',
        mode: filters.mode || 'online',
        location: filters.mode === 'offline' ? {
          city: 'Mumbai',
          address: 'Andheri West, Mumbai',
          latitude: 19.1197,
          longitude: 72.8464
        } : undefined,
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '07:00 AM',
          timezone: 'Asia/Kolkata'
        },
        maxParticipants: 15,
        currentParticipants: 8,
        isPopular: true,
        image: 'https://example.com/yoga1.jpg',
        tags: ['beginner', 'flexibility', 'stress-relief']
      },
      {
        id: '2',
        title: 'Advanced Power Yoga',
        description: 'Intensive workout combining strength, flexibility, and cardio.',
        price: 1999,
        originalPrice: 2499,
        duration: 45,
        sessionsCount: 20,
        features: [
          'Advanced asanas',
          'Strength building',
          'Cardio workout',
          'Weight loss focus'
        ],
        instructor: {
          id: 'instructor_2',
          name: 'Rajesh Kumar',
          image: 'https://example.com/instructor2.jpg',
          rating: 4.9,
          experience: 8
        },
        category: 'Power Yoga',
        level: 'advanced',
        mode: filters.mode || 'online',
        location: filters.mode === 'offline' ? {
          city: 'Mumbai',
          address: 'Bandra East, Mumbai',
          latitude: 19.0596,
          longitude: 72.8295
        } : undefined,
        schedule: {
          days: ['Tuesday', 'Thursday', 'Saturday'],
          time: '06:00 AM',
          timezone: 'Asia/Kolkata'
        },
        maxParticipants: 10,
        currentParticipants: 6,
        isRecommended: true,
        image: 'https://example.com/yoga2.jpg',
        tags: ['advanced', 'strength', 'weight-loss']
      },
      {
        id: '3',
        title: 'Meditation & Mindfulness',
        description: 'Learn meditation techniques for mental peace and clarity.',
        price: 799,
        originalPrice: 999,
        duration: 21,
        sessionsCount: 7,
        features: [
          'Meditation techniques',
          'Mindfulness practices',
          'Stress reduction',
          'Mental clarity'
        ],
        instructor: {
          id: 'instructor_3',
          name: 'Anita Desai',
          image: 'https://example.com/instructor3.jpg',
          rating: 4.7,
          experience: 6
        },
        category: 'Meditation',
        level: 'beginner',
        mode: filters.mode || 'online',
        schedule: {
          days: ['Monday', 'Wednesday', 'Friday'],
          time: '08:00 PM',
          timezone: 'Asia/Kolkata'
        },
        maxParticipants: 20,
        currentParticipants: 12,
        image: 'https://example.com/yoga3.jpg',
        tags: ['meditation', 'mindfulness', 'stress-relief']
      }
    ];

    // Apply filters
    let filteredPackages = mockPackages;

    if (filters.mode) {
      filteredPackages = filteredPackages.filter(pkg => pkg.mode === filters.mode);
    }

    if (filters.price_min) {
      filteredPackages = filteredPackages.filter(pkg => pkg.price >= filters.price_min!);
    }

    if (filters.price_max) {
      filteredPackages = filteredPackages.filter(pkg => pkg.price <= filters.price_max!);
    }

    if (filters.level) {
      filteredPackages = filteredPackages.filter(pkg => pkg.level === filters.level);
    }

    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'price_low_to_high':
          filteredPackages.sort((a, b) => a.price - b.price);
          break;
        case 'price_high_to_low':
          filteredPackages.sort((a, b) => b.price - a.price);
          break;
        case 'popular':
          filteredPackages.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
          break;
        case 'near_to_far':
          // Mock distance calculation
          filteredPackages.sort((a, b) => {
            const aDistance = a.location ? Math.random() * 10 : 0;
            const bDistance = b.location ? Math.random() * 10 : 0;
            return aDistance - bDistance;
          });
          break;
      }
    }

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPackages = filteredPackages.slice(startIndex, endIndex);

    return {
      success: true,
      message: 'Yoga classes fetched successfully',
      data: {
        packages: paginatedPackages,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(filteredPackages.length / limit),
          total_items: filteredPackages.length,
          items_per_page: limit,
          has_next: endIndex < filteredPackages.length,
          has_prev: page > 1
        }
      }
    };
  }

  async bookPackageMock(request: BookingRequest): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      message: 'Package booked successfully',
      data: {
        bookingId: `booking_${Date.now()}`,
        package: {
          id: request.packageId,
          title: 'Mock Package',
          description: 'Mock package description',
          price: 999,
          duration: 30,
          sessionsCount: 12,
          features: [],
          instructor: {
            id: 'instructor_1',
            name: 'Mock Instructor',
            image: '',
            rating: 4.5,
            experience: 5
          },
          category: 'Hatha Yoga',
          level: 'beginner',
          mode: 'online',
          schedule: {
            days: ['Monday', 'Wednesday', 'Friday'],
            time: '07:00 AM',
            timezone: 'Asia/Kolkata'
          },
          image: '',
          tags: []
        },
        paymentStatus: 'completed',
        bookingDetails: {
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          sessions: []
        }
      }
    };
  }

  // Utility functions for ExploreScreen
  getClassAvailabilityStatus(yogaClass: any) {
    return {
      hasOnline: yogaClass.group_online || yogaClass.one_to_one_online,
      hasOffline: yogaClass.group_offline || yogaClass.one_to_one_offline,
      hasHomeVisit: yogaClass.home_visit,
    };
  }

  formatDays(daysString: string): string[] {
    if (!daysString) return [];
    
    // Split by comma and clean up
    const days = daysString.split(',').map(day => day.trim());
    
    // Map to proper day names
    const dayMap: Record<string, string> = {
      'mon': 'Monday',
      'tue': 'Tuesday', 
      'wed': 'Wednesday',
      'thu': 'Thursday',
      'fri': 'Friday',
      'sat': 'Saturday',
      'sun': 'Sunday',
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    
    return days.map(day => dayMap[day.toLowerCase()] || day);
  }
}

export const yogaClassesService = new YogaClassesService(); 