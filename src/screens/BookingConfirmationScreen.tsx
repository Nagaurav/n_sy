import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { formatDisplayDate, formatDisplayTime, formatSlotTimeRange, formatShortDate } from '../utils/dateUtils';
import { theme } from '../theme';
import { apiService } from '../services';

type RouteParams = {
  bookingData: {
    serviceType: 'consultation' | 'yoga_class';
    professionalId: string | number;
    professionalName: string;
    professionalSpecialization?: string;
    serviceName: string;
    price: number;
    basePrice?: number;
    discount?: number;
    platformFee?: number;
    date?: string;
    time?: string;
    startTime?: string;
    endTime?: string;
    duration?: number;
    deliveryMode?: string;
    yogaPlanId?: string | number;
    slotId?: string | number;
    cancellationPolicy?: string;
  };
};

const { width, height } = Dimensions.get('window');

const BookingConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const appTheme = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper component for consistent detail rows
  const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon as any} size={20} color={appTheme.theme.colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  // Helper functions for labels
  const getDeliveryModeLabel = (mode: string) => {
    const modeMap: Record<string, string> = {
      'online': 'Online Video Call',
      'offline': 'In-Person Visit',
      'group_online': 'Group Online Class',
      'group_offline': 'Group In-Person Class',
      'one_to_one': '1-on-1 Session',
      'home_visit': 'Home Visit',
      'GROUP_ONLINE': 'Group Online Class',
      'GROUP_OFFLINE': 'Group In-Person Class',
      'ONE_TO_ONE_ONLINE': '1-on-1 Online Session',
      'ONE_TO_ONE_OFFLINE': '1-on-1 In-Person Session',
      'HOME_VISIT': 'Home Visit'
    };
    return modeMap[mode] || mode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getDurationLabel = (duration: number, isYoga: boolean) => {
    if (isYoga) {
      if (duration >= 60) {
        const months = Math.floor(duration / 60);
        return `${months} Month${months > 1 ? 's' : ''}`;
      }
      return `${duration} Days`;
    }
    return `${duration} Minutes`;
  };

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const { bookingData } = route.params as RouteParams;
  const isYoga = bookingData?.serviceType === 'yoga_class';

  // Start animations when component mounts
  React.useEffect(() => {
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
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleConfirmBooking = async () => {
    if (!user?.user_id && !user?.id && !user?._id) {
      Alert.alert('Error', 'Please login to continue with booking.');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Normalize delivery mode for backend (convert to uppercase)
      const normalizedDeliveryMode = bookingData.deliveryMode?.toUpperCase();

      const response = await apiService.createBookingAndInitiatePayment({
        userId: user?.user_id || user?.id || user?._id || 0,
        professionalId: bookingData.professionalId,
        serviceType: bookingData.serviceType,
        amount: bookingData.price,
        duration: bookingData.duration || 30,
        couponCode: undefined,
        slotId: bookingData.slotId ? Number(bookingData.slotId) : undefined,
        yogaPlanId: bookingData.yogaPlanId ? Number(bookingData.yogaPlanId) : undefined,
        deliveryMode: normalizedDeliveryMode
      });

      console.log('📡 [BookingConfirmation] Raw API Response:', response);
      console.log('📡 [BookingConfirmation] Response success:', response.success);
      console.log('📡 [BookingConfirmation] Response data exists:', !!response.data);

      if (response.success && response.data) {
        const resp = response.data;
        
        // Enhanced booking ID extraction
        const finalBookingId = resp.booking_id || resp.data?.booking_id || resp.id || resp.data?.id;
        
        // Enhanced transaction ID extraction - look into nested payment objects for Yoga
        const finalTransactionId = 
          resp.transaction_id || 
          resp.data?.transaction_id || 
          resp.payment_id || 
          resp.data?.payment_id ||
          resp.payment?.transaction_id || // Yoga nested payment object
          resp.data?.payment?.transaction_id || // Double nested for Yoga
          resp.payment?.payment_id || // Alternative payment ID field
          resp.data?.payment?.payment_id; // Double nested alternative

        console.log('✅ [BookingConfirmation] Extracted IDs:', { 
            bookingId: finalBookingId, 
            transactionId: finalTransactionId,
            // Debug: Show the structure we're working with
            hasRespData: !!resp,
            hasRespDataData: !!resp.data,
            hasRespPayment: !!resp.payment,
            hasRespDataPayment: !!resp.data?.payment
        });

        (navigation as any).navigate('PaymentGateway', {
            paymentUrl: resp.payment_url || resp.data?.payment_url,
            redirectUrl: "https://samyayog.com/payment-status", 
            bookingId: finalBookingId,
            transactionId: finalTransactionId, // This should now be properly extracted
            bookingType: bookingData.serviceType
        });
      } else {
        console.log('❌ [BookingConfirmation] Booking failed:', response);
        Alert.alert("Booking Failed", response.error || "Could not initiate payment.");
      }
    } catch (error) {
      console.error('🔥 [BookingConfirmation] Booking error:', error);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookingData) return null;

  const color = isYoga ? '#4CAF50' : '#008272';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header - Matching ProfessionalHomeHeader */}
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
              Confirm Booking
            </Text>
            <Text style={styles.headerSubtitle}>
              Review your booking details
            </Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Modern Consultation Card - Matching Payment Summary Style */}
        <Animated.View style={[
          styles.card,
          styles.consultationCard,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }
        ]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerIconContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {bookingData.professionalName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardHeaderTitle}>Consultation Details</Text>
              <Text style={styles.cardHeaderSubtitle}>{bookingData.professionalName}</Text>
            </View>
            <View style={[styles.serviceTypeBadge, { backgroundColor: '#008272' }]}>
              <Text style={styles.serviceTypeText}>
                {isYoga ? 'YOGA' : 'CONSULT'}
              </Text>
            </View>
          </View>
          
          {/* Consultation Details */}
          <View style={styles.consultationDetailsContainer}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Service</Text>
              <Text style={styles.detailValue}>{bookingData.serviceName}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Professional</Text>
              <Text style={styles.detailValue}>{bookingData.professionalName}</Text>
            </View>
            
            {bookingData.professionalSpecialization && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Specialization</Text>
                <Text style={styles.detailValue}>{bookingData.professionalSpecialization}</Text>
              </View>
            )}
            
            {bookingData.date && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{formatDisplayDate(bookingData.date)}</Text>
              </View>
            )}
            
            {(bookingData.startTime || bookingData.time) && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {bookingData.startTime && bookingData.endTime 
                    ? formatSlotTimeRange(bookingData.startTime, bookingData.endTime)
                    : bookingData.time 
                    ? formatDisplayTime(bookingData.time)
                    : 'To be scheduled'
                  }
                </Text>
              </View>
            )}
            
            {bookingData.deliveryMode && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Mode</Text>
                <Text style={styles.detailValue}>
                  {bookingData.deliveryMode.includes('ONLINE') ? 'Online Session' : 
                  bookingData.deliveryMode.includes('OFFLINE') ? 'In-Person Visit' : 
                  bookingData.deliveryMode.includes('GROUP') ? 'Group Session' : 
                  getDeliveryModeLabel(bookingData.deliveryMode)}
                </Text>
              </View>
            )}
            
            {bookingData.duration && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Duration</Text>
                <Text style={styles.detailValue}>{getDurationLabel(bookingData.duration, isYoga)}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Modern Payment Summary Card - Matching ModernAppointmentCard */}
        <Animated.View style={[
          styles.card,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }
        ]}>
          {/* Payment Header */}
          <View style={styles.paymentHeader}>
            <View style={styles.paymentIconContainer}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#4CAF50" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Payment Summary</Text>
              <Text style={styles.paymentSubtitle}>Secure transaction</Text>
            </View>
            <View style={[styles.secureBadge, { backgroundColor: '#4CAF5020' }]}>
              <Text style={[styles.secureBadgeText, { color: '#4CAF50' }]}>SECURE</Text>
            </View>
          </View>
          
          {/* Price Breakdown */}
          <View style={styles.priceBreakdownContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Base Amount</Text>
              <Text style={styles.priceValue}>₹{bookingData.basePrice || bookingData.price.toLocaleString()}</Text>
            </View>
            
            {bookingData.discount && bookingData.discount > 0 && (
              <View style={styles.priceItem}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: '#4CAF50' }]}>
                  -₹{bookingData.discount.toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>₹{bookingData.platformFee || 0}</Text>
            </View>
            
            <View style={[styles.priceItem, styles.totalItem]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{bookingData.price.toLocaleString()}</Text>
            </View>
          </View>
        </Animated.View>

      </ScrollView>

      {/* Modern Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabelFooter}>
              Total Amount
            </Text>
            <Text style={styles.totalAmount}>
              ₹ {bookingData.price.toLocaleString()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.confirmButton, 
              { 
                backgroundColor: isProcessing ? theme.colors.text.secondary : '#008272',
                opacity: isProcessing ? 0.7 : 1
              }
            ]} 
            onPress={handleConfirmBooking}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.background.white} size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-closed" size={18} color={theme.colors.background.white} />
                <Text style={styles.confirmButtonText}>
                  Pay ₹ {bookingData.price.toLocaleString()}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED'
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 120, // Extra padding for footer
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
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
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },

  // Modern Card Styles matching ProfessionalHomeScreen Stats Card
  card: { 
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    position: 'relative',
  },
  
  // Card Type Styles - Different Border Colors
  consultationCard: {
    borderColor: '#10B981', // Green for consultation
    borderLeftWidth: 2,
  },
  yogaCard: {
    borderColor: '#8B5CF6', // Purple for yoga
    borderLeftWidth: 2,
  },
  // Modern Consultation Card Styles - Matching Payment Summary
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  headerInfo: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  consultationDetailsContainer: {
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  detailsGrid: {
    gap: theme.spacing.m,
  },
  detailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  detailIcon: {
    marginRight: theme.spacing.m,
  },
  detailContent: {
    flex: 1,
  },
  serviceHighlight: {
    backgroundColor: '#F0FDF4',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginTop: theme.spacing.s,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#065F46',
    marginBottom: theme.spacing.xs,
  },
  serviceTag: {
    backgroundColor: '#10B981',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.xs,
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F3F4F6',
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
    color: '#1F2937',
    marginBottom: 4,
  },
  speciality: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  
  // Payment Summary Styles
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  paymentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  secureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  priceBreakdownContainer: {
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  totalItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: theme.spacing.s,
    marginTop: theme.spacing.xs,
  },
  serviceTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  serviceTypeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Section Title
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700',
    marginBottom: theme.spacing.m,
    color: theme.colors.text.primary
  },

  
  // Price Styles
  priceLabel: { 
    fontSize: 14, 
    fontWeight: '500',
    color: '#6B7280'
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: '700',
    color: '#1F2937'
  },
  priceValue: { 
    fontSize: 14, 
    fontWeight: '600',
    color: '#1F2937'
  },
  totalValue: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#008272'
  },

  // Redesigned Details Styles
  detailsContainer: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },

  // Footer
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.m,
  },
  totalContainer: {
    flex: 1,
  },
  totalLabelFooter: {
    fontSize: 12,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.secondary
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#008272'
  },
  confirmButton: { 
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: '#008272',
    alignItems: 'center',
    minWidth: 180,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  confirmButtonText: { 
    color: theme.colors.background.white, 
    fontSize: 16, 
    fontWeight: 'bold'
  },
  
  // Status Indicator Styles
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.s,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});

export default BookingConfirmationScreen;
