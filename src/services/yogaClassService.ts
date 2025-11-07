import { makeApiRequest, API_CONFIG } from '../config/api';

// Yoga Class interface - matches the backend response exactly
export interface YogaClass {
  id: number;
  professional_id: number;
  title: string;
  description: string;
  duration: string; // "ONE_MONTH", "TWO_MONTHS", "THREE_MONTHS", "SIX_MONTHS", "ONE_YEAR"
  days: string; // "Monday,Wednesday,Friday"
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  
  // Session type availability
  group_online: boolean;
  group_offline: boolean;
  one_to_one_online: boolean;
  one_to_one_offline: boolean;
  home_visit: boolean;
  
  // Language and health
  languages: string; // "English,Hindi"
  is_disease_specific: boolean;
  disease: string; // "Back Pain", etc.
  
  // Pricing for different session types
  price_home_visit: number;
  price_one_to_one_online: number | null;
  price_one_to_one_offline: number;
  price_group_online: number;
  price_group_offline: number;
  
  // Capacity and policies
  max_participants_online: number;
  max_participants_offline: number;
  allow_mid_month_entry: boolean;
  gender_focus: string; // "all", "male", "female"
  
  // Location
  location: string;
  city: string | null;
  time_slot: string | null;
  latitude: number | null;
  longitude: number | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Calculated field from backend
  effective_price: number;
}

export interface YogaClassFilters {
  page?: number;
  limit?: number;
  city?: string;
  location?: string;
  professional_id?: number;
  
  // Session type filters (exact match with backend)
  group_online?: boolean;
  group_offline?: boolean;
  one_to_one_online?: boolean;
  one_to_one_offline?: boolean;
  home_visit?: boolean;
  
  // Price filters
  min_price?: number;
  max_price?: number;
  price_type?: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit';
  
  // Disease and health filters
  disease?: string;
  is_disease_specific?: boolean;
  
  // Demographics
  gender_focus?: 'all' | 'male' | 'female';
  
  // Duration filters (exact match with backend)
  duration?: 'ONE_MONTH' | 'TWO_MONTHS' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR';
  
  // Day filters
  days?: string; // "Monday,Wednesday,Friday"
  
  // Time filters
  start_time?: string;
  end_time?: string;
  
  // Language filters
  languages?: string; // "English,Hindi"
  
  // Entry policy
  allow_mid_month_entry?: boolean;
  
  // Sorting options
  sort_by?: 'price_low_to_high' | 'price_high_to_low' | 'effective_price' | 'start_time' | 'created_at';
  sort_order?: 'asc' | 'desc';
  
  // Location filters
  latitude?: number;
  longitude?: number;
  
  // Pagination
  max_participants?: number;
}

