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

  const color = isYoga ? '#4CAF50' : appTheme.theme.colors.primary;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Gradient Header - Matching Other Screens */}
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
            <Ionicons name="arrow-back" size={24} color={appTheme.theme.colors.background.white} />
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
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Comprehensive Booking Summary Card */}
        <Animated.View style={[
          styles.card,
          appTheme.theme.shadows.card,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            borderLeftColor: color, 
            borderLeftWidth: 5 
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{bookingData.serviceName}</Text>
              <Text style={styles.sub}>
                {bookingData.professionalName}
                {bookingData.professionalSpecialization && ` • ${bookingData.professionalSpecialization}`}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
              <Ionicons name={isYoga ? 'fitness' : 'medkit'} size={14} color={color} />
              <Text style={[styles.typeText, { color }]}>{isYoga ? 'Yoga' : 'Consult'}</Text>
            </View>
          </View>
          
          {/* Appointment Details */}
          <View style={styles.detailsContainer}>
            <Text style={styles.sectionTitle}>Appointment Details</Text>
            
            <DetailRow 
              label="Service" 
              value={bookingData.serviceName} 
              icon="medkit" 
            />
            
            <DetailRow 
              label="Provider" 
              value={bookingData.professionalName} 
              icon="person" 
            />
            
            {bookingData.date && (
              <DetailRow 
                label="Date" 
                value={formatDisplayDate(bookingData.date)} 
                icon="calendar" 
              />
            )}
            
            {(bookingData.startTime || bookingData.time) && (
              <DetailRow 
                label="Time" 
                value={
                  bookingData.startTime && bookingData.endTime 
                    ? formatSlotTimeRange(bookingData.startTime, bookingData.endTime)
                    : bookingData.time 
                    ? formatDisplayTime(bookingData.time)
                    : 'To be scheduled'
                } 
                icon="time-outline" 
              />
            )}
            
            {bookingData.deliveryMode && (
              <DetailRow 
                label="Mode" 
                value={getDeliveryModeLabel(bookingData.deliveryMode)} 
                icon="videocam" 
              />
            )}
            
            {bookingData.duration && (
              <DetailRow 
                label="Duration" 
                value={getDurationLabel(bookingData.duration, isYoga)} 
                icon="hourglass-outline" 
              />
            )}
          </View>
        </Animated.View>

        {/* Comprehensive Price Breakdown Card */}
        <Animated.View style={[
          styles.card,
          appTheme.theme.shadows.card,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            borderLeftColor: appTheme.theme.colors.primary, 
            borderLeftWidth: 5 
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Payment Summary</Text>
              <Text style={styles.sub}>Secure transaction</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: appTheme.theme.colors.feedback.success + '20' }]}>
              <Ionicons name="shield-checkmark-outline" size={14} color={appTheme.theme.colors.feedback.success} />
              <Text style={[styles.typeText, { color: appTheme.theme.colors.feedback.success }]}>SECURE</Text>
            </View>
          </View>
          
          {/* Price Breakdown */}
          <View style={styles.priceBreakdown}>
            <Text style={styles.sectionTitle}>Payment Details</Text>
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base Amount</Text>
              <Text style={styles.priceValue}>₹{bookingData.basePrice || bookingData.price.toLocaleString()}</Text>
            </View>
            
            {bookingData.discount && bookingData.discount > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Discount</Text>
                <Text style={[styles.priceValue, { color: appTheme.theme.colors.feedback.success }]}>
                  -₹{bookingData.discount.toLocaleString()}
                </Text>
              </View>
            )}
            
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform Fee</Text>
              <Text style={styles.priceValue}>₹{bookingData.platformFee || 0}</Text>
            </View>
            
            <View style={[styles.priceRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>₹{bookingData.price.toLocaleString()}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Cancellation Policy Card */}
        <Animated.View style={[
          styles.card,
          appTheme.theme.shadows.card,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
            borderLeftColor: appTheme.theme.colors.secondary, 
            borderLeftWidth: 5 
          }
        ]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Cancellation Policy</Text>
              <Text style={styles.sub}>Important information</Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: appTheme.theme.colors.secondary + '20' }]}>
              <Ionicons name="information-circle" size={14} color={appTheme.theme.colors.secondary} />
              <Text style={[styles.typeText, { color: appTheme.theme.colors.secondary }]}>INFO</Text>
            </View>
          </View>
          
          <View style={styles.policyContent}>
            <Text style={styles.policyText}>
              {bookingData.cancellationPolicy || 
               (isYoga 
                 ? "Cancellations are allowed up to 24 hours before the class start time for a full refund."
                 : "Cancellations are allowed up to 2 hours before the appointment for a full refund."
               )
              }
            </Text>
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
              appTheme.theme.shadows.float,
              { 
                backgroundColor: isProcessing ? appTheme.theme.colors.text.secondary : appTheme.theme.colors.primary,
                opacity: isProcessing ? 0.7 : 1
              }
            ]} 
            onPress={handleConfirmBooking}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator color={appTheme.theme.colors.background.white} size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="lock-closed" size={18} color={appTheme.theme.colors.background.white} />
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
    backgroundColor: theme.colors.background.primary 
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 120, // Extra padding for footer
  },
  header: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: theme.spacing.l,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
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
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.background.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: theme.colors.background.white,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
  topCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
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

  // Card Styles (matching AppointmentsScreen)
  card: { 
    backgroundColor: theme.colors.background.surface, 
    marginBottom: theme.spacing.m, 
    borderRadius: theme.borderRadius.l, 
    padding: theme.spacing.m, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  title: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: theme.colors.text.primary 
  },
  sub: { 
    fontSize: 14, 
    color: theme.colors.text.secondary 
  },
  typeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  typeText: { 
    fontSize: 10, 
    fontWeight: '700', 
    marginLeft: 4, 
    textTransform: 'uppercase' 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
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

  // Price Breakdown Styles
  priceBreakdown: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
    paddingTop: theme.spacing.s,
    marginTop: theme.spacing.xs,
  },
  priceLabel: { 
    fontSize: 14, 
    fontWeight: '500',
    color: theme.colors.text.secondary
  },
  totalLabel: { 
    fontSize: 16, 
    fontWeight: '700',
    color: theme.colors.text.primary
  },
  priceValue: { 
    fontSize: 14, 
    fontWeight: '600',
    color: theme.colors.text.primary
  },
  totalValue: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: theme.colors.primary
  },

  // Policy Styles
  policyContent: {
    marginTop: theme.spacing.m,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
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
  detailContent: {
    flex: 1,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.primary + '20',
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    letterSpacing: 0.5,
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
    fontSize: theme.typography.small.fontSize,
    marginBottom: theme.spacing.xs,
    color: theme.colors.text.secondary
  },
  totalAmount: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  confirmButton: { 
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    minWidth: 180,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  confirmButtonText: { 
    color: theme.colors.background.white, 
    fontSize: theme.typography.body.fontSize, 
    fontWeight: 'bold'
  }
});

export default BookingConfirmationScreen;
