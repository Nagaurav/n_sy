import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState } from '../store';
import { apiService, apiClient } from '../services';
import { setCurrentAppointment, setChatActive, fetchAppointmentById } from '../store/appointmentSlice';
import { useAuth } from '../hooks/useAuth';
import { VideoPlaceholder, PrescriptionViewer } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

type RouteParams = {
  appointmentId: string;
  professionalId: string;
  userId: string;
  appointmentData?: any; // Optional appointment data passed from list
};

const AppointmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user, token, isAuthenticated } = useAuth();
  const { appointmentId, professionalId: routeProfessionalId, userId, appointmentData } = route.params as RouteParams;
  
  console.log('📋 [AppointmentDetail] Screen mounted with appointmentId:', appointmentId, 'professionalId:', routeProfessionalId, 'userId:', userId);
  
  // Validate required parameters
  useEffect(() => {
    if (!appointmentId || !routeProfessionalId || !userId) {
      console.error('❌ [AppointmentDetail] Missing required parameters:', { appointmentId, professionalId: routeProfessionalId, userId });
      Alert.alert('Invalid Appointment', 'Required appointment information is missing.');
      navigation.goBack();
    }
  }, [appointmentId, routeProfessionalId, userId, navigation]);
  
  const {
    currentAppointment,
    loading,
    error,
    chatActive,
    videoCallActive,
  } = useSelector((state: RootState) => state.appointment);

  const [timeUntilChat, setTimeUntilChat] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [prescriptionLoading, setPrescriptionLoading] = useState(false);

  // Get professionalId from appointment data or route params
  const professionalId = currentAppointment?.professional_id || routeProfessionalId || 'unknown';

  // Debug: Log appointment state changes
  useEffect(() => {
    console.log('📋 [AppointmentDetail] Appointment state updated:', {
      appointmentId,
      hasAppointment: !!currentAppointment,
      loading,
      error,
      chatActive,
      videoCallActive,
      appointmentStatus: currentAppointment?.booking_status,
    });
  }, [currentAppointment, loading, error, chatActive, videoCallActive, appointmentId]);

  // Helper to combine Date (from slot.date) and Time (from slot.start_time)
  const getRealAppointmentDate = (dateString: string, timeString: string) => {
    try {
      const dateObj = new Date(dateString); // "2025-05-07..."
      const timeObj = new Date(timeString); // "1970-01-01T01:30..."

      // Combine them
      const finalDate = new Date(dateObj);
      finalDate.setHours(timeObj.getUTCHours());
      finalDate.setMinutes(timeObj.getUTCMinutes());
      finalDate.setSeconds(0);
      
      return finalDate;
    } catch (e) {
      console.error("Date parsing error", e);
      return new Date();
    }
  };

  // Calculate time until chat becomes available (15 minutes before appointment)
  const calculateTimeUntilChat = useCallback(() => {
    // 1. Safety Check: If we don't have a valid appointment, stop immediately.
    if (!currentAppointment) {
      console.log(' [AppointmentDetail] No appointment data available');
      return null;
    }

    try {
      // Use slot data if available, otherwise fall back to root level data
      const appointmentDate = currentAppointment.date || currentAppointment.slot?.date;
      const appointmentTime = currentAppointment.time || currentAppointment.slot?.start_time;

      if (!appointmentDate || !appointmentTime) {
        console.log(' [AppointmentDetail] No appointment date or time available');
        return null;
      }

      // ✅ NEW CODE: Use the helper function to combine date and time properly
      const chatStartTime = getRealAppointmentDate(appointmentDate, appointmentTime);
      
      // Now calculate availability using this correct date
      const now = new Date();
      const diff = (chatStartTime.getTime() - now.getTime()) / 60000;
      const minutesUntilChat = diff <= 0 ? 0 : Math.floor(diff);
      
      console.log(' [AppointmentDetail] Chat availability:', {
        appointmentDate,
        appointmentTime,
        chatStartTime: chatStartTime.toISOString(),
        now: now.toISOString(),
        minutesUntilChat,
        isAvailable: minutesUntilChat === 0,
      });
      
      return minutesUntilChat;
    } catch (error) {
      console.error(' [AppointmentDetail] Error calculating chat time:', error);
      return null;
    }
  }, [currentAppointment]);

  // Check appointment status and permissions
  const checkAppointmentAccess = useCallback(async () => {
    console.log(' [AppointmentDetail] Checking appointment access:', { appointmentId });
    try {
      // Use AuthContext instead of secure storage
      const authToken = token;
      const hasUser = !!user;
      
      console.log('🔐 [AppointmentDetail] Access check results:', {
        hasAuthToken: !!authToken,
        hasUser,
        isAuthenticated,
        userId: user?.id,
      });
      
      if (!authToken || !isAuthenticated) {
        console.warn('⚠️ [AppointmentDetail] No auth token found or not authenticated');
        Alert.alert('Authentication Required', 'Please log in to access this appointment.');
        navigation.goBack();
        return false;
      }
      
      // For development/testing, we can skip the appointment token check
      // In production, you might want to verify the appointment belongs to the user
      console.log('✅ [AppointmentDetail] Access granted');
      return true;
    } catch (error) {
      console.error('❌ [AppointmentDetail] Error checking appointment access:', error);
      return false;
    }
  }, [appointmentId, user, token, isAuthenticated, navigation]);

  // Refresh appointment data
  const refreshAppointment = useCallback(async () => {
    console.log('🔄 [AppointmentDetail] Refreshing appointment data:', appointmentId);
    setIsRefreshing(true);
    try {
      console.log('📡 [AppointmentDetail] Fetching appointment by ID...');
      await dispatch(fetchAppointmentById(appointmentId) as any);
      console.log('📡 [AppointmentDetail] Checking chat status...');
      
      console.log('✅ [AppointmentDetail] Appointment data refreshed successfully');
    } catch (error) {
      console.error('❌ [AppointmentDetail] Error refreshing appointment:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, appointmentId]);

  // 1. FIX: Updated Session Check Logic
  const isSessionFeatureAvailable = useCallback((type: 'chat' | 'video' = 'chat') => {
    if (!currentAppointment) return false;
    
    // ✅ ALWAYS ALLOW if confirmed/completed (Removes 15-min restriction & fixes disabled button)
    if (currentAppointment.booking_status === 'CONFIRMED' || currentAppointment.booking_status === 'COMPLETED') {
       return true; 
    }

    // Fallback logic for safety
    try {
      // ✅ FIX: Use slot.date if root date is missing (Fixes 1970 bug)
      // The API returns date inside the 'slot' object
      const dateStr = currentAppointment.date || currentAppointment.slot?.date;
      const timeStr = currentAppointment.time || currentAppointment.slot?.start_time;

      if (!dateStr || !timeStr) return false;

      let appointmentDate: Date;

      // Handle ISO strings correctly
      if (typeof timeStr === 'string' && timeStr.includes('T')) {
        appointmentDate = new Date(timeStr);
      } else {
        const [hours, minutes] = String(timeStr).split(':').map(Number);
        appointmentDate = new Date(dateStr);
        appointmentDate.setHours(hours, minutes, 0, 0);
      }
      
      const now = new Date();
      
      // Allow if in past or within 15 mins
      if (appointmentDate <= now) return true;
      const fifteenMinutesBefore = new Date(appointmentDate.getTime() - (15 * 60 * 1000));
      return now >= fifteenMinutesBefore;

    } catch (error) {
      console.error('Error checking session availability:', error);
      return false;
    }
  }, [currentAppointment]);

  // Get user-friendly message about chat availability
  const getChatAvailabilityMessage = useCallback(() => {
    if (!currentAppointment) return '';
    
    const status = currentAppointment.booking_status;
    if (status !== 'CONFIRMED' && status !== 'COMPLETED') {
      return 'Chat only available for confirmed or completed appointments';
    }
    
    if (!isSessionFeatureAvailable('chat')) {
      if (!currentAppointment.time) return 'Chat time not available';
      const [hours, minutes] = currentAppointment.time.split(':').map(Number);
      const appointmentDate = new Date(currentAppointment.date || '');
      appointmentDate.setHours(hours, minutes, 0, 0);
      const now = new Date();
      
      if (now < appointmentDate) {
        const diffMs = appointmentDate.getTime() - now.getTime();
        const diffMins = Math.ceil(diffMs / (1000 * 60));
        return `Chat available in ~${diffMins} minutes`;
      }
      
      return 'Chat session has ended';
    }
    
    return 'Chat is available';
  }, [currentAppointment, isSessionFeatureAvailable]);

  // Check if chat should be available based on appointment status and timing
  const isChatAvailable = useCallback(() => {
    if (!currentAppointment) return false;
    const status = currentAppointment.booking_status;
    return (status === 'CONFIRMED' || status === 'COMPLETED') && 
           isSessionFeatureAvailable('chat');
  }, [currentAppointment, isSessionFeatureAvailable]);

  // Check if video should be available based on appointment status and mode
  const isVideoAvailable = useCallback(() => {
    if (!currentAppointment) return false;
    const status = currentAppointment.booking_status;
    return (status === 'CONFIRMED' || status === 'COMPLETED') && 
           isSessionFeatureAvailable('video') &&
           currentAppointment.mode === 'online'; // Only for online appointments
  }, [currentAppointment, isSessionFeatureAvailable]);

  // 2. FIX: specific Chat Press Handler
  const handleChatPress = async () => {
    const effectiveProfessionalId = currentAppointment?.professional_id || professionalId;
    
    console.log('💬 [AppointmentDetail] Chat button pressed');
    
    // ✅ REMOVED the "!chatActive" check which was blocking you
    // We strictly trust isChatAvailable() now.
    if (!isChatAvailable()) {
      Alert.alert('Chat Not Available', 'Chat is only available for confirmed appointments.');
      return;
    }
    
    const hasAccess = await checkAppointmentAccess();
    if (!hasAccess) return;
    
    const chatId = currentAppointment?.chat_id || appointmentId;
    
    // Navigate to Chat
    (navigation as any).navigate('ChatScreen', {
      chatId,
      appointmentId,
      title: currentAppointment?.professional_name || 'Chat',
      receiverId: effectiveProfessionalId,
    });
  };

  // Get user-friendly message about video call availability
  const getVideoCallAvailabilityMessage = useCallback(() => {
    if (!currentAppointment) return 'Video call not available';
    
    const status = currentAppointment.booking_status;
    if (status !== 'CONFIRMED' && status !== 'COMPLETED') {
      return 'Video calls only for confirmed or completed appointments';
    }
    
    if (currentAppointment.mode !== 'online') {
      return 'Video calls only available for online appointments';
    }
    
    if (!isSessionFeatureAvailable('video')) {
      if (!currentAppointment.time) return 'Video call time not available';
      const [hours, minutes] = currentAppointment.time.split(':').map(Number);
      const appointmentDate = new Date(currentAppointment.date || '');
      appointmentDate.setHours(hours, minutes, 0, 0);
      const now = new Date();
      
      if (now < appointmentDate) {
        const diffMs = appointmentDate.getTime() - now.getTime();
        const diffMins = Math.ceil(diffMs / (1000 * 60));
        return `Video call available in ~${diffMins} minutes`;
      }
      
      return 'Video call session has ended';
    }
    
    return 'Video call is available';
  }, [currentAppointment, isSessionFeatureAvailable]);

  // Handle video call
  const handleVideoCallPress = async () => {
    console.log('🎥 [AppointmentDetail] Video call button pressed:', {
      appointmentId,
      isVideoAvailable: isVideoAvailable(),
      mode: currentAppointment?.mode,
      status: currentAppointment?.booking_status,
    });
    
    // Check appointment status and mode first
    if (!currentAppointment) return;
    
    if (currentAppointment.mode !== 'online') {
      console.log('❌ [AppointmentDetail] Video call only available for online appointments');
      Alert.alert('Video Call Not Available', 'Video calls are only available for online appointments.');
      return;
    }
    
    if (!isVideoAvailable()) {
      console.log('⏰ [AppointmentDetail] Video call not available:', {
        status: currentAppointment.booking_status,
        isSessionAvailable: isSessionFeatureAvailable('video')
      });
      
      if (currentAppointment.booking_status !== 'CONFIRMED' && 
          currentAppointment.booking_status !== 'COMPLETED') {
        Alert.alert('Video Call Not Available', 'Video calls are only available for confirmed or completed appointments.');
      } else {
        Alert.alert('Video Call Not Available', 'Video calls are only available during your scheduled appointment time.');
      }
      return;
    }
    
    const hasAccess = await checkAppointmentAccess();
    if (!hasAccess) {
      console.warn('⚠️ [AppointmentDetail] Access denied for video call');
      return;
    }
    
    console.log('📞 [AppointmentDetail] Video call feature placeholder');
    Alert.alert('Video Call', 'Video call feature will be available soon.');
  };

  // Fetch prescription data for the appointment
  const fetchPrescriptionData = useCallback(async () => {
    if (!currentAppointment) return;
    
    // Validate that we have required booking data before proceeding
    if (!currentAppointment.booking_id && !currentAppointment.appointment_id) {
      console.error('❌ [AppointmentDetail] No valid booking ID found in appointment data');
      return;
    }
    
    setPrescriptionLoading(true);
    try {
      const bookingId = Number(currentAppointment.booking_id || currentAppointment.appointment_id);
      console.log('📡 [AppointmentDetail] Fetching prescription for booking:', bookingId);
      const response = await apiService.getBookingPrescription(bookingId);
      console.log('📡 [AppointmentDetail] Prescription API response:', {
        hasData: !!response?.data,
        prescriptionId: response?.data?.data?.id,
        prescriptionType: response?.data?.data?.prescriptionType,
      });
      
      if (response?.data?.data?.id) {
        setPrescriptionData(response.data.data);
      } else {
        setPrescriptionData(null);
      }
    } catch (error: any) {
      const status = error?.response?.status;
      console.error('❌ [AppointmentDetail] Error fetching prescription:', {
        status,
        error: error?.message,
      });
      
      // Don't show error for 404 - just set prescriptionData to null
      if (status !== 404) {
        console.warn('⚠️ [AppointmentDetail] Failed to fetch prescription data');
      }
      setPrescriptionData(null);
    } finally {
      setPrescriptionLoading(false);
    }
  }, [currentAppointment]);

  // Fetch prescription when appointment is loaded and status is COMPLETED
  useEffect(() => {
    if (currentAppointment && currentAppointment.booking_status === 'COMPLETED') {
      fetchPrescriptionData();
    }
  }, [currentAppointment, fetchPrescriptionData]);

  // Initial data fetch
  useEffect(() => {
    console.log('🔄 [AppointmentDetail] Initial data fetch triggered');
    refreshAppointment();
  }, [refreshAppointment]);

  // ✅ ADD PAYMENT SYNC EFFECT - Sync payment status when appointment loads
  useEffect(() => {
    const syncPaymentStatus = async () => {
      if (currentAppointment?.transaction_id && currentAppointment?.payment_status === 'PENDING') {
        try {
          console.log(`🔄 [AppointmentDetail] Force syncing payment for TXN: ${currentAppointment.transaction_id}`);
          
          // Use consistent endpoint with other screens
          const response = await apiService.syncPaymentStatus(currentAppointment.transaction_id);
          console.log('✅ [AppointmentDetail] Payment sync response:', response.data);
          
          // Check if sync was successful
          const isSuccess = 
            response.data?.msg?.includes('SUCCESS') || 
            response.data?.msg?.includes('updated to SUCCESS') ||
            response.data?.current_status === 'SUCCESS' ||
            response.data?.status === 'SUCCESS';
          
          if (isSuccess) {
            console.log('✅ [AppointmentDetail] Payment status synced successfully');
            
            // Refresh appointment data after sync to get updated status
            setTimeout(() => {
              console.log('🔄 [AppointmentDetail] Refreshing appointment data after payment sync...');
              refreshAppointment();
            }, 1000);
          } else {
            console.log('⚠️ [AppointmentDetail] Payment still pending, will retry on next load');
          }
        } catch (error) {
          console.error('⚠️ [AppointmentDetail] Sync attempt failed (Background webhook will handle it):', error);
        }
      }
    };

    if (currentAppointment) {
      syncPaymentStatus();
    }
  }, [currentAppointment, refreshAppointment]);

  // Update time until chat
  useEffect(() => {
    console.log('⏰ [AppointmentDetail] Setting up chat countdown timer');
    const timer = setInterval(() => {
      const minutes = calculateTimeUntilChat();
      const previousMinutes = timeUntilChat;
      setTimeUntilChat(minutes);
      
      // Only log when time actually changes (not every 30 seconds)
      if (minutes !== null && minutes !== previousMinutes) {
        console.log('⏰ [AppointmentDetail] Chat available in', minutes, 'minutes');
      }
    }, 30000); // Update every 30 seconds
    
    setTimeUntilChat(calculateTimeUntilChat());
    
    return () => {
      console.log('🧹 [AppointmentDetail] Cleaning up chat countdown timer');
      clearInterval(timer);
    };
  }, [calculateTimeUntilChat, timeUntilChat]);

  if (loading && !currentAppointment) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
      </View>
    );
  }

  if (error && !currentAppointment) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle-outline" size={60} color={theme.colors.feedback.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshAppointment}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!currentAppointment) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="document-outline" size={60} color={theme.colors.text.primary} />
        <Text style={styles.errorText}>Appointment not found</Text>
      </View>
    );
  }

  // Helper function to format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date not available';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => {
              console.log('⬅️ [AppointmentDetail] Back button pressed');
              navigation.goBack();
            }} 
            style={styles.backButton}
          >
            <Icon name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Professional Profile Card */}
        <View style={styles.professionalCard}>
          <View style={styles.professionalHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Icon name="person" size={40} color={theme.colors.primary} />
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(currentAppointment.booking_status, theme) }]} />
            </View>
            <View style={styles.professionalInfo}>
              <Text style={styles.professionalName}>{currentAppointment.professional_name}</Text>
              <Text style={styles.professionalTitle}>Healthcare Professional</Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { color: getStatusColor(currentAppointment.booking_status, theme) }]}>{currentAppointment.booking_status}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Appointment Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Appointment Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="calendar" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{formatDate(currentAppointment.date)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="time" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{currentAppointment.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name={currentAppointment.mode === 'online' ? 'videocam' : 'location'} size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Mode</Text>
              <Text style={styles.detailValue}>{currentAppointment.mode === 'online' ? 'Online Consultation' : 'In-Person Visit'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Icon name="payments" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Consultation Fee</Text>
              <Text style={styles.detailValue}>₹{currentAppointment.amount}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          
          <View style={styles.actionButtons}>
            {/* Chat Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                isChatAvailable() ? styles.chatButton : styles.disabledActionButton,
              ]}
              onPress={handleChatPress}
              disabled={!isChatAvailable()}
            >
              <View style={styles.actionButtonContent}>
                <Icon 
                  name="chatbubble" 
                  size={24} 
                  color={isChatAvailable() ? '#fff' : '#94A3B8'} 
                />
                <Text style={[styles.actionButtonText, { 
                  color: isChatAvailable() ? '#fff' : '#94A3B8' 
                }]}>
                  Chat
                </Text>
              </View>
              {!isChatAvailable() && currentAppointment && (
                <Text style={styles.helperText}>
                  {getChatAvailabilityMessage()}
                </Text>
              )}
            </TouchableOpacity>

            {/* Video Call Button */}
            {currentAppointment?.mode === 'online' && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isVideoAvailable() ? styles.videoButton : styles.disabledActionButton,
                ]}
                onPress={handleVideoCallPress}
                disabled={!isVideoAvailable()}
              >
                <View style={styles.actionButtonContent}>
                  <Icon 
                    name="videocam" 
                    size={24} 
                    color={isVideoAvailable() ? '#fff' : '#94A3B8'}
                  />
                  <Text style={[styles.actionButtonText, { 
                    color: isVideoAvailable() ? '#fff' : '#94A3B8' 
                  }]}>
                    Video Call
                  </Text>
                </View>
                {!isVideoAvailable() && currentAppointment && (
                  <Text style={styles.helperText}>
                    {getVideoCallAvailabilityMessage()}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Video/Audio Placeholder */}
        {videoCallActive && (
          <View style={styles.videoCard}>
            <View style={styles.cardHeader}>
              <Icon name="videocam" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Video Consultation</Text>
            </View>
            <VideoPlaceholder />
          </View>
        )}

        {/* Prescription Viewer - Only show for COMPLETED appointments */}
        {currentAppointment.booking_status === 'COMPLETED' && (
          <View style={styles.prescriptionCard}>
            <View style={styles.cardHeader}>
              <Icon name="medkit" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Prescriptions</Text>
              {prescriptionData && (
                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => {
                    // Navigate to PrescriptionDetail if prescription exists
                    (navigation as any).navigate('PrescriptionDetail', {
                      prescriptionId: prescriptionData.id,
                      appointmentId: currentAppointment.appointment_id,
                    });
                  }}
                >
                  <Icon name="download" size={20} color={theme.colors.primary} />
                  <Text style={styles.downloadButtonText}>View Details</Text>
                </TouchableOpacity>
              )}
            </View>
            {prescriptionLoading ? (
              <View style={styles.prescriptionLoadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.prescriptionLoadingText}>Loading prescription...</Text>
              </View>
            ) : (
              <PrescriptionViewer appointmentId={currentAppointment.appointment_id} />
            )}
          </View>
        )}

        {/* Security Information */}
        <View style={styles.securityCard}>
          <Icon name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.securityText}>Your consultation is secure and private</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper function to get status color
const getStatusColor = (status: string, theme: any): string => {
  switch (status) {
    case 'CONFIRMED':
      return theme.colors.success;
    case 'PENDING':
      return theme.colors.warning;
    case 'COMPLETED':
      return theme.colors.primary;
    case 'CANCELLED':
      return theme.colors.feedback.error;
    default:
      return theme.colors.text.primary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
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
    padding: 10,
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

  // Professional Card
  professionalCard: {
    margin: 20,
    marginTop: 30,
    padding: 24,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  professionalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: theme.colors.background.surface,
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  professionalTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Details Card
  detailsCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 28, // Increased from 20 for much better spacing
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    color: theme.colors.text.primary,
    fontWeight: '600',
  },

  // Actions Card
  actionsCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatButton: {
    backgroundColor: '#10B981',
  },
  videoButton: {
    backgroundColor: '#3B82F6',
  },
  disabledActionButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Video Card
  videoCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Prescription Card
  prescriptionCard: {
    margin: 20,
    marginTop: 0,
    padding: 24,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  prescriptionLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  prescriptionLoadingText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 12,
    fontWeight: '500',
  },

  // Security Card
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    marginTop: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  securityText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginLeft: 12,
    letterSpacing: 0.2,
  },

  // Loading and Error States
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.feedback.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
  },
  retryButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppointmentDetailScreen;
