import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Animated,
  SafeAreaView,
  RefreshControl,
  StatusBar,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  format, 
  parseISO, 
  isToday, 
  isTomorrow, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths,
  isSameMonth,
  isSameDay,
  getDay,
} from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// ✅ CORRECT IMPORTS
import type { RootStackParamList } from '../../App';
import { apiService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../store';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';
import { AvailableSlot, FormattedAvailableSlot } from '../types/booking';

type SelectTimeRouteProp = RouteProp<RootStackParamList, 'SelectTime'>;
type SelectTimeNavigationProp = StackNavigationProp<RootStackParamList, 'SelectTime'>;

const { width, height } = Dimensions.get('window');

const SelectTimeScreen: React.FC = () => {
  console.log('🚀 SelectTimeScreen MOUNTED - Modern UI');
  
  const navigation = useNavigation<SelectTimeNavigationProp>();
  const route = useRoute<SelectTimeRouteProp>();
  const { professionalId, professionalName, serviceDetails } = route.params;
  const { theme: appTheme } = useTheme();

  // Debug: Log received parameters
  console.log('📦 SelectTimeScreen received params:', {
    professionalId,
    professionalName,
    serviceDetails
  });

  // State management
  const [allSlots, setAllSlots] = useState<FormattedAvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<FormattedAvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState<Set<Date>>(new Set());
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null); // For duration filtering
  const [showDurationDropdown, setShowDurationDropdown] = useState(false); // For dropdown visibility

  const { user } = useAppSelector((state: any) => state.auth);
  const userId = user?.user_id || user?._id || user?.id;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // --- HELPER FUNCTIONS ---
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (e) { 
      console.warn('Invalid time format:', dateString);
      return dateString; 
    }
  };

  const getSlotDuration = (startTime: string, endTime: string) => {
    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    } catch { return 0; }
  };

  const formatDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // --- API CALLS ---
  const fetchAvailableSlots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Fetching slots for:', professionalId);
      
      const slots = await apiService.getAllAvailableSlots(professionalId);
      
      if (!slots || !slots.data || !Array.isArray(slots.data) || slots.data.length === 0) {
        setAllSlots([]);
        setError('No available time slots found.');
        return;
      }

      const formattedSlots = (slots.data as AvailableSlot[]).map(slot => ({
        ...slot,
        displayStartTime: formatTime(slot.start_time),
        displayEndTime: formatTime(slot.end_time),
      }));

      // Filter out past dates and extract available dates
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const futureSlots = formattedSlots.filter(slot => {
        const slotDate = parseISO(slot.date);
        return slotDate >= now;
      });

      // Extract unique available dates
      const dates = new Set<string>();
      futureSlots.forEach(slot => {
        const slotDate = parseISO(slot.date);
        dates.add(format(slotDate, 'yyyy-MM-dd'));
      });

      setAllSlots(futureSlots);
      setAvailableDates(new Set(Array.from(dates).map(d => parseISO(d))));
      animateIn();
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load slots');
    } finally {
      setIsLoading(false);
    }
  }, [professionalId, animateIn]);

  const fetchPriceForSlot = async (slot: FormattedAvailableSlot) => {
    try {
      setIsPriceLoading(true);
      const duration = getSlotDuration(slot.start_time, slot.end_time);
      const result = await apiService.calculateBookingPrice({
        slotId: slot.id,
        duration,
        userId
      });
      if (result.success) setPriceDetails(result.data);
    } catch (e) { console.error(e); } 
    finally { setIsPriceLoading(false); }
  };

  useEffect(() => { 
    fetchAvailableSlots();
  }, [professionalId, fetchAvailableSlots]);

  // --- HANDLERS ---
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setPriceDetails(null);
  };

  const handleSlotSelect = (slot: FormattedAvailableSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setPriceDetails(null);
    } else {
      setSelectedSlot(slot);
      fetchPriceForSlot(slot);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleConfirm = () => {
    if (!selectedSlot || !selectedDate || !serviceDetails) return;
    
    const bookingData = {
      professionalId,
      professionalName,
      serviceName: serviceDetails.name,
      price: priceDetails?.final_amount || 0,
      date: format(selectedDate, 'yyyy-MM-dd'),
      startTime: selectedSlot.start_time,
      endTime: selectedSlot.end_time,
      duration: getSlotDuration(selectedSlot.start_time, selectedSlot.end_time),
      slotId: selectedSlot.id,
      serviceType: 'consultation',
      deliveryMode: selectedSlot.is_online ? 'online' : 'offline',
    };

    navigation.navigate('BookingConfirmationScreen' as any, { bookingData });
  };

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Add empty days for alignment
    const startDay = getDay(startOfMonth(currentMonth));
    const emptyDays = Array(startDay).fill(null);
    
    return [...emptyDays, ...days];
  };

  const getSlotsForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allSlots.filter(slot => slot.date.startsWith(dateStr));
  };

  const isDateAvailable = (date: Date) => {
    return Array.from(availableDates).some(availableDate => 
      isSameDay(date, availableDate)
    );
  };

  // --- DURATION FILTER LOGIC ---
  const getAvailableDurations = () => {
    const durations = new Set<number>();
    selectedDateSlots.forEach(slot => {
      const duration = getSlotDuration(slot.start_time, slot.end_time);
      if (duration > 0) durations.add(duration);
    });
    return Array.from(durations).sort((a, b) => a - b);
  };

  const handleDurationSelect = (duration: number | null) => {
    setSelectedDuration(duration);
    setShowDurationDropdown(false);
  };

  const toggleDropdown = () => {
    setShowDurationDropdown(!showDurationDropdown);
  };

  const getFilteredTimeSlots = () => {
    if (!selectedDuration) return selectedDateSlots;
    return selectedDateSlots.filter(slot => {
      const duration = getSlotDuration(slot.start_time, slot.end_time);
      return duration === selectedDuration;
    });
  };

  // --- RENDER COMPONENTS ---
  const renderCalendarDay = (day: Date | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const isSelected = selectedDate && isSameDay(day, selectedDate);
    const isAvailable = isDateAvailable(day);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isTodayDate = isToday(day);
    const isPast = day < new Date() && !isTodayDate;

    return (
      <TouchableOpacity
        key={day.toISOString()}
        style={[
          styles.calendarDay,
          isSelected && styles.selectedCalendarDay,
          isAvailable && !isPast && styles.availableCalendarDay,
          isTodayDate && styles.todayCalendarDay,
          !isCurrentMonth && styles.otherMonthDay,
          isPast && styles.pastDay
        ]}
        onPress={() => isAvailable && !isPast && handleDateSelect(day)}
        disabled={!isAvailable || isPast}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.calendarDayText,
          isSelected && styles.selectedCalendarDayText,
          isAvailable && !isPast && styles.availableCalendarDayText,
          !isCurrentMonth && styles.otherMonthDayText,
          isPast && styles.pastDayText
        ]}>
          {format(day, 'd')}
        </Text>
        {isAvailable && !isPast && (
          <View style={[
            styles.availableDot,
            isSelected && styles.selectedAvailableDot
          ]} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTimeSlot = (slot: FormattedAvailableSlot) => {
    const isSelected = selectedSlot?.id === slot.id;
    const duration = getSlotDuration(slot.start_time, slot.end_time);

    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.timeSlotCard,
          isSelected && styles.selectedTimeSlotCard,
          slot.is_online && styles.onlineTimeSlotCard
        ]}
        onPress={() => handleSlotSelect(slot)}
        activeOpacity={0.8}
      >
        <View style={styles.timeSlotContent}>
          <View style={styles.timeSlotHeader}>
            <Text style={[
              styles.timeSlotTime,
              isSelected && styles.selectedTimeSlotText
            ]}>
              {slot.displayStartTime}
            </Text>
            <View style={styles.timeSlotHeaderRight}>
              {slot.is_online && (
                <View style={[
                  styles.onlineBadge,
                  isSelected && styles.selectedOnlineBadge
                ]}>
                  <Ionicons name="videocam" size={12} color={isSelected ? theme.colors.primary : "#fff"} />
                  <Text style={[
                    styles.onlineBadgeText,
                    isSelected && styles.selectedOnlineBadgeText
                  ]}>Online</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.timeSlotFooter}>
            <Text style={[
              styles.timeSlotDuration,
              isSelected && styles.selectedTimeSlotDuration
            ]}>
              {duration} min
            </Text>
            <View style={styles.timeSlotPriceContainer}>
              <Text style={[
                styles.timeSlotPrice,
                isSelected && styles.selectedTimeSlotPrice
              ]}>
                ₹{duration * 10}
              </Text>
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Select Time Slot</Text>
              <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
            </View>
            <View style={styles.shareButton} />
          </View>
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.loadingText}>Finding available slots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Select Time Slot</Text>
              <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
            </View>
            <View style={styles.shareButton} />
          </View>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={appTheme.colors.error} />
          <Text style={styles.errorText}>Failed to load time slots</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableSlots}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008272" />
      
      {/* Header */}
      <LinearGradient
        colors={['#008272', '#4C7360', '#2F5233']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Select Time Slot</Text>
            <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAvailableSlots} />
          }
        >
          {/* Professional Info Card */}
          <View style={[styles.professionalCard, styles.firstCard]}>
            <View style={styles.professionalCardContent}>
              <View style={styles.professionalIconContainer}>
                <Ionicons name="person" size={24} color="#FFFFFF" />
              </View>
              
              <View style={styles.professionalTextContainer}>
                <Text style={styles.professionalTitle}>{professionalName}</Text>
                <Text style={styles.professionalSubtitle}>{serviceDetails?.name || 'Consultation'}</Text>
              </View>
              
              <View style={styles.professionalArrowContainer}>
                <Ionicons name="arrow-forward" size={20} color={appTheme.colors.text.secondary} />
              </View>
            </View>
          </View>

          {/* Calendar Card */}
          <View style={[styles.professionalCard, styles.calendarCard]}>
            <View style={styles.professionalCardContent}>
              <View style={styles.calendarIconContainer}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              
              <View style={styles.professionalTextContainer}>
                <Text style={styles.professionalTitle}>Select Date</Text>
                <Text style={styles.professionalSubtitle}>Choose an available date</Text>
              </View>
            </View>

            {/* Calendar Content */}
            <View style={styles.calendarContent}>
            {/* Month Navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity 
                style={styles.monthNavButton} 
                onPress={() => handleMonthChange('prev')}
              >
                <Ionicons name="chevron-back" size={20} color={appTheme.colors.primary} />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              
              <TouchableOpacity 
                style={styles.monthNavButton} 
                onPress={() => handleMonthChange('next')}
              >
                <Ionicons name="chevron-forward" size={20} color={appTheme.colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {/* Day headers */}
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                <Text key={index} style={styles.dayHeader}>
                  {day}
                </Text>
              ))}
              
              {/* Calendar days */}
              {getDaysInMonth().map((day, index) => renderCalendarDay(day, index))}
            </View>

            {/* Selected Date Info */}
            {selectedDate && (
              <View style={styles.selectedDateInfo}>
                <Text style={styles.selectedDateText}>
                  {formatDateLabel(selectedDate)}
                </Text>
                <Text style={styles.selectedDateSlots}>
                  {selectedDateSlots.length} time slots available
                </Text>
              </View>
            )}
            </View>
          </View>

          {/* Time Slots Card */}
          {selectedDate && (
            <View style={[styles.professionalCard, styles.timeSlotsCard]}>
              <View style={styles.professionalCardContent}>
                <View style={styles.timeIconContainer}>
                  <Ionicons name="time-outline" size={24} color="#FFFFFF" />
                </View>
                
                <View style={styles.professionalTextContainer}>
                  <Text style={styles.professionalTitle}>Select Time</Text>
                  <Text style={styles.professionalSubtitle}>Choose your preferred time slot</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={toggleDropdown}
                >
                  <Ionicons 
                    name="ellipsis-vertical" 
                    size={20} 
                    color={appTheme.colors.primary} 
                  />
                </TouchableOpacity>
              </View>

              {/* Duration Dropdown */}
              {showDurationDropdown && (
                <View style={styles.durationDropdown}>
                  <TouchableOpacity 
                    style={styles.dropdownItem}
                    onPress={() => handleDurationSelect(null)}
                  >
                    <Text style={styles.dropdownText}>All Durations</Text>
                    {selectedDuration === null && (
                      <Ionicons name="checkmark" size={16} color={appTheme.colors.primary} />
                    )}
                  </TouchableOpacity>
                  {getAvailableDurations().map(duration => (
                    <TouchableOpacity 
                      key={duration}
                      style={styles.dropdownItem}
                      onPress={() => handleDurationSelect(duration)}
                    >
                      <Text style={styles.dropdownText}>{duration} min</Text>
                      {selectedDuration === duration && (
                        <Ionicons name="checkmark" size={16} color={appTheme.colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Time Slots Content */}
              <View style={styles.calendarContent}>
              {getFilteredTimeSlots().length > 0 ? (
                <View style={styles.timeSlotsGrid}>
                  {getFilteredTimeSlots().map(renderTimeSlot)}
                </View>
              ) : (
                <View style={styles.noSlotsContainer}>
                  <Ionicons name="time-off-outline" size={48} color={appTheme.colors.text.secondary} />
                  <Text style={styles.noSlotsText}>
                    {selectedDuration ? `No ${selectedDuration}min slots available` : 'No time slots available'}
                  </Text>
                  <Text style={styles.noSlotsSubText}>
                    {selectedDuration ? 'Try a different duration' : 'Please select a different date'}
                  </Text>
                </View>
              )}
              </View>
            </View>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.card, { marginBottom: 0 }]}>
          {isPriceLoading ? (
            <ActivityIndicator size="small" color={appTheme.colors.primary} />
          ) : priceDetails ? (
            <View style={styles.priceContent}>
              <Text style={styles.priceLabel}>Total Amount</Text>
              <Text style={styles.priceAmount}>₹{priceDetails.final_amount}</Text>
              {priceDetails.discount_amount > 0 && (
                <Text style={styles.discountText}>
                  You saved ₹{priceDetails.discount_amount}
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.selectPrompt}>Select a time slot to see price</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.bookButton}
          disabled={!selectedSlot}
          onPress={handleConfirm}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedSlot ? [appTheme.colors.primary, appTheme.colors.secondary] : ['#9CA3AF', '#6B7280']}
            style={styles.bookButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color={selectedSlot ? '#fff' : '#9CA3AF'} 
            />
            <Text style={styles.bookButtonText}>
              {selectedSlot ? 'Confirm Booking' : 'Select Time Slot'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.surface,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.m,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },

  // Calendar Styles
  calendarCard: {
    paddingBottom: 0, // Remove padding since content is now in the card header
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  monthNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  emptyDay: {
    width: '14.28%',
    height: 40,
    marginBottom: 4,
  },
  calendarDay: {
    width: '14.28%',
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedCalendarDay: {
    backgroundColor: theme.colors.primary,
  },
  availableCalendarDay: {
    backgroundColor: theme.colors.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  todayCalendarDay: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  pastDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  selectedCalendarDayText: {
    color: '#fff',
  },
  availableCalendarDayText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  otherMonthDayText: {
    color: theme.colors.text.secondary,
  },
  pastDayText: {
    color: theme.colors.text.secondary,
  },
  availableDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  selectedAvailableDot: {
    backgroundColor: '#fff',
  },
  selectedDateInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedDateSlots: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Time Slots Styles
  timeSlotsCard: {
    paddingBottom: 0, // Remove padding since content is now in the card header
  },
  calendarContent: {
    padding: theme.spacing.l,
    paddingTop: 0, // No top padding since header already has padding
  },
  timeSlotsGrid: {
    gap: 12,
  },
  timeSlotCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.background.secondary,
    padding: 8,
  },
  selectedTimeSlotCard: {
    backgroundColor: theme.colors.background.primary,
    borderColor: theme.colors.primary,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineTimeSlotCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  timeSlotContent: {
    flexDirection: 'column',
    padding: 4,
    gap: 6,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeSlotPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotTime: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  selectedTimeSlotText: {
    color: theme.colors.primary,
  },
  timeSlotDuration: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  selectedTimeSlotDuration: {
    color: theme.colors.primary,
  },
  timeSlotPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  selectedTimeSlotPrice: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOnlineBadge: {
    backgroundColor: '#fff',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  onlineBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  selectedOnlineBadgeText: {
    color: theme.colors.primary,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSlotsText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
  noSlotsSubText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },

  // Consistent Header Styles (matching ProfessionalHomeHeader)
  header: { 
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  topCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomWave: {
    position: 'absolute',
    bottom: -20,
    left: -50,
    right: -50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Consistent Card Styles (matching ProfessionalProfileScreen)
  scrollView: { flex: 1 },
  scrollViewContent: { 
    flexGrow: 1, 
    padding: 16,
    paddingTop: 24, // Added extra top margin
    paddingBottom: 140 // Add padding for footer height
  },
  card: { 
    backgroundColor: theme.colors.background.surface, 
    marginBottom: 16, 
    borderRadius: theme.borderRadius.l, 
    padding: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  firstCard: {
    marginTop: 8, // Extra margin for the first card
  },

  // Professional Card Styles (matching ProfessionalHomeScreen)
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#008272',
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.m,
    ...theme.shadows.card,
  },
  professionalCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.l,
    justifyContent: 'space-between',
  },
  professionalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.m,
    backgroundColor: '#008272',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  professionalTextContainer: {
    flex: 1,
  },
  professionalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  professionalSubtitle: {
    fontSize: 14,
    lineHeight: 18,
    color: theme.colors.text.secondary,
  },
  professionalArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.s,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.m,
    backgroundColor: '#008272',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  timeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.m,
    backgroundColor: '#008272',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary + '20',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: '#F5F2ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationDropdown: {
    position: 'absolute',
    top: 60,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    minWidth: 120,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  dropdownText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  sub: { fontSize: 14, color: theme.colors.text.secondary },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' },
  cardContent: {
    marginBottom: 8,
  },

  // Section Styles
  section: {
    backgroundColor: theme.colors.background.surface,
    marginBottom: 16,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
  bookButton: {
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    marginTop: 16,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 20, // Reduced from 100 since we have paddingBottom now
  },

  // Price Styles
  priceContent: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
  },
  discountText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  selectPrompt: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Legacy Styles (keep for compatibility)
  compactSlotsContainer: {
    gap: 20,
  },
  compactDaySection: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  compactDateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  compactDateLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },
  compactDateCount: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: 'System',
  },
  pastDateLabel: {
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  compactSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  compactTimeSlot: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
    padding: 12,
    width: (width - 48 - 24) / 4,
    alignItems: 'center',
    position: 'relative',
    aspectRatio: 1,
  },
  selectedCompactSlot: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  onlineCompactSlot: {
    borderColor: theme.colors.primary,
  },
  compactSlotContent: {
    alignItems: 'center',
  },
  compactTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },
  selectedCompactSlotText: {
    color: '#fff',
  },
  compactDuration: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontFamily: 'System',
  },
  compactOnlineBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactSelectedIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showMoreButton: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 12,
    width: (width - 48 - 24) / 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontFamily: 'System',
  },
  showMoreButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  showMoreTextActive: {
    color: '#fff',
  },
});

export default SelectTimeScreen;
