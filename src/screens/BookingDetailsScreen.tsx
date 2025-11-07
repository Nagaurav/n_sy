import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { bookingService } from '../services/bookingService';
import { colors } from '../theme/colors';
import { fonts } from '../constants/fonts';

interface BookingDetailsScreenProps {
  route: {
    params: {
      bookingId: string;
    };
  };
}

const BookingDetailsScreen: React.FC<BookingDetailsScreenProps> = ({ route }) => {
  const { bookingId } = route.params;
  const navigation = useNavigation();
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bookingService.getBookingDetails(bookingId);
      
      // The service returns BookingDetails directly, not a response wrapper
      setBookingDetails(response);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = () => {
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
              const response = await bookingService.cancelBooking(bookingId);
              if (response.success) {
                // Show basic cancellation success message
                Alert.alert('✅ Cancellation Successful', 'Your booking has been cancelled successfully!', [
                  { text: 'OK', onPress: () => fetchBookingDetails() }
                ]);
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking');
              }
            } catch (err: any) {
              // Handle specific cancellation policy errors
              if (err.message?.includes('24 hours') || 
                  err.message?.includes('12 hours') || 
                  err.message?.includes('within 1 hour')) {
                Alert.alert(
                  '⚠️ Cancellation Not Allowed', 
                  err.message + '\n\nPlease contact support for urgent cancellations.',
                  [
                    { text: 'Contact Support', onPress: () => {
                      // TODO: Navigate to support or open contact
                      Alert.alert('Support', 'Support feature coming soon!');
                    }},
                    { text: 'OK', style: 'cancel' }
                  ]
                );
              } else {
                Alert.alert('Error', err.message || 'Failed to cancel booking');
              }
            }
          }
        }
      ]
    );
  };

  const handleContactProfessional = () => {
    if (bookingDetails?.professional_details?.phone) {
      Linking.openURL(`tel:${bookingDetails.professional_details.phone}`);
    } else {
      Alert.alert('No Contact', 'Professional contact information not available');
    }
  };

  const handleViewReceipt = () => {
    // TODO: Implement receipt generation/viewing
    Alert.alert('Receipt', 'Receipt feature coming soon!');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.error;
      case 'completed':
        return colors.primaryBlue;
      case 'no_show':
        return colors.error;
      default:
        return colors.gray;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'failed':
        return colors.error;
      case 'refunded':
        return colors.info;
      default:
        return colors.gray;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
        <Text style={styles.loadingText}>Loading booking details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={colors.error} />
        <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBookingDetails}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!bookingDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text" size={64} color={colors.gray} />
        <Text style={styles.errorTitle}>Booking Not Found</Text>
        <Text style={styles.errorMessage}>The requested booking could not be found.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
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
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleViewReceipt} style={styles.receiptButton}>
            <Ionicons name="receipt" size={20} color={colors.offWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Booking Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingDetails.booking_status) }]}>
              <Text style={styles.statusText}>{bookingDetails.booking_status?.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Payment Status:</Text>
            <View style={[styles.statusBadge, { backgroundColor: getPaymentStatusColor(bookingDetails.payment_status) }]}>
              <Text style={styles.statusText}>{bookingDetails.payment_status?.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Professional Details Card */}
        {bookingDetails.professional_details && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Professional Details</Text>
            <View style={styles.professionalInfo}>
              {bookingDetails.professional_details.avatar && (
                <Image 
                  source={{ uri: bookingDetails.professional_details.avatar }} 
                  style={styles.professionalAvatar}
                />
              )}
              <View style={styles.professionalText}>
                <Text style={styles.professionalName}>{bookingDetails.professional_details.name}</Text>
                <Text style={styles.professionalSpeciality}>{bookingDetails.professional_details.speciality}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={colors.warning} />
                  <Text style={styles.ratingText}>{bookingDetails.professional_details.rating}</Text>
                  <Text style={styles.experienceText}>
                    {bookingDetails.professional_details.experience_years} years experience
                  </Text>
                </View>
              </View>
            </View>
            {bookingDetails.professional_details.bio && (
              <Text style={styles.bioText}>{bookingDetails.professional_details.bio}</Text>
            )}
            <TouchableOpacity style={styles.contactButton} onPress={handleContactProfessional}>
              <Ionicons name="call" size={16} color={colors.primaryBlue} />
              <Text style={styles.contactButtonText}>Contact Professional</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Session Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{bookingDetails.booking_date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{bookingDetails.booking_time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="hourglass" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{bookingDetails.duration} minutes</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Type:</Text>
            <Text style={styles.detailValue}>
              {bookingDetails.booking_type?.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          {bookingDetails.slot_details && (
            <View style={styles.detailRow}>
              <Ionicons name="map" size={20} color={colors.gray} />
              <Text style={styles.detailLabel}>Location:</Text>
              <Text style={styles.detailValue}>{bookingDetails.slot_details.location}</Text>
            </View>
          )}
        </View>

        {/* Consultation Specific Details */}
        {bookingDetails.consultation_type && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Consultation Details</Text>
            <View style={styles.detailRow}>
              <Ionicons name="medical" size={20} color={colors.gray} />
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{bookingDetails.consultation_type}</Text>
            </View>
            {bookingDetails.health_concerns && (
              <View style={styles.detailRow}>
                <Ionicons name="heart" size={20} color={colors.gray} />
                <Text style={styles.detailLabel}>Health Concerns:</Text>
                <Text style={styles.detailValue}>{bookingDetails.health_concerns}</Text>
              </View>
            )}
            {bookingDetails.special_instructions && (
              <View style={styles.detailRow}>
                <Ionicons name="information-circle" size={20} color={colors.gray} />
                <Text style={styles.detailLabel}>Instructions:</Text>
                <Text style={styles.detailValue}>{bookingDetails.special_instructions}</Text>
              </View>
            )}
            {bookingDetails.emergency_contact && (
              <View style={styles.detailRow}>
                <Ionicons name="warning" size={20} color={colors.gray} />
                <Text style={styles.detailLabel}>Emergency Contact:</Text>
                <Text style={styles.detailValue}>
                  {bookingDetails.emergency_contact.name} ({bookingDetails.emergency_contact.relationship})
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Payment Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="card" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Amount:</Text>
            <Text style={styles.amountText}>₹{bookingDetails.total_amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="wallet" size={20} color={colors.gray} />
            <Text style={styles.detailLabel}>Method:</Text>
            <Text style={styles.detailValue}>{bookingDetails.payment_method}</Text>
          </View>
          {bookingDetails.cancellation_policy && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle" size={20} color={colors.gray} />
              <Text style={styles.detailLabel}>Cancellation Policy:</Text>
              <Text style={styles.detailValue}>{bookingDetails.cancellation_policy}</Text>
            </View>
          )}
        </View>

        {/* Notes Card */}
        {bookingDetails.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{bookingDetails.notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {bookingDetails.booking_status === 'confirmed' && (
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
              <Ionicons name="close-circle" size={20} color={colors.offWhite} />
              <Text style={styles.cancelButtonText}>Cancel Booking</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Back to Bookings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primaryBlue,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.offWhite,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray,
    fontFamily: fonts.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 8,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
  retryButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  statusCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: colors.offWhite,
    fontSize: 12,
    fontFamily: fonts.bold,
  },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  professionalText: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  professionalSpeciality: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.medium,
    marginLeft: 4,
    marginRight: 12,
  },
  experienceText: {
    fontSize: 14,
    color: colors.gray,
    fontFamily: fonts.regular,
  },
  bioText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primaryBlue,
    borderRadius: 8,
  },
  contactButtonText: {
    color: colors.primaryBlue,
    fontSize: 16,
    fontFamily: fonts.medium,
    marginLeft: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 16,
    fontFamily: fonts.medium,
    color: colors.text,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  amountText: {
    fontSize: 18,
    color: colors.success,
    fontFamily: fonts.bold,
    flex: 1,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    backgroundColor: colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cancelButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontFamily: fonts.medium,
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});

export default BookingDetailsScreen;
