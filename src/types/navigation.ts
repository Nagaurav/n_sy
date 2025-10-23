import { StackNavigationProp } from '@react-navigation/stack';

export type HomeStackParamList = {
  Home: undefined;
  ClassesList: undefined;
  ProfessionalProfile: { professionalId: string };
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
};

export type ClassesListScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ClassesList'
>;

export type ProfessionalProfileScreenNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'ProfessionalProfile'
>;
