// AppNavigator.tsx
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../utils/AuthContext';
import { ROUTES } from './constants';
import { colors } from '../theme/colors';

// Import screens
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ExpertProfileScreen from '../screens/ExpertProfileScreen';
import BookConsultationScreen from '../screens/BookConsultationScreen';
import PaymentScreen from '../screens/PaymentScreen';
import AppointmentConfirmationScreen from '../screens/AppointmentConfirmationScreen';
import JoinSessionScreen from '../screens/JoinSessionScreen';
import MyAppointmentsScreen from '../screens/MyAppointmentsScreen';
import HealthRecordsScreen from '../screens/HealthRecordsScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import new screens
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import CategoryModeSelectionScreen from '../screens/CategoryModeSelectionScreen';
import YogaSelectionScreen from '../screens/YogaSelectionScreen';
import ConsultationBookingScreen from '../screens/ConsultationBookingScreen';
import DateSelectionScreen from '../screens/DateSelectionScreen';
import TimeSelectionScreen from '../screens/TimeSelectionScreen';
import BookingConfirmationScreen from '../screens/BookingConfirmationScreen';
import BookingSuccessScreen from '../screens/BookingSuccessScreen';
import ProfessionalListingScreen from '../screens/ProfessionalListingScreen';

// Import Support & Help screens
import FAQScreen from '../screens/FAQScreen';
import CustomerSupportScreen from '../screens/CustomerSupportScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.offWhite,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName = '';
          switch (route.name) {
            case 'Home':
              iconName = 'home-variant';
              break;
            case 'Appointments':
              iconName = 'calendar-check';
              break;
            case 'Health':
              iconName = 'heart-pulse';
              break;
            case 'Profile':
              iconName = 'account';
              break;
            default:
              iconName = 'circle';
          }
          return <MaterialCommunityIcons name={iconName as any} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Appointments" component={MyAppointmentsScreen} />
      <Tab.Screen name="Health" component={HealthRecordsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function MainStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
      
      {/* Category Selection and Mode Selection */}
      <Stack.Screen name={ROUTES.CATEGORY_SELECTION} component={CategorySelectionScreen} />
      <Stack.Screen name={ROUTES.CATEGORY_MODE_SELECTION} component={CategoryModeSelectionScreen} />
      
      {/* Unified Yoga Selection Screen */}
      <Stack.Screen name={ROUTES.YOGA_SELECTION} component={YogaSelectionScreen} />
      
      {/* Yoga Consultation Flow */}
      <Stack.Screen name={ROUTES.CONSULTATION_BOOKING} component={ConsultationBookingScreen} />
      <Stack.Screen name={ROUTES.DATE_SELECTION} component={DateSelectionScreen} />
      <Stack.Screen name={ROUTES.TIME_SELECTION} component={TimeSelectionScreen} />
      <Stack.Screen name={ROUTES.BOOKING_CONFIRMATION} component={BookingConfirmationScreen} />
      <Stack.Screen name={ROUTES.BOOKING_SUCCESS} component={BookingSuccessScreen} />
      
      {/* Generic Professional Listing Screen */}
      <Stack.Screen name={ROUTES.PROFESSIONAL_LISTING} component={ProfessionalListingScreen} />
      
      {/* Professional Profile and Booking */}
      <Stack.Screen name={ROUTES.PROFESSIONAL_PROFILE} component={ExpertProfileScreen} />
      <Stack.Screen name={ROUTES.BOOK_CONSULTATION} component={BookConsultationScreen} />
      <Stack.Screen name={ROUTES.PAYMENT} component={PaymentScreen} />
      <Stack.Screen name={ROUTES.APPOINTMENT_CONFIRMATION} component={AppointmentConfirmationScreen} />
      
      {/* Session Management */}
      <Stack.Screen name={ROUTES.JOIN_SESSION} component={JoinSessionScreen} />
      
      {/* Support & Help */}
      <Stack.Screen name={ROUTES.FAQ_SCREEN} component={FAQScreen} />
      <Stack.Screen name={ROUTES.CUSTOMER_SUPPORT} component={CustomerSupportScreen} />
      <Stack.Screen name={ROUTES.FEEDBACK_SCREEN} component={FeedbackScreen} />
    </Stack.Navigator>
  );
}

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  console.log('AppNavigator - Auth State:', { isAuthenticated, isLoading });

  if (isLoading) {
    console.log('AppNavigator - Showing SplashScreen (loading)');
    return <SplashScreen />;
  }

  console.log('AppNavigator - Rendering navigation, isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
