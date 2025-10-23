import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Calendar } from 'react-native-calendars';
import { HomeStackParamList } from '../../App';
import { apiService } from '../services/api';
import { TimeSlot } from '../types/booking';
import { format } from 'date-fns';

// Define the detailed route parameters for type safety
interface DateTimeSelectionScreenRouteParams {
  professionalId: string;
  professionalName: string;
  serviceId?: string;
  serviceName?: string;
  price?: number;
  duration?: number;
  serviceDetails?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  };
}


// Define the specific route and navigation prop types for this screen
type DateTimeSelectionScreenRouteProp = RouteProp<HomeStackParamList, 'DateTimeSelection'>;
type DateTimeSelectionScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'DateTimeSelection'>;

const DateTimeSelectionScreen = () => {
  const navigation = useNavigation<DateTimeSelectionScreenNavigationProp>();
  const route = useRoute<DateTimeSelectionScreenRouteProp>();
  const { 
    professionalId, 
    professionalName = 'Professional', 
    serviceDetails,
    serviceId = serviceDetails?.id,
    serviceName = serviceDetails?.name || 'Consultation',
    price = serviceDetails?.price || 0,
    duration = serviceDetails?.duration || 30,
  } = route.params;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available slots when a date is selected
  useEffect(() => {
    if (selectedDate) {
      fetchSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchSlotsForDate = async (date: string) => {
    setIsLoading(true);
    setError(null);
    setAvailableSlots([]);
    setSelectedSlot(null);

    try {
      const response = await apiService.getAvailableSlots(professionalId, date);
      
      if (response.success && response.data && Array.isArray(response.data.slots)) {
        // Normalize the API response to match our TimeSlot interface
        const normalizedSlots = response.data.slots.map((slot: any) => ({
            id: slot.id || slot._id,
            startTime: slot.startTime || slot.start_time,
            endTime: slot.endTime || slot.end_time,
            isAvailable: slot.isAvailable !== undefined ? slot.isAvailable : true,
        }));
        setAvailableSlots(normalizedSlots);
        if (normalizedSlots.length === 0) {
          setError('No available slots for the selected date');
        }
      } else {
        setError(response.error || 'No availability data received');
      }
    } catch (err: any) {
      console.error('Error fetching slots:', err);
      setError('Failed to load available slots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedSlot) return;

    const bookingData = {
      professionalId,
      professionalName,
      slot_id: selectedSlot.id,
      date: selectedDate,
      time: selectedSlot.startTime, // Use startTime
      duration,
      price,
      serviceName,
      serviceId,
    };

    navigation.navigate('BookingConfirmation', { bookingData });
  };

  const renderTimeSlots = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading available slots...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (!selectedDate) {
        return (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptySubtext}>Please select a date to see availability</Text>
            </View>
          );
    }

    if (availableSlots.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No slots available</Text>
          <Text style={styles.emptySubtext}>Please select another date</Text>
        </View>
      );
    }

    return (
      <View style={styles.slotsContainer}>
        {availableSlots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.slotButton,
              selectedSlot?.id === slot.id && styles.selectedSlotButton,
            ]}
            onPress={() => handleSlotSelect(slot)}
          >
            <Text
              style={[
                styles.slotText,
                selectedSlot?.id === slot.id && styles.selectedSlotText,
              ]}
            >
              {slot.startTime} - {slot.endTime}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Date & Time</Text>
          <Text style={styles.subtitle}>{professionalName}</Text>
          <Text style={styles.serviceName}>{serviceName}</Text>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate || '']: {
                selected: true,
                selectedColor: '#4A90E2',
              },
            }}
            theme={{
              selectedDayBackgroundColor: '#4A90E2',
              todayTextColor: '#4A90E2',
              arrowColor: '#4A90E2',
            }}
            minDate={format(new Date(), 'yyyy-MM-dd')}
          />
        </View>

        <View style={styles.slotsSection}>
          <Text style={styles.sectionTitle}>
            {selectedDate
              ? `Available Slots for ${format(new Date(selectedDate), 'MMMM d, yyyy')}`
              : 'Select a date to see available slots'}
          </Text>
          {renderTimeSlots()}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedDate || !selectedSlot) && styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={!selectedDate || !selectedSlot}
        >
          <Text style={styles.confirmButtonText}>Proceed to Confirm</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#4A4A4A',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 16,
    color: '#666666',
  },
  calendarContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slotsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotButton: {
    width: '48%',
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedSlotButton: {
    borderColor: '#4A90E2',
    backgroundColor: '#F0F7FF',
  },
  slotText: {
    fontSize: 14,
    color: '#333333',
  },
  selectedSlotText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#666666',
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4F',
  },
  errorText: {
    color: '#FF4D4F',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateTimeSelectionScreen;

