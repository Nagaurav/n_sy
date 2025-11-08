// MyAppointmentsScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'react-native';
import { ROUTES } from '../navigation/constants';
import { consultationBookingService } from '../services/consultationBookingService';
import { useAuth } from '../utils/AuthContext';

type Appointment = {
  id: string;
  professional: { 
    name: string; 
    avatar_url?: string;
    speciality?: string;
  };
  service: string;
  dateTime: string; // ISO
  mode: 'online' | 'offline' | 'home_visit';
  duration: number;
  status: 'upcoming' | 'past' | 'cancelled' | 'completed';
  feedbackGiven: boolean;
  canRebook: boolean;
  payment_status: string;
  total_amount: string;
};

const MyAppointmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user ID from auth context
      const userId = user?.id || user?.userId;
      if (!userId) {
        setError('No user logged in');
        setLoading(false);
        return;
      }
      
      // Fetch user's consultation bookings
      const response = await consultationBookingService.getUserConsultationBookings(Number(userId));
      
      if (response.success && response.data) {
        const now = new Date();
        const transformedAppointments = response.data.map(booking => {
          const bookingDate = new Date(`${booking.consultation_date}T${booking.consultation_time}`);
          const isUpcoming = bookingDate >= now;
          const isCancelled = booking.status?.toLowerCase() === 'cancelled';
          const isCompleted = booking.status?.toLowerCase() === 'completed';
          
          return {
            id: booking.booking_id,
            professional: {
              name: booking.professional_details?.name || 'Professional',
              avatar_url: booking.professional_details?.avatar_url,
              speciality: booking.professional_details?.speciality,
            },
            service: booking.professional_details?.speciality || 'Consultation',
            dateTime: bookingDate.toISOString(),
            mode: booking.consultation_type as 'online' | 'offline' | 'home_visit',
            duration: booking.duration || 60,
            status: isCancelled ? 'cancelled' : isCompleted ? 'completed' : isUpcoming ? 'upcoming' : 'past',
            feedbackGiven: false, // This would come from the API
            canRebook: !isUpcoming && !isCancelled,
            payment_status: booking.payment_status,
            total_amount: booking.total_amount,
          };
        });
        
        setAppointments(transformedAppointments);
      }
    } catch (e: any) {
      setError(e.message || 'Could not load appointments. Try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filtered = appointments.filter(a => a.status === tab);

  const handleViewDetails = (appointment: Appointment) => {
    // Navigate to appointment details screen with the full appointment data
    (navigation as any).navigate(ROUTES.BOOKING_DETAILS, { 
      bookingId: appointment.id,
      appointmentData: appointment 
    });
  };

  const handleRebook = (appointment: Appointment) => {
    (navigation as any).navigate(ROUTES.BOOK_CONSULTATION, { 
      professional: appointment.professional, 
      service: appointment.service 
    });
  };

  const handleGiveFeedback = (appointment: Appointment) => {
    // Navigate to feedback screen (you can create this later)
    Alert.alert('Feedback', 'Feedback feature coming soon!');
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => {
    const appointmentDate = new Date(item.dateTime);
    const isUpcoming = appointmentDate >= new Date();
    const isCancelled = item.status === 'cancelled';
    const modeIcon = item.mode === 'online' ? 'video' : item.mode === 'offline' ? 'phone' : 'chat';
    const modeLabel = item.mode.charAt(0).toUpperCase() + item.mode.slice(1);

    return (
      <View style={[
        styles.appointmentCard,
        isCancelled && styles.cancelledAppointment
      ]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account" size={22} color={colors.primaryGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.professionalName}>{item.professional.name}</Text>
            <Text style={styles.serviceTitle}>{item.service}</Text>
          </View>
          <View style={[styles.modeTag, item.mode === 'online' ? styles.video : item.mode === 'offline' ? styles.audio : styles.chat]}>
            <MaterialCommunityIcons
              name={modeIcon}
              size={16}
              color={colors.offWhite}
            />
            <Text style={styles.modeTagText}>{modeLabel}</Text>
          </View>
        </View>
        <View style={styles.appointmentDetails}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.primaryText} />
            <Text style={styles.detailText}>
              {appointmentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={colors.primaryText} />
            <Text style={styles.detailText}>
              {appointmentDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.durationText}>• {item.duration} min</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons 
              name={modeIcon} 
              size={16} 
              color={colors.primaryText} 
            />
            <Text style={styles.detailText}>
              {modeLabel}
            </Text>
          </View>
          {item.payment_status && (
            <View style={[styles.detailRow, { marginTop: 4 }]}>
              <MaterialCommunityIcons 
                name={item.payment_status.toLowerCase() === 'completed' ? 'check-circle' : 'clock-outline'} 
                size={16} 
                color={item.payment_status.toLowerCase() === 'completed' ? colors.success : colors.warning} 
              />
              <Text style={[
                styles.detailText, 
                { 
                  color: item.payment_status.toLowerCase() === 'completed' 
                    ? colors.success 
                    : colors.warning,
                  textTransform: 'capitalize'
                }
              ]}>
                Payment {item.payment_status.toLowerCase()}
              </Text>
              {item.total_amount && (
                <Text style={[styles.detailText, { marginLeft: 8, fontWeight: '600' }]}>
                  • ₹{parseFloat(item.total_amount).toFixed(2)}
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.button, styles.secondaryButton]}
            onPress={() => handleViewDetails(item)}
          >
            <Text style={styles.buttonText}>View Details</Text>
          </Pressable>
          
          {isUpcoming ? (
            <Pressable
              style={[styles.button, styles.dangerButton]}
              onPress={() => console.log('Cancel appointment')}
            >
              <Text style={[styles.buttonText, styles.dangerButtonText]}>Cancel</Text>
            </Pressable>
          ) : item.canRebook ? (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={() => handleRebook(item)}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Rebook</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable style={[styles.tabBtn, tab === 'upcoming' && styles.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabActiveText]}>Upcoming</Text>
        </Pressable>
        <Pressable style={[styles.tabBtn, tab === 'past' && styles.tabActive]} onPress={() => setTab('past')}>
          <Text style={[styles.tabBtnText, tab === 'past' && styles.tabActiveText]}>Past</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primaryGreen} size="large" />
        </View>
      ) : error ? (
        <View style={styles.loaderWrap}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons 
            name="calendar-blank" 
            size={80} 
            color={colors.secondaryText} 
          />
          <Text style={styles.emptyTitle}>No {tab} appointments found</Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'upcoming' 
              ? 'You don\'t have any upcoming appointments. Book a session to get started!'
              : 'You haven\'t completed any appointments yet. Your session history will appear here.'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderAppointmentItem}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.primaryGreen,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
  },
  tabRow: { flexDirection: 'row', marginTop: 10, marginHorizontal: 20, marginBottom: 8 },
  tabBtn: { flex: 1, paddingVertical: 11, alignItems: 'center', backgroundColor: colors.lightSage, borderRadius: 16, marginHorizontal: 2 },
  tabActive: { backgroundColor: colors.primaryGreen },
  tabBtnText: { color: colors.primaryGreen, fontWeight: '700' },
  tabActiveText: { color: colors.offWhite },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: colors.error, fontSize: 16, marginTop: 12 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
  nothingText: { color: colors.secondaryText, fontSize: 15, marginTop: 32 },
  listContent: { padding: 16 },
  appointmentCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    padding: 18,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 10 },
  professionalName: { ...typography.subtitle, fontWeight: '700', color: colors.primaryGreen, marginBottom: 2 },
  serviceTitle: { fontSize: 14, color: colors.secondaryText },
  modeTag: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginLeft: 'auto', minWidth: 70, justifyContent: 'center' },
  video: { backgroundColor: colors.primaryGreen },
  audio: { backgroundColor: colors.accentTeal },
  chat: { backgroundColor: colors.accentPurple },
  modeTagText: { color: colors.offWhite, marginLeft: 3, fontSize: 12, fontWeight: '700' },
  appointmentDetails: { marginTop: 1, marginBottom: 7 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  detailText: { fontWeight: '500', fontSize: 14, marginLeft: 7, color: colors.secondaryText },
  durationText: { fontSize: 14, color: colors.secondaryText, marginLeft: 4 },
  actionButtons: { flexDirection: 'row', marginTop: 11, gap: 14 },
  button: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
  secondaryButton: { backgroundColor: colors.lightSage },
  primaryButton: { backgroundColor: colors.primaryGreen },
  dangerButton: { backgroundColor: colors.error },
  buttonText: { color: colors.primaryGreen, fontWeight: '600', fontSize: 15 },
  primaryButtonText: { color: colors.offWhite },
  dangerButtonText: { color: colors.offWhite },
  statusUpcoming: {
    backgroundColor: colors.lightGreen,
  },
  statusCompleted: {
    backgroundColor: colors.lightBlue,
  },
  statusCancelled: {
    backgroundColor: colors.lightGray,
    opacity: 0.7,
  },
  statusPast: {
    backgroundColor: colors.lightGray,
  },
  cancelledAppointment: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  joinBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryGreen, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, gap: 7 },
  joinBtnText: { color: colors.offWhite, fontWeight: '700', fontSize: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightSage, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  actionBtnText: { color: colors.primaryGreen, fontWeight: '600', fontSize: 14 },
});

export default MyAppointmentsScreen; 