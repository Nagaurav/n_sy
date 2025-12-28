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
  DateTimeSelection: {
    professionalId: string;
    professionalName: string;
    serviceId: string;
    serviceName: string;
    price: number;
    duration: number;
    serviceDetails: {
      id: string;
      name: string;
      duration: number;
      price: number;
    };
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
