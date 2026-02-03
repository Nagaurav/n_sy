import { Professional } from './professional';
import { YogaPlan } from './yogaPlan'; // Ensure you have this type, or use 'any'

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface UnifiedAppointment {
  // Unique ID for React Keys (e.g., "consult-58" or "yoga-12")
  id: string;
  
  // Real ID for API calls
  reference_id: number;
  
  // Distinguisher
  type: 'consultation' | 'yoga_class';
  
  // Common Fields
  status: AppointmentStatus;
  payment_status: string;
  amount: number;
  date: string; // ISO Date String
  
  // Display Helpers
  title: string;       // e.g., "Dr. Smith" or "Morning Yoga"
  subtitle: string;    // e.g., "Cardiologist" or "Mon, Wed, Fri"
  imageUrl?: string;
  
  // Original Data Objects (Optional)
  professional?: Professional;
  yoga_plan?: any;
}
