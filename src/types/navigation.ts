import { ROUTES } from '../navigation/constants';
import { YogaClass } from '../services/yogaClassService';
import { Professional } from './professional';

// Define a type for the main tab navigator
export type MainTabParamList = {
  [ROUTES.HOME]: undefined;
  [ROUTES.MY_APPOINTMENTS]: undefined;
  [ROUTES.HEALTH_RECORDS]: undefined;
  [ROUTES.PROFILE]: undefined;
};

export type RootStackParamList = {
  // Auth Flow
  [ROUTES.SPLASH]: undefined;
  [ROUTES.AUTH]: undefined;
  
  // Main Tabs
  [ROUTES.HOME]: undefined;
  [ROUTES.MY_APPOINTMENTS]: undefined;
  [ROUTES.HEALTH_RECORDS]: undefined;
  [ROUTES.PROFILE]: undefined;
  
  // Professional Flow
  // Main Stack Navigator
  Main: undefined;
  Auth: undefined;
  
  // Tab Navigator
  MainTabs: undefined;
  
  [ROUTES.PROFESSIONAL_PROFILE]: {
    professionalId?: string;
    professional?: Professional;
    mode?: 'online' | 'offline' | 'home_visit';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
    category?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
  };
  
  // Booking Flow
  [ROUTES.APPOINTMENT_CONFIRMATION]: {
    bookingId: string;
    professional: {
      id: string;
      name: string;
      title: string;
    };
    date: string;
    time: string;
    duration: number;
    mode: 'online' | 'offline' | 'home_visit';
    amount: number;
  };

  [ROUTES.BOOK_CONSULTATION]: {
    professional: {
      id: string;
      name: string;
      title: string;
      price: number;
    };
    mode: 'online' | 'offline' | 'home_visit';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
  };
  
  [ROUTES.BOOKING_CONFIRMATION]: {
    instructor?: any; // TODO: Replace with proper type
    professional?: any; // TODO: Replace with proper type
    selectedDate?: string;
    selectedTime?: string;
    mode: 'online' | 'offline' | 'home_visit';
    duration?: number;
    service?: string;
    category?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
  };
  
  [ROUTES.PAYMENT]: {
    amount: number;
    bookingDetails: {
      bookingId: string;
      service?: string;
      selectedDate?: string;
      selectedTime?: string;
      selectedDuration?: number;
      selectedClassType?: 'one_on_one' | 'group';
      mode?: 'online' | 'offline' | 'home_visit';
      location?: any;
      category?: string;
      categoryName?: string;
      categoryIcon?: string;
      categoryColor?: string;
      instructor?: any;
    };
    professional?: {
      id: string;
      name: string;
    };
    paymentUrl?: string;
  };
  
  [ROUTES.BOOKING_SUCCESS]: {
    category?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
    professional?: any; // TODO: Replace with proper type
    instructor?: any; // TODO: Replace with proper type
    bookingDetails?: {
      bookingId?: string;
      selectedDate?: string;
      selectedTime?: string;
      selectedDuration?: number;
      selectedClassType?: 'one_on_one' | 'group';
      mode?: 'online' | 'offline' | 'home_visit';
      location?: any;
    };
    paymentDetails?: {
      amount: number;
      method?: string;
      transactionId: string;
    };
  };
  
  // Session Management
  [ROUTES.JOIN_SESSION]: {
    sessionTime: string;
    mode: 'chat' | 'audio' | 'video';
    professional: {
      id: string;
      name: string;
      title: string;
    };
    service: string;
    duration: number;
    meetingLink?: string;
    chatRoomId?: string;
  };
  
  // Category Selection
  [ROUTES.CATEGORY_SELECTION]: undefined;
  
  [ROUTES.CATEGORY_MODE_SELECTION]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };
  
  // Yoga Flow
  [ROUTES.YOGA_SELECTION]: {
    mode: 'online' | 'offline' | 'home_visit';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
  };
  
  [ROUTES.CONSULTATION_BOOKING]: {
    professional: any; // TODO: Replace with proper type
  };
  
  [ROUTES.DATE_SELECTION]: {
    professional: any; // TODO: Replace with proper type
  };
  
  [ROUTES.TIME_SELECTION]: {
    professional: any; // TODO: Replace with proper type
    selectedDate: string;
  };
  
  // Professional Listing
  [ROUTES.PROFESSIONAL_LISTING]: {
    category: string;
    mode: 'online' | 'offline' | 'home_visit';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
    serviceType?: 'classes' | 'consultation';
  };
  
  // Support & Help
  [ROUTES.FAQ_SCREEN]: undefined;
  [ROUTES.CUSTOMER_SUPPORT]: undefined;
  [ROUTES.FEEDBACK_SCREEN]: {
    appointmentId?: string;
    professionalId?: string;
  };
  
  // Articles
  [ROUTES.ARTICLE]: undefined;
  [ROUTES.ARTICLE_DETAIL]: {
    articleId: number;
    title?: string;
    image?: string;
    author?: string;
    date?: string;
  };
};

// This allows us to use the navigation prop with proper type checking
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
