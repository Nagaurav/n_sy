/**
 * Service type definition for professional services
 */
export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  is_online?: boolean;
  price_online_15min?: number;
  price_online_30min?: number;
  price_online_60min?: number;
  price_offline_15min?: number;
  price_offline_30min?: number;
  price_offline_60min?: number;
}

/**
 * Service category type for grouping related services
 */
export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  services: Service[];
}

/**
 * Service availability time slot
 */
export interface ServiceAvailability {
  id: string;
  serviceId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  maxParticipants?: number;
  availableSlots: number;
  isRecurring?: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
    endDate?: string;      // ISO string
  };
}

/**
 * Service booking details
 */
export interface ServiceBooking {
  id: string;
  serviceId: string;
  userId: string;
  professionalId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  amount: number;
  currency: string;
  notes?: string;
  createdAt: string;  // ISO string
  updatedAt: string;  // ISO string
}
