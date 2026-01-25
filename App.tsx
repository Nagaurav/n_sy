// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { AppRegistry, StatusBar, View, Text, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { store } from './src/store';
import { useAuth } from './src/hooks/useAuth';
import { theme } from './src/theme';
import { ThemeProvider } from './src/contexts/ThemeContext';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import PhoneNumberScreen from './src/screens/PhoneNumberScreen';
import OTPScreen from './src/screens/OTPScreen';
import SignupScreen from './src/screens/SignupScreen';
import ModernHomeScreen from './src/screens/ModernHomeScreen';
import SelectTimeScreen from './src/screens/SelectTimeScreen';
import BookingConfirmationScreen from './src/screens/BookingConfirmationScreen';
import PaymentGatewayScreen from './src/screens/PaymentGatewayScreen';
import BookingSuccessScreen from './src/screens/BookingSuccessScreen';
import BookingFailedScreen from './src/screens/BookingFailedScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PrescriptionDetailScreen from './src/screens/PrescriptionDetailScreen';
import DietPlanScreen from './src/screens/DietPlanScreen';
import ChatScreen from './src/screens/ChatScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

// Navigation Types
export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
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

import { HomeStackParamList } from './src/types/navigation';

// Combined root navigation types
export type RootStackParamList = AuthStackParamList & 
  Omit<DrawerParamList, keyof AuthStackParamList> & 
  Omit<HomeStackParamList, keyof AuthStackParamList | keyof DrawerParamList> & {
    MainDrawer: undefined;
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
  };

const AuthStack = createStackNavigator<AuthStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();
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
import ClassDetailsScreen from './src/screens/ClassDetailsScreen';
import AppointmentDetailScreen from './src/screens/AppointmentDetailScreen';

// Temporary test component to verify navigation
const RedTestScreen = () => (
  <View style={{ flex: 1, backgroundColor: '#FF0000' }}>
    <Text style={{ marginTop: 100, textAlign: 'center', color: '#FFF', fontSize: 20, fontWeight: 'bold' }}>
      RED TEST SCREEN
    </Text>
  </View>
);

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#FFFFFF' } 
      }}
    >
      <HomeStack.Screen name="Home" component={ModernHomeScreen} />
      <HomeStack.Screen name="ProfessionalsList" component={ProfessionalsListScreen} />
      <HomeStack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
      <HomeStack.Screen name="ClassesList" component={ClassesListScreen} />
      <HomeStack.Screen name="ClassDetails" component={ClassDetailsScreen} />
      <HomeStack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
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
      <HomeStack.Screen name="ChatScreen" component={ChatScreen} />
      <HomeStack.Screen name="PrescriptionDetail" component={PrescriptionDetailScreen} />
      <HomeStack.Screen name="DietPlan" component={DietPlanScreen} />
    </HomeStack.Navigator>
  );
};

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
  const { isAuthenticated, isLoading, isAuthReady, initializeAuth } = useAuth();
  
  // Initialize auth state on mount
  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);
  
  // Add a timeout to prevent infinite loading
  const [isNavigationReady, setIsNavigationReady] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔧 Navigation ready timeout reached');
      setIsNavigationReady(true);
    }, 2000); // 2 second timeout
    
    return () => clearTimeout(timer);
  }, []);

  console.log('🧭 AppNavigator state:', { 
    isLoading, 
    isAuthenticated, 
    isAuthReady,
    isNavigationReady 
  });

  // Show splash screen for 2 seconds using navigation timeout only
  if (!isNavigationReady) {
    return (
      <AuthStack.Navigator screenOptions={{ headerShown: false }}>
        <AuthStack.Screen name="Splash" component={SplashScreen} />
      </AuthStack.Navigator>
    );
  }

  if (isAuthenticated) {
    return (
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* The Home Tabs (Base Layer) */}
        <RootStack.Screen 
          name="MainDrawer" 
          component={MainDrawerNavigator} 
        />
        
        {/* ✅ THE FIX: SelectTime sits on TOP LAYER */}
        <RootStack.Screen
          name="SelectTime"
          component={SelectTimeScreen}
          options={{
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
            gestureEnabled: false,
          }}
        />
      </RootStack.Navigator>
    );
  } else {
    return (
      <AuthStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'none',
          gestureEnabled: false
        }}
        initialRouteName="Login"
      >
        <AuthStack.Screen name="Login" component={LoginScreen} />
        <AuthStack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
        <AuthStack.Screen name="OTP" component={OTPScreen} />
        <AuthStack.Screen name="Signup" component={SignupScreen} />
      </AuthStack.Navigator>
    );
  }
};

const App = () => {
  
  try {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <SafeAreaProvider>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <NavigationContainer
              linking={{
                prefixes: ['samyayog://'],
                config: {
                  screens: {
                    BookingSuccess: 'payment/confirmation/:bookingId',
                  }
                }
              }}
            >
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </ThemeProvider>
      </Provider>
    );
  } catch (error) {
    console.error('❌ [App] Fatal error during app initialization:', error);
    throw error;
  }
};

export default App;