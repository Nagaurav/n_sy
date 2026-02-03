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
  SafeAreaView,
  RefreshControl,
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
import { useTheme } from '../contexts/ThemeContext';
import { AvailableSlot, FormattedAvailableSlot, SectionData } from '../types/booking';

type SelectTimeRouteProp = RouteProp<RootStackParamList, 'SelectTime'>;
type SelectTimeNavigationProp = StackNavigationProp<RootStackParamList, 'SelectTime'>;

const { width, height } = Dimensions.get('window');

const SelectTimeScreen: React.FC = () => {
  console.log('🚀 SelectTimeScreen MOUNTED - Redesigned UI');
  
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
    try {
      const date = parseISO(dateString);
      const now = new Date();
      
      // Check if date is in the past
      if (date < now && !isToday(date)) {
        return format(date, 'MMM d (Past)');
      }
      
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      
      // Check if within this week
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (date <= weekFromNow) {
        return format(date, 'EEEE');
      }
      
      // For dates further in the future, show full date
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateString;
    }
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
        const slotDate = parseISO(dateKey);
        const now = new Date();
        
        // Filter out past dates (only keep today and future dates)
        if (slotDate < now && !isToday(slotDate)) {
          return acc; // Skip past dates
        }
        
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

      // Sort by date (closest dates first)
      groupedSlots.sort((a, b) => new Date(a.title).getTime() - new Date(b.title).getTime());
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
                slotId: selectedSlot.id, // Fixed: slotId instead of slot_id
                slot_id: selectedSlot.id, // Keep both for backward compatibility
                date: selectedSlot.date,
                startTime: selectedSlot.start_time,
                endTime: selectedSlot.end_time,
                duration,
                price: priceDetails?.final_amount || 0,
                isOnline: selectedSlot.is_online,
                serviceType: 'consultation',
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
              <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Select Time Slot</Text>
              <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
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
              <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Select Time Slot</Text>
              <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
            </View>
            <View style={styles.headerButton} />
          </View>
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
      
      {/* Consistent Header */}
      <LinearGradient
        colors={[appTheme.colors.primary, appTheme.colors.secondary]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Select Time Slot</Text>
            <Text style={styles.headerSubtitle}>Choose your preferred time</Text>
          </View>
          <View style={styles.headerButton} />
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
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
          <View style={[styles.card, { borderLeftColor: appTheme.colors.primary, borderLeftWidth: 5 }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{professionalName}</Text>
                <Text style={styles.sub}>{serviceDetails?.name || 'Consultation'}</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: appTheme.colors.primary + '20' }]}>
                <Ionicons name="person" size={14} color={appTheme.colors.primary} />
                <Text style={[styles.typeText, { color: appTheme.colors.primary }]}>PRO</Text>
              </View>
            </View>
          </View>

          {/* Instructions Card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar-outline" size={24} color={appTheme.colors.primary} />
              <Text style={styles.sectionTitle}>Select Your Preferred Time</Text>
            </View>
            <Text style={styles.aboutText}>
              Choose a time slot that works best for your schedule. Available slots are shown below.
            </Text>
          </View>

          {/* Time Slots */}
          <View style={styles.compactSlotsContainer}>
            {sectionedSlots.slice(0, displayedDates).map((section) => {
              if (!section) return null;
              return (
                <View key={section.title} style={styles.compactDaySection}>
                  {/* Date Header */}
                  <View style={styles.compactDateHeader}>
                    <Text style={[
                      styles.compactDateLabel,
                      section.dateLabel?.includes('(Past)') && styles.pastDateLabel
                    ]}>
                      {section.dateLabel || section.formattedDate?.split(',')[0]}
                    </Text>
                    <Text style={styles.compactDateCount}>
                      {section.data?.length || 0} slots
                    </Text>
                  </View>
                  
                  {/* Time Slots Grid */}
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
    backgroundColor: theme.colors.background.primary 
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

  // Consistent Header Styles (matching ProfessionalProfileScreen)
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: theme.colors.background.surface, 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: theme.colors.background.surface,
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
  // Remove old compact slots styles that are duplicated
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
