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
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';
import { ConsultationBooking } from '../types/booking';
import { theme } from '../theme';

const AppointmentsScreen = ({ navigation }: any) => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
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
      userId: user?._id,
      userObject: user, // Log the entire user object to see what fields it has
    });

    // Wait for auth to finish loading before checking user
    if (authLoading) {
      console.log('⏳ Waiting for auth to finish loading...');
      return;
    }

    // Check for user_id, _id, or id (API returns user_id)
    const userId = (user as any)?.user_id || user?._id || (user as any)?.id;
    
    if (userId) {
      console.log('✅ User authenticated, fetching appointments for:', userId);
      fetchAppointments(1);
    } else {
      console.log('❌ User not authenticated - user object:', user);
      setIsLoading(false);
      setError('User not authenticated');
    }
  }, [(user as any)?.user_id, user?._id, (user as any)?.id, authLoading]);

  const fetchAppointments = useCallback(async (pageToLoad: number = 1) => {
    // Check for user_id, _id, or id (API returns user_id)
    const userId = (user as any)?.user_id || user?._id || (user as any)?.id;
    
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

      const response = await apiService.getUserAppointments(String(userId), {
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
  }, [user?._id]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchAppointments(1);
  }, [fetchAppointments]);

  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || isLoading || !hasMore) {
      return;
    }
    fetchAppointments(page + 1);
  }, [fetchAppointments, page, isLoadingMore, isLoading, hasMore]);

  const handleViewPrescription = useCallback(
    async (bookingId: number | string) => {
      try {
        const numericId = Number(bookingId);
        const response = await apiService.getBookingPrescription(numericId);
        if (response?.data?.id) {
          navigation.navigate('HomeStack', {
            screen: 'PrescriptionDetail',
            params: { prescriptionId: response.data.id },
          });
        } else {
          Alert.alert('No prescription uploaded yet.');
        }
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 404) {
          Alert.alert('No prescription uploaded yet.');
        } else {
          Alert.alert('Error', 'Failed to fetch prescription. Please try again later.');
        }
      }
    },
    [navigation],
  );

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

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
    const statusBadgeStyle = getStatusBadgeStyle(status);
    const bookingId = item.booking_id || item._id;
    const timeDisplay = item.time; // Already formatted as "09:00 - 09:15"

    return (
      <View style={styles.appointmentCard}>
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

        {(status === 'confirmed' || status === 'completed') && (
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

            {status === 'completed' && (
              <TouchableOpacity
                style={styles.secondaryActionButton}
                onPress={() => handleViewPrescription(bookingId)}
              >
                <Ionicons name="medkit-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.secondaryActionButtonText}>View Prescription</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Appointments</Text>
        </View>
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
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Appointments</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* User Info Card */}
      <View style={styles.userInfo}>
        <View style={styles.userInfoHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={24} color="#1E88E5" />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.first_name || user?.firstName || 'User'} {user?.last_name || user?.lastName || ''}
            </Text>
            {user?.phone && (
              <View style={styles.phoneRow}>
                <Ionicons name="call" size={14} color="#6B7280" />
                <Text style={styles.userPhone}>{user.phone}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{appointments.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {appointments.filter((a: any) => (a.booking_status || a.status || '').toLowerCase() === 'confirmed').length}
            </Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {appointments.filter((a: any) => (a.booking_status || a.status || '').toLowerCase() === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>
      </View>

      {/* Content Area */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
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
              colors={["#1E88E5"]}
              tintColor="#1E88E5"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#1E88E5" />
                <Text style={styles.footerLoaderText}>Loading more appointments...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={80} color="#D1D5DB" />
              <Text style={styles.emptyText}>No Appointments Yet</Text>
              <Text style={styles.emptySubtext}>
                Your booking history will appear here.{"\n"}
                Start by booking your first consultation!
              </Text>
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
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  userInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E88E5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    marginBottom: 16,
    ...theme.shadows.card,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  dateTimeContainer: {
    flex: 1,
    gap: 8,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  appointmentTime: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  cardDetails: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    flex: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    paddingVertical: 12,
    gap: 8,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionButtonText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  secondaryActionButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B7280',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AppointmentsScreen;