export interface YogaClassResponse {
  msg: string; // "Yoga classes fetched successfully"
  data: YogaClass[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class YogaClassService {
  // Get all yoga classes using the user API endpoint
  async getYogaClasses(params: YogaClassFilters = {}): Promise<YogaClassResponse> {
    try {
      console.log('🔍 YogaClassService - Calling API:', API_CONFIG.ENDPOINTS.YOGA_CLASSES);
      console.log('🔍 YogaClassService - With params:', params);
      
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        params
      );
      
      console.log('🔍 YogaClassService - Raw API response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes:', error);
      throw error;
    }
  }

  // Get yoga classes by professional ID
  async getYogaClassesByProfessional(professionalId: number, params: YogaClassFilters = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES}?professional_id=${professionalId}`,
        'GET',
        undefined,
        params
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by professional:', error);
      throw error;
    }
  }

  // Get yoga classes filtered by session type
  async getYogaClassesBySessionType(sessionType: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit', params: Omit<YogaClassFilters, 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit'> = {}): Promise<YogaClassResponse> {
    try {
      const filterParams = { ...params, [sessionType]: true };
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        filterParams
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by session type:', error);
      throw error;
    }
  }

  // Get yoga classes by disease/specialization
  async getYogaClassesByDisease(disease: string, params: Omit<YogaClassFilters, 'disease'> = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, disease, is_disease_specific: true }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by disease:', error);
      throw error;
    }
  }

  // Get yoga classes by duration
  async getYogaClassesByDuration(duration: 'ONE_MONTH' | 'TWO_MONTHS' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'ONE_YEAR', params: Omit<YogaClassFilters, 'duration'> = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, duration }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by duration:', error);
      throw error;
    }
  }

  // Get yoga classes by price range
  async getYogaClassesByPriceRange(minPrice: number, maxPrice: number, priceType: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit', params: Omit<YogaClassFilters, 'min_price' | 'max_price'> = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, min_price: minPrice, max_price: maxPrice, price_type: priceType }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by price range:', error);
      throw error;
    }
  }

  // Get yoga classes by location/city
  async getYogaClassesByLocation(location: string, city?: string, params: Omit<YogaClassFilters, 'location' | 'city'> = {}): Promise<YogaClassResponse> {
    try {
      const filterParams: any = { ...params, location };
      if (city) filterParams.city = city;
      
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        filterParams
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by location:', error);
      throw error;
    }
  }

  // Get yoga classes by days of the week
  async getYogaClassesByDays(days: string[], params: Omit<YogaClassFilters, 'days'> = {}): Promise<YogaClassResponse> {
    try {
      const daysString = days.join(',');
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, days: daysString }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by days:', error);
      throw error;
    }
  }

  // Get yoga classes by gender focus
  async getYogaClassesByGender(gender: string, params: Omit<YogaClassFilters, 'gender_focus'> = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, gender_focus: gender }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes by gender:', error);
      throw error;
    }
  }

  // Get yoga classes that allow mid-month entry
  async getYogaClassesWithMidMonthEntry(params: Omit<YogaClassFilters, 'allow_mid_month_entry'> = {}): Promise<YogaClassResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.USER.YOGA_CLASSES,
        'GET',
        undefined,
        { ...params, allow_mid_month_entry: true }
      );
      
      return response;
    } catch (error) {
      console.error('Error fetching yoga classes with mid-month entry:', error);
      throw error;
    }
  }

  // Helper methods for UI display
  getSessionTypesAvailable(yogaClass: YogaClass): string[] {
    const types: string[] = [];
    
    if (yogaClass.group_online) types.push('Group Online');
    if (yogaClass.group_offline) types.push('Group Offline');
    if (yogaClass.one_to_one_online) types.push('One-to-One Online');
    if (yogaClass.one_to_one_offline) types.push('One-to-One Offline');
    if (yogaClass.home_visit) types.push('Home Visit');
    
    return types;
  }

  getPriceForSessionType(yogaClass: YogaClass, sessionType: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit'): number | null {
    switch (sessionType) {
      case 'group_online':
        return yogaClass.price_group_online;
      case 'group_offline':
        return yogaClass.price_group_offline;
      case 'one_to_one_online':
        return yogaClass.price_one_to_one_online;
      case 'one_to_one_offline':
        return yogaClass.price_one_to_one_offline;
      case 'home_visit':
        return yogaClass.price_home_visit;
      default:
        return null;
    }
  }

  getLowestPrice(yogaClass: YogaClass): number {
    const prices = [
      yogaClass.price_group_online,
      yogaClass.price_group_offline,
      yogaClass.price_one_to_one_online,
      yogaClass.price_one_to_one_offline,
      yogaClass.price_home_visit
    ].filter((price): price is number => price !== null && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }

  getHighestPrice(yogaClass: YogaClass): number {
    const prices = [
      yogaClass.price_group_online,
      yogaClass.price_group_offline,
      yogaClass.price_one_to_one_online,
      yogaClass.price_one_to_one_offline,
      yogaClass.price_home_visit
    ].filter((price): price is number => price !== null && price > 0);
    
    return prices.length > 0 ? Math.max(...prices) : 0;
  }

  formatDuration(duration: string): string {
    switch (duration) {
      case 'ONE_MONTH':
        return '1 Month';
      case 'TWO_MONTHS':
        return '2 Months';
      case 'THREE_MONTHS':
        return '3 Months';
      case 'SIX_MONTHS':
        return '6 Months';
      case 'ONE_YEAR':
        return '1 Year';
      default:
        return duration;
    }
  }

  formatDays(days: string): string {
    return days.split(',').map(day => day.trim()).join(', ');
  }

  formatLanguages(languages: string): string {
    return languages.split(',').map(lang => lang.trim()).join(', ');
  }

  isSlotAvailable(yogaClass: YogaClass, sessionType: 'group_online' | 'group_offline' | 'one_to_one_online' | 'one_to_one_offline' | 'home_visit'): boolean {
    return yogaClass[sessionType] === true;
  }

  getAvailableSlotsCount(yogaClass: YogaClass): number {
    let count = 0;
    if (yogaClass.group_online) count++;
    if (yogaClass.group_offline) count++;
    if (yogaClass.one_to_one_online) count++;
    if (yogaClass.one_to_one_offline) count++;
    if (yogaClass.home_visit) count++;
    return count;
  }
}

export const yogaClassService = new YogaClassService();
export default yogaClassService;
