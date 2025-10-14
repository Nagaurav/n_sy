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

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import PhoneNumberScreen from './src/screens/PhoneNumberScreen';
import OTPScreen from './src/screens/OTPScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

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
  Settings: undefined;
  HelpSupport: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  ProfessionalsList: { categoryId?: string; searchQuery?: string; categoryName?: string };
  ProfessionalProfile: { professionalId: string };
  DateTimeSelection: { 
    professionalId: string; 
    serviceId?: string; 
    serviceName?: string; 
    price?: number; 
    duration?: number; 
  };
  BookingConfirmation: { bookingData: any };
  Payment: { bookingId: string };
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const Drawer = createDrawerNavigator<DrawerParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();

// Import additional screens for drawer
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';

// Import additional screens for home stack
import ProfessionalsListScreen from './src/screens/ProfessionalsListScreen';
import ProfessionalProfileScreen from './src/screens/ProfessionalProfileScreen';

// Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ProfessionalsList" component={ProfessionalsListScreen} />
      <HomeStack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
      {/* Add other home stack screens here */}
    </HomeStack.Navigator>
  );
};

// Custom Drawer Content Component (will be created separately)
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
          drawerLabel: 'My Appointments',
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
  const { isAuthenticated, isLoading } = useAuth();
  
  // TEMPORARY: Force loading to false after 2 seconds for testing
  const [forceLoaded, setForceLoaded] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔧 FORCE: Setting forceLoaded to true');
      setForceLoaded(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  console.log('🧭 AppNavigator state:', { isLoading, isAuthenticated, forceLoaded });

  // Use forceLoaded OR !isLoading to prevent infinite loading
  if (isLoading && !forceLoaded) {
    console.log('⏳ Showing loading screen...');
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
      <AuthProvider>
        <SafeAreaProvider>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </AuthProvider>
    </Provider>
  );
};

export default App;