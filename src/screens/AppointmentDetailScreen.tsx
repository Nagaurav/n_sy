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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { setCurrentAppointment, setChatActive, fetchAppointmentById } from '../store/appointmentSlice';
import { getAuthToken, getAppointmentToken } from '../utils/secureStorage';
import { VideoPlaceholder, PrescriptionViewer } from '../components';

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
  const { appointmentId, professionalId, userId, appointmentData } = route.params as RouteParams;
  
  console.log('📋 [AppointmentDetail] Screen mounted with appointmentId:', appointmentId, 'professionalId:', professionalId, 'userId:', userId);
  
  // Validate required parameters
  useEffect(() => {
    if (!appointmentId || !professionalId || !userId) {
      console.error('❌ [AppointmentDetail] Missing required parameters:', { appointmentId, professionalId, userId });
      Alert.alert('Invalid Appointment', 'Required appointment information is missing.');
      navigation.goBack();
    }
  }, [appointmentId, professionalId, userId, navigation]);
  
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

  // Calculate time until chat becomes available (15 minutes before appointment)
  const calculateTimeUntilChat = useCallback(() => {
    if (!currentAppointment) {
      console.log('⏰ [AppointmentDetail] No appointment data for chat calculation');
      return null;
    }
    
    const appointmentTime = new Date(`${currentAppointment.date} ${currentAppointment.time}`);
    const chatStartTime = new Date(appointmentTime.getTime() - 15 * 60 * 1000); // 15 minutes before
    const now = new Date();
    
    const diff = chatStartTime.getTime() - now.getTime();
    const minutesUntilChat = diff <= 0 ? 0 : Math.floor(diff / (1000 * 60));
    
    console.log('⏰ [AppointmentDetail] Chat availability:', {
      appointmentTime: appointmentTime.toISOString(),
      chatStartTime: chatStartTime.toISOString(),
      now: now.toISOString(),
      minutesUntilChat,
      isAvailable: minutesUntilChat === 0,
    });
    
    return minutesUntilChat;
  }, [currentAppointment]);

  // Check appointment status and permissions
  const checkAppointmentAccess = useCallback(async () => {
    console.log('🔐 [AppointmentDetail] Checking appointment access:', { appointmentId });
    try {
      const authToken = await getAuthToken();
      const appointmentToken = await getAppointmentToken(appointmentId);
      
      console.log('🔐 [AppointmentDetail] Access check results:', {
        hasAuthToken: !!authToken,
        hasAppointmentToken: !!appointmentToken,
      });
      
      if (!authToken) {
        console.warn('⚠️ [AppointmentDetail] No auth token found');
        Alert.alert('Authentication Required', 'Please log in to access this appointment.');
        navigation.goBack();
        return false;
      }
      
      // Verify appointment belongs to current user
      if (currentAppointment && !appointmentToken) {
        console.warn('⚠️ [AppointmentDetail] No appointment token found for appointment:', appointmentId);
        Alert.alert('Access Denied', 'You do not have permission to access this appointment.');
        navigation.goBack();
        return false;
      }
      
      console.log('✅ [AppointmentDetail] Access granted');
      return true;
    } catch (error) {
      console.error('❌ [AppointmentDetail] Error checking appointment access:', error);
      return false;
    }
  }, [appointmentId, currentAppointment, navigation]);

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

  // Enhanced session feature availability check (15 minutes before appointment)
  const isSessionFeatureAvailable = useCallback((type: 'chat' | 'video' = 'chat') => {
    if (!currentAppointment) return false;
    
    try {
      // Parse appointment date and time
      const [hours, minutes] = currentAppointment.time.split(':').map(Number);
      const appointmentDate = new Date(currentAppointment.date);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      
      // If appointment is in the past, allow access
      if (appointmentDate <= now) return true;
      
      // Calculate 15 minutes before appointment
      const fifteenMinutesBefore = new Date(appointmentDate.getTime() - (15 * 60 * 1000));
      
      // Check if current time is within 15 minutes before appointment
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
      const [hours, minutes] = currentAppointment.time.split(':').map(Number);
      const appointmentDate = new Date(currentAppointment.date);
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

  // Handle chat navigation
  const handleChatPress = async () => {
    console.log('💬 [AppointmentDetail] Chat button pressed:', {
      appointmentId,
      chatActive,
      professionalId: currentAppointment?.professional_id,
      professionalName: currentAppointment?.professional_name,
      bookingStatus: currentAppointment?.booking_status,
    });
    
    // Check appointment status first
    if (!isChatAvailable()) {
      console.log('⏰ [AppointmentDetail] Chat not available for status:', currentAppointment?.booking_status);
      Alert.alert('Chat Not Available', 'Chat is only available for confirmed or completed appointments.');
      return;
    }
    
    if (!chatActive) {
      console.log('⏰ [AppointmentDetail] Chat not active yet, showing alert');
      Alert.alert('Chat Not Available', 'Chat will be available at the appointment time.');
      return;
    }
    
    const hasAccess = await checkAppointmentAccess();
    if (!hasAccess) {
      console.warn('⚠️ [AppointmentDetail] Access denied, not navigating to chat');
      return;
    }
    
    // Use appointmentId as chatId (backend should handle this mapping)
    // If backend uses a different chatId, it should be included in appointment data
    const chatId = currentAppointment?.chat_id || appointmentId;
    
    console.log('🚀 [AppointmentDetail] Navigating to ChatScreen:', {
      chatId,
      appointmentId,
      professionalId,
      userId,
      professionalName: currentAppointment?.professional_name,
    });
    
    (navigation as any).navigate('ChatScreen', {
      chatId,
      appointmentId,
      title: currentAppointment?.professional_name || 'Chat',
      receiverId: professionalId,
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
      const [hours, minutes] = currentAppointment.time.split(':').map(Number);
      const appointmentDate = new Date(currentAppointment.date);
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
    
    setPrescriptionLoading(true);
    try {
      const bookingId = Number(currentAppointment.booking_id || currentAppointment.appointment_id);
      console.log('📡 [AppointmentDetail] Fetching prescription for booking:', bookingId);
      const response = await apiService.getBookingPrescription(bookingId);
      console.log('📡 [AppointmentDetail] Prescription API response:', {
        hasData: !!response?.data,
        prescriptionId: response?.data?.id,
        prescriptionType: response?.data?.prescriptionType,
      });
      
      if (response?.data?.id) {
        setPrescriptionData(response.data);
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

  // Fetch prescription when appointment is loaded
  useEffect(() => {
    if (currentAppointment) {
      fetchPrescriptionData();
    }
  }, [currentAppointment, fetchPrescriptionData]);

  // Initial data fetch
  useEffect(() => {
    console.log('🔄 [AppointmentDetail] Initial data fetch triggered');
    refreshAppointment();
  }, [refreshAppointment]);

  // Update time until chat
  useEffect(() => {
    console.log('⏰ [AppointmentDetail] Setting up chat countdown timer');
    const timer = setInterval(() => {
      const minutes = calculateTimeUntilChat();
      setTimeUntilChat(minutes);
      if (minutes !== null && minutes > 0) {
        console.log('⏰ [AppointmentDetail] Chat available in', minutes, 'minutes');
      }
    }, 30000); // Update every 30 seconds
    
    setTimeUntilChat(calculateTimeUntilChat());
    
    return () => {
      console.log('🧹 [AppointmentDetail] Cleaning up chat countdown timer');
      clearInterval(timer);
    };
  }, [calculateTimeUntilChat]);

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
        <Icon name="alert-circle-outline" size={60} color="#EF4444" />
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
        <Icon name="document-outline" size={60} color="#1A202C" />
        <Text style={styles.errorText}>Appointment not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            <Icon name="arrow-back" size={24} color="#1A202C" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Details</Text>
          <TouchableOpacity 
            onPress={() => {
              console.log('🔄 [AppointmentDetail] Refresh button pressed');
              refreshAppointment();
            }} 
            style={styles.refreshButton}
          >
            <Icon 
              name="refresh" 
              size={24} 
              color="#1A202C" 
              style={{ transform: [{ rotate: isRefreshing ? '180deg' : '0deg' }] }} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Appointment Info Card */}
      <View style={styles.card}>
        <View style={styles.statusBadge}>
          <Text style={[styles.statusText, { color: getStatusColor(currentAppointment.booking_status) }]}>
            {currentAppointment.booking_status}
          </Text>
        </View>
        
        <Text style={styles.professionalName}>{currentAppointment.professional_name}</Text>
        <Text style={styles.appointmentDate}>{currentAppointment.date}</Text>
        <Text style={styles.appointmentTime}>{currentAppointment.time}</Text>
        <Text style={styles.appointmentMode}>
          <Icon name={currentAppointment.mode === 'online' ? 'videocam' : 'location'} size={16} />
          {' '}{currentAppointment.mode === 'online' ? 'Online' : 'Offline'}
        </Text>
        <Text style={styles.appointmentAmount}>Amount: ₹{currentAppointment.amount}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Chat Button - Only show for CONFIRMED or COMPLETED appointments */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isChatAvailable() ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={handleChatPress}
          disabled={!isChatAvailable()}
        >
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
          {!isChatAvailable() && currentAppointment && (
            <Text style={styles.helperText}>
              {getChatAvailabilityMessage()}
            </Text>
          )}
        </TouchableOpacity>

        {/* Video Call Button - Only show for online appointments */}
        {currentAppointment?.mode === 'online' && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isVideoAvailable() ? styles.activeButton : styles.inactiveButton,
            ]}
            onPress={handleVideoCallPress}
            disabled={!isVideoAvailable()}
          >
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
            {!isVideoAvailable() && currentAppointment && (
              <Text style={styles.helperText}>
                {getVideoCallAvailabilityMessage()}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Video/Audio Placeholder */}
      {videoCallActive && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Video Consultation</Text>
          <VideoPlaceholder />
        </View>
      )}

      {/* Prescription Viewer - Embedded at bottom */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Prescriptions</Text>
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
              <Icon name="download" size={20} color="#3B82F6" />
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

      {/* Security Info */}
      <View style={styles.securityInfo}>
        <Icon name="shield-checkmark" size={20} color="#4CAF50" />
        <Text style={styles.securityText}>
          This appointment is secured with end-to-end encryption
        </Text>
      </View>
    </ScrollView>
  );
};

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'CONFIRMED':
      return '#4CAF50';
    case 'PENDING':
      return '#FF9800';
    case 'COMPLETED':
      return '#3B82F6';
    case 'CANCELLED':
      return '#EF4444';
    default:
      return '#1A202C';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  card: {
    margin: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  professionalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  appointmentDate: {
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 8,
  },
  appointmentMode: {
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    backgroundColor: '#3B82F6',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#1A202C',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1A202C',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 4,
    textAlign: 'center',
  },
  helperText: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 100,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  videoContainer: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  prescriptionContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    margin: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 8,
  },
  activeButton: {
    backgroundColor: '#3B82F6',
  },
  inactiveButton: {
    backgroundColor: '#E5E7EB',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  downloadButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  prescriptionLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  prescriptionLoadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6B7280',
  },
});

export default AppointmentDetailScreen;
