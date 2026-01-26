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
  Alert,
  RefreshControl,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService, medicalService } from '../services';
import { ConsultationBooking, UnifiedAppointment } from '../types/booking';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

const AppointmentsScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
  });
  
  // Filter options
  const filterOptions = [
    { key: 'all', label: 'All', icon: 'calendar-outline' },
    { key: 'confirmed', label: 'Booked', icon: 'checkmark-circle' },
    { key: 'completed', label: 'Done', icon: 'checkmark-done' },
    { key: 'pending', label: 'Pending', icon: 'time' },
    { key: 'cancelled', label: 'Cancelled', icon: 'close-circle' },
  ];

  // 🟢 Calls the merged API logic
  const loadData = async () => {
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    if (!userId) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }
    
    try {
      setError(null);
      setIsLoading(true);
      
      const res = await bookingService.getAllUserBookings(userId);
      if (res.success && res.data) {
        setAppointments(res.data);
        
        // Calculate stats for unified appointments
        const newStats = {
          total: res.data.length,
          confirmed: res.data.filter((apt: UnifiedAppointment) => apt.status === 'CONFIRMED').length,
          completed: res.data.filter((apt: UnifiedAppointment) => apt.status === 'COMPLETED').length,
          pending: res.data.filter((apt: UnifiedAppointment) => apt.status === 'PENDING').length,
          cancelled: res.data.filter((apt: UnifiedAppointment) => apt.status === 'CANCELLED').length,
        };
        setStats(newStats);
      } else {
        setError(res.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [user, authLoading]);

  const fetchAppointments = useCallback(async (pageToLoad: number = 1) => {
    // Check for user_id, _id, or id (API returns user_id)
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    
    if (!userId) {
      setError('User not authenticated');
      if (pageToLoad === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
      return;
    }

    const limit = 10;
    const offset = (pageToLoad - 1) * limit;

    try {
      setError(null);

      if (pageToLoad === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await bookingService.getUserAppointments(String(userId), {
        limit,
        offset,
      });
      
      if (response.success && response.data) {
        // API returns data as array directly, not nested in appointments field
        const appointmentsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || (response.data as any).appointments || [];
        
        // Sort appointments by date (newest first)
        const sortedAppointments = appointmentsList.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

        // Calculate stats
        const newStats = {
          total: sortedAppointments.length,
          confirmed: sortedAppointments.filter((apt: any) => apt.booking_status === 'CONFIRMED').length,
          completed: sortedAppointments.filter((apt: any) => apt.booking_status === 'COMPLETED').length,
          pending: sortedAppointments.filter((apt: any) => apt.booking_status === 'PENDING').length,
          cancelled: sortedAppointments.filter((apt: any) => apt.booking_status === 'CANCELLED').length,
        };
        setStats(newStats);

        if (pageToLoad === 1) {
          setAppointments(sortedAppointments as any);
        } else {
          setAppointments((prev) => [...prev, ...(sortedAppointments as any)]);
        }

        setHasMore(appointmentsList.length === limit);
        setPage(pageToLoad);
      } else {
        setError(response.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      if (pageToLoad === 1) {
        setIsLoading(false);
        setIsRefreshing(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [user]);

  // ✅ ADD THIS BLOCK to refresh whenever screen appears
  useFocusEffect(
    React.useCallback(() => {
      // Check if we have a user before fetching
      const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
      
      if (userId) {
        console.log('🔄 Screen focused - Fetching latest appointments...');
        fetchAppointments(1); // Fetch page 1 to get the newest status
      }
    }, [user, fetchAppointments]) // Dependencies
  );
  
  // Start entrance animation when data loads
  useEffect(() => {
    if (!isLoading && !authLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, authLoading, fadeAnim, slideAnim, scaleAnim]);
  
  // Filter appointments based on selected filter
  const filteredAppointments = appointments.filter(appointment => {
    if (selectedFilter === 'all') return true;
    return appointment.status?.toLowerCase() === selectedFilter.toLowerCase();
  });
  
  const handleRefresh = useCallback(() => {
    console.log('🔄 [AppointmentsScreen] User triggered refresh - fetching latest appointment data');
    console.log('🔄 [AppointmentsScreen] Current appointments count:', appointments.length);
    
    // Log current appointment statuses before refresh
    appointments.forEach((apt, index) => {
      console.log(`🔄 [AppointmentsScreen] Before refresh - Appointment ${index + 1}:`, {
        id: apt.id,
        referenceId: apt.reference_id,
        type: apt.type,
        status: apt.status,
        title: apt.title
      });
    });
    
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Clear current appointments to force fresh fetch
    setAppointments([]);
    
    // Fetch fresh data
    loadData();
  }, [appointments, loadData]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) {
      console.log('⏸️ [AppointmentsScreen] Load more skipped:', {
        isLoadingMore,
        isLoading,
        hasMore,
      });
      return;
    }
    console.log('📄 [AppointmentsScreen] Loading more appointments, page:', page + 1);
    fetchAppointments(page + 1);
  }, [fetchAppointments, page, isLoadingMore, isLoading, hasMore]);

  const handleViewPrescription = useCallback(
    async (bookingId: number | string) => {
      const numericId = Number(bookingId);
      console.log('💊 [AppointmentsScreen] View prescription pressed:', {
        bookingId,
        numericId,
      });
      
      try {
        console.log('📡 [AppointmentsScreen] Fetching prescription for booking:', numericId);
        const response = await medicalService.getPrescription(numericId);
        console.log('📡 [AppointmentsScreen] Prescription API response:', {
          hasData: !!response?.data?.data,
          prescriptionId: response?.data?.data?.id,
          prescriptionType: response?.data?.data?.prescriptionType,
        });
        
        if (response?.data?.data?.id) {
          console.log('🚀 [AppointmentsScreen] Navigating to PrescriptionDetail:', {
            prescriptionId: response.data.data.id,
          });
          navigation.navigate('HomeStack', {
            screen: 'PrescriptionDetail',
            params: { prescriptionId: response.data.data.id },
          });
        } else {
          console.log('ℹ️ [AppointmentsScreen] No prescription found');
          Alert.alert('No prescription uploaded yet.');
        }
      } catch (error: any) {
        const status = error?.response?.status;
        console.error('❌ [AppointmentsScreen] Error fetching prescription:', {
          status,
          error: error?.message,
          bookingId: numericId,
        });
        
        if (status === 404) {
          console.log('ℹ️ [AppointmentsScreen] Prescription not found (404)');
          Alert.alert('No prescription uploaded yet.');
        } else {
          Alert.alert('Error', 'Failed to fetch prescription. Please try again later.');
        }
      }
    },
    [navigation],
  );

  // Set up header with back button only
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false, // Hide default header, use custom green header
    });
  }, [navigation]);

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'upcoming':
        return {
          backgroundColor: theme.colors.feedback.success + '20',
          textColor: theme.colors.primary,
          icon: 'checkmark-circle',
        };
      case 'completed':
        return {
          backgroundColor: theme.colors.feedback.success + '40',
          textColor: theme.colors.feedback.success,
          icon: 'checkmark-done-circle',
        };
      case 'pending':
        return {
          backgroundColor: theme.colors.feedback.warning + '20',
          textColor: theme.colors.feedback.warning,
          icon: 'time',
        };
      case 'cancelled':
        return {
          backgroundColor: theme.colors.feedback.error + '20',
          textColor: theme.colors.feedback.error,
          icon: 'close-circle',
        };
      default:
        return {
          backgroundColor: theme.colors.background.secondary,
          textColor: theme.colors.text.secondary,
          icon: 'help-circle',
        };
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      // Handle time format like "10:00" or "14:30"
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const renderItem = ({ item }: { item: UnifiedAppointment }) => {
    const isYoga = item.type === 'yoga_class';
    const color = isYoga ? '#4CAF50' : '#2196F3'; // Green vs Blue

    const handleAppointmentPress = () => {
      navigation.navigate('AppointmentDetail', { 
        appointmentId: item.reference_id,
        type: item.type // Pass type so Detail screen knows what to do
      });
    };

    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleSection}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.subtitle}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Ionicons 
              name={isYoga ? 'fitness' : 'medkit'} 
              size={16} 
              color={color} 
            />
            <Text style={[styles.typeText, { color }]}>
              {isYoga ? 'Yoga' : 'Consultation'}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar" size={16} color="#666" />
            <Text style={styles.detailText}>{new Date(item.date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.detailText}>{item.time || 'N/A'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash" size={16} color="#666" />
            <Text style={styles.detailText}>₹{item.amount}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.statusBadge, { 
            backgroundColor: item.status === 'CONFIRMED' ? '#4CAF5020' : 
                           item.status === 'COMPLETED' ? '#2196F320' :
                           item.status === 'PENDING' ? '#FF980020' : '#F4433620'
          }]}>
            <Text style={[styles.statusText, { 
              color: item.status === 'CONFIRMED' ? '#4CAF50' : 
                     item.status === 'COMPLETED' ? '#2196F3' :
                     item.status === 'PENDING' ? '#FF9800' : '#F44336'
            }]}>
              {item.status}
            </Text>
          </View>
          
          <TouchableOpacity onPress={handleAppointmentPress} style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Details</Text>
            <Ionicons name="chevron-forward" size={16} color={color} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading...' : 'Loading your appointments...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
      
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
        <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>My Appointments</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleRefresh}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={20} color={appTheme.colors.background.surface} />
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>
      </Animated.View>

      {/* Content Area */}
      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={appTheme.colors.feedback.error} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color={appTheme.colors.background.surface} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* Statistics Dashboard */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.confirmed}</Text>
              <Text style={styles.statLabel}>Booked</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Done</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>

          {/* Appointments List */}
          <View style={styles.listContainer}>
            <FlatList
              data={filteredAppointments}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[appTheme.colors.primary]}
                  tintColor={appTheme.colors.primary}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListHeaderComponent={
                <View>
                  {/* Filter Section - Dropdown */}
                  <View style={styles.filterDropdownContainer}>
                    <TouchableOpacity 
                      style={styles.filterDropdownButton}
                      onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.filterDropdownContent}>
                        <Ionicons 
                          name={filterOptions.find(f => f.key === selectedFilter)?.icon as any} 
                          size={16} 
                          color={appTheme.colors.text.secondary} 
                        />
                        <Text style={styles.filterDropdownText}>
                          {filterOptions.find(f => f.key === selectedFilter)?.label}
                        </Text>
                        <Ionicons 
                          name={showFilterDropdown ? "chevron-up" : "chevron-down"} 
                          size={14} 
                          color={appTheme.colors.text.secondary} 
                        />
                      </View>
                    </TouchableOpacity>
                    
                    {showFilterDropdown && (
                      <View style={styles.filterDropdownMenu}>
                        {filterOptions.map((filter) => (
                          <TouchableOpacity
                            key={filter.key}
                            style={[
                              styles.filterDropdownItem,
                              selectedFilter === filter.key && styles.filterDropdownItemActive
                            ]}
                            onPress={() => {
                              setSelectedFilter(filter.key);
                              setShowFilterDropdown(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons 
                              name={filter.icon as any} 
                              size={16} 
                              color={selectedFilter === filter.key ? appTheme.colors.background.surface : appTheme.colors.text.secondary} 
                            />
                            <Text style={[
                              styles.filterDropdownItemText,
                              selectedFilter === filter.key && styles.filterDropdownItemTextActive
                            ]}>
                              {filter.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              }
              ListFooterComponent={
                isLoadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={appTheme.colors.primary} />
                    <Text style={styles.footerLoaderText}>Loading more...</Text>
                  </View>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={64} color={appTheme.colors.text.secondary} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {selectedFilter === 'all' ? 'No Appointments Yet' : `No ${selectedFilter} Appointments`}
                  </Text>
                  <Text style={styles.emptySubtext}>
                    {selectedFilter === 'all' 
                      ? 'Your booking history will appear here.\nStart by booking your first consultation!'
                      : `There are no ${selectedFilter} appointments to show.`
                    }
                  </Text>
                  {selectedFilter === 'all' && (
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => navigation.getParent()?.navigate('MainDrawer', {
                        screen: 'HomeStack',
                        params: { screen: 'Home' }
                      })}
                    >
                      <Ionicons name="add-circle" size={20} color={appTheme.colors.background.surface} />
                      <Text style={styles.bookButtonText}>Book First Appointment</Text>
                    </TouchableOpacity>
                  )}
                </View>
              }
            />
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  // Header Styles
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -30,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -25,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 80,
    borderTopRightRadius: 80,
  },
  
  // Content Container
  contentContainer: {
    flex: 1,
    minHeight: height - 200, // Ensure minimum height for scrolling
  },
  
  // Statistics Dashboard
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    gap: theme.spacing.s,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 12,
  },
  
  // Filter Section - Dropdown
  filterDropdownContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text.secondary + '15',
  },
  filterDropdownButton: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  filterDropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flex: 1,
    marginLeft: theme.spacing.s,
  },
  filterDropdownMenu: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
    marginTop: theme.spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    gap: theme.spacing.s,
  },
  filterDropdownItemActive: {
    backgroundColor: theme.colors.primary,
  },
  filterDropdownItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    flex: 1,
  },
  filterDropdownItemTextActive: {
    color: theme.colors.background.surface,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 17,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: theme.colors.background.primary,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  errorText: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  retryText: {
    color: theme.colors.background.surface,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.2,
  },

  // 🟢 Unified Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 4,
    lineHeight: 24,
  },
  sub: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },

  // List Container
  listContainer: {
    flex: 1,
    padding: theme.spacing.l,
    paddingTop: 0,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 130, 114, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 3,
    borderColor: 'rgba(0, 130, 114, 0.15)',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  emptySubtext: {
    fontSize: 17,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    fontWeight: '500',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  bookButtonText: {
    color: theme.colors.background.surface,
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.3,
  },

  // Footer Loader
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  footerLoaderText: {
    marginLeft: 12,
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },

  // Modern Appointment Card Styles
  appointmentCard: {
    marginBottom: theme.spacing.l,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  cardContent: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.xl,
    padding: 0,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  specializationText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  // Status Badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  
  // Date and Time Section
  dateTimeSection: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  dateTimeText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  
  // Details Section
  detailsSection: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text.secondary + '20',
    paddingTop: theme.spacing.m,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  
  // Action Buttons
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.l,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  primaryActionButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryActionButton: {
    backgroundColor: 'rgba(0, 130, 114, 0.08)',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.background.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButtonText: {
    color: theme.colors.primary,
  },
  
  // Legacy styles for backward compatibility
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  // Missing styles for appointment card (legacy)
  dateTimeContainer: {
    flex: 1,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    paddingVertical: 2,
  },
  appointmentDate: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
    fontWeight: '600',
  },
  appointmentTime: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.text.secondary + '20',
    marginVertical: theme.spacing.m,
    marginHorizontal: theme.spacing.l,
  },
  cardDetails: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.l,
  },
});

export default AppointmentsScreen;
