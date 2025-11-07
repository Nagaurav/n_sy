// DateSelectionScreen.tsx
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
import { useNavigation, useRoute, NavigationProp } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { professionalSlotService } from '../services/professionalSlotService';

interface DateOption {
  id: string;
  label: string;
  date: Date;
  isAvailable: boolean;
}

const DateSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute();
  const { mode, location, professionalId } = route.params as {
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    professionalId?: string;
  };

  const [availableDates, setAvailableDates] = useState<DateOption[]>([]);
  const [selectedDate, setSelectedDate] = useState<DateOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailableDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (professionalId) {
        // Fetch available slots for the professional
        const response = await professionalSlotService.getAvailableSlots(professionalId);
        if (response && response.slots) {
          // Transform slots to date options
          const dateMap = new Map<string, DateOption>();
          
          response.slots.forEach((slot: any) => {
            const dateKey = slot.date;
            const date = new Date(slot.date);
            
            if (!dateMap.has(dateKey)) {
              dateMap.set(dateKey, {
                id: dateKey,
                label: formatDateLabel(date),
                date: date,
                isAvailable: slot.status !== 'booked'
              });
            }
          });
          
          const dates = Array.from(dateMap.values());
          setAvailableDates(dates);
        } else {
          // Fallback to generated dates if no slots available
          generateDefaultDates();
        }
      } else {
        // Generate default available dates if no professional ID
        generateDefaultDates();
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      generateDefaultDates();
    } finally {
      setLoading(false);
    }
  }, [professionalId]);

  const generateDefaultDates = () => {
    const dates: DateOption[] = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      dates.push({
        id: date.toISOString().split('T')[0],
        label: formatDateLabel(date),
        date: date,
        isAvailable: i > 0, // Today is not available, future dates are
      });
    }
    
    setAvailableDates(dates);
  };

  const formatDateLabel = (date: Date): string => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}`;
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  const handleDateSelect = (dateOption: DateOption) => {
    if (!dateOption.isAvailable) {
      Alert.alert('Date Not Available', 'This date is not available for booking.');
      return;
    }
    setSelectedDate(dateOption);
  };

  const handleContinue = () => {
    if (!selectedDate) {
      Alert.alert('Select Date', 'Please select a date to continue.');
      return;
    }

    navigation.navigate(ROUTES.TIME_SELECTION, {
      selectedDate: selectedDate.date.toISOString().split('T')[0],
      mode,
      location,
      professionalId,
    });
  };

  const renderDateItem = ({ item }: { item: DateOption }) => (
    <TouchableOpacity
      style={[
        styles.dateCard,
        selectedDate?.id === item.id && styles.selectedDateCard,
        !item.isAvailable && styles.unavailableDateCard,
      ]}
      onPress={() => handleDateSelect(item)}
      disabled={!item.isAvailable}
    >
      <Text style={[
        styles.dateLabel,
        selectedDate?.id === item.id && styles.selectedDateLabel,
        !item.isAvailable && styles.unavailableDateLabel,
      ]}>
        {item.label}
      </Text>
      {selectedDate?.id === item.id && (
        <MaterialCommunityIcons name="check" size={20} color={colors.offWhite} />
      )}
    </TouchableOpacity>
  );

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
          <Text style={styles.headerTitle}>Select Date</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading available dates...</Text>
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
        <Text style={styles.headerTitle}>Select Date</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <MaterialCommunityIcons name="calendar" size={60} color={colors.primaryGreen} />
        <Text style={styles.title}>Choose Your Date</Text>
        <Text style={styles.subtitle}>
          Select a date for your {mode} consultation
        </Text>
        
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Date List */}
      <FlatList
        data={availableDates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.dateList}
        showsVerticalScrollIndicator={false}
      />

      {/* Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.button,
            !selectedDate && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedDate}
        >
          <Text style={styles.buttonText}>Continue to Time Selection</Text>
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
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
    marginTop: 8,
  },
  dateList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedDateCard: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  unavailableDateCard: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.6,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  selectedDateLabel: {
    color: colors.offWhite,
  },
  unavailableDateLabel: {
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

export default DateSelectionScreen;
