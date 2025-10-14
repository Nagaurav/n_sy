/**
 * Authentication Usage Examples for Samyayog App
 * 
 * This file demonstrates how to properly use the authentication system
 * with user ID scoping throughout the application.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppSelector } from '../store';
import { apiService } from '../services/api';
import { ConsultationBooking } from '../types/booking';

// Example 1: Basic Authentication State Access
export const UserProfileExample = () => {
  const { user, isAuthenticated, signOut } = useAuth();

  if (!isAuthenticated) {
    return <Text>Please log in to view your profile</Text>;
  }

  return (
    <View>
      <Text>Welcome, {user?.firstName} {user?.lastName}!</Text>
      <Text>Phone: {user?.phone}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>User ID: {user?._id}</Text>
      
      <TouchableOpacity onPress={signOut}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 2: User-Scoped API Calls
export const UserAppointmentsExample = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserAppointments();
  }, [user?._id]);

  const fetchUserAppointments = async () => {
    if (!user?._id) {
      console.log('No authenticated user found');
      return;
    }

    setLoading(true);
    try {
      // This API call is automatically scoped to the authenticated user
      // The user_id is retrieved from the global auth state
      const response = await apiService.getUserAppointments(user._id);
      
      if (response.success) {
        setAppointments(response.data?.appointments || []);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text>My Appointments ({appointments.length})</Text>
      {loading && <Text>Loading...</Text>}
      {/* Render appointments list */}
    </View>
  );
};

// Example 3: Creating User-Scoped Bookings
export const CreateBookingExample = () => {
  const { user } = useAuth();
  const [isBooking, setIsBooking] = useState(false);

  const createBooking = async (professionalId: string, slotId: string) => {
    if (!user?._id) {
      Alert.alert('Error', 'Please log in to book an appointment');
      return;
    }

    setIsBooking(true);
    try {
      // Create booking payload with user_id from authenticated state
      const bookingData = {
        user_id: user._id,           // ✅ Dynamically retrieved from auth state
        professional_id: professionalId,
        slot_id: slotId,
        duration: 30,
        // coupon_code: 'DISCOUNT10' // Optional
      };

      console.log('Creating booking for user:', user._id);
      
      const response = await apiService.createConsultationBooking(bookingData);
      
      if (response.success) {
        Alert.alert('Success', 'Booking created successfully!');
        // Navigate to appointments or confirmation screen
      } else {
        Alert.alert('Error', response.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert('Error', 'Failed to create booking');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View>
      <TouchableOpacity 
        onPress={() => createBooking('prof_123', 'slot_456')}
        disabled={isBooking || !user}
      >
        <Text>{isBooking ? 'Booking...' : 'Book Appointment'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 4: Using Redux Store Directly
export const ReduxStoreExample = () => {
  // Access auth state directly from Redux store
  const authState = useAppSelector((state) => state.auth);
  
  return (
    <View>
      <Text>Auth Status: {authState.isAuthenticated ? 'Logged In' : 'Logged Out'}</Text>
      <Text>Loading: {authState.isLoading ? 'Yes' : 'No'}</Text>
      <Text>User ID: {authState.user?._id || 'None'}</Text>
      <Text>Token Present: {authState.token ? 'Yes' : 'No'}</Text>
    </View>
  );
};

// Example 5: Conditional Rendering Based on Auth
export const ConditionalContentExample = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <Text>Loading authentication...</Text>;
  }

  if (!isAuthenticated) {
    return (
      <View>
        <Text>Please log in to access this content</Text>
        {/* Show login button or redirect to auth screens */}
      </View>
    );
  }

  return (
    <View>
      <Text>Welcome back, {user?.firstName}!</Text>
      {/* Show authenticated content */}
      <UserAppointmentsExample />
      <CreateBookingExample />
    </View>
  );
};

// Example 6: Error Handling with Authentication
export const ErrorHandlingExample = () => {
  const { user, signOut } = useAuth();
  const [error, setError] = useState('');

  const makeAuthenticatedRequest = async () => {
    try {
      setError('');
      
      if (!user?._id) {
        throw new Error('User not authenticated');
      }

      // Make API call that requires authentication
      const response = await apiService.getUserProfile(user._id);
      
      if (!response.success) {
        throw new Error(response.error || 'Request failed');
      }

      // Handle successful response
      console.log('User profile:', response.data?.user);
      
    } catch (error: any) {
      console.error('Request error:', error);
      setError(error.message);
      
      // If it's an authentication error, consider logging out
      if (error.message.includes('authentication') || error.message.includes('token')) {
        Alert.alert(
          'Session Expired',
          'Please log in again',
          [{ text: 'OK', onPress: () => signOut() }]
        );
      }
    }
  };

  return (
    <View>
      {error && <Text style={{ color: 'red' }}>Error: {error}</Text>}
      <TouchableOpacity onPress={makeAuthenticatedRequest}>
        <Text>Make Authenticated Request</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example 7: User Profile Update
export const UpdateProfileExample = () => {
  const { user, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateProfile = async () => {
    if (!user?._id) return;

    setIsUpdating(true);
    try {
      const updatedData = {
        firstName: 'Updated Name',
        email: 'newemail@example.com'
      };

      // Update via API (this will also update the backend)
      const response = await apiService.updateUserProfile(user._id, updatedData);
      
      if (response.success && response.data?.user) {
        // Update local state
        await updateUser(updatedData);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <TouchableOpacity onPress={updateProfile} disabled={isUpdating}>
      <Text>{isUpdating ? 'Updating...' : 'Update Profile'}</Text>
    </TouchableOpacity>
  );
};

/**
 * Key Principles Demonstrated:
 * 
 * 1. ✅ Always check user authentication before making API calls
 * 2. ✅ Use user._id from auth state, never hardcode or guess user IDs
 * 3. ✅ Handle loading and error states appropriately
 * 4. ✅ Automatic token attachment via Axios interceptors
 * 5. ✅ Proper error handling with session expiration logic
 * 6. ✅ Conditional rendering based on authentication status
 * 7. ✅ User-scoped operations that prevent data leakage
 */
