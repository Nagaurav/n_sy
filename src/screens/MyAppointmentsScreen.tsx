import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { ROUTES } from '../navigation/constants';
import { consultationBookingService } from '../services/consultationBookingService';
import { useAuth } from '../utils/AuthContext';

interface Appointment {
  id: string;
  professional: {
    id: string;
    name: string;
    avatar_url?: string;
    speciality: string;
    title?: string;
  };
  service: string;
  dateTime: string;
  mode: 'online' | 'offline' | 'home_visit';
  duration: number;
  status: 'upcoming' | 'past' | 'cancelled' | 'completed';
  feedbackGiven: boolean;
  canRebook: boolean;
  payment_status: string;
  total_amount: number | string;
  booking_date?: string;
  booking_time?: string;
  consultation_type?: 'online' | 'offline' | 'home_visit';
  [key: string]: any;
}

const MyAppointmentsScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  /** 🔄 Fetch Appointments */
  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = user?.id || user?.userId;

      if (!userId) throw new Error('User not logged in.');

      const response = await consultationBookingService.getUserConsultationBookings(Number(userId));

      if (!response.success || !response.data?.data) {
        throw new Error(response.message || 'Failed to fetch appointments.');
      }

      const now = new Date();
      const mapped = response.data.data.map((b: any) => {
        const bookingDate = new Date(b.booking_date);
        const status =
          b.booking_status === 'CANCELLED'
            ? 'cancelled'
            : b.booking_status === 'COMPLETED'
            ? 'completed'
            : bookingDate > now
            ? 'upcoming'
            : 'past';

        return {
          id: b.booking_id || b.id,
          professional: {
            id: b.professional_id || b.professional?.id || '',
            name: b.professional_name || b.professional?.name || 'Professional',
            avatar_url: b.professional_avatar || b.professional?.avatar_url,
            speciality: b.professional_speciality || b.professional?.speciality || 'General',
            title: b.professional_title || b.professional?.title,
          },
          service: b.service || b.professional_details?.speciality || 'Consultation',
          dateTime: bookingDate.toISOString(),
          mode: (b.consultation_type || b.mode) as 'online' | 'offline' | 'home_visit',
          duration: b.duration || 60,
          status,
          feedbackGiven: b.feedback_given || false,
          canRebook: status === 'past' || status === 'completed',
          payment_status: b.payment_status || 'pending',
          total_amount: b.total_amount || 0,
          ...b,
        };
      });

      setAppointments(mapped);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /** Filtered by tab */
  const filteredAppointments = useMemo(
    () => appointments.filter((a) => a.status === tab),
    [appointments, tab]
  );

  /** Handlers */
  const handleViewDetails = (appointment: Appointment) => {
    navigation.navigate(ROUTES.BOOKING_DETAILS, {
      bookingId: appointment.id,
      appointmentData: appointment,
    });
  };

  const handleRebook = (appointment: Appointment) => {
    navigation.navigate(ROUTES.BOOK_CONSULTATION, {
      professional: appointment.professional,
      service: appointment.service,
    });
  };

  const handleCancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel your session with ${appointment.professional.name}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => console.log(`Cancel appointment ${appointment.id}`),
        },
      ]
    );
  };

  /** Render Item */
  const renderAppointment = ({ item }: { item: Appointment }) => {
    const date = new Date(item.dateTime);
    const isUpcoming = item.status === 'upcoming';
    const isCancelled = item.status === 'cancelled';

    const modeIcon =
      item.mode === 'online' ? 'video' : item.mode === 'offline' ? 'office-building' : 'home';
    const modeLabel =
      item.mode === 'online'
        ? 'Online'
        : item.mode === 'offline'
        ? 'Clinic Visit'
        : 'Home Visit';

    return (
      <View
        style={[
          styles.card,
          isCancelled && styles.cancelledCard,
        ]}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="account" size={22} color={colors.primaryGreen} />
          <View style={{ flex: 1 }}>
            <Text style={styles.professionalName}>{item.professional.name}</Text>
            <Text style={styles.serviceTitle}>{item.service}</Text>
          </View>
          <View
            style={[
              styles.modeTag,
              item.mode === 'online'
                ? styles.videoTag
                : item.mode === 'offline'
                ? styles.audioTag
                : styles.chatTag,
            ]}
          >
            <MaterialCommunityIcons name={modeIcon} size={16} color={colors.offWhite} />
            <Text style={styles.modeText}>{modeLabel}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.primaryText} />
            <Text style={styles.detailText}>
              {date.toLocaleDateString('en-US', {
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
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} • {item.duration} min
            </Text>
          </View>
          {item.payment_status && (
            <View style={styles.detailRow}>
              <MaterialCommunityIcons
                name={
                  item.payment_status.toLowerCase() === 'completed'
                    ? 'check-circle'
                    : 'clock-outline'
                }
                size={16}
                color={
                  item.payment_status.toLowerCase() === 'completed'
                    ? colors.success
                    : colors.warning
                }
              />
              <Text
                style={[
                  styles.detailText,
                  {
                    color:
                      item.payment_status.toLowerCase() === 'completed'
                        ? colors.success
                        : colors.warning,
                    textTransform: 'capitalize',
                  },
                ]}
              >
                Payment {item.payment_status}
              </Text>
              {item.total_amount && (
                <Text style={[styles.detailText, { marginLeft: 8, fontWeight: '600' }]}>
                  • ₹{parseFloat(String(item.total_amount)).toFixed(2)}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <Pressable style={[styles.btn, styles.secondaryBtn]} onPress={() => handleViewDetails(item)}>
            <Text style={styles.btnText}>View Details</Text>
          </Pressable>

          {isUpcoming ? (
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={() => handleCancelAppointment(item)}>
              <Text style={[styles.btnText, styles.cancelText]}>Cancel</Text>
            </Pressable>
          ) : item.canRebook ? (
            <Pressable style={[styles.btn, styles.primaryBtn]} onPress={() => handleRebook(item)}>
              <Text style={[styles.btnText, styles.primaryText]}>Rebook</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  /** UI */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {['upcoming', 'past'].map((t) => (
          <Pressable
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabActive]}
            onPress={() => setTab(t as 'upcoming' | 'past')}
          >
            <Text style={[styles.tabText, tab === t && styles.tabActiveText]}>
              {t === 'upcoming' ? 'Upcoming' : 'Past'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* States */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primaryGreen} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank" size={80} color={colors.secondaryText} />
          <Text style={styles.emptyTitle}>No {tab} appointments</Text>
          <Text style={styles.emptySubtitle}>
            {tab === 'upcoming'
              ? "You don’t have any upcoming appointments."
              : "You haven’t completed any sessions yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

/** 💅 Styles */
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
    fontWeight: '700',
  },
  tabRow: { flexDirection: 'row', margin: 16, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 11, borderRadius: 16, backgroundColor: colors.lightGreen },
  tabActive: { backgroundColor: colors.primaryGreen },
  tabText: { color: colors.primaryGreen, textAlign: 'center', fontWeight: '700' },
  tabActiveText: { color: colors.offWhite },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: colors.error, fontSize: 15 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 6 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cancelledCard: { opacity: 0.7, borderLeftWidth: 4, borderLeftColor: colors.error },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  professionalName: { ...typography.subtitle, fontWeight: '700', color: colors.primaryGreen },
  serviceTitle: { fontSize: 14, color: colors.secondaryText },
  modeTag: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 6, gap: 5 },
  videoTag: { backgroundColor: colors.primaryGreen },
  audioTag: { backgroundColor: colors.accentTeal },
  chatTag: { backgroundColor: colors.accentPurple },
  modeText: { color: colors.offWhite, fontSize: 12, fontWeight: '700' },
  details: { marginTop: 4 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  detailText: { fontSize: 14, color: colors.secondaryText, marginLeft: 6 },
  actionRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  btn: { flex: 1, paddingVertical: 10, borderRadius: 14, alignItems: 'center' },
  secondaryBtn: { backgroundColor: colors.lightGreen },
  primaryBtn: { backgroundColor: colors.primaryGreen },
  cancelBtn: { backgroundColor: colors.error },
  btnText: { fontWeight: '600', fontSize: 15 },
  primaryText: { color: colors.offWhite },
  cancelText: { color: colors.offWhite },
});

export default MyAppointmentsScreen;
