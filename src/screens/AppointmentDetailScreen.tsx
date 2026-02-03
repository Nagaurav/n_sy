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
}

const AppointmentDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const appTheme = useTheme();

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
              professionalName: found.title, // e.g. "Morning Yoga"
              professionalSpeciality: 'Yoga Instructor',
              amount: found.amount,
              paymentStatus: found.payment_status,
              mode: found.subtitle // e.g. "Group Online"
            };
            console.log(`✅ [DetailScreen] Found yoga booking: ${found.title}`);
          } else if (apptType === 'consultation') {
            data = {
              id: found.reference_id,
              type: 'consultation',
              status: found.status,
              date: found.date,
              time: found.time,
              professionalName: found.title || 'Consultation',
              professionalSpeciality: found.subtitle || 'General Practitioner',
              amount: found.amount,
              paymentStatus: found.payment_status,
              mode: found.subtitle
            };
            console.log(`✅ [DetailScreen] Found consultation: ${data.professionalName}`);
          }
        } else {
          console.log(`❌ [DetailScreen] No ${apptType} found with ID: ${appointmentId}`);
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
      <StatusBar barStyle="light-content" backgroundColor={appTheme.theme.colors.primary} />
      <LinearGradient 
        colors={[appTheme.theme.colors.primary, appTheme.theme.colors.secondary]}
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              {isYoga ? 'Class Details' : 'Consultation'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isYoga ? 'View your yoga class information' : 'View your consultation details'}
            </Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={{ padding: 16 }} 
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchDetails(); }} />}
      >
        {/* Main Info Card */}
        <Animated.View style={[
          styles.card,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }], borderTopColor: color, borderTopWidth: 4 }
        ]}>
          <View style={styles.row}>
            <View style={[styles.avatar, { backgroundColor: color }]}>
              <Ionicons name={isYoga ? "fitness" : "medkit"} size={24} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{detail.professionalName}</Text>
              <Text style={styles.docSpec}>{detail.professionalSpeciality}</Text>

              <View style={[
                styles.badge,
                { backgroundColor: detail.status === 'CONFIRMED' ? '#E8F5E9' : '#FFF3E0' }
              ]}>
                <Text style={{ color: detail.status === 'CONFIRMED' ? '#2E7D32' : '#EF6C00', fontSize: 12, fontWeight: '700' }}>
                  {detail.status}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Date & Time Section */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Schedule</Text>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.infoText}>
                {detail.date ? new Date(detail.date).toDateString() : 'Date N/A'}
              </Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="time-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{detail.time}</Text>
            </View>
            {isYoga && detail.mode && (
              <View style={[styles.infoRow, { marginTop: 8 }]}>
                <Ionicons name="videocam-outline" size={18} color="#666" />
                <Text style={styles.infoText}>{(detail.mode).replace(/_/g, ' ')}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Payment Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Payment Details</Text>
            <View style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.paymentLabel}>Amount</Text>
                <Text style={styles.paymentAmount}>₹{detail.amount || 0}</Text>
              </View>
              <View style={[styles.paymentStatusBadge, {
                backgroundColor: detail.paymentStatus === 'COMPLETED' ? '#E8F5E9' : '#FFF3E0'
              }]}>
                <Text style={[styles.paymentStatusText, {
                  color: detail.paymentStatus === 'COMPLETED' ? '#2E7D32' : '#EF6C00'
                }]}>
                  {detail.paymentStatus || 'PENDING'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Booking Information */}
          <View style={styles.infoSection}>
            <Text style={styles.sectionLabel}>Booking Information</Text>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag-outline" size={18} color="#666" />
              <Text style={styles.infoText}>ID: {detail.id}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#666" />
              <Text style={styles.infoText}>Type: {isYoga ? 'Yoga Class' : 'Consultation'}</Text>
            </View>
          </View>
        </Animated.View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* Chat */}
        <TouchableOpacity 
          style={[
            styles.listButton, 
            { 
              borderColor: detail.status === 'CONFIRMED' ? color + '40' : '#e0e0e0',
              opacity: detail.status === 'CONFIRMED' ? 1 : 0.5
            }
          ]} 
          onPress={handleChatPress}
          disabled={detail.status !== 'CONFIRMED'}
        >
          <View style={[styles.iconBox, { backgroundColor: detail.status === 'CONFIRMED' ? color + '15' : '#f5f5f5' }]}>
            <Ionicons name="chatbubbles" size={22} color={detail.status === 'CONFIRMED' ? color : '#999'} />
          </View>
          <Text style={[
            styles.listText, 
            { color: detail.status === 'CONFIRMED' ? theme.colors.text.primary : '#999' }
          ]}>
            Message {isYoga ? 'Instructor' : 'Doctor'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={detail.status === 'CONFIRMED' ? '#ccc' : '#e0e0e0'} />
        </TouchableOpacity>

        {/* Add to Calendar */}
        <TouchableOpacity 
          style={[
            styles.listButton, 
            { 
              marginTop: 10,
              borderColor: detail.status === 'CONFIRMED' ? '#E3F2FD' : '#e0e0e0',
              opacity: detail.status === 'CONFIRMED' ? 1 : 0.5
            }
          ]} 
          onPress={() => {
            if (detail.status === 'CONFIRMED') {
              Alert.alert("Coming Soon", "Calendar integration will be available soon!");
            }
          }}
          disabled={detail.status !== 'CONFIRMED'}
        >
          <View style={[styles.iconBox, { backgroundColor: detail.status === 'CONFIRMED' ? '#E3F2FD' : '#f5f5f5' }]}>
            <Ionicons name="calendar-outline" size={22} color={detail.status === 'CONFIRMED' ? '#2196F3' : '#999'} />
          </View>
          <Text style={[
            styles.listText, 
            { color: detail.status === 'CONFIRMED' ? theme.colors.text.primary : '#999' }
          ]}>
            Add to Calendar
          </Text>
          <Ionicons name="chevron-forward" size={20} color={detail.status === 'CONFIRMED' ? '#ccc' : '#e0e0e0'} />
        </TouchableOpacity>

        {/* Cancel */}
        {(detail.status === 'CONFIRMED' || detail.status === 'PENDING') && (
          <TouchableOpacity
            style={[styles.listButton, { marginTop: 10, borderColor: '#FFEBEE' }]}
            onPress={handleCancelPress}
            disabled={cancelling}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FFEBEE' }]}>
              {cancelling ? <ActivityIndicator size="small" color="#D32F2F" /> : <Ionicons name="close-circle" size={22} color="#D32F2F" />}
            </View>
            <Text style={[styles.listText, { color: '#D32F2F' }]}>
              Cancel {isYoga ? 'Class' : 'Booking'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Book Again */}
        {detail.status === 'COMPLETED' && (
          <TouchableOpacity style={[styles.listButton, { marginTop: 10, borderColor: '#E8F5E9' }]} onPress={() => {
            Alert.alert("Coming Soon", "Rebooking will be available soon!");
          }}>
            <View style={[styles.iconBox, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="add-circle-outline" size={22} color="#4CAF50" />
            </View>
            <Text style={[styles.listText, { color: '#4CAF50' }]}>Book Again</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 🟢 UPDATED STYLES TO MATCH OTHER SCREENS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
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
  placeholderButton: {
    width: 40,
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

  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  docName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  docSpec: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6
  },

  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 15 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 10, color: theme.colors.text.primary, fontWeight: '500', fontSize: 15 },
  
  // Enhanced UI Styles
  infoSection: { marginBottom: 8 },
  sectionLabel: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme.colors.text.primary, 
    marginBottom: 12 
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  paymentStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary, marginBottom: 12 },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    padding: 12,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  listText: { flex: 1, fontSize: 15, fontWeight: '600', color: theme.colors.text.primary },
});

export default AppointmentDetailScreen;
