import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import RNAddCalendarEvent from 'react-native-add-calendar-event';
import { useRoute } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { bookingService } from '../services'; // ✅ new: real API source

interface AppointmentDetails {
  bookingId: string;
  professional: {
    id: string;
    name: string;
    location?: string;
  };
  dateTime: string;
  mode: 'chat' | 'audio' | 'video' | 'offline';
  duration: number;
  service: string;
  meetingLink?: string;
  chatRoomId?: string;
}

const AppointmentConfirmationScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const params = route.params as AppointmentDetails;

  const [details, setDetails] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch full booking details from backend (no mock meeting/chat data)
  const fetchAppointmentDetails = useCallback(async () => {
    try {
      if (!params.bookingId) throw new Error('Missing booking ID.');

      const response = await bookingService.getBookingDetails(params.bookingId);
      if (!response.success) throw new Error(response.message || 'Failed to load booking details.');

      setDetails({
        bookingId: response.data.id,
        professional: {
          id: response.data.professional.id,
          name: `${response.data.professional.firstName} ${response.data.professional.lastName}`,
          location: response.data.professional.location,
        },
        dateTime: response.data.startTime,
        duration: response.data.duration || 60,
        mode: response.data.mode || 'online',
        service: response.data.serviceType || 'consultation',
        meetingLink: response.data.meetingLink,
        chatRoomId: response.data.chatRoomId,
      });
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      Alert.alert('Error', 'Failed to load appointment details.');
    } finally {
      setLoading(false);
    }
  }, [params.bookingId]);

  useEffect(() => {
    fetchAppointmentDetails();
  }, [fetchAppointmentDetails]);

  const handleAddToCalendar = useCallback(async () => {
    if (!details) return;

    try {
      const eventConfig = {
        title: `Session: ${details.service} with ${details.professional.name}`,
        startDate: new Date(details.dateTime).toISOString(),
        endDate: new Date(
          new Date(details.dateTime).getTime() + details.duration * 60000
        ).toISOString(),
        notes: `Mode: ${details.mode}`,
        location: details.mode === 'offline' ? details.professional.location : undefined,
      } as any;

      const result = await RNAddCalendarEvent.presentEventCreatingDialog(eventConfig);
      if (result && result.action !== 'CANCELED') {
        Alert.alert('Added to Calendar', 'Session added to your calendar!');
      }
    } catch {
      Alert.alert('Error', 'Could not add to calendar.');
    }
  }, [details]);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })} • ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading || !details) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading your appointment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.animationContainer}>
          <LottieView
            source={require('../assets/animations/success.json')}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <Text style={styles.header}>Appointment Confirmed!</Text>
        <Text style={styles.subheader}>
          Your session with <Text style={styles.highlight}>{details.professional.name}</Text> is booked.
        </Text>

        {/* Appointment Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{formatDate(details.dateTime)}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons
              name={details.mode === 'offline' ? 'map-marker' : details.mode === 'audio' ? 'phone' : 'video'}
              size={20}
              color={colors.primaryGreen}
            />
            <Text style={styles.detailValue}>{details.mode.toUpperCase()}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{details.professional.name}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="meditation" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{details.service}</Text>
          </View>
        </View>

        {/* Add to Calendar */}
        <TouchableOpacity style={styles.calendarButton} onPress={handleAddToCalendar}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primaryGreen} />
          <Text style={styles.calendarButtonText}>Add to Calendar</Text>
        </TouchableOpacity>

        {/* Join Session */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() =>
            navigation.navigate(ROUTES.JOIN_SESSION, {
              sessionTime: details.dateTime,
              mode: details.mode,
              professional: {
                id: details.professional.id,
                name: details.professional.name,
                title: 'Yoga Professional', // Default title since it's required
                ...(details.professional.location && { location: details.professional.location })
              },
              service: details.service,
              duration: details.duration,
              meetingLink: details.meetingLink,
              chatRoomId: details.chatRoomId,
            })
          }
        >
          <MaterialCommunityIcons name="video" size={20} color={colors.offWhite} />
          <Text style={styles.joinButtonText}>Join Session</Text>
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate(ROUTES.HOME)}
        >
          <Text style={styles.actionButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { alignItems: 'center', padding: 24 },
  animationContainer: { width: 180, height: 180, marginTop: 30, marginBottom: 10 },
  lottie: { width: '100%', height: '100%' },
  header: {
    color: colors.primaryGreen,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  subheader: {
    color: colors.primaryText,
    marginBottom: 22,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  highlight: { color: colors.primaryGreen, fontWeight: 'bold' },
  detailsCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 18,
    padding: 18,
    alignSelf: 'stretch',
    marginBottom: 28,
    gap: 11,
    shadowColor: '#000',
    shadowOpacity: 0.09,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  detailValue: { fontSize: 16, color: colors.primaryText, fontWeight: '600', marginLeft: 4 },
  calendarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightSage,
    paddingVertical: 13,
    paddingHorizontal: 36,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.primaryGreen,
    marginBottom: 14,
    gap: 8,
  },
  calendarButtonText: { color: colors.primaryGreen, fontWeight: '700', fontSize: 15 },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentGreen,
    paddingVertical: 14,
    paddingHorizontal: 38,
    borderRadius: 15,
    marginVertical: 6,
    gap: 8,
  },
  joinButtonText: { color: colors.offWhite, fontWeight: '700', fontSize: 15 },
  actionButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 14,
    paddingHorizontal: 38,
    borderRadius: 15,
    alignItems: 'center',
    marginVertical: 6,
  },
  actionButtonText: { color: colors.offWhite, fontWeight: '700', fontSize: 15 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.secondaryText, fontSize: 16, marginTop: 10 },
});

export default AppointmentConfirmationScreen;
