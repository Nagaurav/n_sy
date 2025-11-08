import React, { useEffect, useMemo } from 'react';
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
import { ROUTES } from '../navigation/constants';
import type { RootStackParamList } from '../navigation/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 🧠 Strong typing for navigation params
type BookingSuccessParams = RootStackParamList[typeof ROUTES.BOOKING_SUCCESS];
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const BookingSuccessScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const params = route.params as BookingSuccessParams;

  // ✅ Extract params safely
  const {
    category = 'yoga',
    categoryName = 'Yoga Session',
    categoryColor = colors.primaryGreen,
    professional = params.instructor || {},
    bookingDetails = {},
    paymentDetails = {},
    sessionDetails,
  } = params;

  // 🧠 Derived values
  const startDate = bookingDetails.startDate || bookingDetails.selectedDate;
  const time = bookingDetails.time || bookingDetails.selectedTime;
  const duration = bookingDetails.duration || bookingDetails.selectedDuration || 60;

  const getCategoryIcon = useMemo(() => {
    const iconMap: Record<string, string> = {
      yoga: 'yoga',
      meditation: 'meditation',
      dietician: 'food-apple',
      ayurveda: 'leaf',
      mental_health: 'brain',
      homeopathy: 'water',
      nutritionist: 'food-variant',
      naturopath: 'nature',
    };
    return iconMap[category] || 'account-star';
  }, [category]);

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'TBD';

  const formatTime = (t?: string) => t || 'TBD';

  // 🗓️ Auto-add to calendar (mock)
  useEffect(() => {
    const addToCalendar = async () => {
      try {
        // Placeholder for real integration
        console.log('📅 Auto-adding booking to calendar:', {
          title: `${categoryName} with ${professional?.name || 'Expert'}`,
          startDate,
          time,
        });
        Alert.alert(
          'Added to Calendar',
          'Your session has been added to your calendar with reminders.',
          [{ text: 'OK' }]
        );
      } catch (err) {
        console.error('Calendar error:', err);
      }
    };
    addToCalendar();
  }, [categoryName, professional, startDate, time]);

  // 🧩 Next steps logic
  const nextSteps = useMemo(() => {
    const steps = sessionDetails
      ? [
          'You’ll receive a confirmation email with all session details.',
          `Join your first ${categoryName.toLowerCase()} class at ${formatTime(sessionDetails.schedule?.time)}.`,
          'Track your progress in My Appointments.',
          'Receive reminders 1 hour and 15 minutes before each session.',
        ]
      : [
          'You’ll receive a confirmation email with consultation details.',
          `Join your ${categoryName.toLowerCase()} consultation at ${formatTime(time)}.`,
          'Prepare any notes or concerns for discussion.',
          'Receive a reminder 1 hour before your session.',
        ];

    return steps.map((text, i) => ({ number: i + 1, text }));
  }, [sessionDetails, categoryName, time]);

  // 🧭 Handlers
  const handleViewAppointments = () => navigation.navigate(ROUTES.MY_APPOINTMENTS);
  const handleGoHome = () => navigation.navigate(ROUTES.HOME);
  const handleReAddToCalendar = () =>
    Alert.alert('Added', 'Session re-added to your calendar.');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ✅ Success Header */}
        <View style={styles.header}>
          <View style={[styles.iconWrapper, { backgroundColor: `${categoryColor}20` }]}>
            <MaterialCommunityIcons name="check-circle" size={80} color={colors.primaryGreen} />
          </View>
          <Text style={styles.title}>Booking Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your {categoryName.toLowerCase()} has been successfully booked.
          </Text>
        </View>

        {/* ✅ Session Details */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name={getCategoryIcon as any} size={22} color={categoryColor} />
            <Text style={styles.cardTitle}>Session Details</Text>
          </View>
          <Text style={styles.detailText}>👤 {professional.name || 'N/A'}</Text>
          <Text style={styles.detailText}>
            🗓️ {formatDate(startDate)} • {formatTime(time)} ({duration} min)
          </Text>
          <Text style={styles.detailText}>💳 {paymentDetails.method?.toUpperCase() || 'Online'} • ₹{paymentDetails.amount || 0}</Text>
        </View>

        {/* ✅ Calendar Info */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="calendar-check" size={22} color={colors.primaryGreen} />
            <Text style={styles.cardTitle}>Calendar</Text>
          </View>
          <Text style={styles.detailText}>✅ Added to your calendar automatically.</Text>
          <Text style={styles.secondaryText}>
            You’ll get reminders before the session.
          </Text>
        </View>

        {/* ✅ Next Steps */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="information" size={22} color={colors.primaryGreen} />
            <Text style={styles.cardTitle}>Next Steps</Text>
          </View>
          {nextSteps.map((s) => (
            <View key={s.number} style={styles.stepItem}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepNumber}>{s.number}</Text>
              </View>
              <Text style={styles.stepText}>{s.text}</Text>
            </View>
          ))}
        </View>

        {/* ✅ Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewAppointments}>
            <MaterialCommunityIcons name="calendar" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>View Appointments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleReAddToCalendar}>
            <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primaryGreen} />
            <Text style={styles.secondaryButtonText}>Re-add to Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGoHome} style={styles.tertiaryButton}>
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20 },
  header: { alignItems: 'center', paddingVertical: 40 },
  iconWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.primaryGreen, marginBottom: 6 },
  subtitle: { fontSize: 16, color: colors.secondaryText, textAlign: 'center', lineHeight: 22 },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  detailText: { fontSize: 15, color: colors.primaryText, marginBottom: 4 },
  secondaryText: { fontSize: 14, color: colors.secondaryText },
  stepItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  stepNumber: { color: '#fff', fontWeight: '700', fontSize: 13 },
  stepText: { flex: 1, color: colors.primaryText, fontSize: 14, lineHeight: 20 },
  actions: { marginTop: 20, gap: 10 },
  primaryButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryButton: {
    borderColor: colors.primaryGreen,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: { color: colors.primaryGreen, fontSize: 16, fontWeight: '600' },
  tertiaryButton: { alignItems: 'center', paddingVertical: 16 },
  tertiaryButtonText: { color: colors.secondaryText, fontSize: 16, fontWeight: '500' },
});

export default BookingSuccessScreen;
