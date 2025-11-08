// TimeSelectionScreen.tsx
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
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { professionalService } from '../services';
import type { Professional } from '../services/professional/ProfessionalService';

interface TimeSlot {
  id: string;
  time: string;
  isAvailable: boolean;
  fullSlotData?: any; // For any additional slot data from the API
}

const TimeSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedDate, mode, location, professionalId } = route.params as {
    selectedDate: string;
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    professionalId?: string;
  };

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [professional, setProfessional] = useState<Professional | null>(null);

  const fetchTimeSlots = useCallback(async () => {
    if (!professionalId) {
      generateDefaultTimeSlots();
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Get professional details and slots in parallel
      const [profResponse, slotsResponse] = await Promise.all([
        professionalService.getProfessionalById(professionalId),
        professionalService.checkSlotAvailability(professionalId)
      ]);

      // Handle professional data
      if (profResponse.success && profResponse.data) {
        setProfessional(profResponse.data);
      } else {
        throw new Error(profResponse.message || 'Failed to load professional details');
      }

      // Handle time slots
      if (slotsResponse.success && slotsResponse.data) {
        const selectedDaySlots = slotsResponse.data.find(
          (day: { date: string }) => day.date === selectedDate
        );

        if (selectedDaySlots?.slots?.length) {
          const availableSlots = selectedDaySlots.slots
            .filter((slot: { isAvailable: boolean }) => slot.isAvailable)
            .map((slot: { startTime: string }) => ({
              id: `slot_${slot.startTime}`,
              time: slot.startTime,
              isAvailable: true,
              fullSlotData: {
                ...slot,
                date: selectedDate,
                professionalId,
                professional: profResponse.data
              }
            }));

          setTimeSlots(availableSlots.length > 0 ? availableSlots : []);
        } else {
          setTimeSlots([]);
        }
      } else {
        throw new Error(slotsResponse.message || 'Failed to load time slots');
      }
    } catch (error) {
      console.error('Error in fetchTimeSlots:', error);
      setError('Failed to load time slots. Please try again.');
      setTimeSlots([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, professionalId]);

  const generateDefaultTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Add slots every hour
      slots.push({
        id: `slot_${hour}:00`,
        time: `${hour.toString().padStart(2, '0')}:00`,
        isAvailable: true,
      });
      
      // Add half-hour slots
      if (hour < endHour - 1) {
        slots.push({
          id: `slot_${hour}:30`,
          time: `${hour.toString().padStart(2, '0')}:30`,
          isAvailable: true,
        });
      }
    }
    
    setTimeSlots(slots);
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (!timeSlot.isAvailable) {
      Alert.alert('Time Not Available', 'This time slot is not available for booking.');
      return;
    }
    setSelectedTime(timeSlot);
  };

  const handleContinue = () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot to continue.');
      return;
    }

    if (!professional) {
      Alert.alert('Error', 'Professional information not available');
      return;
    }

    // Format the selected date and time
    const [hours, minutes] = selectedTime.time.split(':');
    const [year, month, day] = selectedDate.split('-');
    const selectedDateTime = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes)
    );

    // Prepare professional data for booking
    const bookingProfessionalData = {
      id: professional.id,
      name: `${professional.firstName} ${professional.lastName}`,
      title: professional.specializations?.[0] || 'Professional',
      price: professional.serviceTypes?.[0]?.price || 0
    };

    // Prepare slot data
    const slotData = {
      id: selectedTime.id,
      time: selectedTime.time,
      date: selectedDate,
      duration: 60, // Default 60 minutes
      professionalId: professional.id,
      professional: bookingProfessionalData,
      ...(selectedTime as any).fullSlotData // Type assertion for additional slot data
    };

    // Navigate directly to BOOK_CONSULTATION with all necessary data
    navigation.navigate(ROUTES.BOOK_CONSULTATION, {
      professional: bookingProfessionalData,
      selectedTime: selectedDateTime.toISOString(),
      mode,
      location,
      slot: slotData,
      // Include any additional data needed for the booking flow
      bookingData: {
        startTime: selectedDateTime.toISOString(),
        endTime: new Date(selectedDateTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        mode,
        location,
        professional: bookingProfessionalData,
        serviceType: 'consultation',
        price: professional.serviceTypes?.[0]?.price || 0
      }
    });
  };

  const renderTimeSlot = ({ item }: { item: TimeSlot }) => (
    <TouchableOpacity
      style={[
        styles.timeCard,
        selectedTime?.id === item.id && styles.selectedTimeCard,
        !item.isAvailable && styles.unavailableTimeCard,
      ]}
      onPress={() => handleTimeSelect(item)}
      disabled={!item.isAvailable}
    >
      <Text style={[
        styles.timeLabel,
        selectedTime?.id === item.id && styles.selectedTimeLabel,
        !item.isAvailable && styles.unavailableTimeLabel,
      ]}>
        {item.time}
      </Text>
      {selectedTime?.id === item.id && (
        <MaterialCommunityIcons name="check" size={20} color={colors.offWhite} />
      )}
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Time</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading available time slots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Time</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <MaterialCommunityIcons name="clock" size={60} color={colors.primaryGreen} />
        <Text style={styles.title}>Choose Your Time</Text>
        <Text style={styles.subtitle}>
          Select a time slot for your {mode} consultation
        </Text>
        <Text style={styles.dateText}>
          {formatDate(selectedDate)}
        </Text>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Time Slots Grid */}
      <FlatList
        data={timeSlots}
        renderItem={renderTimeSlot}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.timeGrid}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.button,
            !selectedTime && styles.buttonDisabled,
          ]}
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondaryText,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    marginBottom: 16,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 14,
    color: colors.primaryGreen,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '600' as const,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
  timeGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timeCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    margin: 6,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    minWidth: 100,
  },
  selectedTimeCard: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  unavailableTimeCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.6,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  selectedTimeLabel: {
    color: colors.offWhite,
  },
  unavailableTimeLabel: {
    color: colors.secondaryText,
  },
  bottomAction: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.offWhite,
  },
});

export default TimeSelectionScreen;
