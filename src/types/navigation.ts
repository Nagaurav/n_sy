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
  // ───────────────────────────────
  // Auth Flow
  // ───────────────────────────────
  [ROUTES.SPLASH]: undefined;
  [ROUTES.AUTH]: undefined;

  // ───────────────────────────────
  // Main Tabs
  // ───────────────────────────────
  [ROUTES.HOME]: undefined;
  [ROUTES.MY_APPOINTMENTS]: {
    refresh?: boolean;
    tab?: 'upcoming' | 'past';
  };
  [ROUTES.HEALTH_RECORDS]: undefined;
  [ROUTES.PROFILE]: undefined;

  // ───────────────────────────────
  // Navigators
  // ───────────────────────────────
  Main: undefined;
  Auth: undefined;
  MainTabs: undefined;

  // ───────────────────────────────
  // Booking Details
  // ───────────────────────────────
  [ROUTES.BOOKING_DETAILS]: {
    bookingId: string;
    professional: {
      id: string;
      name: string;
      title: string;
      avatar_url?: string;
    };
    date: string;
    time: string;
    duration: number;
    mode: 'online' | 'offline' | 'home_visit';
    amount: number;
    status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
    paymentStatus: 'paid' | 'pending' | 'failed' | 'refunded';
  };

  // ───────────────────────────────
  // Professional Profile Screen
  // ───────────────────────────────
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
    bookingData?: {
      date: string;
      time: string;
      duration: number;
    };
  };

  // ───────────────────────────────
  // Book Consultation Flow
  // ───────────────────────────────
  [ROUTES.BOOK_CONSULTATION]: {
    professional: Professional;
    selectedTime?: string;
    slot?: any;
    mode?: 'online' | 'offline' | 'home_visit';
    location?: {
      city?: string;
      latitude?: number;
      longitude?: number;
    };
    bookingData?: {
      startTime: string;
      endTime: string;
      mode: string;
      location?: any;
      professional: Professional;
      serviceType: string;
      price: number;
    };
  };

  [ROUTES.BOOKING_CONFIRMATION]: {
    instructor?: any;
    professional?: any;
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
    professional?: any;
    instructor?: any;
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

  // ───────────────────────────────
  // Session Management
  // ───────────────────────────────
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

  // ───────────────────────────────
  // Category Flow
  // ───────────────────────────────
  [ROUTES.CATEGORY_SELECTION]: undefined;

  [ROUTES.CATEGORY_MODE_SELECTION]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };

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

  // ───────────────────────────────
  // Yoga Flow
  // ───────────────────────────────
  [ROUTES.YOGA_SELECTION]: {
    mode: 'online' | 'offline' | 'home_visit';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
  };

  // ───────────────────────────────
  // Miscellaneous
  // ───────────────────────────────
  [ROUTES.CONSULTATION_BOOKING]: {
    professional: any;
  };

  [ROUTES.DATE_SELECTION]: {
    professional: any;
  };

  [ROUTES.TIME_SELECTION]: {
    professional: any;
    selectedDate: string;
  };

  // ───────────────────────────────
  // Support & Help
  // ───────────────────────────────
  [ROUTES.FAQ_SCREEN]: undefined;
  [ROUTES.CUSTOMER_SUPPORT]: undefined;
  [ROUTES.FEEDBACK_SCREEN]: {
    appointmentId?: string;
    professionalId?: string;
  };

  // ───────────────────────────────
  // Articles
  // ───────────────────────────────
  [ROUTES.ARTICLE]: undefined;
  [ROUTES.ARTICLE_DETAIL]: {
    articleId: number;
    title?: string;
    image?: string;
    author?: string;
    date?: string;
  };
};

// ───────────────────────────────
// Global Declaration for Navigation Types
// ───────────────────────────────
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
