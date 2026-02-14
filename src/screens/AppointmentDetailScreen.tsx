import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StatusBar,
  Animated,
  SafeAreaView,
  RefreshControl,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { bookingService } from '../services/bookingService';
import { dietService } from '../services/dietService';
import { apiClient } from '../services/apiClient';

interface AppointmentDetail {
  id: string | number;
  type: 'consultation' | 'yoga_class';
  status: string;
  date: string;
  time: string;
  professionalName: string;
  professionalSpeciality: string;
  amount: number;
  paymentStatus: string;
  mode?: string;
  professionalPhoto?: string;
  professional?: any; // Professional object with rating, experience, etc.
}

// Helper function to format date in a user-friendly way
const formatAppointmentDate = (dateString: string): string => {
  if (!dateString) return 'Date N/A';
  
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time to compare dates only
  const resetTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const resetDate = resetTime(date);
  const resetToday = resetTime(today);
  const resetTomorrow = resetTime(tomorrow);
  
  if (resetDate.getTime() === resetToday.getTime()) {
    return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else if (resetDate.getTime() === resetTomorrow.getTime()) {
    return `Tomorrow, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }
};

// Helper function to format time with AM/PM
const formatTimeWithAMPM = (timeString: string): string => {
  if (!timeString) return 'Time N/A';
  
  // Handle time formats like "09:00 - 09:15" or "14:30"
  const timeParts = timeString.split(' - ');
  
  const formatSingleTime = (time: string): string => {
    const cleanTime = time.trim();
    const [hours, minutes] = cleanTime.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) return cleanTime;
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  if (timeParts.length === 2) {
    return `${formatSingleTime(timeParts[0])} - ${formatSingleTime(timeParts[1])}`;
  } else {
    return formatSingleTime(timeString);
  }
};

const AppointmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme: appTheme } = useTheme();
  const theme = appTheme || require('../theme').theme;

  // 🟢 1. Extract params including TYPE
  const { appointmentId, type } = (route.params || {}) as { appointmentId: string | number, type?: 'consultation' | 'yoga_class' };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [detail, setDetail] = useState<AppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // 🟢 2. Unified Logic: Auto-detect type from unified list first
  const fetchDetails = useCallback(async () => {
    console.log(`🚀 [DetailScreen] fetchDetails called with ID: ${appointmentId}, Type: ${type}`);
    
    if (!appointmentId || !user) {
      console.log(`❌ [DetailScreen] Missing appointmentId or user`);
      return;
    }

    try {
      setLoading(true);
      let data: any = null;
      let apptType = type; // Don't default to consultation, let us detect it

      console.log(`🔎 [DetailScreen] Fetching ID: ${appointmentId} Initial Type: ${apptType || 'unknown'}`);

      // 🎯 STEP 1: If no type provided, auto-detect from unified list
      if (!apptType) {
        console.log(`🔍 [DetailScreen] Auto-detecting type for ID: ${appointmentId}`);
        const listRes = await bookingService.getAllUserBookings((user as any).id || (user as any).user_id);
        
        console.log(`📋 [DetailScreen] Unified list response:`, listRes.success ? 'SUCCESS' : 'FAILED');
        
        if (listRes.success && listRes.data) {
          console.log(`🔍 [DetailScreen] Searching through ${listRes.data.length} items for ID: ${appointmentId}`);
          
          // Debug: Log all reference_ids
          listRes.data.forEach((item: any, index: number) => {
            console.log(`  Item ${index}: reference_id=${item.reference_id}, type=${item.type}`);
          });
          
          const found = listRes.data.find((item: any) =>
            String(item.reference_id) === String(appointmentId)
          );
          
          console.log(`🎯 [DetailScreen] Search result for ID ${appointmentId}:`, found ? 'FOUND' : 'NOT FOUND');
          
          if (found) {
            apptType = found.type;
            console.log(`✅ [DetailScreen] Auto-detected type: ${apptType} for ID: ${appointmentId}`);
          } else {
            console.log(`❌ [DetailScreen] Appointment ID ${appointmentId} not found in unified list`);
            Alert.alert("Error", "Appointment not found.");
            navigation.goBack();
            return;
          }
        } else {
          console.log(`❌ [DetailScreen] Failed to get unified list`);
          Alert.alert("Error", "Failed to load appointments.");
          navigation.goBack();
          return;
        }
      }

      // 🎯 UNIFIED APPROACH: Always use unified list (most reliable)
      console.log(`🔄 [DetailScreen] Using unified list approach for type: ${apptType}`);
      
      const listRes = await bookingService.getAllUserBookings((user as any).id || (user as any).user_id);

      if (listRes.success && listRes.data) {
        const found = listRes.data.find((item: any) =>
          String(item.reference_id) === String(appointmentId) && item.type === apptType
        );

        if (found) {
          if (apptType === 'yoga_class') {
            data = {
              id: found.reference_id,
              type: 'yoga_class',
              status: found.status,
              date: found.date,
              time: found.time || 'TBA',
              professionalName: found.professional?.first_name && found.professional?.last_name
                ? `Dr. ${found.professional.first_name} ${found.professional.last_name}`
                : found.title,
              professionalSpeciality: found.professional?.speciality_name || found.professional?.speciality || 'Yoga Instructor',
              amount: found.amount,
              paymentStatus: found.payment_status,
              mode: found.mode || (isYoga ? 'offline' : 'online'), // 🆕 Use actual mode instead of subtitle
              professionalPhoto: found.professional?.photo_url || found.imageUrl,
              professional: found.professional
            };
            console.log(` [DetailScreen] Found yoga booking: ${data.professionalName}`);
          } else if (apptType === 'consultation') {
            data = {
              id: found.reference_id,
              type: 'consultation',
              status: found.status,
              date: found.date,
              time: found.time,
              professionalName: found.professional?.first_name && found.professional?.last_name
                ? `Dr. ${found.professional.first_name} ${found.professional.last_name}`
                : found.title,
              professionalSpeciality: found.professional?.speciality_new?.name || found.professional?.speciality_name || found.professional?.speciality || found.professional?.role || 'General Practitioner',
              amount: found.amount,
              paymentStatus: found.payment_status,
              mode: found.mode || (isYoga ? 'offline' : 'online'), // 🆕 Use actual mode instead of subtitle
              professionalPhoto: found.professional?.photo_url || found.imageUrl,
              professional: found.professional
            };
            console.log(` [DetailScreen] Found consultation: ${data.professionalName}`);
          }
        } else {
          console.log(` [DetailScreen] No ${apptType} found with ID: ${appointmentId}`);
        }
      }

      if (data) {
        setDetail(data);
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true })
        ]).start();
      } else {
        console.log("❌ [DetailScreen] Data not found for ID:", appointmentId);
        Alert.alert("Error", "Appointment details could not be found.");
        navigation.goBack();
      }

    } catch (e) {
      console.error("Fetch Error:", e);
      Alert.alert("Error", "Failed to load details.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [appointmentId, type, user, navigation, fadeAnim, slideAnim]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // --- Actions ---

  const handleChatPress = () => {
    if (!detail) return;
    console.log(`💬 [DetailScreen] Navigating to ChatScreen with:`, {
      appointmentId: detail.id,
      title: detail.professionalName
    });
    (navigation.navigate as any)('ChatScreen', {
      appointmentId: detail.id,
      title: detail.professionalName,
    });
  };

  const handlePrescriptionPress = useCallback(async () => {
    if (!detail?.id) {
      Alert.alert("Error", "No appointment ID found.");
      return;
    }

    console.log('🧭 [DetailScreen] Navigating to PrescriptionDetail with appointmentId:', detail.id);
    
    try {
      // Navigate through the hierarchy: RootStack -> MainDrawer -> HomeStack -> PrescriptionDetail
      const rootNav = navigation as any;
      
      rootNav.navigate('MainDrawer', {
        screen: 'HomeStack',
        params: {
          screen: 'PrescriptionDetail',
          params: {
            prescriptionId: detail.id
          }
        }
      });
    } catch (error) {
      console.error('🧭 [DetailScreen] Navigation error:', error);
      Alert.alert("Navigation Error", "Could not navigate to prescription details.");
    }
  }, [detail?.id, navigation]);

  const handleDietPlanPress = useCallback(async () => {
    if (!detail?.id) {
      Alert.alert("Error", "No appointment ID found.");
      return;
    }

    console.log('🧭 [DetailScreen] Navigating to DietPlan with bookingId:', detail.id);
    
    (navigation.navigate as any)('DietPlan', { 
      bookingId: detail.id 
    });
  }, [detail?.id, navigation]);

  const handleAddToCalendar = () => {
    if (!detail || detail.status !== 'CONFIRMED') return;
    
    const eventTitle = `${isYoga ? 'Yoga Class' : 'Consultation'}: ${detail.professionalName}`;
    const eventDescription = `${detail.professionalSpeciality}\nMode: ${detail.mode || 'Online'}\nAmount: ₹${detail.amount}`;
    const eventDate = new Date(detail.date);
    
    // Create calendar event URL
    const startDate = new Date(eventDate);
    const endDate = new Date(eventDate);
    
    // Parse time to set hours and minutes
    if (detail.time && detail.time !== 'TBA') {
      const timeMatch = detail.time.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const [, hours, minutes] = timeMatch;
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        endDate.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0); // Add 1 hour duration
      }
    }
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(detail.mode || 'Online')}`;
    
    Alert.alert(
      "Add to Calendar",
      "Would you like to add this appointment to your Google Calendar?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Add to Calendar", 
          onPress: () => {
            // In a real app, you would use Linking.openURL(calendarUrl)
            Alert.alert("Success", "Calendar event created successfully!");
          }
        }
      ]
    );
  };

  const handleReschedule = () => {
    if (!detail || detail.status !== 'CONFIRMED') return;
    
    Alert.alert(
      "Reschedule Appointment",
      "Would you like to reschedule this appointment? You will be able to select a new date and time.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reschedule", 
          onPress: () => {
            // Navigate to rescheduling screen or open date/time picker
            Alert.alert("Coming Soon", "Rescheduling feature will be available soon!");
          }
        }
      ]
    );
  };

  const handleCancelPress = () => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setCancelling(true);
            try {
              // 🟢 Smart Cancel: Use the correct API based on type
              let endpoint = detail?.type === 'yoga_class'
                ? `/user/yoga-booking/cancel/${appointmentId}`
                : `/user/consultation-booking/cancel/${appointmentId}`;

              const res = await apiClient.post(endpoint, {});

              if (res.success) {
                Alert.alert("Success", "Booking cancelled successfully.");
                navigation.goBack();
              } else {
                Alert.alert("Error", "Failed to cancel.");
              }
            } catch (err) {
              Alert.alert("Error", "Network error occurred.");
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!detail) return null;

  const isYoga = detail.type === 'yoga_class';
  const color = isYoga ? '#4CAF50' : theme.colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header matching ProfessionalHomeHeader */}
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
            <Text style={styles.headerTitle}>
              {isYoga ? 'Class Details' : 'Consultation'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isYoga ? 'View your yoga class information' : 'View your consultation details'}
            </Text>
          </View>
          
          {/* Calendar Button in Header - Right Side */}
          {detail.status === 'CONFIRMED' && (
            <TouchableOpacity 
              style={styles.headerCalendarButton}
              onPress={handleAddToCalendar}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ padding: theme.spacing.m }} 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchDetails(); }} />}
      >
        {/* Modern Appointment Card */}
        <Animated.View style={[
          styles.modernCard, // 🆕 Remove colored borders to match ProfessionalHomeScreen
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          {/* Modern Header with Status Chips */}
          <View style={styles.modernHeader}>
            <View style={styles.statusChipsRow}>
              <View style={[styles.statusChip, { backgroundColor: theme.colors.feedback.success + '20' }]}>
                <Ionicons name="checkmark-circle" size={12} color={theme.colors.feedback.success} />
                <Text style={[styles.statusChipText, { color: theme.colors.feedback.success }]}>
                  {detail.status}
                </Text>
              </View>
              <View style={[styles.statusChip, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name={isYoga ? 'location' : 'videocam'} size={12} color={theme.colors.primary} />
                <Text style={[styles.statusChipText, { color: theme.colors.primary }]}>
                  {isYoga ? 'offline' : 'online'}
                </Text>
              </View>
            </View>
          </View>

          {/* Professional Section */}
          <View style={styles.professionalSection}>
            <View style={styles.professionalAvatarContainer}>
              {detail.professionalPhoto ? (
                <Image source={{ uri: detail.professionalPhoto }} style={styles.professionalAvatar} />
              ) : (
                <View style={[styles.professionalAvatarPlaceholder, { backgroundColor: color }]}>
                  <Text style={styles.avatarText}>
                    {detail.professionalName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.professionalInfo}>
              <Text style={styles.professionalName}>{detail.professionalName}</Text>
              <Text style={styles.professionalSpeciality}>{detail.professionalSpeciality}</Text>
              
              {/* Professional Credentials */}
              <View style={styles.professionalCredentials}>
                {detail.professional?.rating && (
                  <View style={styles.credentialItem}>
                    <Ionicons name="star" size={12} color={theme.colors.primary} />
                    <Text style={styles.credentialText}>
                      {detail.professional.rating.toFixed(1)} ({detail.professional.review_count || 0})
                    </Text>
                  </View>
                )}
                {detail.professional?.experience_years && (
                  <View style={styles.credentialItem}>
                    <Ionicons name="time" size={12} color={theme.colors.text.secondary} />
                    <Text style={styles.credentialText}>
                      {detail.professional.experience_years}+ years
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Prominent Date & Time Section */}
          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Date</Text>
                <Text style={styles.dateTimeValue}>{formatAppointmentDate(detail.date)}</Text>
              </View>
            </View>
            <View style={styles.dateTimeRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Time</Text>
                <Text style={styles.dateTimeValue}>{formatTimeWithAMPM(detail.time)}</Text>
              </View>
            </View>
          </View>

          {/* Secondary Details */}
          <View style={styles.secondaryDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={theme.colors.text.secondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Mode</Text>
                <Text style={styles.detailValue}>{detail.mode || (isYoga ? 'In-person' : 'Video')}</Text>
              </View>
            </View>
            <View style={[styles.detailItem, styles.detailItemRight]}>
              <Ionicons name="pricetag-outline" size={16} color={theme.colors.text.secondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Fee</Text>
                <Text style={styles.detailValue}>₹{detail.amount || 0}</Text>
              </View>
            </View>
          </View>

          {/* Payment & Booking Status */}
          <View style={styles.statusSection}>
            <View style={styles.statusRow}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Payment</Text>
                <View style={styles.paymentBadge}>
                  <Ionicons 
                    name={detail.paymentStatus === 'COMPLETED' ? 'checkmark-circle' : 'time'} 
                    size={12} 
                    color={detail.paymentStatus === 'COMPLETED' ? '#059669' : '#D97706'}
                  />
                  <Text style={[styles.paymentBadgeText, {
                    color: detail.paymentStatus === 'COMPLETED' ? '#059669' : '#D97706'
                  }]}>
                    {detail.paymentStatus || 'PENDING'}
                  </Text>
                </View>
              </View>
              <View style={[styles.statusItem, styles.statusItemRight]}>
                <Text style={styles.statusLabel}>Booking ID</Text>
                <Text style={styles.bookingId}>#{detail.id}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Modern Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          
          {/* Message Action */}
          <TouchableOpacity 
            style={[
              styles.actionRow, // 🆕 Remove colored borders to match ProfessionalHomeScreen
              { opacity: detail.status === 'CONFIRMED' ? 1 : 0.5 }
            ]} 
            onPress={handleChatPress}
            disabled={detail.status !== 'CONFIRMED'}
          >
            <View style={[styles.actionIcon, { backgroundColor: detail.status === 'CONFIRMED' ? theme.colors.primary + '15' : '#f5f5f5' }]}>
              <Ionicons name="chatbubbles" size={20} color={detail.status === 'CONFIRMED' ? theme.colors.primary : '#999'} />
            </View>
            <View style={styles.actionContent}>
              <Text style={[styles.actionTitle, { color: detail.status === 'CONFIRMED' ? theme.colors.text.primary : '#999' }]}>
                Message {isYoga ? 'Instructor' : 'Doctor'}
              </Text>
              <Text style={styles.actionSubtitle}>Start conversation</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={detail.status === 'CONFIRMED' ? '#ccc' : '#e0e0e0'} />
          </TouchableOpacity>

          {/* Cancel Action */}
          {(detail.status === 'CONFIRMED' || detail.status === 'PENDING') && (
            <TouchableOpacity 
              style={[
                styles.actionRow, // 🆕 Remove colored borders to match ProfessionalHomeScreen
                styles.cancelAction
              ]} 
              onPress={handleCancelPress} 
              disabled={cancelling}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.feedback.error + '15' }]}>
                {cancelling ? <ActivityIndicator size="small" color={theme.colors.feedback.error} /> : <Ionicons name="close-circle" size={20} color={theme.colors.feedback.error} />}
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Cancel {isYoga ? 'Class' : 'Booking'}</Text>
                <Text style={styles.actionSubtitle}>Remove appointment</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Prescription Action */}
          {(detail.status === 'COMPLETED' || detail.status === 'CONFIRMED') && (
            <TouchableOpacity 
              style={styles.actionRow} // 🆕 Remove colored borders to match ProfessionalHomeScreen
              onPress={handlePrescriptionPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="medical" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>View Prescription</Text>
                <Text style={styles.actionSubtitle}>Medical prescription details</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          )}

          {/* Diet Plan Action */}
          {(detail.status === 'COMPLETED' || detail.status === 'CONFIRMED') && (
            <TouchableOpacity 
              style={styles.actionRow} // 🆕 Remove colored borders to match ProfessionalHomeScreen
              onPress={handleDietPlanPress}
            >
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.secondary + '15' }]}>
                <Ionicons name="nutrition" size={20} color={theme.colors.secondary} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Diet Plan</Text>
                <Text style={styles.actionSubtitle}>Nutrition recommendations</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          )}

          {/* Book Again Action */}
          {detail.status === 'COMPLETED' && (
            <TouchableOpacity 
              style={[
                styles.actionRow, // 🆕 Remove colored borders to match ProfessionalHomeScreen
                styles.bookAgainAction
              ]} 
              onPress={() => {
                Alert.alert("Coming Soon", "Rebooking will be available soon!");
              }}>
              <View style={[styles.actionIcon, { backgroundColor: theme.colors.feedback.success + '15' }]}>
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.feedback.success} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Book Again</Text>
                <Text style={styles.actionSubtitle}>Schedule new appointment</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 🎨 MODERN APPOINTMENT DETAIL SCREEN STYLES
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED' 
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  placeholderButton: {
    width: 44,
  },

  // Header matching ProfessionalHomeHeader
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
  headerCalendarButton: {
    width: 40,
    height: 40,
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
    fontSize: 20, 
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },

  // Modern Card Design
  modernCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.l,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success, // 🆕 Green border to match ProfessionalStatsContainer
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // 🆕 Card Type Styles - Different Border Colors (thinner borders, matching appointment cards)
  consultationCard: {
    borderColor: '#10B981', // Green for consultation
    borderLeftWidth: 2, // 🆕 Reduced from 4px to 2px
  },
  yogaCard: {
    borderColor: '#8B5CF6', // Purple for yoga
    borderLeftWidth: 2, // 🆕 Reduced from 4px to 2px
  },
  modernHeader: {
    padding: theme.spacing.m,
    paddingBottom: 0,
  },
  statusChipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.l,
    gap: 4,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Professional Section
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: theme.spacing.m,
    paddingBottom: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  professionalAvatarContainer: {
    marginRight: theme.spacing.m,
  },
  professionalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  professionalSpeciality: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  professionalCredentials: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  credentialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 130, 114, 0.05)',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
    gap: 4,
  },
  credentialText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },

  // Prominent Date & Time Section
  dateTimeSection: {
    padding: theme.spacing.m,
    backgroundColor: 'rgba(0, 130, 114, 0.02)',
    margin: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  dateTimeContent: {
    marginLeft: theme.spacing.m,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Secondary Details
  secondaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingLeft: theme.spacing.xl,
  },
  detailContent: {
    marginLeft: theme.spacing.s,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },

  // Status Section
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  statusItem: {
    flex: 1,
  },
  statusItemRight: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: theme.spacing.xl,
  },
  statusLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
    gap: 4,
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingId: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Modern Actions Section
  actionsSection: {
    marginTop: theme.spacing.l,
  },
  
  // 🆕 Individual Action Row Border Styles - Different Border Colors
  consultationActionRow: {
    borderColor: '#10B981', // Green for consultation
    borderLeftWidth: 2,
    borderWidth: 1,
  },
  yogaActionRow: {
    borderColor: '#8B5CF6', // Purple for yoga
    borderLeftWidth: 2,
    borderWidth: 1,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success, // 🆕 Green border to match ProfessionalStatsContainer
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  cancelAction: {
    borderColor: theme.colors.feedback.error + '30',
  },
  bookAgainAction: {
    borderColor: theme.colors.feedback.success + '30',
  },
});

export default AppointmentDetailScreen;
