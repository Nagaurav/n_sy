// Base
import { BaseService } from './base/BaseService';

// Auth
import { AuthService } from './auth/AuthService';

// Booking
import { BookingService } from './booking/BookingService';

// Professional
import { ProfessionalService } from './professional/ProfessionalService';

// Yoga
import { YogaService } from './yoga/YogaService';

// Export all services
export {
  // Base
  BaseService,
  
  // Services
  AuthService,
  BookingService,
  ProfessionalService,
  YogaService,
};

// Export service instances for direct usage
export const authService = AuthService.getInstance();
export const bookingService = BookingService.getInstance();
export const professionalService = ProfessionalService.getInstance();
export const yogaService = YogaService.getInstance();
