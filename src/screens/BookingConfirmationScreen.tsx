import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Linking,
  Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppSelector } from '../store';
import Config from 'react-native-config';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { usePayment } from '../hooks/usePayment';
import { bookingService } from '../services';

// Define the structure of data received via route.params
interface BookingData {
  // Professional info
  professionalId: string;
  professionalName: string;
  
  // Booking details
  slot_id?: string;
  date?: string;
  time?: string;
  startDate?: string;
  startTime?: string;
  endTime?: string;
  days?: string;
  duration: number | string;
  price: number;
  coupon_code?: string;
  
  // Service/Plan info
  serviceName?: string;
  serviceId?: string;
  serviceType?: 'yoga_class' | 'consultation' | 'membership';
  yogaPlanId?: number;
  planTitle?: string;
  
  // Session details
  sessionMode?: string;
  sessionModeLabel?: string;
  location?: string;
  languages?: string;
  maxParticipants?: number;
  
  // Service details (nested object)
  serviceDetails?: {
    id: string;
    name: string;
    duration: number;
    price: number;
    serviceType?: string;
  };
  
  // Additional identifiers (commented out as they're likely duplicates)
  // id: string;
  // name: string;
  // duration: number;
  // price: number;
}

type BookingConfirmationRouteProp = RouteProp<{
  BookingConfirmation: {
    bookingData: BookingData;
  };
}, 'BookingConfirmation'>;

type NavigationProp = {
  navigate: (screen: string, params?: any) => void;
  goBack: () => void;
  dispatch: (action: any) => void;
};

// Define the expected structure of the API response
interface CreateBookingSuccessResponse {
  msg: string;
  data: {
    booking_id: number;
    user_id: number;
    professional_id: number;
    coupon_code: string | null;
    date: string;
    time: string;
    mode: 'online' | 'offline';
    duration: number;
    payment_id: string;
    final_amount: number;
    original_amount: number;
    discount_amount: number;
  };
  payment_url: string;
}

const BookingConfirmationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BookingConfirmationRouteProp>();
  const { bookingData } = route.params;

  // Debug: Log received booking data
  console.log('📦 BookingConfirmationScreen received bookingData:', bookingData);

  // Get auth state from Redux
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppSelector((state: any) => state.auth);
  const userId = user?.user_id || user?._id;
  
  // Debug: Log user info
  console.log('👤 User info:', { userId, isAuthenticated, user: { email: user?.email, phone: user?.phone } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { checkPaymentStatus, initiatePayment, isProcessing: isPaymentProcessing, paymentStatus, paymentError, resetPaymentState } = usePayment();
  const [couponCode, setCouponCode] = useState(bookingData?.coupon_code || '');
  const [isCouponApplied, setIsCouponApplied] = useState(!!bookingData?.coupon_code);
  const [priceDetails, setPriceDetails] = useState({
    original_amount: bookingData?.price || 0,
    discount_amount: 0,
    final_amount: bookingData?.price || 0
  });

  // Format price with currency
  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim();
    if (!code) return;

    try {
      setIsLoading(true);

      // Determine slot and duration for price calculation
      const rawSlotId = (bookingData as any).slotId ?? bookingData.slot_id;
      const numericSlotId = Number(rawSlotId);

      if (!Number.isFinite(numericSlotId) || numericSlotId <= 0) {
        Alert.alert(
          'Error',
          'Unable to apply coupon because the booking slot could not be determined. Please go back and re-select your time slot.',
        );
        return;
      }

      const duration =
        typeof bookingData.duration === 'string'
          ? parseInt(bookingData.duration, 10)
          : bookingData.duration || 60;

      const result = await bookingService.calculatePrice({
        slotId: numericSlotId,
        duration,
        couponCode: code,
        userId,
      });

      if (!result.success || !result.data) {
        Alert.alert('Error', result.error || 'Invalid or expired coupon code');
        return;
      }

      setPriceDetails({
        original_amount: result.data.original_amount,
        discount_amount: result.data.discount_amount,
        final_amount: result.data.final_amount,
      });

      setIsCouponApplied(true);
    } catch (error) {
      console.error('Error applying coupon:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Invalid or expired coupon code',
      );
    } finally {
      setIsLoading(false);
    }
  }, [couponCode, bookingData]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponCode('');
    setIsCouponApplied(false);
    setPriceDetails(prev => ({
      ...prev,
      discount_amount: 0,
      final_amount: prev.original_amount
    }));
  }, []);

  // Handle authentication and navigation
  useEffect(() => {
    if (isAuthLoading) {
      // Still loading auth state
      return;
    }

    if (!isAuthenticated || !userId) {
      console.log('User not authenticated, redirecting to login...');
      setError('Please sign in to continue with booking');
      
      const timer = setTimeout(() => {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { 
                name: 'Auth',
                params: { 
                  screen: 'Login',
                  params: { 
                    redirect: 'BookingConfirmation',
                    params: { bookingData }
                  }
                } 
              }
            ]
          })
        );
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // User is authenticated
      setError('');
      console.log('User is authenticated, proceeding with booking confirmation');
    }
  }, [isAuthenticated, isAuthLoading, userId, navigation, bookingData]);

  // Show loading state while checking auth
  if (isAuthLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated || !userId) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Handle deep linking for payment callback
  useFocusEffect(
    useCallback(() => {
      const handleDeepLink = async (event: { url: string }) => {
        const url = event.url;
        if (url.includes('payment-status')) {
          const params = new URLSearchParams(url.split('?')[1]);
          const status = params.get('status');
          const bookingId = params.get('bookingId');
          const paymentId = params.get('paymentId');
          
          if (status === 'success' && bookingId && paymentId) {
            try {
              setIsLoading(true);
              // Verify payment status with the backend
              const paymentStatus = await checkPaymentStatus(paymentId);
              
              if (paymentStatus.success) {
                // Navigate to success screen with booking details
                navigation.navigate('BookingSuccess', {
                  bookingId: bookingId,
                  paymentId: paymentId || '',
                  amount: priceDetails.final_amount,
                  bookingDetails: {
                    professionalName: bookingData.professionalName,
                    serviceName: bookingData.serviceDetails?.name || 'Yoga Session'
                  }
                });
              } else {
                setError(paymentStatus.error || 'Payment verification failed. Please check your bookings.');
              }
            } catch (error) {
              console.error('Error verifying payment:', error);
              setError('Error verifying payment. Please check your bookings.');
            } finally {
              setIsLoading(false);
            }
          } else {
            setError('Payment failed or incomplete. Please try again.');
          }
        }
      };

      // Add event listener for deep links
      const subscription = Linking.addEventListener('url', handleDeepLink as any);

      // Check if the app was opened from a deep link
      Linking.getInitialURL().then(url => {
        if (url) handleDeepLink({ url });
      });

      return () => {
        subscription.remove();
      };
    }, [navigation, bookingData, priceDetails, checkPaymentStatus])
  );

  // Handle payment errors
  useEffect(() => {
    if (paymentError) {
      Alert.alert('Payment Error', paymentError);
      resetPaymentState();
    }
  }, [paymentError, resetPaymentState]);

  // Handle booking confirmation
  const handleConfirmBooking = useCallback(async () => {
    console.log('🚀 BookingConfirmationScreen: Confirm booking button pressed');
    
    if (!userId) {
      console.log('❌ No userId found');
      setError('Please sign in to continue with booking');
      return;
    }

    console.log('✅ User authenticated, proceeding with booking');
    setIsLoading(true);
    setError('');

    try {
      // Log the booking data for debugging
      console.log('📋 Booking data:', {
        bookingData,
        priceDetails,
        userId
      });

      // Validate required fields
      if (!bookingData.professionalId) {
        throw new Error('Professional ID is required');
      }

      // Check if we have either a slot_id or a date (for both regular and yoga plan bookings)
      const hasSlotInfo = bookingData.slot_id || bookingData.date || bookingData.startDate;
      
      if (!hasSlotInfo) {
        console.log('Missing booking info:', {
          slot_id: bookingData.slot_id,
          startDate: bookingData.startDate,
          date: bookingData.date,
          yogaPlanId: bookingData.yogaPlanId,
          isYogaPlan: !!bookingData.yogaPlanId,
          allBookingData: bookingData
        });
        throw new Error('Booking information is incomplete. Please select a time slot or date.');
      }
      
      // Log the booking info that will be used
      console.log('Using booking info:', {
        slot_id: bookingData.slot_id,
        date: bookingData.date || bookingData.startDate,
        isYogaPlan: !!bookingData.yogaPlanId,
        yogaPlanId: bookingData.yogaPlanId
      });

      // Determine desired duration early
      const duration = typeof bookingData.duration === 'string' 
        ? parseInt(bookingData.duration, 10) 
        : bookingData.duration || 60;

      // CRITICAL: Slot resolution must be handled by backend, not frontend
      // Frontend guessing slots is a security/authenticity hazard
      // Require slot_id to be present and valid - fail if missing
      const rawSlotId = bookingData.slot_id;
      const numericSlotId = Number(rawSlotId);
      
      if (!rawSlotId || !Number.isFinite(numericSlotId) || numericSlotId <= 0) {
        const errorMsg = 'Slot ID is required for booking. Please go back and select a time slot.';
        console.error('❌ [BookingConfirmation] Slot resolution hazard prevented:', {
          slot_id: rawSlotId,
          numericSlotId,
          bookingData: {
            date: bookingData.date,
            startDate: bookingData.startDate,
            time: bookingData.time,
            startTime: bookingData.startTime,
          }
        });
        throw new Error(errorMsg);
      }
      
      const slotId = numericSlotId;
      console.log('✅ [BookingConfirmation] Using validated slot_id:', slotId);
      
      const serviceType = bookingData.serviceType || 'yoga_class';
      const serviceId = bookingData.serviceId || 
                       bookingData.yogaPlanId?.toString() || 
                       `service_${Date.now()}`;

      console.log('Payment parameters:', {
        serviceType,
        serviceId,
        slotId,
        duration,
        professionalId: bookingData.professionalId,
        amount: priceDetails.final_amount
      });

      // Combine booking and payment into a single API call
      const paymentResponse = await initiatePayment({
        bookingId: `booking_${Date.now()}`,
        amount: priceDetails.final_amount,
        professionalId: bookingData.professionalId,
        slotId,
        duration,
        serviceType,
        serviceId,
        couponCode: isCouponApplied ? couponCode : undefined,
        metadata: {
          professionalName: bookingData.professionalName,
          serviceName: bookingData.serviceDetails?.name || bookingData.planTitle || 'Yoga Session',
          date: bookingData.date || bookingData.startDate || new Date().toISOString().split('T')[0],
          time: bookingData.time || bookingData.startTime || new Date().toLocaleTimeString(),
          mode: bookingData.sessionMode || 'online',
          userId: String(userId),
          isYogaPlan: !!bookingData.yogaPlanId || serviceType === 'yoga_class',
          yogaPlanId: bookingData.yogaPlanId
        }
      });

      // If we have a payment URL, open it in the WebView
      if (paymentResponse?.paymentUrl) {
        console.log('💳 Payment URL received, navigating to PaymentGateway:', paymentResponse.paymentUrl);
        console.log('📦 Payment data:', {
          bookingId: paymentResponse.data?.booking_id,
          paymentId: paymentResponse.data?.payment_id,
          amount: paymentResponse.data?.final_amount,
          customerId: userId,
          customerEmail: user?.email,
          customerPhone: user?.phone,
        });
        
        navigation.navigate('PaymentGateway', {
          paymentUrl: paymentResponse.paymentUrl,
          bookingId: paymentResponse.data?.booking_id?.toString() || '',
          paymentId: paymentResponse.data?.payment_id || '',
          amount: paymentResponse.data?.final_amount || bookingData.price,
          customerId: userId?.toString() || '',
          customerEmail: user?.email || '',
          customerPhone: user?.phone || '',
          merchantId: Config.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT' // Fallback to test ID if not set
        });
        
        console.log('✅ Navigation to PaymentGateway called');
      } else {
        console.log('❌ No payment URL received from API');
        throw new Error('No payment URL received');
      }
    } catch (err) {
      console.error('Booking/Payment failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [userId, bookingData, priceDetails, initiatePayment, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.content}>
            <Text style={styles.title}>Confirm Your Booking</Text>
            
            {/* Professional Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Professional</Text>
              <Text style={styles.text}>{bookingData?.professionalName}</Text>
            </View>

            {/* Service Details */}
            {bookingData?.serviceDetails && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service</Text>
                <Text style={styles.text}>{bookingData.serviceDetails.name}</Text>
                <Text style={styles.text}>
                  Duration: {bookingData.serviceDetails.duration} minutes
                </Text>
              </View>
            )}

            {/* Session Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Details</Text>
              {bookingData?.startDate && (
                <Text style={styles.text}>
                  Date: {new Date(bookingData.startDate).toLocaleDateString()}
                </Text>
              )}
              {bookingData?.startTime && (
                <Text style={styles.text}>
                  Time: {bookingData.startTime}
                  {bookingData?.endTime ? ` - ${bookingData.endTime}` : ''}
                </Text>
              )}
              {bookingData?.location && (
                <Text style={styles.text}>Location: {bookingData.location}</Text>
              )}
              {bookingData?.sessionModeLabel && (
                <Text style={styles.text}>Session Type: {bookingData.sessionModeLabel}</Text>
              )}
            </View>

            {/* Coupon Code */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Apply Coupon</Text>
              <View style={styles.couponContainer}>
                <TextInput
                  style={[styles.input, isCouponApplied && styles.inputDisabled]}
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  editable={!isCouponApplied}
                  placeholderTextColor="#999"
                />
                <TouchableOpacity 
                  style={[styles.button, styles.couponButton, isCouponApplied && styles.buttonDisabled]}
                  onPress={handleApplyCoupon}
                  disabled={isCouponApplied || !couponCode.trim()}
                >
                  <Text style={styles.buttonText}>
                    {isCouponApplied ? 'Applied' : 'Apply'}
                  </Text>
                </TouchableOpacity>
              </View>
              {isCouponApplied && (
                <TouchableOpacity 
                  style={styles.removeCouponButton}
                  onPress={handleRemoveCoupon}
                >
                  <Text style={styles.removeCouponText}>Remove coupon</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Price Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Summary</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Base Price:</Text>
                <Text style={styles.priceValue}>₹{priceDetails.original_amount.toFixed(2)}</Text>
              </View>
              {priceDetails.discount_amount > 0 && (
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Discount ({couponCode}):</Text>
                  <Text style={[styles.priceValue, styles.discountText]}>-₹{priceDetails.discount_amount.toFixed(2)}</Text>
                </View>
              )}
              <View style={[styles.priceRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{priceDetails.final_amount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => navigation.goBack()}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton, isLoading && styles.disabledButton]}
                onPress={handleConfirmBooking}
                disabled={isLoading}
              >
                {isLoading || isPaymentProcessing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    Confirm & Pay {formatPrice(priceDetails.final_amount)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  couponContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    fontSize: 16,
    color: '#333',
  },
  inputDisabled: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  couponButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: theme.colors.text.secondary,
  },
  removeCouponButton: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  removeCouponText: {
    color: theme.colors.primary,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.feedback.error,
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  content: {
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.primary,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: '#666',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  discountText: {
    color: '#4CAF50',
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: theme.colors.background.white,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 8,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 48,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  confirmButton: {
    flex: 2,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cancelButtonText: {
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: theme.colors.background.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginRight: 40, // To center the title (back button is 40px wide)
  },
  bookingCard: {
    backgroundColor: theme.colors.background.white,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  couponText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.feedback.error,
  },
  confirmButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  confirmButtonSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  priceCard: {
    backgroundColor: theme.colors.background.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userCard: {
    backgroundColor: theme.colors.background.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});
export default BookingConfirmationScreen;
