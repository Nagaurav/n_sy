import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  SectionList,
  Platform,
  SectionListData,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO } from 'date-fns';
import { HomeStackParamList } from '../../App';
import { apiService } from '../services/apiService';
import { useAppSelector } from '../store';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { 
  AvailableSlot, 
  FormattedAvailableSlot, 
  SectionData 
} from '../types/booking';

type DateTimeSelectionRouteProp = RouteProp<HomeStackParamList, 'DateTimeSelection'>;
type DateTimeSelectionNavigationProp = StackNavigationProp<HomeStackParamList, 'DateTimeSelection'>;

const DateTimeSelectionScreen = () => {
  const navigation = useNavigation<DateTimeSelectionNavigationProp>();
  const route = useRoute<DateTimeSelectionRouteProp>();
  const { 
    professionalId, 
    professionalName, 
    serviceDetails 
  } = route.params;

  const [sectionedSlots, setSectionedSlots] = useState<SectionData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FormattedAvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDetails, setPriceDetails] = useState<{
    original_amount: number;
    discount_amount: number;
    final_amount: number;
  } | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);
  const { user } = useAppSelector((state: any) => state.auth);
  const userId = user?.user_id || user?._id || user?.id;
  
  // Format time to 12-hour format with AM/PM
  const formatTime = (dateString: string): string => {
    try {
      // Parse the time string (e.g., '1970-01-01T03:30:00.000Z')
      const date = new Date(dateString);
      // Extract hours and minutes
      let hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      
      // Convert to 12-hour format
      hours = hours % 12;
      hours = hours || 12; // Convert 0 to 12
      
      // Format minutes to always be 2 digits
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return dateString; // Return original string if parsing fails
    }
  };

  // Fetch available slots from the API
  const fetchAvailableSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedSlot(null);

      console.log('🔍 Fetching available slots for professional:', professionalId);
      
      // Use the API service to fetch available slots
      const slots = await apiService.getAllAvailableSlots(professionalId);
      
      console.log('📦 Available slots response:', slots);

      // Check if we have any slots
      if (!slots || !Array.isArray(slots)) {
        console.warn('⚠️ Invalid slots data format:', slots);
        setSectionedSlots([]);
        setError('Could not load available time slots. Please try again later.');
        return;
      }
      
      if (slots.length === 0) {
        console.log('ℹ️ No available time slots found');
        setSectionedSlots([]);
        setError('No available time slots found for this professional. Please check back later.');
        return;
      }

      // Process and group slots by date
      const groupedSlots = (slots as AvailableSlot[]).reduce<SectionData[]>((acc: SectionData[], slot: AvailableSlot) => {
        const dateKey = slot.date.substring(0, 10); // Extract YYYY-MM-DD
        
        // Format the slot with display times
        const formattedSlot: FormattedAvailableSlot = {
          ...slot,
          displayStartTime: formatTime(slot.start_time),
          displayEndTime: formatTime(slot.end_time),
          isSelected: false
        };

        // Find or create the section for this date
        let section = acc.find((sec: SectionData) => sec.title === dateKey);
        if (!section) {
          section = { 
            title: dateKey, 
            data: [],
            formattedDate: format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')
          };
          acc.push(section);
        }
        section.data.push(formattedSlot);

        return acc;
      }, [] as SectionData[]);

      // Sort sections by date
      groupedSlots.sort((a: SectionData, b: SectionData) => a.title.localeCompare(b.title));

      // Sort slots within each section by start time
      groupedSlots.forEach((section: SectionData) => {
        section.data.sort((a: FormattedAvailableSlot, b: FormattedAvailableSlot) => 
          a.start_time.localeCompare(b.start_time)
        );
      });

      setSectionedSlots(groupedSlots);
      console.log('🔍 Final sectionedSlots state:', {
        totalSections: groupedSlots.length,
        totalSlots: groupedSlots.reduce((acc, section) => acc + section.data.length, 0),
        firstSection: groupedSlots[0],
        isLoading: false
      });
    } catch (error: any) {
      console.error('❌ Error fetching available slots:', error);
      setError(
        error.response?.data?.message || 
        error.message || 
        'Failed to load available time slots. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [professionalId]);

  const getSlotDuration = (startTime: string, endTime: string): number => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Convert ms to minutes
    } catch (error) {
      console.error('Error calculating slot duration:', error);
      return 0;
    }
  };

  const fetchPriceForSlot = async (slot: FormattedAvailableSlot) => {
    try {
      setIsPriceLoading(true);
      setPriceError(null);

      const rawDuration = getSlotDuration(slot.start_time, slot.end_time);
      const duration =
        Number.isFinite(rawDuration) && rawDuration > 0
          ? rawDuration
          : slot.duration || 60;

      console.log('Requesting price for slot:', {
        slotId: slot.id,
        duration,
      });
      const result = await apiService.calculateBookingPrice({
        slotId: slot.id,
        duration,
        userId,
      });

      if (!result.success || !result.data) {
        setPriceDetails(null);
        setPriceError(result.error || 'Failed to calculate price. Please try again.');
        return;
      }

      setPriceDetails(result.data);
    } catch (err: any) {
      console.error('Error calculating price:', err);
      setPriceDetails(null);
      setPriceError(
        err?.message || 'Failed to calculate price. Please try again.',
      );
    } finally {
      setIsPriceLoading(false);
    }
  };

  // Handle slot selection
  const handleSlotSelect = (slot: FormattedAvailableSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setPriceDetails(null);
      setPriceError(null);
      return;
    }

    setSelectedSlot(slot);
    fetchPriceForSlot(slot);
  };

  // Handle booking confirmation
  const handleConfirm = useCallback(() => {
    if (!selectedSlot) {
      Alert.alert('No Slot Selected', 'Please select a time slot to continue.');
      return;
    }

    if (!serviceDetails) {
      Alert.alert('No Service Selected', 'Please select a service to continue.');
      return;
    }

    if (!priceDetails || isPriceLoading) {
      Alert.alert('Price not ready', 'Please wait while we calculate the price.');
      return;
    }
    
    // Get the slot duration in minutes
    const slotDuration = getSlotDuration(selectedSlot.start_time, selectedSlot.end_time);

    const finalPrice = priceDetails.final_amount;

    // Format the booking data as expected by BookingConfirmationScreen
    const bookingData = {
      professionalId,
      professionalName,
      slot_id: selectedSlot.id, // Use slot_id to match BookingConfirmationScreen interface
      date: selectedSlot.date,
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      duration: slotDuration,
      price: finalPrice,
      isOnline: selectedSlot.is_online,
      serviceDetails: {
        id: serviceDetails.id,
        name: serviceDetails.name,
        duration: slotDuration,
        price: finalPrice
      }
    };

    // Navigate to booking confirmation
    navigation.navigate('BookingConfirmation', {
      bookingData,
    });
  }, [navigation, professionalId, professionalName, selectedSlot, serviceDetails, priceDetails, isPriceLoading]);

  useFocusEffect(
    useCallback(() => {
      // Optional: Add any cleanup or state reset logic here
    }, [])
  );

  // Fetch slots when component mounts
  useEffect(() => {
    fetchAvailableSlots();
  }, [fetchAvailableSlots]);

  // Render individual time slot item
  const renderSlotItem = ({ item }: { item: FormattedAvailableSlot }) => {
    const duration = getSlotDuration(item.start_time, item.end_time);
    
    return (
      <TouchableOpacity
        style={[
          styles.slotButton,
          selectedSlot?.id === item.id && styles.selectedSlotButton
        ]}
        onPress={() => handleSlotSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.slotTimeContainer}>
          <Text 
            style={[
              styles.slotButtonText,
              selectedSlot?.id === item.id && styles.selectedSlotText
            ]}
          >
            {item.displayStartTime} - {item.displayEndTime}
          </Text>
          <Text style={styles.slotDurationText}>
            {duration} min
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render section header with formatted date
  const renderSectionHeader = ({ 
    section 
  }: { 
    section: SectionListData<FormattedAvailableSlot> & { formattedDate?: string } 
  }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>
        {section.formattedDate || section.title}
      </Text>
    </View>
  );

  // Render empty state when no slots are available
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="time-outline" 
        size={48} 
        color={theme.colors.primary} 
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyText}>
        {isLoading ? 'Loading available slots...' : 'No available time slots found.'}
      </Text>
      {!isLoading && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAvailableSlots}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render loading state
  if (isLoading && sectionedSlots.length === 0) {
    console.log('🔍 Rendering loading state:', { isLoading, sectionedSlotsLength: sectionedSlots.length });
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading available time slots...</Text>
      </SafeAreaView>
    );
  }

  const isConfirmDisabled = !selectedSlot || isPriceLoading || !!priceError || !priceDetails;

  // Render error state
  if (error) {
    console.log('🔍 Rendering error state:', { error, isLoading, sectionedSlotsLength: sectionedSlots.length });
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color={theme.colors.error} 
        />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchAvailableSlots}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  console.log('🔍 Rendering main component:', { 
    isLoading, 
    sectionedSlotsLength: sectionedSlots.length,
    hasError: !!error,
    firstSection: sectionedSlots[0]
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {professionalName || 'Select Time'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* TEST TEXT - REMOVE LATER */}
      <View style={{ 
        position: 'absolute', 
        top: 100, 
        left: 20, 
        backgroundColor: '#FFFFFF', 
        padding: 20, 
        borderRadius: 10,
        zIndex: 9999 
      }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#000000' }}>
          🟢 DATETIME SELECTION SCREEN IS VISIBLE
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Service Details */}
        {serviceDetails && (
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName} numberOfLines={1}>
              {serviceDetails.name || 'Consultation'}
            </Text>
            <Text style={styles.serviceDuration}>
              {serviceDetails.duration || 30} min • 
              {selectedSlot?.is_online ? 'Online' : 'In-Person'}
            </Text>
          </View>
        )}

        {/* Available Time Slots */}
        <SectionList
          sections={sectionedSlots}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSlotItem}
          renderSectionHeader={renderSectionHeader}
          ListEmptyComponent={renderEmptyComponent()}
          contentContainerStyle={styles.sectionListContent}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
        />
      </View>

      {/* Fixed Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            isConfirmDisabled && styles.disabledButton,
          ]}
          onPress={handleConfirm}
          disabled={isConfirmDisabled}
          accessibilityRole="button"
          accessibilityLabel="Confirm time slot"
          accessibilityHint="Proceed to booking confirmation"
        >
          <Text style={styles.confirmButtonText}>
            {selectedSlot 
              ? `Confirm ${selectedSlot.displayStartTime} Slot`
              : 'Select a Time Slot'}
          </Text>
          
          {selectedSlot && (
            <View style={styles.priceContainer}>
              {isPriceLoading ? (
                <>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.priceLabel, { marginLeft: 8, color: '#fff' }]}> 
                    Calculating price...
                  </Text>
                </>
              ) : priceDetails ? (
                <>
                  <Text style={styles.priceText}>
                    ₹{priceDetails.final_amount.toFixed(2)}
                  </Text>
                  <Text style={styles.priceLabel}>
                    for {getSlotDuration(selectedSlot.start_time, selectedSlot.end_time)} min
                  </Text>
                </>
              ) : priceError ? (
                <Text style={styles.priceLabel}>{priceError}</Text>
              ) : null}
            </View>
          )}
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
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingBottom: 80, // Add padding to prevent content from being hidden behind footer
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: theme.colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.colors?.border || '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  serviceDetails: {
    padding: 16,
    backgroundColor: theme.colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.colors?.border || '#E5E7EB',
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  serviceDuration: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  sectionListContent: {
    paddingBottom: 100, // Space for the footer button
    paddingTop: 8,
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.colors?.border || '#E5E7EB',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  slotButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 4,
    backgroundColor: theme.colors.background.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
  },
  selectedSlotButton: {
    backgroundColor: 'rgba(30, 136, 229, 0.1)',
    borderColor: theme.colors.primary,
  },
  slotButtonText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  slotTimeContainer: {
    flexDirection: 'column',
  },
  slotDurationText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  selectedSlotText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  slotPriceText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.background.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.white,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.colors.background.white,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginVertical: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  confirmButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginRight: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  disabledButton: {
    opacity: 0.6,
    backgroundColor: theme.colors.text.secondary,
  },
});

export default DateTimeSelectionScreen;
