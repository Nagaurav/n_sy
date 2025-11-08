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
import { consultationBookingService } from '../services/consultationBookingService';
import { colors } from '../theme/colors';
import { fonts } from '../constants/fonts';

interface BookingDetailsScreenProps {
  route: {
    params: {
      bookingId: string;
      appointmentData?: any; // Optional pre-fetched data
    };
  };
}

const BookingDetailsScreen: React.FC<BookingDetailsScreenProps> = ({ route }) => {
  const { bookingId, appointmentData } = route.params;
  const navigation = useNavigation();
  const [bookingDetails, setBookingDetails] = useState<any>(appointmentData || null);
  const [loading, setLoading] = useState(!appointmentData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentData) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await consultationBookingService.getConsultationBookingDetails(bookingId);
      
      if (response) {
        setBookingDetails(response);
      } else {
        setError('Booking details not found');
      }
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.message || 'An error occurred while fetching booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      Alert.alert(
        'Cancel Booking',
        'Are you sure you want to cancel this booking?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel',
            style: 'destructive',
            onPress: async () => {
              const response = await consultationBookingService.cancelConsultationBooking(
                bookingId,
                'Cancelled by user'
              );
              
              if (response.success) {
                Alert.alert('Success', 'Your booking has been cancelled successfully.');
                // Update local state to reflect cancellation
                setBookingDetails({
                  ...bookingDetails,
                  status: 'CANCELLED',
                  booking_status: 'CANCELLED'
                });
              } else {
                Alert.alert('Error', response.message || 'Failed to cancel booking. Please try again.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      Alert.alert('Error', 'An error occurred while cancelling your booking.');
    } finally {
      setLoading(false);
    }
  };

  const renderActionButtons = () => {
    const status = bookingDetails.booking_status || bookingDetails.status;
    const isUpcoming = status === 'CONFIRMED' || status === 'PENDING';
    const isCompleted = status === 'COMPLETED';
    const isCancelled = status === 'CANCELLED';
    
    return (
      <View style={styles.actionButtons}>
        {isUpcoming && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                // Handle join session for online consultations
                if (bookingDetails.consultation_type === 'online' && bookingDetails.meeting_link) {
                  Linking.openURL(bookingDetails.meeting_link);
                } else {
                  // Open chat or call interface
                  Alert.alert('Contact', 'Would you like to message or call the professional?', [
                    { text: 'Message', onPress: () => console.log('Open chat') },
                    { text: 'Call', onPress: () => console.log('Initiate call') },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }
              }}
            >
              <Ionicons 
                name={bookingDetails.consultation_type === 'online' ? 'videocam-outline' : 'chatbubble-ellipses-outline'} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.buttonText}>
                {bookingDetails.consultation_type === 'online' ? 'Join Session' : 'Message'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleCancelBooking}
            >
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.buttonText}>Cancel Booking</Text>
            </TouchableOpacity>
          </>
        )}
        
        {isCompleted && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => {
              // Navigate to feedback screen
              navigation.navigate('Feedback', { bookingId });
            }}
          >
            <Ionicons name="star-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Leave Feedback</Text>
          </TouchableOpacity>
        )}
        
        {isCancelled && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => {
              // Navigate to rebook screen
              navigation.navigate('BookConsultation', {
                professional: bookingDetails.professional_details || {
                  id: bookingDetails.professional_id,
                  name: bookingDetails.professional_name
                }
              });
            }}
          >
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Book Again</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProfessionalInfo = () => {
    const professional = bookingDetails.professional_details || bookingDetails.professional;
    const consultationDate = bookingDetails.consultation_date || bookingDetails.date;
    const consultationTime = bookingDetails.consultation_time || bookingDetails.time;
    const mode = bookingDetails.consultation_type || bookingDetails.mode || 'online';
    
    return (
      <View style={styles.profileContainer}>
        <Image
          source={{ uri: professional?.avatar_url || 'https://via.placeholder.com/80' }}
          style={styles.profileImage}
          defaultSource={require('../assets/images/avatar-placeholder.png')}
        />
        <View style={styles.profileInfo}>
          <Text style={styles.professionalName}>
            {professional?.name || 'Professional'}
          </Text>
          <Text style={styles.professionalTitle}>
            {professional?.speciality || 'Therapist'}
          </Text>
          {professional?.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>
                {professional.rating.toFixed(1)} 
                {professional.total_ratings ? `(${professional.total_ratings} reviews)` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
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

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return styles.statusConfirmed;
      case 'COMPLETED':
        return styles.statusCompleted;
      case 'CANCELLED':
        return styles.statusCancelled;
      case 'PENDING':
      default:
        return styles.statusPending;
    }
  };
  
  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };
  
  const renderDetailRow = (icon: string, label: string, value: string) => (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={20} color={colors.gray} />
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={50} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBookingDetails}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (!bookingDetails) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-text-outline" size={50} color={colors.secondaryText} />
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
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={handleViewReceipt} style={styles.receiptButton}>
            <Ionicons name="receipt" size={20} color={colors.offWhite} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Booking Status Card */}
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, getStatusBadgeStyle(bookingDetails.booking_status || bookingDetails.status)]}>
            <Text style={styles.statusText}>{getStatusLabel(bookingDetails.booking_status || bookingDetails.status)}</Text>
          </View>
          <Text style={styles.statusSubtext}>
            {bookingDetails.booking_status === 'CONFIRMED' 
              ? 'Your booking is confirmed' 
              : bookingDetails.booking_status === 'COMPLETED'
                ? 'This booking has been completed'
                : bookingDetails.booking_status === 'CANCELLED'
                  ? 'This booking has been cancelled'
                  : 'Your booking is being processed'}
          </Text>
        </View>

        {/* Professional Details Card */}
        {bookingDetails.professional_details && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Professional Details</Text>
            {renderProfessionalInfo()}
          </View>
        )}

        {/* Session Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Session Details</Text>
          <View style={styles.detailsContainer}>
            {bookingDetails.consultation_date && (
              renderDetailRow(
                'calendar-outline', 
                'Date', 
                new Date(bookingDetails.consultation_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long'
                })
              )
            )}
            {bookingDetails.consultation_time && (
              renderDetailRow(
                'time-outline', 
                'Time', 
                new Date(`2000-01-01T${bookingDetails.consultation_time}`).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })
              )
            )}
            {renderDetailRow(
              bookingDetails.consultation_type === 'online' ? 'laptop-outline' : 'location-outline', 
              bookingDetails.consultation_type === 'online' ? 'Mode' : 'Location',
              bookingDetails.consultation_type === 'online' 
                ? 'Online Session' 
                : bookingDetails.consultation_type === 'home_visit'
                  ? 'Home Visit'
                  : bookingDetails.address || 'Location not specified'
            )}
            {bookingDetails.payment_status && (
              renderDetailRow(
                'card-outline', 
                'Payment', 
                `${bookingDetails.payment_status.charAt(0).toUpperCase()}${bookingDetails.payment_status.slice(1).toLowerCase()}`
              )
            )}
            {bookingDetails.total_amount && (
              renderDetailRow(
                'cash-outline',
                'Amount',
                `₹${parseFloat(bookingDetails.total_amount).toFixed(2)}`
              )
            )}
          </View>
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
        {renderActionButtons()}
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
    backgroundColor: colors.primaryGreen,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
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
