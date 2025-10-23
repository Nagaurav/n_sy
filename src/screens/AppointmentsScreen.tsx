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
import { apiService } from '../services/api';
import { ConsultationBooking } from '../types/booking';
import { theme } from '../theme';

const AppointmentsScreen = ({ navigation }: any) => {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      fetchAppointments();
    } else {
      console.log('❌ User not authenticated - user object:', user);
      setIsLoading(false);
      setError('User not authenticated');
    }
  }, [(user as any)?.user_id, user?._id, (user as any)?.id, authLoading]);

  const fetchAppointments = useCallback(async () => {
    // Check for user_id, _id, or id (API returns user_id)
    const userId = (user as any)?.user_id || user?._id || (user as any)?.id;
    
    if (!userId) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const response = await apiService.getUserAppointments(String(userId));
      
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
        setAppointments(sortedAppointments as any);
      } else {
        setError(response.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?._id]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchAppointments();
  }, [fetchAppointments]);

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return '#10B981';
      case 'pending':
        return '#F59E0B';
      case 'completed':
        return '#6366F1';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'pending':
        return 'time';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
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
    const statusColor = getStatusColor(status);
    const statusIcon = getStatusIcon(status);
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
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Ionicons name={statusIcon as any} size={16} color="#FFFFFF" />
            <Text style={styles.statusText}>{status.toUpperCase()}</Text>
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

        {status === 'confirmed' && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                'Appointment Details',
                `Professional: ${item.professional_name}\nDate: ${formatDate(item.date)}\nTime: ${timeDisplay}\nMode: ${item.mode}\nAmount: ₹${item.amount}`
              );
            }}
          >
            <Ionicons name="information-circle" size={20} color="#1E88E5" />
            <Text style={styles.actionButtonText}>View Details</Text>
          </TouchableOpacity>
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
          <TouchableOpacity onPress={fetchAppointments} style={styles.retryButton}>
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
            appointments.length === 0 && styles.emptyListContainer
          ]}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              colors={['#1E88E5']}
              tintColor="#1E88E5"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={80} color="#D1D5DB" />
              <Text style={styles.emptyText}>No Appointments Yet</Text>
              <Text style={styles.emptySubtext}>
                Your booking history will appear here.{'\n'}
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
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
  actionButton: {
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
});

export default AppointmentsScreen;
