import { BaseService } from '../base/BaseService';
import { ProfessionalFilterQueryParams, ProfessionalSlotsQueryParams } from '../../config/api';

export interface Professional {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profilePicture?: string;
  bio?: string;
  experience: number; // in years
  rating: number;
  totalRatings: number;
  isOnline: boolean;
  isAvailable: boolean;
  languages: string[];
  specializations: string[];
  education: Array<{
    degree: string;
    institution: string;
    year: number;
  }>;
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  serviceTypes: Array<{
    type: 'online' | 'in_person' | 'home_visit';
    price: number;
    duration: number; // in minutes
  }>;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalSlot {
  id: string;
  professionalId: string;
  startTime: string;
  endTime: string;
  date: string;
  type: 'online' | 'offline' | 'home_visit';
  isBooked: boolean;
  isAvailable: boolean;
  bookingId?: string;
  createdAt: string;
  updatedAt: string;
}

export class ProfessionalService extends BaseService {
  private static instance: ProfessionalService;

  private constructor() {
    super('/professionals');
  }

  public static getInstance(): ProfessionalService {
    if (!ProfessionalService.instance) {
      ProfessionalService.instance = new ProfessionalService();
    }
    return ProfessionalService.instance;
  }

  // Get all professionals with filtering and pagination
  async getProfessionals(params?: ProfessionalFilterQueryParams): Promise<{
    success: boolean;
    data?: Professional[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<Professional[]>('', params);
  }

  // Get a single professional by ID
  async getProfessionalById(id: string): Promise<{
    success: boolean;
    data?: Professional;
    message?: string;
  }> {
    return this.get<Professional>(`/${id}`);
  }

  // Get available time slots for a professional
  async getAvailableSlots(
    professionalId: string,
    params?: Omit<ProfessionalSlotsQueryParams, 'professional_id'>
  ): Promise<{
    success: boolean;
    data?: ProfessionalSlot[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<ProfessionalSlot[]>(`/${professionalId}/slots`, params);
  }

  // Create a new slot (for professionals)
  async createSlot(slotData: Omit<ProfessionalSlot, 'id' | 'createdAt' | 'updatedAt' | 'isBooked' | 'bookingId'>): Promise<{
    success: boolean;
    data?: ProfessionalSlot;
    message?: string;
  }> {
    return this.post<ProfessionalSlot>('/slots', slotData);
  }

  // Update a slot (for professionals)
  async updateSlot(
    slotId: string,
    slotData: Partial<Omit<ProfessionalSlot, 'id' | 'createdAt' | 'updatedAt' | 'professionalId'>>
  ): Promise<{
    success: boolean;
    data?: ProfessionalSlot;
    message?: string;
  }> {
    return this.put<ProfessionalSlot>(`/slots/${slotId}`, slotData);
  }

  // Delete a slot (for professionals)
  async deleteSlot(slotId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.delete(`/slots/${slotId}`);
  }

  // Get professional's schedule for a date range
  async getSchedule(
    professionalId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      date: string;
      slots: ProfessionalSlot[];
    }>;
    message?: string;
  }> {
    return this.get(`/${professionalId}/schedule`, { startDate, endDate });
  }

  // Get professional's availability status
  async getAvailability(professionalId: string): Promise<{
    success: boolean;
    data?: {
      isAvailable: boolean;
      nextAvailableSlot?: string;
      availableSlotsToday: number;
      availableSlotsThisWeek: number;
    };
    message?: string;
  }> {
    return this.get(`/${professionalId}/availability`);
  }

  // Update professional's profile
  async updateProfile(
    professionalId: string,
    profileData: Partial<Omit<Professional, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
  ): Promise<{
    success: boolean;
    data?: Professional;
    message?: string;
  }> {
    return this.put<Professional>(`/${professionalId}/profile`, profileData);
  }

  // Check slot availability for a professional
  async checkSlotAvailability(professionalId: string): Promise<{
    success: boolean;
    data?: {
      date: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        isAvailable: boolean;
      }>;
    }[];
    message?: string;
  }> {
    try {
      const response = await this.get(`/check-slot/checkAvailability?professional_id=${professionalId}`);
      
      // Transform the API response to match our expected format
      if (response.success && response.data) {
        const transformedData = Object.entries(response.data).map(([date, slots]) => ({
          date,
          slots: (slots as any[]).map(slot => ({
            startTime: slot.start_time,
            endTime: slot.end_time,
            isAvailable: slot.is_available
          }))
        }));
        
        return {
          success: true,
          data: transformedData,
          message: response.message
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return {
        success: false,
        message: 'Failed to check slot availability. Please try again.'
      };
    }
  }
}
