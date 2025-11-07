// navigation/constants.ts
export const ROUTES = {
  SPLASH: 'Splash',
  AUTH: 'Auth',
  HOME: 'Home',
  PROFESSIONAL_PROFILE: 'ProfessionalProfile',
  BOOK_CONSULTATION: 'BookConsultation',
  PAYMENT: 'Payment',
  APPOINTMENT_CONFIRMATION: 'AppointmentConfirmation',
  JOIN_SESSION: 'JoinSession',
  MY_APPOINTMENTS: 'MyAppointments',
  HEALTH_RECORDS: 'HealthRecords',
  PROFILE: 'Profile',
  
  // Category Selection and Mode Selection
  CATEGORY_SELECTION: 'CategorySelection',
  CATEGORY_MODE_SELECTION: 'CategoryModeSelection',
  
  // Unified Yoga Selection Screen
  YOGA_SELECTION: 'YogaSelection',
  
  // Yoga Consultation Flow (Appointment-based)
  CONSULTATION_BOOKING: 'ConsultationBooking',
  DATE_SELECTION: 'DateSelection',
  TIME_SELECTION: 'TimeSelection',
  BOOKING_CONFIRMATION: 'BookingConfirmation',
  BOOKING_SUCCESS: 'BookingSuccess',
  
  // Generic Professional Listing Screen
  PROFESSIONAL_LISTING: 'ProfessionalListing',
  
  // Support & Help
  FAQ_SCREEN: 'FAQScreen',
  CUSTOMER_SUPPORT: 'CustomerSupport',
  FEEDBACK_SCREEN: 'FeedbackScreen',
  
  // Article/Blog routes (consolidated)
  ARTICLE: 'Article',
  ARTICLE_DETAIL: 'ArticleDetail',
} as const;

export type RootStackParamList = {
  [ROUTES.SPLASH]: undefined;
  [ROUTES.AUTH]: undefined;
  [ROUTES.HOME]: undefined;
  [ROUTES.PROFESSIONAL_PROFILE]: { professional: any };
  [ROUTES.BOOK_CONSULTATION]: { professional: any };
  [ROUTES.PAYMENT]: { amount: number; bookingId: string };
  [ROUTES.APPOINTMENT_CONFIRMATION]: { bookingId: string };
  [ROUTES.JOIN_SESSION]: {
    sessionTime: string;
    mode: 'chat' | 'audio' | 'video';
    professional: any;
    service: string;
    duration: number;
    meetingLink?: string;
    chatRoomId?: string;
  };
  [ROUTES.MY_APPOINTMENTS]: undefined;
  [ROUTES.HEALTH_RECORDS]: undefined;
  [ROUTES.PROFILE]: undefined;
  
  // Category Selection and Mode Selection
  [ROUTES.CATEGORY_SELECTION]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };
  [ROUTES.CATEGORY_MODE_SELECTION]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };
  
  // Unified Yoga Selection Screen
  [ROUTES.YOGA_SELECTION]: {
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
  };
  
  // Yoga Consultation Flow
  [ROUTES.CONSULTATION_BOOKING]: { professional: any };
  [ROUTES.DATE_SELECTION]: { professional: any };
  [ROUTES.TIME_SELECTION]: { professional: any; selectedDate: string };
  [ROUTES.BOOKING_CONFIRMATION]: { professional: any; selectedDate: string; selectedTime: string };
  [ROUTES.BOOKING_SUCCESS]: {
    // Generic booking data for all categories
    category?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
    
    // Professional/Instructor details
    professional?: any;
    instructor?: any;
    
    // Booking details
    bookingDetails?: any;
    preferences?: any;
    bookingId?: string;
    
    // Payment details
    paymentDetails?: any;
    
    // Session details (for classes)
    sessionDetails?: any;
    
    // Mode and location
    mode?: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    
    // Package details (for package bookings)
    package?: any;
  };
  
  // Generic Professional Listing Screen
  [ROUTES.PROFESSIONAL_LISTING]: {
    category: string;
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    serviceType?: 'classes' | 'consultation';
  };
  
  // Support & Help
  [ROUTES.FAQ_SCREEN]: undefined;
  [ROUTES.CUSTOMER_SUPPORT]: undefined;
  [ROUTES.FEEDBACK_SCREEN]: { appointmentId?: string; professionalId?: string };
  
  // Article/Blog routes (consolidated)
  [ROUTES.ARTICLE]: undefined;
  [ROUTES.ARTICLE_DETAIL]: { articleId: number };
}; 