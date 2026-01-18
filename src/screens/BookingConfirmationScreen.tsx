import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAppSelector } from '../store';
import Config from 'react-native-config';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { usePayment } from '../hooks/usePayment';
import { bookingService } from '../services';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

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

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const loadingSpinAnim = useRef(new Animated.Value(0)).current;
  const cardScaleAnim = useRef(new Animated.Value(0.8)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const card1Opacity = useRef(new Animated.Value(0)).current;
  const card2Opacity = useRef(new Animated.Value(0)).current;
  const card3Opacity = useRef(new Animated.Value(0)).current;
  const card4Opacity = useRef(new Animated.Value(0)).current;
  const { width, height } = Dimensions.get('window');

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

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
      return `${hours}:${minutesStr} ${ampm}`;
    } catch (e) { 
      console.warn('Invalid time format:', dateString);
      return dateString; 
    }
  };

  // Animation functions
  const animateIn = useCallback(() => {
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    cardScaleAnim.setValue(0.8);
    headerAnim.setValue(-50);
    card1Opacity.setValue(0);
    card2Opacity.setValue(0);
    card3Opacity.setValue(0);
    card4Opacity.setValue(0);
    
    // Header animation
    Animated.timing(headerAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    // Main content animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Staggered card animations
    const cardAnimations = [
      { value: card1Opacity, delay: 200 },
      { value: card2Opacity, delay: 300 },
      { value: card3Opacity, delay: 400 },
      { value: card4Opacity, delay: 500 },
    ];
    
    cardAnimations.forEach(({ value, delay }) => {
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(value, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(cardScaleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });
    
    // Start pulse effect for primary button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Start shimmer effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, cardScaleAnim, shimmerAnim, pulseAnim, headerAnim, card1Opacity, card2Opacity, card3Opacity, card4Opacity]);

  const animateButtonPress = useCallback(() => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [buttonScaleAnim]);

  const animateCardHover = useCallback(() => {
    Animated.parallel([
      Animated.timing(cardScaleAnim, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardScaleAnim, pulseAnim]);

  // Loading spin animation
  useEffect(() => {
    if (isLoading || isPaymentProcessing) {
      Animated.loop(
        Animated.timing(loadingSpinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      loadingSpinAnim.setValue(0);
    }
  }, [isLoading, isPaymentProcessing, loadingSpinAnim]);

  // Trigger animation on mount
  useEffect(() => {
    setTimeout(() => animateIn(), 100);
  }, [animateIn]);

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

      // 1. Handle Duration (Don't panic on "ONE_MONTH")
      let safeDuration = 0;
      if (typeof bookingData.duration === 'number') {
          safeDuration = bookingData.duration;
      } else if (typeof bookingData.duration === 'string') {
          const parsed = parseInt(bookingData.duration, 10);
          safeDuration = isNaN(parsed) ? 0 : parsed; 
          // 0 is fine for classes, backend knows duration
      }

      // 2. Handle Slot ID (Don't force 0, just pass undefined)
      let slotIdToPass: number | undefined = undefined;
      const isClassBooking = bookingData.serviceType === 'yoga_class' || !!bookingData.yogaPlanId;

      if (!isClassBooking) {
         // Strict check ONLY for consultations
         const numericSlot = Number(bookingData.slot_id);
         if (!bookingData.slot_id || isNaN(numericSlot) || numericSlot <= 0) {
            throw new Error('Slot ID is required for consultation booking.');
         }
         slotIdToPass = numericSlot;
      }
      
      const serviceType = bookingData.serviceType || 'yoga_class';
      const serviceId = bookingData.serviceId || 
                       bookingData.yogaPlanId?.toString() || 
                       `service_${Date.now()}`;

      console.log('Payment parameters:', {
        serviceType,
        serviceId,
        slotId: slotIdToPass, // ✅ Will be 'undefined' for classes, which is correct
        duration: safeDuration,
        professionalId: bookingData.professionalId,
        amount: priceDetails.final_amount
      });

      // Combine booking and payment into a single API call
      const paymentResponse = await initiatePayment({
        bookingId: `booking_${Date.now()}`,
        amount: priceDetails.final_amount,
        professionalId: bookingData.professionalId,
        slotId: slotIdToPass, // ✅ Will be 'undefined' for classes, which is correct
        serviceType: isClassBooking ? 'yoga_class' : 'consultation',
        serviceId: bookingData.yogaPlanId?.toString(), // ✅ Passing Real Class ID
        duration: safeDuration,
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

      // If we have a payment URL, open it in WebView
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
          merchantId: Config.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT', // Fallback to test ID if not set
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Premium Header with Gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <Animated.View 
          style={[
            styles.headerContent,
            {
              transform: [{ translateY: headerAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={styles.headerIcon}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.background.surface} />
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <Animated.View 
                  style={[
                    styles.loadingIcon,
                    {
                      transform: [{ rotate: loadingSpinAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg']
                      })}]
                    }
                  ]}
                >
                  <Ionicons name="sync" size={32} color={theme.colors.primary} />
                </Animated.View>
                <Text style={styles.loadingText}>Processing your booking...</Text>
                <Text style={styles.loadingSubtext}>Please wait while we confirm your details</Text>
              </View>
              
              {/* Shimmer placeholders */}
              <View style={styles.shimmerContainer}>
                <View style={[styles.shimmerCard, styles.shimmerPlaceholder]} />
                <View style={[styles.shimmerCard, styles.shimmerPlaceholder]} />
                <View style={[styles.shimmerCard, styles.shimmerPlaceholder]} />
              </View>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <LinearGradient
                colors={['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.05)']}
                style={styles.errorGradient}
              >
                <Ionicons name="alert-circle" size={48} color={theme.colors.feedback.error} />
              </LinearGradient>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <>
              {/* Professional Info Card */}
              <Animated.View 
                style={[
                  styles.bookingCard,
                  {
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
                  style={styles.cardGradient}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.secondary]}
                        style={styles.iconGradient}
                      >
                        <Ionicons name="person-circle" size={24} color={theme.colors.background.surface} />
                      </LinearGradient>
                    </View>
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>Professional</Text>
                      <Text style={styles.cardValue}>{bookingData?.professionalName}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Service Details Card */}
              {(bookingData?.serviceDetails || bookingData?.planTitle) && (
                <Animated.View 
                  style={[
                    styles.bookingCard,
                    {
                      transform: [{ scale: cardScaleAnim }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
                    style={styles.cardGradient}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <View style={styles.iconContainer}>
                        <LinearGradient
                          colors={[theme.colors.primary, theme.colors.secondary]}
                          style={styles.iconGradient}
                        >
                          <Ionicons name="medical" size={24} color={theme.colors.background.surface} />
                        </LinearGradient>
                      </View>
                      <View style={styles.cardHeaderContent}>
                        <Text style={styles.cardTitle}>Service</Text>
                        <Text style={styles.cardValue}>
                          {bookingData.serviceDetails?.name || bookingData.planTitle || 'Yoga Session'}
                        </Text>
                        <Text style={styles.cardSubtext}>
                          Duration: {bookingData.duration || bookingData.serviceDetails?.duration || 'N/A'} minutes
                        </Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Session Details Card */}
              <Animated.View 
                style={[
                  styles.bookingCard,
                  {
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
                  style={styles.cardGradient}
                />
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                      <LinearGradient
                        colors={[theme.colors.primary, theme.colors.secondary]}
                        style={styles.iconGradient}
                      >
                        <Ionicons name="calendar" size={24} color={theme.colors.background.surface} />
                      </LinearGradient>
                    </View>
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>Session Details</Text>
                    </View>
                  </View>
                  <View style={styles.detailContent}>
                    {bookingData?.startDate && (
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={20} color="#666" />
                        <Text style={styles.detailLabel}>Date:</Text>
                        <Text style={styles.detailValue}>
                          {new Date(bookingData.startDate).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {bookingData?.startTime && (
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={20} color="#666" />
                        <Text style={styles.detailLabel}>Time:</Text>
                        <Text style={styles.detailValue}>
                          {formatTime(bookingData.startTime)}
                          {bookingData?.endTime ? ` - ${formatTime(bookingData.endTime)}` : ''}
                        </Text>
                      </View>
                    )}
                    {bookingData?.location && (
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={20} color="#666" />
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{bookingData.location}</Text>
                      </View>
                    )}
                    {bookingData?.sessionModeLabel && (
                      <View style={styles.detailRow}>
                        <Ionicons name="videocam-outline" size={20} color="#666" />
                        <Text style={styles.detailLabel}>Session Type:</Text>
                        <Text style={styles.detailValue}>{bookingData.sessionModeLabel}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Coupon Code Card */}
              <Animated.View 
                style={[
                  styles.bookingCard,
                  {
                    opacity: card4Opacity,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
                  style={styles.cardGradient}
                />
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="pricetag" size={24} color={theme.colors.background.surface} />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.cardTitle}>Apply Coupon</Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.couponContainer}>
                    <TextInput
                      style={[styles.couponInput, isCouponApplied && styles.couponInputDisabled]}
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChangeText={setCouponCode}
                      editable={!isCouponApplied}
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity 
                      style={[styles.applyButton, isCouponApplied && styles.buttonDisabled]}
                      onPress={handleApplyCoupon}
                      disabled={isCouponApplied || !couponCode.trim()}
                    >
                      <Text style={styles.applyButtonText}>
                        {isCouponApplied ? 'Applied' : 'Apply'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {isCouponApplied && (
                    <TouchableOpacity 
                      style={styles.removeCouponButton}
                      onPress={handleRemoveCoupon}
                    >
                      <Ionicons name="close-circle" size={16} color={theme.colors.feedback.error} />
                      <Text style={styles.removeCouponText}>Remove coupon</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>

              {/* Price Summary Card */}
              <Animated.View 
                style={[
                  styles.bookingCard,
                  {
                    opacity: card4Opacity,
                    transform: [{ scale: cardScaleAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
                  style={styles.cardGradient}
                />
                <View style={styles.cardHeader}>
                  <View style={styles.iconContainer}>
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.secondary]}
                      style={styles.iconGradient}
                    >
                      <Ionicons name="cash" size={24} color={theme.colors.background.surface} />
                    </LinearGradient>
                  </View>
                  <View style={styles.cardHeaderContent}>
                    <Text style={styles.cardTitle}>Price Summary</Text>
                  </View>
                </View>
                <View style={styles.cardContent}>
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
              </Animated.View>

              {/* Premium Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.secondaryButton]}
                  onPress={() => navigation.goBack()}
                  disabled={isLoading}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </TouchableOpacity>
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.secondary]}
                    style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                  >
                    <TouchableOpacity
                      style={styles.primaryButtonContent}
                      onPress={() => {
                        animateButtonPress();
                        handleConfirmBooking();
                      }}
                      disabled={isLoading}
                    >
                      {isLoading || isPaymentProcessing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" />
                          <Text style={styles.primaryButtonText}>
                            Confirm & Pay {formatPrice(priceDetails.final_amount)}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </Animated.View>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  // Header Styles
  gradientHeader: {
    paddingTop: 60,
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
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.background.surface,
    letterSpacing: 0.3,
    flex: 1,
    textAlign: 'center',
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },

  // Content
  content: {
    paddingBottom: 24,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  loadingIcon: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  shimmerContainer: {
    width: '100%',
    gap: 16,
  },
  shimmerCard: {
    height: 80,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.background.surface,
  },
  shimmerPlaceholder: {
    backgroundColor: '#F3F4F6',
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.feedback.error,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Card Styles
  bookingCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.l,
    zIndex: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    zIndex: 1,
    position: 'relative',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 2,
    position: 'relative',
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderContent: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  cardSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  cardContent: {
    paddingTop: 8,
    zIndex: 1,
    position: 'relative',
  },
  detailContent: {
    paddingTop: 8,
    zIndex: 1,
    position: 'relative',
  },

  // Detail Rows
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginLeft: 12,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },

  // Coupon Styles
  couponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
  },
  couponInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: theme.colors.text.secondary,
  },
  applyButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  removeCouponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  removeCouponText: {
    color: theme.colors.feedback.error,
    fontSize: 14,
    textDecorationLine: 'underline',
  },

  // Price Styles
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  discountText: {
    color: theme.colors.feedback.success,
  },
  totalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },

  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 24,
  },
  primaryButton: {
    flex: 2,
    borderRadius: theme.borderRadius.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 56,
  },
  primaryButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.m,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
export default BookingConfirmationScreen;
