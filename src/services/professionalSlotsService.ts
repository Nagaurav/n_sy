// professionalSlotsService.ts
import { 
  makeApiRequest, 
  API_CONFIG, 
  ProfessionalSlotsQueryParams 
} from '../config/api';

// Types for professional slot management
export interface ProfessionalSlot {
  id: string;
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type: 'online' | 'offline' | 'home_visit';
  is_available: boolean;
  is_booked: boolean;
  booking_id?: string;
  price?: number;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSlotRequest {
  professional_id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_type: 'online' | 'offline' | 'home_visit';
  price?: number;
  location?: string;
  notes?: string;
}

export interface UpdateSlotRequest {
  date?: string;
  start_time?: string;
  end_time?: string;
  slot_type?: 'online' | 'offline' | 'home_visit';
  is_available?: boolean;
  price?: number;
  location?: string;
  notes?: string;
}

export interface ProfessionalSlotsResponse {
  success: boolean;
  message: string;
  data: ProfessionalSlot[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SingleSlotResponse {
  success: boolean;
  message: string;
  data: ProfessionalSlot;
}

class ProfessionalSlotsService {
  // Create a new slot
  async createSlot(request: CreateSlotRequest): Promise<SingleSlotResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PROFESSIONAL_SLOTS.CREATE,
        'POST',
        request
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to create slot: ${error.message}`);
    }
  }

  // Get all slots with optional filtering
  async getSlots(params: ProfessionalSlotsQueryParams = {}): Promise<ProfessionalSlotsResponse> {
    try {
      // Set default pagination if not provided
      const queryParams = {
        page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params,
      };

      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PROFESSIONAL_SLOTS.GET_ALL,
        'GET',
        undefined,
        queryParams
      );
      
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch slots: ${error.message}`);
    }
  }

  // Get slots by professional ID
  async getSlotsByProfessional(
    professionalId: string, 
    params: Omit<ProfessionalSlotsQueryParams, 'professional_id'> = {}
  ): Promise<ProfessionalSlotsResponse> {
    return this.getSlots({ ...params, professional_id: professionalId });
  }

  // Get available slots
  async getAvailableSlots(params: Omit<ProfessionalSlotsQueryParams, 'is_available'> = {}): Promise<ProfessionalSlotsResponse> {
    return this.getSlots({ ...params, is_available: true });
  }

  // Get slots by date range
  async getSlotsByDateRange(
    startDate: string, 
    endDate: string, 
    params: Omit<ProfessionalSlotsQueryParams, 'start_date' | 'end_date'> = {}
  ): Promise<ProfessionalSlotsResponse> {
    return this.getSlots({ ...params, start_date: startDate, end_date: endDate });
  }

  // Get slots by date
  async getSlotsByDate(
    date: string, 
    params: Omit<ProfessionalSlotsQueryParams, 'date'> = {}
  ): Promise<ProfessionalSlotsResponse> {
    return this.getSlots({ ...params, date });
  }

  // Get slots by type
  async getSlotsByType(
    slotType: 'online' | 'offline' | 'home_visit', 
    params: Omit<ProfessionalSlotsQueryParams, 'slot_type'> = {}
  ): Promise<ProfessionalSlotsResponse> {
    return this.getSlots({ ...params, slot_type: slotType });
  }

