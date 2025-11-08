import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation } from '@react-navigation/native';

import { consultationBookingService } from '../services/consultationBookingService';
import { colors } from '../theme/colors';
import { fonts } from '../constants/fonts';
import { ROUTES } from '../navigation/constants';

interface BookingRouteParams {
  bookingId: string;
  appointmentData?: any;
}

const BookingDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { bookingId, appointmentData } = route.params as BookingRouteParams;

  const [booking, setBooking] = useState<any>(appointmentData || null);
  const [loading, setLoading] = useState(!appointmentData);
  const [error, setError] = useState<string | null>(null);

  // 🧠 Fetch booking details
  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await consultationBookingService.getConsultationBookingDetails(bookingId);
      if (response?.data) {
        setBooking(response.data);
      } else {
        setError('Booking details not found.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Failed to load booking details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!appointmentData) fetchBookingDetails();
  }, [fetchBookingDetails, appointmentData]);

  // 🧠 Cancel booking
  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await consultationBookingService.cancelConsultationBooking(
                bookingId,
                'Cancelled by user'
              );
              if (response.success) {
                setBooking((prev: any) => ({
                  ...prev,
                  status: 'CANCELLED',
                  booking_status: 'CANCELLED',
                }));
                Alert.alert('Booking Cancelled', 'Your booking was successfully cancelled.');
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking.');
              }
            } catch {
              Alert.alert('Error', 'Unable to cancel the booking. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // 🧠 Computed booking status
  const bookingStatus = useMemo(
    () => (booking?.booking_status || booking?.status || 'UNKNOWN').toUpperCase(),
    [booking]
  );

  const statusLabel = useMemo(() => {
    const map: Record<string, string> = {
      CONFIRMED: 'Confirmed',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      PENDING: 'Pending',
      UNKNOWN: 'Unknown',
    };
    return map[bookingStatus] || 'Unknown';
  }, [bookingStatus]);

  const statusStyle = useMemo(() => {
    switch (bookingStatus) {
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'CANCELLED':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  }, [bookingStatus]);

  // 🧠 Render professional info
  const professional = useMemo(() => {
    return booking?.professional_details || booking?.professional || {};
  }, [booking]);

  const handleJoinSession = async () => {
    const url = booking?.meeting_link;
    if (url) {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open session link.');
      }
    } else {
      Alert.alert('No Session Link', 'Session link not available yet.');
    }
  };

  const handleRebook = () => {
    navigation.navigate(ROUTES.BOOK_CONSULTATION, {
      professional: {
        id: professional.id,
        name: professional.name,
        speciality: professional.speciality,
      },
    });
  };

  const handleFeedback = () => {
    navigation.navigate(ROUTES.FEEDBACK, { bookingId });
  };

  const renderActionButtons = () => {
    if (bookingStatus === 'CONFIRMED' || bookingStatus === 'PENDING') {
      return (
        <>
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleJoinSession}>
            <Ionicons name="videocam-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Join Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleCancelBooking}>
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Cancel Booking</Text>
          </TouchableOpacity>
        </>
      );
    }
    if (bookingStatus === 'COMPLETED') {
      return (
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleFeedback}>
          <Ionicons name="star-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Leave Feedback</Text>
        </TouchableOpacity>
      );
    }
    if (bookingStatus === 'CANCELLED') {
      return (
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleRebook}>
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Book Again</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  // 🧠 UI: Loading / Error / Empty
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="warning-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="document-outline" size={48} color={colors.secondaryText} />
        <Text style={styles.errorText}>No booking details available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.offWhite} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, statusStyle]}>
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.statusSubtext}>
            {bookingStatus === 'CONFIRMED'
              ? 'Your session is confirmed.'
              : bookingStatus === 'CANCELLED'
              ? 'This booking was cancelled.'
              : bookingStatus === 'COMPLETED'
              ? 'Session completed successfully.'
              : 'Awaiting confirmation.'}
          </Text>
        </View>

        {/* Professional Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Professional</Text>
          <View style={styles.profileContainer}>
            <Image
              source={{
                uri: professional.avatar_url || 'https://via.placeholder.com/80',
              }}
              style={styles.profileImage}
            />
            <View>
              <Text style={styles.professionalName}>{professional.name || 'Professional'}</Text>
              <Text style={styles.professionalTitle}>{professional.speciality || 'Therapist'}</Text>
              {professional.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <Text style={styles.ratingText}>{professional.rating.toFixed(1)}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Session Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Details</Text>
          <Text style={styles.detail}>📅 {booking.consultation_date}</Text>
          <Text style={styles.detail}>⏰ {booking.consultation_time}</Text>
          <Text style={styles.detail}>💬 {booking.consultation_type || 'Online'}</Text>
          <Text style={styles.detail}>💵 ₹{booking.total_amount}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>{renderActionButtons()}</View>
      </ScrollView>
    </View>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    color: colors.offWhite,
    fontFamily: fonts.bold,
  },
  backButton: { padding: 6 },
  content: { padding: 16 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, color: colors.secondaryText },
  errorText: { marginTop: 12, color: colors.error, textAlign: 'center' },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.offWhite },
  statusContainer: { alignItems: 'center', marginBottom: 16 },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  statusText: { color: colors.offWhite, fontWeight: '700' },
  statusSubtext: { marginTop: 6, color: colors.secondaryText, textAlign: 'center' },
  statusConfirmed: { backgroundColor: '#4CAF50' },
  statusCompleted: { backgroundColor: '#2196F3' },
  statusCancelled: { backgroundColor: '#F44336' },
  statusPending: { backgroundColor: '#FFC107' },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 18, fontFamily: fonts.bold, marginBottom: 12, color: colors.text },
  profileContainer: { flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 14 },
  professionalName: { fontSize: 17, fontFamily: fonts.bold, color: colors.text },
  professionalTitle: { fontSize: 14, color: colors.secondaryText },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  ratingText: { marginLeft: 4, color: colors.secondaryText },
  detail: { fontSize: 15, color: colors.text, marginVertical: 4 },
  actions: { marginVertical: 20 },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  buttonText: { color: colors.offWhite, marginLeft: 8, fontWeight: '600' },
  primaryButton: { backgroundColor: colors.primaryGreen },
  dangerButton: { backgroundColor: colors.error },
});

export default BookingDetailsScreen;
