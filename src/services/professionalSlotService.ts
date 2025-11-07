import { Professional, Service, DateOption, TimeSlot } from '../features/yoga/types';

// Base API URL - using the actual working API
const API_BASE_URL = 'http://88.222.241.179:7000/api/v1';

export interface SlotBookingRequest {
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  userId: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface SlotUpdateRequest {
  date?: string;
  time?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface SlotResponse {
  id: string;
  professionalId: string;
  serviceId: string;
  date: string;
  time: string;
  status: string;
  professional?: Professional;
  service?: Service;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlotsResponse {
  slots: SlotResponse[];
  total: number;
}

// Yoga Classes API interfaces
export interface YogaClassResponse {
  _id: string;
  title: string;
  description: string;
  duration: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS';
  days: string;
  start_time: string;
  end_time: string;
  group_online: boolean;
  group_offline: boolean;
  one_to_one_online: boolean;
  one_to_one_offline: boolean;
  home_visit: boolean;
  languages: string;
  is_disease_specific: boolean;
  disease: string;
  price_home_visit: number;
  price_one_to_one_online: number;
  price_one_to_one_offline: number;
  price_group_online: number;
  price_group_offline: number;
  max_participants_online: number;
  max_participants_offline: number;
  allow_mid_month_entry: boolean;
  gender_focus: string;
  location: string;
  city: string;
  time_slot: string;
  latitude: number;
  longitude: number;
  created_at: string;
  instructor?: {
    name: string;
    rating: number;
    experience: string;
  };
}

export interface YogaClassesResponse {
  msg: string;
  data: YogaClassResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface YogaClassesFilters {
  city?: string;
  disease?: string;
  sort_by?: 'price_low_to_high' | 'price_high_to_low';
  near_to_far?: boolean;
  latitude?: number;
  longitude?: number;
  page?: number;
  limit?: number;
}

// Booking API interfaces
export interface CreateBookingRequest {
  professionalId: string;
  serviceId: string;
  userId: string;
  date: string;
  time: string;
  duration?: number;
  paymentMethod?: string;
  amount?: number;
}

export interface BookingResponse {
  success: boolean;
  bookingId: string;
  message?: string;
  data?: any;
}

export interface PaymentStatusResponse {
  bookingId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  paymentMethod?: string;
  amount?: number;
  transactionId?: string;
}

export interface PriceCalculationRequest {
  professionalId: string;
  serviceId: string;
  duration?: number;
  date?: string;
}

export interface PriceCalculationResponse {
  basePrice: number;
  durationPrice?: number;
  totalPrice: number;
  currency: string;
}

export interface BookingDetails {
  bookingId: string;
  professionalId: string;
  professionalName: string;
  serviceId: string;
  serviceName: string;
  userId: string;
  userName: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  amount: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

// Consultation Booking API interfaces
export interface ConsultationBookingRequest {
  professionalId: string;
  serviceId: string;
  userId: string;
  date: string;
  time: string;
  duration?: number;
  paymentMethod?: string;
  amount?: number;
  consultationType?: 'initial' | 'followup' | 'emergency';
  symptoms?: string;
  medicalHistory?: string;
  preferredLanguage?: string;
}

export interface ConsultationBookingResponse {
  success: boolean;
  consultationId: string;
  bookingId: string;
  message?: string;
  data?: any;
}

class ProfessionalSlotService {
  // Mock data for slots
  private mockSlots: SlotResponse[] = [
    {
      id: 'slot_1',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-20',
      time: '09:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_2',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-20',
      time: '10:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_3',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-20',
      time: '11:00',
      status: 'booked',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_4',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-20',
      time: '14:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_5',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-20',
      time: '15:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_6',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-21',
      time: '09:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_7',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-21',
      time: '10:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'slot_8',
      professionalId: '1',
      serviceId: 'service_1',
      date: '2024-01-21',
      time: '11:00',
      status: 'available',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
  ];

  // Mock data for yoga classes
  private mockYogaClasses: YogaClassResponse[] = [
    {
      _id: 'yoga_class_1',
      title: 'Hatha Yoga for Beginners',
      description: 'Perfect for beginners, this class focuses on basic yoga poses and breathing techniques.',
      duration: 'ONE_MONTH',
      days: 'Monday, Wednesday, Friday',
      start_time: '06:00',
      end_time: '07:00',
      group_online: true,
      group_offline: true,
      one_to_one_online: true,
      one_to_one_offline: true,
      home_visit: true,
      languages: 'English, Hindi',
      is_disease_specific: false,
      disease: '',
      price_home_visit: 1500,
      price_one_to_one_online: 800,
      price_one_to_one_offline: 1200,
      price_group_online: 500,
      price_group_offline: 800,
      max_participants_online: 20,
      max_participants_offline: 15,
      allow_mid_month_entry: true,
      gender_focus: 'All',
      location: 'Andheri West, Mumbai',
      city: 'Mumbai',
      time_slot: '06:00-07:00',
      latitude: 19.1197,
      longitude: 72.8464,
      created_at: '2024-01-15T10:00:00Z',
      instructor: {
        name: 'Dr. Sarah Johnson',
        rating: 4.8,
        experience: '8 years',
      },
    },
    {
      _id: 'yoga_class_2',
      title: 'Advanced Vinyasa Flow',
      description: 'Dynamic flow class for intermediate to advanced practitioners.',
      duration: 'THREE_MONTHS',
      days: 'Tuesday, Thursday, Saturday',
      start_time: '07:00',
      end_time: '08:30',
      group_online: true,
      group_offline: true,
      one_to_one_online: true,
      one_to_one_offline: true,
      home_visit: false,
      languages: 'English, Hindi',
      is_disease_specific: false,
      disease: '',
      price_home_visit: 0,
      price_one_to_one_online: 1200,
      price_one_to_one_offline: 1800,
      price_group_online: 800,
      price_group_offline: 1200,
      max_participants_online: 15,
      max_participants_offline: 10,
      allow_mid_month_entry: false,
      gender_focus: 'All',
      location: 'Koramangala, Bangalore',
      city: 'Bangalore',
      time_slot: '07:00-08:30',
      latitude: 12.9716,
      longitude: 77.5946,
      created_at: '2024-01-15T10:00:00Z',
      instructor: {
        name: 'Dr. Priya Sharma',
        rating: 4.9,
        experience: '6 years',
      },
    },
  ];

  // Get professionals with search and pagination - MOCK DATA
  async getProfessionalsBySearch(searchQuery: string, page: number = 1, limit: number = 10): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock response - in real implementation, this would filter professionals based on search query
    return {
      success: true,
      message: 'Search results (Mock Data)',
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        pages: 0,
      },
    };
  }

  // Get professionals with online status and duration filters - MOCK DATA
  async getProfessionalsByFilter(filters: {
    is_online?: boolean;
    duration?: number;
    page?: number;
    limit?: number;
  } = {}): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock response
    return {
      success: true,
      message: 'Filtered professionals (Mock Data)',
      data: [],
      pagination: {
        page: filters.page || 1,
        limit: filters.limit || 10,
        total: 0,
        pages: 0,
      },
    };
  }

  // Get yoga classes with filters - MOCK DATA
  async getYogaClasses(filters: YogaClassesFilters = {}): Promise<YogaClassesResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let filteredClasses = [...this.mockYogaClasses];
    
    // Apply filters
    if (filters.city) {
      filteredClasses = filteredClasses.filter(cls => 
        cls.city.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    
    if (filters.disease) {
      filteredClasses = filteredClasses.filter(cls => 
        cls.disease.toLowerCase().includes(filters.disease!.toLowerCase())
      );
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClasses = filteredClasses.slice(startIndex, endIndex);
    
    return {
      msg: 'Yoga classes fetched successfully (Mock Data)',
      data: paginatedClasses,
      pagination: {
        page,
        limit,
        total: filteredClasses.length,
        pages: Math.ceil(filteredClasses.length / limit),
      },
    };
  }

  // Get yoga classes by city - MOCK DATA
  async getYogaClassesByCity(city: string, filters: Omit<YogaClassesFilters, 'city'> = {}): Promise<YogaClassesResponse> {
    return this.getYogaClasses({ ...filters, city });
  }

  // Get yoga classes by disease - MOCK DATA
  async getYogaClassesByDisease(disease: string, filters: Omit<YogaClassesFilters, 'disease'> = {}): Promise<YogaClassesResponse> {
    return this.getYogaClasses({ ...filters, disease });
  }

  // Get yoga classes sorted by price (low to high) - MOCK DATA
  async getYogaClassesByPriceLowToHigh(filters: Omit<YogaClassesFilters, 'sort_by'> = {}): Promise<YogaClassesResponse> {
    return this.getYogaClasses({ ...filters, sort_by: 'price_low_to_high' });
  }

  // Get yoga classes sorted by price (high to low) - MOCK DATA
  async getYogaClassesByPriceHighToLow(filters: Omit<YogaClassesFilters, 'sort_by'> = {}): Promise<YogaClassesResponse> {
    return this.getYogaClasses({ ...filters, sort_by: 'price_high_to_low' });
  }

  // Get yoga classes sorted by distance (near to far) - MOCK DATA
  async getYogaClassesByDistance(latitude: number, longitude: number, filters: Omit<YogaClassesFilters, 'near_to_far' | 'latitude' | 'longitude'> = {}): Promise<YogaClassesResponse> {
    return this.getYogaClasses({ 
      ...filters, 
      near_to_far: true, 
      latitude, 
      longitude 
    });
  }

  // ===== NEW BOOKING API METHODS - MOCK DATA =====

  // Get all available slots for a professional - MOCK DATA
  async getAvailableSlots(professionalId: string, serviceId?: string, date?: string): Promise<AvailableSlotsResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    let filteredSlots = this.mockSlots.filter(slot => slot.professionalId === professionalId);
      
      if (serviceId) {
      filteredSlots = filteredSlots.filter(slot => slot.serviceId === serviceId);
      }
      
      if (date) {
      filteredSlots = filteredSlots.filter(slot => slot.date === date);
    }
    
    return {
      slots: filteredSlots,
      total: filteredSlots.length,
    };
  }

  // Create a new booking - MOCK DATA
  async createBooking(bookingData: CreateBookingRequest): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const bookingId = `booking_${Date.now()}`;
    
    return {
      success: true,
      bookingId,
      message: 'Booking created successfully (Mock Data)',
      data: {
        ...bookingData,
        id: bookingId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }

  // Get payment status for a booking - MOCK DATA
  async getPaymentStatus(bookingId: string): Promise<PaymentStatusResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      bookingId,
      status: 'completed', // Changed from 'pending' to 'completed' for successful payment flow
      paymentMethod: 'online',
      amount: 1200,
      transactionId: `txn_${Date.now()}`,
    };
  }

  // Calculate price for a booking - MOCK DATA
  async calculatePrice(priceData: PriceCalculationRequest): Promise<PriceCalculationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const basePrice = 1000;
    const durationPrice = priceData.duration ? (priceData.duration - 60) * 10 : 0;
    const totalPrice = basePrice + durationPrice;
    
    return {
      basePrice,
      durationPrice,
      totalPrice,
      currency: 'INR',
    };
  }

  // Get user's bookings - MOCK DATA
  async getUserBookings(userId: string, status?: string): Promise<BookingDetails[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockBookings: BookingDetails[] = [
      {
        bookingId: 'booking_1',
        professionalId: '1',
        professionalName: 'Dr. Sarah Johnson',
        serviceId: 'service_1',
        serviceName: 'Yoga Session',
        userId,
        userName: 'John Doe',
        date: '2024-01-20',
        time: '09:00',
        duration: 60,
        status: 'confirmed',
        amount: 1200,
        paymentStatus: 'completed',
        paymentMethod: 'online',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
      {
        bookingId: 'booking_2',
        professionalId: '2',
        professionalName: 'Dr. Rajesh Kumar',
        serviceId: 'service_2',
        serviceName: 'Ayurvedic Consultation',
        userId,
        userName: 'John Doe',
        date: '2024-01-22',
        time: '14:00',
        duration: 90,
        status: 'pending',
        amount: 1500,
        paymentStatus: 'pending',
        paymentMethod: 'online',
        createdAt: '2024-01-16T10:00:00Z',
        updatedAt: '2024-01-16T10:00:00Z',
      },
    ];
    
    if (status) {
      return mockBookings.filter(booking => booking.status === status);
    }
    
    return mockBookings;
  }

  // Get professional's bookings - MOCK DATA
  async getProfessionalBookings(professionalId: string, status?: string): Promise<BookingDetails[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const mockBookings: BookingDetails[] = [
      {
        bookingId: 'booking_1',
        professionalId,
        professionalName: 'Dr. Sarah Johnson',
        serviceId: 'service_1',
        serviceName: 'Yoga Session',
        userId: 'user_1',
        userName: 'John Doe',
        date: '2024-01-20',
        time: '09:00',
        duration: 60,
        status: 'confirmed',
        amount: 1200,
        paymentStatus: 'completed',
        paymentMethod: 'online',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
      },
    ];
    
    if (status) {
      return mockBookings.filter(booking => booking.status === status);
    }
    
    return mockBookings;
  }

  // Get booking details - MOCK DATA
  async getBookingDetails(bookingId: string): Promise<BookingDetails> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      bookingId,
      professionalId: '1',
      professionalName: 'Dr. Sarah Johnson',
      serviceId: 'service_1',
      serviceName: 'Yoga Session',
      userId: 'user_1',
      userName: 'John Doe',
      date: '2024-01-20',
      time: '09:00',
      duration: 60,
      status: 'confirmed',
      amount: 1200,
      paymentStatus: 'completed',
      paymentMethod: 'online',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };
  }

  // Cancel a booking - MOCK DATA
  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      bookingId,
      message: 'Booking cancelled successfully (Mock Data)',
      data: {
        reason,
        cancelledAt: new Date().toISOString(),
      },
    };
  }

  // Get payment analytics - MOCK DATA
  async getPaymentAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    professionalId?: string;
    status?: string;
  }): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      message: 'Payment analytics (Mock Data)',
      data: {
        totalRevenue: 50000,
        totalBookings: 45,
        averageBookingValue: 1111,
        paymentMethods: {
          online: 35,
          cash: 10,
        },
        statusBreakdown: {
          completed: 40,
          pending: 3,
          cancelled: 2,
        },
      },
    };
  }

  // ===== CONSULTATION BOOKING API METHODS - MOCK DATA =====

  // Create a consultation booking - MOCK DATA
  async createConsultationBooking(consultationData: ConsultationBookingRequest): Promise<ConsultationBookingResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const consultationId = `consultation_${Date.now()}`;
    const bookingId = `booking_${Date.now()}`;
    
    return {
      success: true,
      consultationId,
      bookingId,
      message: 'Consultation booking created successfully (Mock Data)',
      data: {
        ...consultationData,
        id: consultationId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }

  // Get consultants for consultation booking - MOCK DATA
  async getConsultants(params: any): Promise<any> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      message: 'Consultants fetched successfully (Mock Data)',
      data: [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          category: 'yoga',
          rating: 4.8,
          experience: '8 years',
          consultation_fee: 1200,
          is_online: true,
          is_offline: true,
        },
        {
          id: '2',
          name: 'Dr. Rajesh Kumar',
          category: 'ayurveda',
          rating: 4.6,
          experience: '12 years',
          consultation_fee: 1500,
          is_online: false,
          is_offline: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      },
    };
  }

  // Transform API response to DateOption format
  transformToDateOptions(slots: SlotResponse[]): DateOption[] {
    const dateMap = new Map<string, DateOption>();
    
    slots.forEach(slot => {
      const dateKey = slot.date;
      const date = new Date(slot.date);
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          id: dateKey,
          label: this.formatDateLabel(date),
          date: date,
          isAvailable: true
        });
      }
    });
    
    return Array.from(dateMap.values());
  }

  // Transform API response to TimeSlot format
  transformToTimeSlots(slots: SlotResponse[]): TimeSlot[] {
    return slots.map(slot => ({
      id: slot.id,
      time: slot.time,
      isAvailable: slot.status !== 'booked'
    }));
  }

  // Transform yoga class to Professional format
  transformYogaClassToProfessional(yogaClass: YogaClassResponse): Professional {
    return {
      _id: yogaClass._id,
      name: yogaClass.instructor?.name || 'Yoga Instructor',
      expertise: [yogaClass.title, yogaClass.disease || 'General Yoga'],
      rating: yogaClass.instructor?.rating || 4.5,
      experience: yogaClass.instructor?.experience || '5 years',
      languages: yogaClass.languages ? yogaClass.languages.split(',').map(lang => lang.trim()) : ['English'],
      location: yogaClass.location,
      isOnline: yogaClass.one_to_one_online || yogaClass.group_online,
      responseTime: 'Usually responds in 2 hours',
      bio: yogaClass.description,
      priceRange: `₹${Math.min(yogaClass.price_one_to_one_online, yogaClass.price_group_online)}-${Math.max(yogaClass.price_one_to_one_offline, yogaClass.price_home_visit)}`,
      services: [
        {
          _id: 'online_1on1',
          name: 'One-on-One Online Session',
          description: 'Personalized online yoga session',
          price: yogaClass.price_one_to_one_online,
          duration: '60 minutes',
          format: 'Online',
        },
        {
          _id: 'group_online',
          name: 'Group Online Session',
          description: 'Group yoga session online',
          price: yogaClass.price_group_online,
          duration: '60 minutes',
          format: 'Online',
        },
        {
          _id: 'offline_1on1',
          name: 'One-on-One Offline Session',
          description: 'Personalized offline yoga session',
          price: yogaClass.price_one_to_one_offline,
          duration: '60 minutes',
          format: 'Offline',
        },
        {
          _id: 'home_visit',
          name: 'Home Visit Session',
          description: 'Yoga session at your home',
          price: yogaClass.price_home_visit,
          duration: '60 minutes',
          format: 'Home Visit',
        },
      ],
    };
  }

  // Helper function to format date labels
  private formatDateLabel(date: Date): string {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
  }
}

export const professionalSlotService = new ProfessionalSlotService(); 