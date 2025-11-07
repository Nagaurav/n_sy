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
import { ROUTES } from '../navigation/constants';
import { bookingService, BookingDetails } from '../services/bookingService';

type Appointment = {
  id: string;
  professional: { name: string; avatar?: string };
  service: string;
  dateTime: string; // ISO
  mode: string;
  duration: number;
  status: 'upcoming' | 'past';
  feedbackGiven: boolean;
  canRebook: boolean;
};

const MyAppointmentsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments from API
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get user bookings from real API
      const userId = 'user_123'; // Replace with actual user ID from context
      const bookings: BookingDetails[] = await bookingService.getUserBookings(userId);
      
      // Transform booking data to appointment format
      const transformedAppointments: Appointment[] = bookings.map(booking => ({
        id: booking.id,
        professional: { 
          name: booking.professional?.name || 'Professional',
          avatar: booking.professional?.avatar 
        },
        service: booking.service,
        dateTime: booking.dateTime,
        mode: booking.consultationMode,
        duration: booking.duration,
        status: new Date(booking.dateTime) > new Date() ? 'upcoming' : 'past',
        feedbackGiven: false, // This would come from feedback API
        canRebook: booking.status !== 'cancelled',
      }));
      
      setAppointments(transformedAppointments);
    } catch (e: any) {
      setError(e.message || 'Could not load appointments. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const filtered = appointments.filter(a => a.status === tab);

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

  const renderItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialCommunityIcons name="account" size={22} color={colors.primaryGreen} />
        <View style={{ flex: 1 }}>
          <Text style={styles.professionalName}>{item.professional.name}</Text>
          <Text style={styles.serviceTitle}>{item.service}</Text>
        </View>
        <View style={[styles.modeTag, item.mode === 'video' ? styles.video : item.mode === 'audio' ? styles.audio : styles.chat]}>
          <MaterialCommunityIcons
            name={item.mode === 'video' ? 'video' : item.mode === 'audio' ? 'phone' : 'chat'}
            size={16}
            color={colors.offWhite}
          />
          <Text style={styles.modeTagText}>{item.mode.charAt(0).toUpperCase() + item.mode.slice(1)}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.secondaryText} />
          <Text style={styles.dateTime}>
            {new Date(item.dateTime).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              weekday: 'short',
            })}
          </Text>
        </View>
        <View style={styles.row}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={colors.secondaryText} />
          <Text style={styles.dateTime}>
            {new Date(item.dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} · {item.duration} min
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        {tab === 'upcoming' ? (
          <Pressable
            style={styles.joinBtn}
            onPress={() =>
                          (navigation as any).navigate(ROUTES.JOIN_SESSION, {
              sessionTime: item.dateTime,
              mode: item.mode as 'chat' | 'audio' | 'video',
              professional: item.professional,
              service: item.service,
              duration: item.duration,
              bookingId: item.id,
              meetingLink: 'https://meet.google.com/abc-defg-hij', // Mock meeting link
              chatRoomId: 'chat_room_123', // Mock chat room ID
            })
            }
          >
            <Text style={styles.joinBtnText}>Join</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color={colors.offWhite} />
          </Pressable>
        ) : (
          <>
            <Pressable style={styles.actionBtn} onPress={() => handleGiveFeedback(item)}>
              <MaterialCommunityIcons name="star-check" size={16} color={colors.primaryGreen} />
              <Text style={styles.actionBtnText}>{item.feedbackGiven ? "Feedback Given" : "Give Feedback"}</Text>
            </Pressable>
            {item.canRebook && (
              <Pressable style={styles.actionBtn} onPress={() => handleRebook(item)}>
                <MaterialCommunityIcons name="calendar-sync" size={16} color={colors.primaryGreen} />
                <Text style={styles.actionBtnText}>Rebook</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </View>
  );

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
          renderItem={renderItem}
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
  card: {
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
  cardBody: { marginTop: 1, marginBottom: 7 },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  dateTime: { fontWeight: '500', fontSize: 14, marginLeft: 7, color: colors.secondaryText },
  cardActions: { flexDirection: 'row', marginTop: 11, gap: 14 },
  joinBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primaryGreen, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 18, gap: 7 },
  joinBtnText: { color: colors.offWhite, fontWeight: '700', fontSize: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.lightSage, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 16, gap: 6 },
  actionBtnText: { color: colors.primaryGreen, fontWeight: '600', fontSize: 14 },
});

export default MyAppointmentsScreen; 