import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService, medicalService } from '../services';
import { ConsultationBooking } from '../types/booking';
import { theme } from '../theme';

const AppointmentsScreen: React.FC<{ navigation: any, route: any }> = ({ navigation, route }) => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  const [appointments, setAppointments] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    console.log('📱 AppointmentsScreen - Auth State:', {
      authLoading,
      hasUser: !!user,
      userId: (user as any)?.user_id || (user as any)?._id || (user as any)?.id,
      userObject: user, // Log the entire user object to see what fields it has
    });

    // Wait for auth to finish loading before checking user
    if (authLoading) {
      console.log('⏳ Waiting for auth to finish loading...');
      return;
    }

    // Check for user_id, _id, or id (API returns user_id)
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    
    if (userId) {
      console.log('✅ User authenticated, fetching appointments for:', userId);
      fetchAppointments(1);
    } else {
      console.log('❌ User not authenticated - user object:', user);
      setIsLoading(false);
      setError('User not authenticated');
    }
  }, [(user as any)?.user_id, (user as any)?._id, (user as any)?.id, authLoading]);

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
      
      console.log('📋 Appointments API Response:', response);
      console.log('📋 response.data type:', typeof response.data);
      console.log('📋 response.data is array?', Array.isArray(response.data));
      console.log('📋 response.data keys:', Object.keys(response.data || {}));
      console.log('📋 response.data content:', JSON.stringify(response.data, null, 2));
      
      if (response.success && response.data) {
        // API returns data as array directly, not nested in appointments field
        const appointmentsList = Array.isArray(response.data) 
          ? response.data 
          : (response.data as any).data || (response.data as any).appointments || [];
        
        console.log('📋 Appointments list:', appointmentsList);
        console.log('📋 Appointments count:', appointmentsList.length);
        
        // Sort appointments by date (newest first)
        const sortedAppointments = appointmentsList.sort((a: any, b: any) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });

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
  }, [(user as any)?.user_id, (user as any)?._id, (user as any)?.id]);

  const handleRefresh = useCallback(() => {
    console.log('🔄 [AppointmentsScreen] User triggered refresh - fetching latest appointment data');
    console.log('🔄 [AppointmentsScreen] Current appointments count:', appointments.length);
    
    // Log current appointment statuses before refresh
    appointments.forEach((apt, index) => {
      console.log(`🔄 [AppointmentsScreen] Before refresh - Appointment ${index + 1}:`, {
        bookingId: apt.booking_id || apt._id,
        bookingStatus: apt.booking_status || apt.status,
        paymentStatus: apt.payment_status,
        professionalName: apt.professional_name
      });
    });
    
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    // Clear current appointments to force fresh fetch
    setAppointments([]);
    
    // Fetch fresh data
    fetchAppointments(1);
  }, [appointments, fetchAppointments]);

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
          backgroundColor: '#E6F4F1',
          textColor: theme.colors.primary,
          icon: 'calendar-check',
        };
      case 'completed':
        return {
          backgroundColor: '#DCFCE7',
          textColor: '#166534',
          icon: 'checkmark-done-circle',
        };
      case 'pending':
        return {
          backgroundColor: '#FEF3C7',
          textColor: '#92400E',
          icon: 'time',
        };
      case 'cancelled':
        return {
          backgroundColor: '#FEE2E2',
          textColor: '#B91C1C',
          icon: 'close-circle',
        };
      default:
        return {
          backgroundColor: '#F8F9FA',
          textColor: '#6B7280',
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

  const renderAppointment = ({ item }: { item: any }) => {
    // Handle both API response formats
    const status = (item.booking_status || item.status || '').toLowerCase();
    const paymentStatus = (item.payment_status || '').toLowerCase();
    const statusBadgeStyle = getStatusBadgeStyle(status);
    const bookingId = item.booking_id || item._id;
    const appointmentId = item.appointment_id || bookingId?.toString();
    
    // Debug: Log status information
    console.log('📅 Appointment Status Debug:', {
      bookingId,
      booking_status: item.booking_status,
      status: item.status,
      displayStatus: status,
      professionalName: item.professional_name,
      showPrescriptionButton: item.booking_status === 'COMPLETED'
    });
    const timeDisplay = item.time; // Already formatted as "09:00 - 09:15"

    const handleAppointmentPress = () => {
      // Log the full item to see available fields
      console.log('🔍 [AppointmentsScreen] Full appointment item:', JSON.stringify(item, null, 2));
      
      // Extract professional ID with multiple fallbacks for nested API structure
      const professionalId = String(
        item.professional_id || 
        item.professionalId || 
        (item.professional && (item.professional.id || item.professional._id || item.professional.professional_id)) ||
        (item.professional_data && (item.professional_data.id || item.professional_data._id || item.professional_data.professional_id)) ||
        (item.professionalInfo && (item.professionalInfo.id || item.professionalInfo._id || item.professionalInfo.professional_id)) ||
        ''
      );
      
      // Extract current user ID with multiple fallbacks
      const currentUserId = String(
        (user as any)?.user_id || 
        (user as any)?.user_id || 
        user?._id || 
        (user as any)?.id || 
        ''
      );
      
      // Get professional name with fallbacks
      const professionalName = 
        item.professional_name ||
        (item.professional && (item.professional.name || item.professional.fullName)) ||
        (item.professional_data && item.professional_data.name) ||
        (item.professionalInfo && item.professionalInfo.name) ||
        'Unknown Professional';
      
      console.log('👆 [AppointmentsScreen] Appointment card pressed:', {
        appointmentId,
        bookingId,
        professionalId: professionalId || 'NOT FOUND',
        professionalName,
        userId: currentUserId || 'NOT FOUND',
        date: item.date,
        status,
        hasProfessionalId: !!professionalId,
        itemKeys: Object.keys(item)
      });
      
      if (appointmentId && currentUserId) {
        console.log('🚀 [AppointmentsScreen] Navigating to AppointmentDetail:', { 
          appointmentId, 
          professionalId, 
          userId: currentUserId,
          professionalName
        });
        navigation.navigate('HomeStack', {
          screen: 'AppointmentDetail',
          params: {
            appointmentId,
            professionalId: professionalId || 'unknown',
            userId: currentUserId,
            professionalName,
            appointmentData: item // Pass the complete appointment data
          }
        });
      } else {
        const missingFields = [];
        if (!appointmentId) missingFields.push('appointmentId');
        if (!currentUserId) missingFields.push('userId');
        
        console.error('❌ [AppointmentsScreen] Missing required parameters:', { 
          appointmentId, 
          professionalId, 
          userId: currentUserId,
          missingFields
        });
        
        Alert.alert(
          'Missing Information', 
          `Unable to open appointment details. Missing: ${missingFields.join(', ')}`
        );
      }
    };

    return (
      <TouchableOpacity style={styles.appointmentCard} onPress={handleAppointmentPress}>
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeContainer}>
            {/* Professional Name */}
            {item.professional_name && (
              <View style={styles.iconTextRow}>
                <Ionicons name="person-circle" size={18} color="#1E88E5" />
                <Text style={styles.professionalName}>{item.professional_name}</Text>
              </View>
            )}
            <View style={styles.iconTextRow}>
              <Ionicons name="calendar" size={18} color="#1E88E5" />
              <Text style={styles.appointmentDate}>{formatDate(item.date)}</Text>
            </View>
            <View style={styles.iconTextRow}>
              <Ionicons name="time" size={18} color="#1E88E5" />
              <Text style={styles.appointmentTime}>{timeDisplay}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadgeStyle.backgroundColor }]}>
            <Ionicons name={statusBadgeStyle.icon as any} size={14} color={statusBadgeStyle.textColor} />
            <Text style={[styles.statusText, { color: statusBadgeStyle.textColor }]}>
              {status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="timer-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{item.duration} minutes</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={20} color="#6B7280" />
            <Text style={styles.detailLabel}>Booking ID:</Text>
            <Text style={styles.detailValue}>#{bookingId}</Text>
          </View>

          {item.mode && (
            <View style={styles.detailRow}>
              <Ionicons name="videocam-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Mode:</Text>
              <Text style={styles.detailValue}>{item.mode.toUpperCase()}</Text>
            </View>
          )}

          {item.amount && (
            <View style={styles.detailRow}>
              <Ionicons name="cash-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>₹{item.amount}</Text>
            </View>
          )}

          {item.coupon_code && (
            <View style={styles.detailRow}>
              <Ionicons name="pricetag-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Coupon:</Text>
              <Text style={styles.detailValue}>{item.coupon_code}</Text>
            </View>
          )}

          {item.payment_status && (
            <View style={styles.detailRow}>
              <Ionicons name="card-outline" size={20} color="#6B7280" />
              <Text style={styles.detailLabel}>Payment:</Text>
              <Text style={styles.detailValue}>{item.payment_status}</Text>
            </View>
          )}
        </View>

        {item.booking_status === 'COMPLETED' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Appointment Details',
                  `Professional: ${item.professional_name}\nDate: ${formatDate(item.date)}\nTime: ${timeDisplay}\nMode: ${item.mode}\nAmount: ₹${item.amount}`,
                );
              }}
            >
              <Ionicons name="information-circle" size={20} color="#1E88E5" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => handleViewPrescription(bookingId)}
            >
              <Ionicons name="medkit-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.secondaryActionButtonText}>View Prescription</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === 'confirmed' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                Alert.alert(
                  'Appointment Details',
                  `Professional: ${item.professional_name}\nDate: ${formatDate(item.date)}\nTime: ${timeDisplay}\nMode: ${item.mode}\nAmount: ₹${item.amount}`,
                );
              }}
            >
              <Ionicons name="information-circle" size={20} color="#1E88E5" />
              <Text style={styles.actionButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>
            {authLoading ? 'Loading...' : 'Loading your appointments...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Appointments</Text>
        </View>
      </View>

      {/* Content Area */}
      {error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={(item: any) => String(item.booking_id || item._id || Math.random())}
          contentContainerStyle={[
            styles.listContainer,
            appointments.length === 0 && styles.emptyListContainer,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.footerLoaderText}>Loading more appointments...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
              </View>
              <Text style={styles.emptyTitle}>No Appointments Yet</Text>
              <Text style={styles.emptySubtext}>
                Your booking history will appear here.{"\n"}
                Start by booking your first consultation!
              </Text>
              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => navigation.getParent()?.navigate('MainDrawer', {
                  screen: 'HomeStack',
                  params: { screen: 'Home' }
                })}
              >
                <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                <Text style={styles.bookButtonText}>Book First Appointment</Text>
              </TouchableOpacity>
            </View>
          }
        />
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
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.background.surface,
    letterSpacing: 0.3,
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

  // List Container
  listContainer: {
    padding: theme.spacing.l,
    paddingTop: theme.spacing.m,
  },
  emptyListContainer: {
    flexGrow: 1,
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

  // Appointment Card Styles
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.l,
    padding: 0,
    ...theme.shadows.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  cardHeader: {
    padding: theme.spacing.l,
    paddingBottom: theme.spacing.m,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  professionalName: {
    fontSize: 18,
    color: theme.colors.text.primary,
    marginBottom: 6,
    fontWeight: '700',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.m,
    ...theme.shadows.card,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 20,
    paddingTop: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginTop: theme.spacing.m,
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
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.card,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    backgroundColor: 'rgba(0, 130, 114, 0.08)',
    borderRadius: theme.borderRadius.l,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.background.surface,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryActionButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Missing styles for appointment card
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
