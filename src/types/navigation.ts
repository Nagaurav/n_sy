import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { UserProfileData } from './userProfile';

export type HomeStackParamList = {
  Home: undefined;
  ClassesList: {
    bookingType?: 'class' | 'consultation';
  };
  ProfessionalsList: {
    bookingType?: 'class' | 'consultation';
    categoryId?: string;
    searchQuery?: string;
    categoryName?: string;
  };
  ProfessionalProfile: { 
    professionalId: string; 
    refresh?: boolean;  // Optional refresh flag to trigger data reload
  };
  AppointmentDetail: { 
    appointmentId: string;
    professionalId: string;
    userId: string;
    professionalName?: string;
  };
  DateTimeSelection: {
    professionalId: string;
    professionalName: string;
    serviceId?: string;
    serviceName?: string;
    price?: number;
    duration?: number;
    serviceDetails?: {
      id: string;
      name: string;
      duration: number;
      price: number;
      description?: string;
      is_online?: boolean;
      price_online_15min?: number;
      price_online_30min?: number;
      price_online_60min?: number;
      price_offline_15min?: number;
      price_offline_30min?: number;
      price_offline_60min?: number;
    };
  };
  SelectTime: {
    professionalId: string;
    professionalName: string;
    serviceDetails?: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
  };
  BookingConfirmation: { bookingData: any; onGoBack?: () => void };
  PaymentGateway: {
    paymentUrl: string;
    bookingId: string;
    paymentId: string;
    amount: number;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    merchantId?: string;
  };
  BookingSuccess: {
    bookingId: string;
    paymentId: string;
    amount: number;
    status?: string;
    message?: string;
    bookingDetails?: {
      professionalName?: string;
      serviceName?: string;
      date?: string;
      time?: string;
    };
  };
  BookingFailed?: {
    bookingId?: string;
    error?: string;
  };
  EditProfile: {
    currentUser: UserProfileData;
  };
  PrescriptionDetail: { prescriptionId: string };
  ChatScreen: { chatId: string; appointmentId: string; title?: string; receiverId?: string };
};

export type ClassesListScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ClassesList'
>;

export type ProfessionalProfileScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ProfessionalProfile'
>;

// Bottom Tab Navigator Types
export type MainTabParamList = {
  Home: undefined;
  Appointments: undefined;
  Profile: undefined;
};

export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
