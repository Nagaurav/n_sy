import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Platform,
  StatusBar,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, parseISO, isToday, isTomorrow, isThisWeek } from 'date-fns';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// ✅ CORRECT IMPORTS
import type { RootStackParamList } from '../../App';
import { apiService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../store';
import { theme } from '../theme';
import { AvailableSlot, FormattedAvailableSlot, SectionData } from '../types/booking';

type SelectTimeRouteProp = RouteProp<RootStackParamList, 'SelectTime'>;
type SelectTimeNavigationProp = StackNavigationProp<RootStackParamList, 'SelectTime'>;

const { width, height } = Dimensions.get('window');

const SelectTimeScreen = () => {
  console.log('🚀 SelectTimeScreen MOUNTED - Redesigned UI');
  
  const navigation = useNavigation<SelectTimeNavigationProp>();
  const route = useRoute<SelectTimeRouteProp>();
  const { professionalId, professionalName, serviceDetails } = route.params;

  // Debug: Log received parameters
  console.log('📦 SelectTimeScreen received params:', {
    professionalId,
    professionalName,
    serviceDetails
  });

  // Performance optimization: Limit initial load
  const MAX_INITIAL_DATES = 7; // Load max 7 dates initially
  const LOAD_MORE_THRESHOLD = 3; // Load more when user scrolls near bottom

  const [sectionedSlots, setSectionedSlots] = useState<SectionData[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FormattedAvailableSlot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceDetails, setPriceDetails] = useState<any>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [displayedDates, setDisplayedDates] = useState<number>(MAX_INITIAL_DATES);
  const [allSlotsLoaded, setAllSlotsLoaded] = useState(false);

  const { user } = useAppSelector((state: any) => state.auth);
  const userId = user?.user_id || user?._id || user?.id;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

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

  const formatDateLabel = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isThisWeek(date)) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const loadMoreDates = useCallback(() => {
    setDisplayedDates(prev => Math.min(prev + LOAD_MORE_THRESHOLD, sectionedSlots.length));
  }, [sectionedSlots.length]);

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
        setSectionedSlots([]);
        setError('No available time slots found.');
        return;
      }

      const groupedSlots = (slots.data as AvailableSlot[]).reduce<SectionData[]>((acc, slot) => {
        const dateKey = slot.date.substring(0, 10);
        const formattedSlot: FormattedAvailableSlot = {
          ...slot,
          displayStartTime: formatTime(slot.start_time),
          displayEndTime: formatTime(slot.end_time),
          isSelected: false
        };

        let section = acc.find((sec) => sec.title === dateKey);
        if (!section) {
          section = { 
            title: dateKey, 
            data: [],
            formattedDate: format(parseISO(dateKey), 'EEEE, MMMM d, yyyy'),
            dateLabel: formatDateLabel(dateKey)
          };
          acc.push(section);
        }
        section.data.push(formattedSlot);
        return acc;
      }, []);

      groupedSlots.sort((a, b) => a.title.localeCompare(b.title));
      groupedSlots.forEach(s => s.data.sort((a, b) => a.start_time.localeCompare(b.start_time)));

      setSectionedSlots(groupedSlots);
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

  const handleSlotSelect = (slot: FormattedAvailableSlot) => {
    if (selectedSlot?.id === slot.id) {
      setSelectedSlot(null);
      setPriceDetails(null);
    } else {
      setSelectedSlot(slot);
      fetchPriceForSlot(slot);
    }
  };

  const handleConfirm = () => {
    if (!selectedSlot || !serviceDetails) return;
    const duration = getSlotDuration(selectedSlot.start_time, selectedSlot.end_time);
    
    console.log('🚀 SelectTimeScreen: Attempting to navigate to BookingConfirmation');
    
    try {
      const rootNav = navigation;
      
      if (rootNav) {
        (rootNav as any).navigate('MainDrawer', {
          screen: 'HomeStack',
          params: {
            screen: 'BookingConfirmation',
            params: {
              bookingData: {
                professionalId,
                professionalName,
                slot_id: selectedSlot.id,
                date: selectedSlot.date,
                startTime: selectedSlot.start_time,
                endTime: selectedSlot.end_time,
                duration,
                price: priceDetails?.final_amount || 0,
                isOnline: selectedSlot.is_online,
                serviceDetails: { ...serviceDetails, price: priceDetails?.final_amount || 0 }
              }
            }
          }
        });
        console.log('✅ SelectTimeScreen: Navigation called successfully');
      } else {
        console.log('❌ No root navigation found');
        throw new Error('No navigation available');
      }
    } catch (error) {
      console.error('❌ SelectTimeScreen: Navigation error:', error);
      Alert.alert('Error', 'Unable to proceed with booking confirmation. Please try again.');
    }
  };

  // --- RENDER ---
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.loadingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Finding available slots...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
        <View style={styles.errorContent}>
          <View style={styles.errorIcon}>
            <Ionicons name="alert-circle-outline" size={48} color={theme.colors.feedback.error} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAvailableSlots}>
            <Ionicons name="refresh-outline" size={20} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background.primary} />
      
      {/* Professional Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.professionalHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{professionalName}</Text>
            <Text style={styles.serviceName}>{serviceDetails?.name || 'Consultation'}</Text>
          </View>
          <View style={styles.headerPlaceholder} />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Instructions */}
          <View style={styles.instructionCard}>
            <View style={styles.instructionIcon}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.instructionText}>
              <Text style={styles.instructionTitle}>Select Your Preferred Time</Text>
              <Text style={styles.instructionSubtitle}>Choose a time slot that works best for your schedule</Text>
            </View>
          </View>

          {/* Time Slots - Compact Design */}
          <View style={styles.compactSlotsContainer}>
            {sectionedSlots.slice(0, displayedDates).map((section) => {
              if (!section) return null;
              return (
                <View key={section.title} style={styles.compactDaySection}>
                  {/* Compact Date Header */}
                  <View style={styles.compactDateHeader}>
                    <Text style={styles.compactDateLabel}>{section.dateLabel || section.formattedDate?.split(',')[0]}</Text>
                    <Text style={styles.compactDateCount}>{section.data?.length || 0} slots</Text>
                  </View>
                  
                  {/* Compact Time Slots Grid */}
                  <View style={styles.compactSlotsGrid}>
                    {(selectedDate === section.title ? section.data : section.data.slice(0, 4)).map((item, index) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.compactTimeSlot,
                          selectedSlot?.id === item.id && styles.selectedCompactSlot,
                          item.is_online && styles.onlineCompactSlot
                        ]}
                        onPress={() => handleSlotSelect(item)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.compactSlotContent}>
                          <Text style={[
                            styles.compactTimeText,
                            selectedSlot?.id === item.id && styles.selectedCompactSlotText
                          ]}>
                            {item.displayStartTime}
                          </Text>
                          <Text style={styles.compactDuration}>{getSlotDuration(item.start_time, item.end_time)}min</Text>
                        </View>
                        {item.is_online && (
                          <View style={styles.compactOnlineBadge}>
                            <Ionicons name="videocam" size={8} color="#fff" />
                          </View>
                        )}
                        {selectedSlot?.id === item.id && (
                          <View style={styles.compactSelectedIndicator}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                    {section.data.length > 4 && (
                      <TouchableOpacity 
                        style={[
                          styles.showMoreButton,
                          selectedDate === section.title && styles.showMoreButtonActive
                        ]}
                        onPress={() => setSelectedDate(selectedDate === section.title ? null : section.title)}
                      >
                        <Text style={[
                          styles.showMoreText,
                          selectedDate === section.title && styles.showMoreTextActive
                        ]}>
                          {selectedDate === section.title ? `Show less` : `+${section.data.length - 4} more`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Bottom Confirmation */}
      <View style={styles.bottomContainer}>
        <View style={styles.priceCard}>
          {isPriceLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
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
          style={[
            styles.confirmButton,
            !selectedSlot && styles.disabledButton
          ]}
          disabled={!selectedSlot}
          onPress={handleConfirm}
        >
          <LinearGradient
            colors={selectedSlot ? [theme.colors.primary, theme.colors.secondary] : [theme.colors.text.secondary, theme.colors.background.secondary]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color={selectedSlot ? theme.colors.background.surface : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.confirmButtonText,
              !selectedSlot && styles.disabledButtonText
            ]}>
              {selectedSlot ? 'Confirm Booking' : 'Select Time Slot'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background.primary 
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.feedback.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    fontFamily: 'System',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: 'System',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
  professionalHeader: {
    marginTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.l,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalInfo: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  professionalName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'System',
  },
  serviceName: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'System',
  },
  headerPlaceholder: {
    width: 48,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  content: {
    paddingBottom: 200,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  instructionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  instructionText: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  instructionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    fontFamily: 'System',
  },
  daySection: {
    marginBottom: 32,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayLabel: {
    flex: 1,
  },
  dayName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'System',
  },
  dayDate: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'System',
  },
  dayIndicator: {
    flex: 1,
    height: 2,
    backgroundColor: theme.colors.colors?.border || '#E5E7EB',
    borderRadius: 1,
  },
  slotsContainer: {
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    ...theme.shadows.card,
    position: 'relative',
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
  },
  selectedSlot: {
    borderLeftColor: theme.colors.primary,
    backgroundColor: 'rgba(0, 130, 114, 0.05)',
    ...theme.shadows.large,
  },
  onlineSlot: {
    borderLeftColor: theme.colors.feedback.success,
  },
  slotContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTime: {
    alignItems: 'flex-start',
  },
  slotTimeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'System',
  },
  selectedSlotText: {
    color: theme.colors.primary,
  },
  slotEndTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
    fontFamily: 'System',
  },
  slotDetails: {
    alignItems: 'flex-end',
    gap: 8,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    fontFamily: 'System',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  onlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'System',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.colors?.border || '#E5E7EB',
    paddingHorizontal: 24,
    paddingVertical: 20,
    ...theme.shadows.large,
  },
  priceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  priceContent: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'System',
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1f2937',
    fontFamily: 'System',
  },
  discountText: {
    fontSize: 12,
    color: theme.colors.feedback.success,
    fontWeight: '600',
    marginTop: 4,
    fontFamily: 'System',
  },
  selectPrompt: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'System',
  },
  confirmButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'System',
  },
  disabledButtonText: {
    color: theme.colors.text.secondary,
  },
  // Compact Design Styles
  compactSlotsContainer: {
    gap: 20,
  },
  compactDaySection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...theme.shadows.card,
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
    color: '#1f2937',
    fontFamily: 'System',
  },
  compactDateCount: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontFamily: 'System',
  },
  compactSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  compactTimeSlot: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
    padding: 12,
    width: (width - 48 - 24) / 4, // 4 boxes per row accounting for padding and gaps
    alignItems: 'center',
    position: 'relative',
    aspectRatio: 1,
  },
  selectedCompactSlot: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  onlineCompactSlot: {
    borderColor: theme.colors.feedback.success,
  },
  compactSlotContent: {
    alignItems: 'center',
  },
  compactTimeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'System',
  },
  selectedCompactSlotText: {
    color: '#fff',
  },
  compactDuration: {
    fontSize: 10,
    color: '#6b7280',
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
    backgroundColor: '#10b981',
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
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    width: (width - 48 - 24) / 4, // Match time slot width
    alignItems: 'center',
    justifyContent: 'center',
  },
  showMoreText: {
    fontSize: 12,
    color: '#6b7280',
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
