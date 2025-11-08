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
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { professionalService } from '../services';
import type { RootStackParamList } from '../navigation/constants';

// ✅ Type-safe navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface DateOption {
  id: string;
  label: string;
  date: Date;
  isAvailable: boolean;
}

interface SlotAvailabilityResponse {
  success: boolean;
  data?: {
    date: string;
    slots: { time: string; isAvailable: boolean }[];
  }[];
  message?: string;
}

const DateSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
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

  /** 🧠 Utility: Format readable date labels */
  const formatDateLabel = useCallback((date: Date): string => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  /** 🧠 Fallback generator for mock data */
  const generateDefaultDates = useCallback((): DateOption[] => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return {
        id: d.toISOString().split('T')[0],
        label: formatDateLabel(d),
        date: d,
        isAvailable: i > 0,
      };
    });
  }, [formatDateLabel]);

  /** 🧠 Fetch date availability */
  const fetchAvailableDates = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!professionalId) {
      setAvailableDates(generateDefaultDates());
      setLoading(false);
      return;
    }

    try {
      const response: SlotAvailabilityResponse = await professionalService.checkSlotAvailability(professionalId);

      if (response.success && response.data) {
        const dateOptions: DateOption[] = response.data.map(({ date, slots }) => {
          const dateObj = new Date(date);
          const hasAvailableSlots = slots.some((s) => s.isAvailable);
          return {
            id: date,
            label: formatDateLabel(dateObj),
            date: dateObj,
            isAvailable: hasAvailableSlots,
          };
        });

        if (dateOptions.length === 0 || !dateOptions.some((d) => d.isAvailable)) {
          setError('No available slots found for this professional.');
        }

        setAvailableDates(dateOptions);
      } else {
        console.warn('API returned no data, using fallback.');
        setAvailableDates(generateDefaultDates());
      }
    } catch (err: any) {
      console.error('Error fetching available dates:', err);
      setError('Unable to fetch available dates. Please try again.');
      setAvailableDates(generateDefaultDates());
    } finally {
      setLoading(false);
    }
  }, [professionalId, formatDateLabel, generateDefaultDates]);

  useEffect(() => {
    fetchAvailableDates();
  }, [fetchAvailableDates]);

  /** 🧠 Handlers */
  const handleDateSelect = (item: DateOption) => {
    if (!item.isAvailable) {
      Alert.alert('Date Unavailable', 'Please choose another date.');
      return;
    }
    setSelectedDate(item);
  };

  const handleContinue = () => {
    if (!selectedDate) {
      Alert.alert('Select a Date', 'Please choose a date to proceed.');
      return;
    }

    navigation.navigate(ROUTES.TIME_SELECTION, {
      selectedDate: selectedDate.date.toISOString().split('T')[0],
      mode,
      location,
      professionalId,
    });
  };

  /** 🧠 Render Date Item */
  const renderDateItem = ({ item }: { item: DateOption }) => {
    const isSelected = selectedDate?.id === item.id;
    const isUnavailable = !item.isAvailable;
    return (
      <TouchableOpacity
        style={[
          styles.dateCard,
          isSelected && styles.selectedCard,
          isUnavailable && styles.unavailableCard,
        ]}
        onPress={() => handleDateSelect(item)}
        disabled={isUnavailable}
      >
        <Text
          style={[
            styles.dateText,
            isSelected && styles.selectedDateText,
            isUnavailable && styles.unavailableDateText,
          ]}
        >
          {item.label}
        </Text>
        {isSelected && (
          <MaterialCommunityIcons name="check" size={20} color={colors.offWhite} />
        )}
      </TouchableOpacity>
    );
  };

  /** 🧠 Loader & Error States */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Date</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Fetching available dates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Date</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      <View style={styles.intro}>
        <MaterialCommunityIcons name="calendar" size={60} color={colors.primaryGreen} />
        <Text style={styles.title}>Choose Your Date</Text>
        <Text style={styles.subtitle}>
          Select a date for your {mode.toUpperCase()} consultation
        </Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Date List */}
      <FlatList
        data={availableDates}
        renderItem={renderDateItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueButton, !selectedDate && styles.disabledButton]}
          onPress={handleContinue}
          disabled={!selectedDate}
        >
          <Text style={styles.continueText}>Continue to Time Selection</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 15, color: colors.secondaryText },
  intro: { alignItems: 'center', paddingHorizontal: 40, marginVertical: 20 },
  title: { fontSize: 22, fontWeight: '700', color: colors.primaryText, marginTop: 12 },
  subtitle: { fontSize: 15, color: colors.secondaryText, textAlign: 'center', marginTop: 6 },
  errorText: { color: colors.error, fontSize: 14, marginTop: 10, textAlign: 'center' },
  listContainer: { paddingHorizontal: 20, paddingBottom: 20 },
  dateCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCard: { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen },
  unavailableCard: { opacity: 0.6, backgroundColor: colors.background },
  dateText: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  selectedDateText: { color: colors.offWhite },
  unavailableDateText: { color: colors.secondaryText },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    alignItems: 'center',
    paddingVertical: 14,
  },
  continueText: { color: colors.offWhite, fontSize: 16, fontWeight: '600' },
  disabledButton: { backgroundColor: colors.border },
});

export default DateSelectionScreen;
