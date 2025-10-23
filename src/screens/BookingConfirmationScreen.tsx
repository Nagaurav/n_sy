import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface BookingData {
  professional_id: string;
  professionalName: string;
  slot_id: string;
  date: string;
  time: string;
  duration: number;
  coupon_code?: string;
}

const BookingConfirmationScreen = ({ navigation, route }: any) => {
  const { bookingData }: { bookingData: BookingData } = route.params;
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirmBooking = async () => {
    if (!user?._id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Create booking payload with user_id from authenticated user state
      const bookingPayload = {
        user_id: user._id, // Dynamically retrieved from global auth state
        professional_id: bookingData.professional_id,
        slot_id: bookingData.slot_id,
        duration: bookingData.duration,
        ...(bookingData.coupon_code && { coupon_code: bookingData.coupon_code }),
      };

      console.log('Creating booking with payload:', bookingPayload);

      const response = await apiService.createConsultationBooking(bookingPayload);

      if (response.success && response.data) {
        Alert.alert(
          'Booking Confirmed!',
          'Your consultation has been successfully booked.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to appointments screen or home
                navigation.navigate('Appointments');
              },
            },
          ]
        );
      } else {
        setError(response.error || 'Failed to create booking. Please try again.');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.bookingCard}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Professional:</Text>
            <Text style={styles.detailValue}>{bookingData.professionalName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{bookingData.date}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{bookingData.time}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{bookingData.duration} minutes</Text>
          </View>

          {bookingData.coupon_code && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Coupon:</Text>
              <Text style={styles.detailValue}>{bookingData.coupon_code}</Text>
            </View>
          )}
        </View>

        <View style={styles.userCard}>
          <Text style={styles.cardTitle}>Patient Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name:</Text>
            <Text style={styles.detailValue}>
              {user?.first_name || user?.firstName} {user?.last_name || user?.lastName}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <Text style={styles.detailValue}>{user?.phone}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <Text style={styles.detailValue}>{user?.email}</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isLoading && styles.buttonDisabled]}
            onPress={handleConfirmBooking}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});

export default BookingConfirmationScreen;
