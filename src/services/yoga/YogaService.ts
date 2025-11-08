import { BaseService } from '../base/BaseService';
import { YogaClassesQueryParams } from '../../config/api';

export interface YogaClass {
  id: string;
  title: string;
  description: string;
  professionalId: string;
  professionalName: string;
  duration: number; // in minutes
  days: string[];
  startTime: string;
  endTime: string;
  price: {
    groupOnline: number;
    groupOffline: number;
    oneToOneOnline: number;
    oneToOneOffline: number;
    homeVisit: number;
  };
  location?: {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  languages: string[];
  isDiseaseSpecific: boolean;
  diseaseSpecializations?: string[];
  maxParticipants: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class YogaService extends BaseService {
  private static instance: YogaService;

  private constructor() {
    super('/yoga-classes');
  }

  public static getInstance(): YogaService {
    if (!YogaService.instance) {
      YogaService.instance = new YogaService();
    }
    return YogaService.instance;
  }

  // Get all yoga classes with filtering and pagination
  async getClasses(params?: YogaClassesQueryParams): Promise<{
    success: boolean;
    data?: YogaClass[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<YogaClass[]>('', params);
  }

  // Get a single yoga class by ID
  async getClassById(id: string): Promise<{
    success: boolean;
    data?: YogaClass;
    message?: string;
  }> {
    return this.get<YogaClass>(`/${id}`);
  }

  // Create a new yoga class (for professionals)
  async createClass(classData: Omit<YogaClass, 'id' | 'createdAt' | 'updatedAt'>): Promise<{
    success: boolean;
    data?: YogaClass;
    message?: string;
  }> {
    return this.post<YogaClass>('', classData);
  }

  // Update a yoga class (for professionals)
  async updateClass(
    id: string,
    classData: Partial<Omit<YogaClass, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<{
    success: boolean;
    data?: YogaClass;
    message?: string;
  }> {
    return this.put<YogaClass>(`/${id}`, classData);
  }

  // Delete a yoga class (for professionals)
  async deleteClass(id: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    return this.delete(`/${id}`);
  }

  // Get classes by professional ID
  async getClassesByProfessional(professionalId: string, params?: Omit<YogaClassesQueryParams, 'professionalId'>): Promise<{
    success: boolean;
    data?: YogaClass[];
    message?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    return this.get<YogaClass[]>(`/professional/${professionalId}`, params);
  }

  // Get available time slots for a yoga class
  async getAvailableSlots(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      date: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        available: boolean;
        bookingId?: string;
      }>;
    }>;
    message?: string;
  }> {
    return this.get(`/${classId}/slots`, { startDate, endDate });
  }
}
