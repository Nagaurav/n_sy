import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService } from '../services';
import { apiClient } from '../services/apiClient';
import { UnifiedAppointment } from '../types/booking';
import { theme } from '../theme';
import { ModernAppointmentCard } from '../components';

const { width } = Dimensions.get('window');

const AppointmentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme: themeHook } = useTheme();
  const theme = themeHook || require('../theme').theme;

  // Helper function to format time with AM/PM
  const formatTimeWithAMPM = (timeString: string): string => {
    if (!timeString) return '';
    
    // Handle time formats like "09:00 - 09:15" or "14:30"
    const timeParts = timeString.split(' - ');
    
    const formatSingleTime = (time: string): string => {
      // Remove any extra spaces and split
      const cleanTime = time.trim();
      const [hours, minutes] = cleanTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) return cleanTime;
      
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    
    if (timeParts.length === 2) {
      // Format time range like "09:00 - 09:15"
      return `${formatSingleTime(timeParts[0])} - ${formatSingleTime(timeParts[1])}`;
    } else {
      // Format single time like "14:30"
      return formatSingleTime(timeString);
    }
  };

  const appTheme = themeHook || theme;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<UnifiedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [subFilter, setSubFilter] = useState<'all' | 'consultation' | 'yoga_class'>('all');

  // Enhanced filter function
  const applyFilter = useCallback((data: UnifiedAppointment[], mainFilter: string, subF: string) => {
    let filtered = data;

    // Apply main filter
    if (mainFilter === 'upcoming') {
      filtered = filtered.filter(item => 
        item.status === 'CONFIRMED' || item.status === 'PENDING'
      );
    } else if (mainFilter === 'completed') {
      filtered = filtered.filter(item => item.status === 'COMPLETED');
    }

    // Apply sub filter
    if (subF !== 'all') {
      filtered = filtered.filter(item => item.type === subF);
    }

    setFilteredAppointments(filtered);
  }, []);

  // �🟢 SINGLE SOURCE OF TRUTH
  const loadData = useCallback(async () => {
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    if (!userId) return; // Wait for user
    
    try {
      if (!isRefreshing) setIsLoading(true);
      setError(null);
      
      // Call the unified service
      const res = await bookingService.getAllUserBookings(userId);
      
      if (res.success && res.data) {
        setAppointments(res.data);
        // Apply current filter to new data
        applyFilter(res.data, selectedFilter, subFilter);
      } else {
        setError('Failed to load appointments.');
      }
    } catch (err) {
      setError('Network error. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isRefreshing, selectedFilter, applyFilter]);

  // Handle filter change
  useEffect(() => {
    applyFilter(appointments, selectedFilter, subFilter);
  }, [selectedFilter, subFilter, appointments, applyFilter]);

  // Initial Load
  useEffect(() => {
    if (user && !authLoading) {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [user, authLoading, loadData]);

  // Refresh on Focus
  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user, loadData])
  );

  const handleCancelBooking = async (appointment: UnifiedAppointment) => {
    try {
      const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
      if (!userId) return;
      
      // Call cancel booking API directly using apiClient
      const response = await apiClient.put(`/user/consultation-booking/cancel/${appointment.reference_id}`, {
        user_id: userId,
        status: 'CANCELLED'
      });
      
      if (response.success) {
        // Refresh the data to show updated status
        loadData();
      } else {
        setError('Failed to cancel appointment. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  
  const renderItem = ({ item }: { item: UnifiedAppointment }) => {
    const isYoga = item.type === 'yoga_class';
    
    // Transform UnifiedAppointment to NextAppointment format for ModernAppointmentCard
    const transformedAppointment = {
      id: item.id,
      professional_name: item.title,
      speciality: item.subtitle,
      speciality_new: { name: item.subtitle },
      date: item.date,
      time: item.time,
      mode: (isYoga ? 'offline' : 'online') as 'online' | 'offline',
      booking_status: item.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
      status: item.status as 'scheduled' | 'completed' | 'cancelled',
      professional_photo: item.imageUrl,
    };

    return (
      <View style={styles.cardWrapper}>
        <ModernAppointmentCard
          appointment={transformedAppointment}
          onJoinSession={() => {
            navigation.navigate('AppointmentDetail', { 
              appointmentId: item.reference_id,
              type: item.type
            });
          }}
          buttonText="View Details"
          showActualStatus={true}
          serviceType={item.type} // 🆕 Pass service type to distinguish consultation vs yoga
        />
      </View>
    );
  };

  if (isLoading && !isRefreshing && appointments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Professional Header - Matching ProfessionalHomeHeader exactly */}
      <LinearGradient
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Manage your appointments</Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
      </LinearGradient>

      {/* Professional Filter Section */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
            onPress={() => {
              setSelectedFilter('all');
              setSubFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="apps" 
              size={16} 
              color={selectedFilter === 'all' ? '#FFFFFF' : theme.colors.primary} 
            />
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              All ({appointments.length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'upcoming' && styles.filterChipActive]}
            onPress={() => {
              setSelectedFilter('upcoming');
              setSubFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="calendar-outline" 
              size={16} 
              color={selectedFilter === 'upcoming' ? '#FFFFFF' : theme.colors.primary} 
            />
            <Text style={[styles.filterText, selectedFilter === 'upcoming' && styles.filterTextActive]}>
              Upcoming ({appointments.filter(item => item.status === 'CONFIRMED' || item.status === 'PENDING').length})
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'completed' && styles.filterChipActive]}
            onPress={() => {
              setSelectedFilter('completed');
              setSubFilter('all');
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="checkmark-done-outline" 
              size={16} 
              color={selectedFilter === 'completed' ? '#FFFFFF' : theme.colors.primary} 
            />
            <Text style={[styles.filterText, selectedFilter === 'completed' && styles.filterTextActive]}>
              Completed ({appointments.filter(item => item.status === 'COMPLETED').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sub Filters */}
        {selectedFilter !== 'all' && (
          <View style={styles.subFilterContainer}>
            <TouchableOpacity
              style={[styles.subFilterChip, subFilter === 'all' && styles.subFilterChipActive]}
              onPress={() => setSubFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.subFilterText, subFilter === 'all' && styles.subFilterTextActive]}>
                All Types
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subFilterChip, subFilter === 'consultation' && styles.subFilterChipActive]}
              onPress={() => setSubFilter('consultation')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="medkit-outline" 
                size={14} 
                color={subFilter === 'consultation' ? '#FFFFFF' : theme.colors.primary} 
              />
              <Text style={[styles.subFilterText, subFilter === 'consultation' && styles.subFilterTextActive]}>
                Consultations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.subFilterChip, subFilter === 'yoga_class' && styles.subFilterChipActive]}
              onPress={() => setSubFilter('yoga_class')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="fitness-outline" 
                size={14} 
                color={subFilter === 'yoga_class' ? '#FFFFFF' : theme.colors.primary} 
              />
              <Text style={[styles.subFilterText, subFilter === 'yoga_class' && styles.subFilterTextActive]}>
                Yoga Classes
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={filteredAppointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: theme.spacing.l, paddingVertical: theme.spacing.m }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={64} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No appointments found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'all' 
                  ? 'You haven\'t booked any appointments yet'
                  : selectedFilter === 'upcoming'
                  ? 'No upcoming appointments scheduled'
                  : 'No completed appointments yet'
                }
              </Text>
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => navigation.navigate('ProfessionalsList')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.bookButtonGradient}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.bookButtonText}>Book Appointment</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2ED' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 44,
  },
  
  // Filter Styles
  filterContainer: { 
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: theme.spacing.l,
  },
  filterScrollContent: {
    paddingTop: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  filterChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m, 
    paddingVertical: theme.spacing.s, 
    borderRadius: 20, 
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    height: 36,
    marginRight: theme.spacing.m,
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: { 
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  filterTextActive: { 
    color: '#fff',
    fontWeight: '700',
  },
  
  // Sub Filter Styles
  subFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: theme.spacing.m,
    paddingTop: theme.spacing.s,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  subFilterChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m, 
    paddingVertical: theme.spacing.s, 
    borderRadius: 18, 
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    height: 36,
    marginRight: theme.spacing.m,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subFilterChipActive: { 
    backgroundColor: theme.colors.secondary || '#6c757d',
    borderColor: theme.colors.secondary || '#6c757d',
    shadowColor: theme.colors.secondary || '#6c757d',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  subFilterText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: theme.colors.primary,
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.2,
    marginLeft: 4,
  },
  subFilterTextActive: { 
    color: '#fff',
    fontWeight: '700',
  },
  
  // Card wrapper for ModernAppointmentCard
  cardWrapper: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
  },
  
  // Empty State Styles
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    minHeight: 300,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
  bookButton: {
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
});

export default AppointmentsScreen;
