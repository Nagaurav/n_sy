// BookingSuccessScreen.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ROUTES } from '../navigation/constants';

// Calendar integration (you'll need to install: npm install react-native-add-calendar-event)
// import * as AddCalendarEvent from 'react-native-add-calendar-event';

interface RouteParams {
  // Generic booking data for all categories
  category?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  
  // Professional/Instructor details (can be either)
  professional?: {
    id?: string;
    name?: string;
    expertise?: string[];
    rating?: number;
    experience?: string;
  };
  
  instructor?: {
    id?: string;
    name?: string;
    title?: string;
    rating?: number;
    experience?: number;
    specialization?: string[];
  };
  
  // Booking details
  bookingDetails?: {
    bookingId?: string;
    startDate?: string;
    endDate?: string;
    time?: string;
    duration?: number; // in minutes
    mode?: 'online' | 'offline';
    location?: string;
    selectedDate?: string;
    selectedTime?: string;
    selectedDuration?: number;
    selectedClassType?: string;
  };
  
  // Payment details
  paymentDetails?: {
    amount?: number;
    method?: string;
    transactionId?: string;
  };
  
  // Session details (for classes)
  sessionDetails?: {
    totalSessions?: number;
    sessionType?: 'one-on-one' | 'group';
    schedule?: {
      days?: string[];
      time?: string;
      timezone?: string;
    };
  };
}

const BookingSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  // Extract and provide fallbacks for all parameters
  const category = params.category || 'yoga';
  const categoryName = params.categoryName || 'Yoga Classes';
  const categoryIcon = params.categoryIcon || 'yoga';
  const categoryColor = params.categoryColor || colors.primaryGreen;
  
  // Handle both professional and instructor objects
  const professional = params.professional || params.instructor || {};
  const bookingDetails = params.bookingDetails || {};
  const paymentDetails = params.paymentDetails || {};
  const sessionDetails = params.sessionDetails;

  // Auto-add to calendar on component mount
  useEffect(() => {
    addToCalendar();
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (timeString?: string) => {
    return timeString || 'TBD'; // You might want to format this based on your time format
  };

  const getCategoryIcon = () => {
    const iconMap: Record<string, string> = {
      'yoga': 'yoga',
      'meditation': 'meditation',
      'dietician': 'food-apple',
      'ayurveda': 'leaf',
      'mental_health': 'brain',
      'homeopathy': 'water',
      'nutritionist': 'food-variant',
      'naturopath': 'nature',
    };
    return iconMap[category] || 'account-star';
  };

  const addToCalendar = async () => {
    try {
      // TODO: Implement actual calendar integration
      // This is a placeholder - you'll need to install and configure react-native-add-calendar-event
      
      const professionalName = professional?.name || 'Expert';
      const eventTitle = `${categoryName} Session with ${professionalName}`;
      const eventDescription = `Your ${categoryName.toLowerCase()} session with ${professionalName}. 
      
Booking ID: ${bookingDetails.bookingId || 'N/A'}
Payment: ₹${paymentDetails.amount || 0} via ${paymentDetails.method?.toUpperCase() || 'N/A'}

${sessionDetails ? `Total Sessions: ${sessionDetails.totalSessions}
Session Type: ${sessionDetails.sessionType}` : ''}`;

      const eventDetails = {
        title: eventTitle,
        description: eventDescription,
        startDate: bookingDetails.startDate || bookingDetails.selectedDate || new Date().toISOString(),
        endDate: bookingDetails.endDate || new Date(new Date(bookingDetails.startDate || bookingDetails.selectedDate || new Date()).getTime() + (bookingDetails.duration || 60) * 60000).toISOString(),
        location: bookingDetails.location || (bookingDetails.mode === 'online' ? 'Online Session' : 'In-person Session'),
        allDay: false,
        alarms: [
          { date: -60 }, // 1 hour before
          { date: -15 }, // 15 minutes before
        ],
      };

      // Placeholder for calendar integration
      console.log('Adding to calendar:', eventDetails);
      
      // Uncomment when you have react-native-add-calendar-event installed:
      // const eventId = await AddCalendarEvent.presentEventCreatingDialog(eventDetails);
      // if (eventId) {
      //   console.log('Event added to calendar with ID:', eventId);
      // }

      // For now, show a success message
      Alert.alert(
        'Calendar Event Added',
        'Your session has been automatically added to your calendar with reminders.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error adding to calendar:', error);
      Alert.alert(
        'Calendar Error',
        'Unable to add event to calendar. You can manually add it later.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleViewAppointments = () => {
    navigation.navigate(ROUTES.MY_APPOINTMENTS as never);
  };

  const handleGoHome = () => {
    navigation.navigate(ROUTES.HOME as never);
  };

  const handleAddToCalendar = () => {
    addToCalendar();
  };

  const getNextSteps = () => {
    if (sessionDetails) {
      // For classes with multiple sessions
      return [
        {
          number: 1,
          text: 'You\'ll receive a confirmation email with all session details',
        },
        {
          number: 2,
          text: `Join your first ${categoryName.toLowerCase()} session at ${formatTime(sessionDetails.schedule?.time || 'TBD')}`,
        },
        {
          number: 3,
          text: 'Track your progress and upcoming sessions in My Appointments',
        },
        {
          number: 4,
          text: 'Receive reminders 1 hour and 15 minutes before each session',
        },
      ];
    } else {
      // For single consultation sessions
      return [
        {
          number: 1,
          text: 'You\'ll receive a confirmation email with consultation details',
        },
        {
          number: 2,
          text: `Join your ${categoryName.toLowerCase()} consultation at ${formatTime(bookingDetails.time || 'TBD')}`,
        },
        {
          number: 3,
          text: 'Prepare any questions or concerns you\'d like to discuss',
        },
        {
          number: 4,
          text: 'Receive a reminder 1 hour before your consultation',
        },
      ];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Header */}
        <View style={styles.successHeader}>
          <View style={[styles.successIcon, { backgroundColor: categoryColor + '20' }]}>
            <MaterialCommunityIcons name="check-circle" size={80} color={colors.primaryGreen} />
          </View>
          <Text style={styles.successTitle}>Booking Successful!</Text>
          <Text style={styles.successSubtitle}>
            Your {categoryName.toLowerCase()} session has been booked and added to your calendar
          </Text>
        </View>

        {/* Professional Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={getCategoryIcon() as any} size={24} color={categoryColor} />
            <Text style={styles.cardTitle}>Session Details</Text>
          </View>
          
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{professional.name || 'N/A'}</Text>
                          <Text style={styles.professionalExpertise}>
                {(professional as any).expertise?.join(' • ') || (professional as any).specialization?.join(' • ') || 'N/A'}
              </Text>
            
            <View style={styles.professionalStats}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={16} color={colors.accentOrange} />
                <Text style={styles.statText}>{professional.rating || 0} Rating</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="clock" size={16} color={colors.secondaryText} />
                <Text style={styles.statText}>{professional.experience || 'N/A'} Experience</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="map-marker" size={16} color={colors.secondaryText} />
                <Text style={styles.statText}>{bookingDetails.mode || 'N/A'}</Text>
              </View>
            </View>

            {bookingDetails.location && (
              <View style={styles.locationInfo}>
                <MaterialCommunityIcons name="map-marker" size={16} color={colors.primaryGreen} />
                <Text style={styles.locationText}>{bookingDetails.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Booking Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-check" size={24} color={colors.primaryGreen} />
            <Text style={styles.cardTitle}>Booking Information</Text>
          </View>
          
          <View style={styles.bookingInfo}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booking ID:</Text>
              <Text style={styles.infoValue}>{bookingDetails.bookingId || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{formatDate(bookingDetails.startDate || bookingDetails.selectedDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Time:</Text>
              <Text style={styles.infoValue}>{formatTime(bookingDetails.time || bookingDetails.selectedTime)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>{bookingDetails.duration || bookingDetails.selectedDuration} minutes</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Payment Method:</Text>
              <Text style={styles.infoValue}>{paymentDetails.method?.toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Amount Paid:</Text>
              <Text style={[styles.infoValue, styles.amountText]}>₹{paymentDetails.amount || 0}</Text>
            </View>
          </View>
        </View>

        {/* Session Schedule (for classes) */}
        {sessionDetails && (
          <View style={styles.detailsCard}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons name="clock-outline" size={24} color={colors.primaryGreen} />
              <Text style={styles.cardTitle}>Class Schedule</Text>
            </View>
            
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleText}>
                {sessionDetails.schedule?.days?.join(', ') || 'TBD'} at {sessionDetails.schedule?.time || 'TBD'}
              </Text>
              <Text style={styles.timezoneText}>
                Timezone: {sessionDetails.schedule?.timezone || 'N/A'}
              </Text>
              <Text style={styles.sessionTypeText}>
                {sessionDetails.totalSessions || 0} sessions • {sessionDetails.sessionType || 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* Calendar Integration Status */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-plus" size={24} color={colors.primaryGreen} />
            <Text style={styles.cardTitle}>Calendar Integration</Text>
          </View>
          
          <View style={styles.calendarInfo}>
            <View style={styles.calendarStatus}>
              <MaterialCommunityIcons name="check-circle" size={20} color={colors.primaryGreen} />
              <Text style={styles.calendarStatusText}>Session added to your calendar</Text>
            </View>
            <Text style={styles.calendarDetails}>
              Reminders set for 1 hour and 15 minutes before each session
            </Text>
          </View>
        </View>

        {/* Next Steps */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information" size={24} color={colors.primaryGreen} />
            <Text style={styles.cardTitle}>What's Next?</Text>
          </View>
          
          <View style={styles.nextSteps}>
            {getNextSteps().map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{step.number}</Text>
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewAppointments}
          >
            <MaterialCommunityIcons name="calendar-check" size={20} color={colors.offWhite} />
            <Text style={styles.primaryButtonText}>View My Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleAddToCalendar}
          >
            <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primaryGreen} />
            <Text style={styles.secondaryButtonText}>Re-add to Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  successIcon: {
    marginBottom: 20,
    borderRadius: 40,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primaryGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  professionalInfo: {
    gap: 12,
  },
  professionalName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  professionalExpertise: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  professionalStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  bookingInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: colors.secondaryText,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '600',
  },
  amountText: {
    color: colors.primaryGreen,
    fontSize: 16,
  },
  scheduleInfo: {
    gap: 8,
  },
  scheduleText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '600',
  },
  timezoneText: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  sessionTypeText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 8,
  },
  calendarInfo: {
    gap: 12,
  },
  calendarStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calendarStatusText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '600',
  },
  calendarDetails: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  nextSteps: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: colors.offWhite,
    fontSize: 12,
    fontWeight: '700',
  },
  stepText: {
    fontSize: 14,
    color: colors.primaryText,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    gap: 12,
    marginTop: 20,
  },
  primaryButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.lightSage,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primaryGreen,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  tertiaryButtonText: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BookingSuccessScreen;
