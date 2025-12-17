// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { store } from './src/store';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { theme } from './src/theme';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import PhoneNumberScreen from './src/screens/PhoneNumberScreen';
import OTPScreen from './src/screens/OTPScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import DateTimeSelectionScreen from './src/screens/DateTimeSelectionScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import PaymentGatewayScreen from './src/screens/PaymentGatewayScreen';
import BookingSuccessScreen from './src/screens/BookingSuccessScreen';
import BookingFailedScreen from './src/screens/BookingFailedScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PrescriptionsListScreen from './src/screens/PrescriptionsListScreen';
import PrescriptionDetailScreen from './src/screens/PrescriptionDetailScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Navigation Types
export type AuthStackParamList = {
  Splash: undefined;
  PhoneNumber: undefined;
  OTP: { phoneNumber: string };
  Signup: { phoneNumber: string };
};

export type DrawerParamList = {
  HomeStack: undefined;
  Appointments: undefined;
  Profile: undefined;
  Articles: undefined;
  Settings: undefined;
  Support: undefined;
  FAQ: undefined;
  HelpSupport: undefined;
};

// Combined root navigation types
export type RootStackParamList = AuthStackParamList & 
  Omit<DrawerParamList, keyof AuthStackParamList> & 
  Omit<HomeStackParamList, keyof AuthStackParamList | keyof DrawerParamList>;

export type HomeStackParamList = {
  Home: undefined;
  ProfessionalsList: { categoryId?: string; searchQuery?: string; categoryName?: string };
  ProfessionalProfile: { 
    professionalId: string;
    refresh?: boolean;  // Optional refresh flag to trigger data reload
  };
  ClassesList: undefined;
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
    };
  };
  BookingConfirmation: { 
    bookingData: any;
    onGoBack?: () => void;
  };
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
    bookingDetails?: {
      professionalName?: string;
      serviceName?: string;
      date?: string;
      time?: string;
    };
  };
  BookingFailed: {
    bookingId?: string;
    error?: string;
  };
  EditProfile: {
    currentUser: import('./src/types/userProfile').UserProfileData;
  };
  ChatList: undefined;
  ChatScreen: {
    chatId: string;
    title?: string;
    receiverId?: string;
  };
  PrescriptionsList: undefined;
  PrescriptionDetail: {
    prescriptionId: string;
  };
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

// Import additional screens for drawer
import ArticlesScreen from './src/screens/ArticlesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SupportScreen from './src/screens/SupportScreen';
import FaqScreen from './src/screens/FaqScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';

// Import additional screens for home stack
import ProfessionalsListScreen from './src/screens/ProfessionalsListScreen';
import ProfessionalProfileScreen from './src/screens/ProfessionalProfileScreen';
import ClassesListScreen from './src/screens/ClassesListScreen';

// Home Stack Navigator
const HomeStackNavigator = () => (
  <HomeStack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: '#FFFFFF' } 
    }}
  >
    <HomeStack.Screen name="Home" component={HomeScreen} />
    <HomeStack.Screen name="ProfessionalsList" component={ProfessionalsListScreen} />
    <HomeStack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
    <HomeStack.Screen name="ClassesList" component={ClassesListScreen} />
    <HomeStack.Screen name="DateTimeSelection" component={DateTimeSelectionScreen} />
    <HomeStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
    <HomeStack.Screen 
      name="PaymentGateway" 
      component={PaymentGatewayScreen} 
      options={{
        gestureEnabled: false,
      }}
    />
    <HomeStack.Screen 
      name="BookingSuccess" 
      component={BookingSuccessScreen} 
      options={{
        gestureEnabled: false,
      }}
    />
    <HomeStack.Screen 
      name="BookingFailed" 
      component={BookingFailedScreen}
      options={{
        gestureEnabled: true,
      }}
    />
    <HomeStack.Screen name="EditProfile" component={EditProfileScreen} />
    <HomeStack.Screen name="ChatList" component={ChatListScreen} />
    <HomeStack.Screen name="ChatScreen" component={ChatScreen} />
    <HomeStack.Screen name="PrescriptionsList" component={PrescriptionsListScreen} />
    <HomeStack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
  </HomeStack.Navigator>
);

// Custom Drawer Content Component
import CustomDrawerContent from './src/components/CustomDrawerContent';

// Main Drawer Navigator
const MainDrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: '#FFFFFF',
          width: 280,
        },
      }}
    >
      <Drawer.Screen 
        name="HomeStack" 
        component={HomeStackNavigator}
        options={{
          drawerLabel: 'Home',
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Appointments" 
        component={AppointmentsScreen}
        options={{
          drawerLabel: 'Appointments',
          drawerIcon: ({ color }) => (
            <Ionicons name="calendar-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          drawerLabel: 'My Profile',
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Articles" 
        component={ArticlesScreen}
        options={{
          drawerLabel: 'Wellness Articles',
          drawerIcon: ({ color }) => (
            <Ionicons name="newspaper-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          drawerLabel: 'Settings',
          drawerIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Support" 
        component={SupportScreen}
        options={{
          drawerLabel: 'Support',
          drawerIcon: ({ color }) => (
            <Ionicons name="headset-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="FAQ" 
        component={FaqScreen}
        options={{
          drawerLabel: 'FAQ',
          drawerIcon: ({ color }) => (
            <Ionicons name="help-buoy-outline" size={24} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="HelpSupport" 
        component={HelpSupportScreen}
        options={{
          drawerLabel: 'Help & Support',
          drawerIcon: ({ color }) => (
            <Ionicons name="help-circle-outline" size={24} color={color} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

// Navigation component that handles auth routing
const AppNavigator = () => {
  const { isAuthenticated, isLoading, isAuthReady } = useAuth();
  
  // Add a timeout to prevent infinite loading
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔧 Navigation ready timeout reached');
      setIsNavigationReady(true);
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, []);

  console.log('🧭 AppNavigator state:', { 
    isLoading, 
    isAuthenticated, 
    isAuthReady,
    isNavigationReady 
  });

  // Show splash screen only if we're still loading and navigation isn't ready
  if ((isLoading || !isAuthReady) && !isNavigationReady) {
    console.log('⏳ Showing splash screen...');
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Splash" component={SplashScreen} />
      </AuthStack.Navigator>
    );
  }

  if (isAuthenticated) {
    console.log('✅ User authenticated, showing main app');
    return <MainDrawerNavigator />;
  } else {
    console.log('❌ User not authenticated, showing auth screens');
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none',
          gestureEnabled: false
        }}
      >
        <AuthStack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
      </AuthStack.Navigator>
    );
  }
};

const App = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;