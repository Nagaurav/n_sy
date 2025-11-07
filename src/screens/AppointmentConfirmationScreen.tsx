// AppointmentConfirmationScreen.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import LottieView from 'lottie-react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RNAddCalendarEvent from 'react-native-add-calendar-event';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ROUTES } from '../navigation/constants';

const AppointmentConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  // These should be passed from the Payment screen after successful payment:
  const { professional, dateTime, mode, duration, service } = route.params as {
    professional: {
      name: string;
      location?: string;
    };
    dateTime: string;   // ISO string
    mode: string;       // 'Chat' | 'Audio' | 'Video' | 'In-person'
    duration: number;   // Duration in minutes
    service: string;
  };

  // Handler to add appointment to device calendar
  const handleAddToCalendar = useCallback(async () => {
    try {
      const eventConfig = {
        title: `Session: ${service} with ${professional.name}`,
        startDate: new Date(dateTime).toISOString(),
        endDate: new Date(new Date(dateTime).getTime() + duration * 60000).toISOString(),
        notes: `Mode: ${mode}`,
        location: mode === 'In-person' ? professional.location : undefined,
        navigationBarIOS: {
          tintColor: colors.primaryGreen,
        },
      } as any;
      const result = await RNAddCalendarEvent.presentEventCreatingDialog(eventConfig);
      if (result && result.action !== 'CANCELED') {
        Alert.alert('Added to Calendar', 'Session added to your calendar!');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not add to calendar.');
    }
  }, [professional, service, dateTime, mode, duration]);

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
          Your session with <Text style={styles.highlight}>{professional.name}</Text> is booked.
        </Text>

        {/* Appointment Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>
              {new Date(dateTime).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-time-four" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>
              {new Date(dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              {' '}({duration} min)
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name={
              mode === 'In-person' ? 'map-marker' : mode === 'Audio' ? 'phone' : 'video'
            } size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{mode}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="account" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{professional.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="meditation" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailValue}>{service}</Text>
          </View>
        </View>

        {/* Add to Calendar Button */}
        <TouchableOpacity style={styles.calendarButton} onPress={handleAddToCalendar}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primaryGreen} />
          <Text style={styles.calendarButtonText}>Add to Calendar</Text>
        </TouchableOpacity>

        {/* Join Session Button */}
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => (navigation as any).navigate(ROUTES.JOIN_SESSION, {
            sessionTime: dateTime,
            mode: mode.toLowerCase() as 'chat' | 'audio' | 'video',
            professional: professional,
            service: service,
            duration: duration,
            meetingLink: 'https://meet.google.com/abc-defg-hij', // Mock meeting link
            chatRoomId: 'chat_room_123', // Mock chat room ID
          })}
        >
          <MaterialCommunityIcons name="video" size={20} color={colors.offWhite} />
          <Text style={styles.joinButtonText}>Join Session</Text>
        </TouchableOpacity>

        {/* Go Home */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate(ROUTES.HOME as never)}
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
    fontWeight: '700' as const,
  },
  subheader: {
    color: colors.primaryText,
    marginBottom: 22,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600' as const,
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
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButtonText: { color: colors.secondaryText, fontWeight: '600', fontSize: 15 },
});

export default AppointmentConfirmationScreen; 