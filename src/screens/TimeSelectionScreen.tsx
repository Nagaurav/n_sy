import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { ProfessionalService } from '../services/professional/ProfessionalService';
import type { Professional } from '../services/professional/ProfessionalService';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  fullSlotData?: any;
}

const professionalService = ProfessionalService.getInstance();

const TimeSelectionScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const { selectedDate, mode, location, professionalId } = route.params as {
    selectedDate: string;
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    professionalId: string;
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);

  const fetchTimeSlots = useCallback(async () => {
    try {
      if (!professionalId) throw new Error('Professional ID not provided');

      setLoading(true);
      setError(null);

      const [profResponse, slotsResponse] = await Promise.all([
        professionalService.getProfessionalById(professionalId),
        professionalService.checkSlotAvailability(professionalId),
      ]);

      if (!profResponse.success || !profResponse.data)
        throw new Error(profResponse.message || 'Failed to load professional details');

      setProfessional(profResponse.data);

      if (!slotsResponse.success || !slotsResponse.data)
        throw new Error(slotsResponse.message || 'Failed to load available time slots');

      const selectedDaySlots = slotsResponse.data.find(
        (day: { date: string }) =>
          new Date(day.date).toDateString() === new Date(selectedDate).toDateString()
      );

      const availableSlots =
        selectedDaySlots?.slots
          ?.filter((slot: { isAvailable: boolean }) => slot.isAvailable)
          ?.map((slot: { startTime: string }) => ({
            id: `slot_${slot.startTime}`,
            time: slot.startTime,
            isAvailable: true,
            fullSlotData: { ...slot, date: selectedDate, professionalId },
          })) || [];

      setTimeSlots(availableSlots);
    } catch (err: any) {
      console.error('Error in fetchTimeSlots:', err);
      setError(err.message || 'Failed to load available slots.');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, professionalId]);

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleContinue = () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot to continue.');
      return;
    }
    if (!professional) {
      Alert.alert('Error', 'Professional information not available.');
      return;
    }

    const [hours, minutes] = selectedTime.time.split(':').map(Number);
    const [year, month, day] = selectedDate.split('-').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes);

    const bookingProfessional = {
      id: professional.id,
      name: `${professional.firstName || ''} ${professional.lastName || ''}`.trim(),
      title: professional.specializations?.[0] || 'Professional',
      price: professional.serviceTypes?.[0]?.price || 0,
    };

    navigation.navigate(ROUTES.BOOK_CONSULTATION, {
      professional: bookingProfessional,
      selectedTime: start.toISOString(),
      mode,
      location,
      slot: selectedTime.fullSlotData,
      bookingData: {
        professional: bookingProfessional,
        startTime: start.toISOString(),
        endTime: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        mode,
        location,
        serviceType: 'consultation',
        price: professional.serviceTypes?.[0]?.price || 0,
      },
    });
  };

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => (
    <TouchableOpacity
      style={[
        styles.timeCard,
        selectedTime?.id === item.id && styles.selectedTimeCard,
        !item.isAvailable && styles.unavailableTimeCard,
      ]}
      onPress={() => item.isAvailable && setSelectedTime(item)}
      disabled={!item.isAvailable}
    >
      <Text
        style={[
          styles.timeLabel,
          selectedTime?.id === item.id && styles.selectedTimeLabel,
          !item.isAvailable && styles.unavailableTimeLabel,
        ]}
      >
        {item.time}
      </Text>
      {selectedTime?.id === item.id && (
        <MaterialCommunityIcons name="check" size={20} color={colors.offWhite} />
      )}
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading)
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color={colors.primaryGreen} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );

  if (error)
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchTimeSlots}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Time</Text>
      </View>

      <View style={styles.content}>
        <MaterialCommunityIcons name="clock" size={60} color={colors.primaryGreen} />
        <Text style={styles.title}>Choose Your Time</Text>
        <Text style={styles.subtitle}>Select a time slot for your {mode} consultation</Text>
        <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
      </View>

      <FlatList
        data={timeSlots}
        renderItem={renderTimeSlot}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.timeGrid}
      />

      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.button, !selectedTime && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedTime}
        >
          <Text style={styles.buttonText}>Continue to Booking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  content: { alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: colors.primaryText, marginTop: 16 },
  subtitle: { fontSize: 16, color: colors.secondaryText },
  dateText: { fontSize: 14, color: colors.primaryGreen, marginTop: 12 },
  timeGrid: { paddingHorizontal: 20, paddingBottom: 20 },
  timeCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 14,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedTimeCard: { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen },
  unavailableTimeCard: { opacity: 0.6 },
  timeLabel: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  selectedTimeLabel: { color: colors.offWhite },
  unavailableTimeLabel: { color: colors.secondaryText },
  bottomAction: { padding: 20, borderTopWidth: 1, borderTopColor: colors.border },
  button: { backgroundColor: colors.primaryGreen, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { backgroundColor: colors.border },
  buttonText: { fontSize: 16, fontWeight: '600', color: colors.offWhite },
  errorText: { color: colors.error, textAlign: 'center', marginTop: 100, fontSize: 16 },
  retryButton: { alignSelf: 'center', marginTop: 20, backgroundColor: colors.primaryGreen, padding: 10, borderRadius: 8 },
  retryButtonText: { color: colors.offWhite },
});

export default TimeSelectionScreen;