  // Get a specific slot by ID
  async getSlotById(slotId: string): Promise<SingleSlotResponse> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PROFESSIONAL_SLOTS.GET_BY_ID}/${slotId}`
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch slot: ${error.message}`);
    }
  }

  // Update a slot
  async updateSlot(slotId: string, request: UpdateSlotRequest): Promise<SingleSlotResponse> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PROFESSIONAL_SLOTS.UPDATE}/${slotId}`,
        'PUT',
        request
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to update slot: ${error.message}`);
    }
  }

  // Delete a slot
  async deleteSlot(slotId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PROFESSIONAL_SLOTS.DELETE}/${slotId}`,
        'DELETE'
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to delete slot: ${error.message}`);
    }
  }

  // Helper method to check if slot is available for booking
  isSlotAvailableForBooking(slot: ProfessionalSlot): boolean {
    return slot.is_available && !slot.is_booked;
  }

  // Helper method to get slot duration in minutes
  getSlotDuration(slot: ProfessionalSlot): number {
    const startTime = new Date(`2000-01-01T${slot.start_time}`);
    const endTime = new Date(`2000-01-01T${slot.end_time}`);
    return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
  }

  // Helper method to format slot time for display
  formatSlotTime(slot: ProfessionalSlot): string {
    return `${slot.start_time} - ${slot.end_time}`;
  }

  // Helper method to get slot type display name
  getSlotTypeDisplayName(slotType: string): string {
    switch (slotType) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'In-Person';
      case 'home_visit':
        return 'Home Visit';
      default:
        return slotType;
    }
  }

  // Helper method to check if slot is in the past
  isSlotInPast(slot: ProfessionalSlot): boolean {
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
    const now = new Date();
    return slotDateTime < now;
  }

  // Helper method to check if slot is today
  isSlotToday(slot: ProfessionalSlot): boolean {
    const slotDate = new Date(slot.date);
    const today = new Date();
    return slotDate.toDateString() === today.toDateString();
  }

  // Helper method to check if slot is in the future
  isSlotInFuture(slot: ProfessionalSlot): boolean {
    const slotDateTime = new Date(`${slot.date}T${slot.start_time}`);
    const now = new Date();
    return slotDateTime > now;
  }

  // Helper method to get slot status
  getSlotStatus(slot: ProfessionalSlot): 'available' | 'booked' | 'past' | 'unavailable' {
    if (this.isSlotInPast(slot)) {
      return 'past';
    }
    if (slot.is_booked) {
      return 'booked';
    }
    if (slot.is_available) {
      return 'available';
    }
    return 'unavailable';
  }

  // Mock methods for development/testing
  async createSlotMock(request: CreateSlotRequest): Promise<SingleSlotResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockSlot: ProfessionalSlot = {
      id: `slot_${Date.now()}`,
      professional_id: request.professional_id,
      date: request.date,
      start_time: request.start_time,
      end_time: request.end_time,
      slot_type: request.slot_type,
      is_available: true,
      is_booked: false,
      price: request.price || 500,
      location: request.location || 'Online',
      notes: request.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    return {
      success: true,
      message: 'Slot created successfully',
      data: mockSlot,
    };
  }

  async getSlotsMock(params: ProfessionalSlotsQueryParams = {}): Promise<ProfessionalSlotsResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockSlots: ProfessionalSlot[] = [
      {
        id: 'slot_1',
        professional_id: 'prof_1',
        date: '2025-01-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        slot_type: 'online',
        is_available: true,
        is_booked: false,
        price: 500,
        location: 'Online',
        notes: 'Morning session',
        created_at: '2025-01-10T10:00:00.000Z',
        updated_at: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'slot_2',
        professional_id: 'prof_1',
        date: '2025-01-15',
        start_time: '14:00:00',
        end_time: '15:00:00',
        slot_type: 'offline',
        is_available: true,
        is_booked: false,
        price: 800,
        location: 'Yoga Studio, Mumbai',
        notes: 'Afternoon session',
        created_at: '2025-01-10T10:00:00.000Z',
        updated_at: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'slot_3',
        professional_id: 'prof_1',
        date: '2025-01-16',
        start_time: '10:00:00',
        end_time: '11:00:00',
        slot_type: 'home_visit',
        is_available: false,
        is_booked: true,
        booking_id: 'booking_123',
        price: 1200,
        location: 'Client Home',
        notes: 'Booked session',
        created_at: '2025-01-10T10:00:00.000Z',
        updated_at: '2025-01-10T10:00:00.000Z',
      },
      {
        id: 'slot_4',
        professional_id: 'prof_2',
        date: '2025-01-15',
        start_time: '16:00:00',
        end_time: '17:00:00',
        slot_type: 'online',
        is_available: true,
        is_booked: false,
        price: 600,
        location: 'Online',
        notes: 'Evening session',
        created_at: '2025-01-10T10:00:00.000Z',
        updated_at: '2025-01-10T10:00:00.000Z',
      },
    ];
    
    // Apply filters if provided
    let filteredSlots = mockSlots;
    
    if (params.professional_id) {
      filteredSlots = filteredSlots.filter(slot => slot.professional_id === params.professional_id);
    }
    
    if (params.date) {
      filteredSlots = filteredSlots.filter(slot => slot.date === params.date);
    }
    
    if (params.is_available !== undefined) {
      filteredSlots = filteredSlots.filter(slot => slot.is_available === params.is_available);
    }
    
    if (params.slot_type) {
      filteredSlots = filteredSlots.filter(slot => slot.slot_type === params.slot_type);
    }
    
    return {
      success: true,
      message: 'Slots fetched successfully',
      data: filteredSlots,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: filteredSlots.length,
        pages: Math.ceil(filteredSlots.length / (params.limit || 10)),
      },
    };
  }

  async getSlotByIdMock(slotId: string): Promise<SingleSlotResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockSlot: ProfessionalSlot = {
      id: slotId,
      professional_id: 'prof_1',
      date: '2025-01-15',
      start_time: '09:00:00',
      end_time: '10:00:00',
      slot_type: 'online',
      is_available: true,
      is_booked: false,
      price: 500,
      location: 'Online',
      notes: 'Morning session',
      created_at: '2025-01-10T10:00:00.000Z',
      updated_at: '2025-01-10T10:00:00.000Z',
    };
    
    return {
      success: true,
      message: 'Slot fetched successfully',
      data: mockSlot,
    };
  }

  async updateSlotMock(slotId: string, request: UpdateSlotRequest): Promise<SingleSlotResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockSlot: ProfessionalSlot = {
      id: slotId,
      professional_id: 'prof_1',
      date: request.date || '2025-01-15',
      start_time: request.start_time || '09:00:00',
      end_time: request.end_time || '10:00:00',
      slot_type: request.slot_type || 'online',
      is_available: request.is_available !== undefined ? request.is_available : true,
      is_booked: false,
      price: request.price || 500,
      location: request.location || 'Online',
      notes: request.notes || 'Updated session',
      created_at: '2025-01-10T10:00:00.000Z',
      updated_at: new Date().toISOString(),
    };
    
    return {
      success: true,
      message: 'Slot updated successfully',
      data: mockSlot,
    };
  }

  async deleteSlotMock(slotId: string): Promise<{ success: boolean; message: string }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Slot deleted successfully',
    };
  }
}

export const professionalSlotsService = new ProfessionalSlotsService(); 