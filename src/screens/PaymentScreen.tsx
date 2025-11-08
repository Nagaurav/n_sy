// PaymentScreen.tsx
import React, { useState } from 'react';
import {
  Alert as RNAlert,
  SafeAreaView,
  StatusBar,
  Linking,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ROUTES } from '../navigation/constants';
import { useAuth } from '../utils/AuthContext';
import { 
  checkPaymentStatus, 
  type PhonePeStatusResponse
} from '../services/phonepeService';
import { PaymentStatus } from '../types/payment';

type NavigationParams = {
  [ROUTES.BOOKING_SUCCESS]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    professional: any; // Consider replacing 'any' with a proper Professional type
    bookingDetails: {
      bookingId: string;
      [key: string]: any;
    };
    paymentDetails: {
      amount: number;
      method: string | null;
      transactionId: string;
    };
  };
  [ROUTES.APPOINTMENT_CONFIRMATION]: {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
    professional: any; // Consider replacing 'any' with a proper Professional type
    bookingDetails: {
      bookingId: string;
      [key: string]: any;
    };
    paymentDetails: {
      amount: number;
      method: string | null;
      transactionId: string;
    };
  };
};

type NavigationProp = NativeStackNavigationProp<NavigationParams>;

// Using PaymentStatus, PaymentInitiateResponse, and PaymentStatusResponse from types/payment.ts

const PAYMENT_METHODS = [
  { 
    key: 'upi', 
    label: 'UPI', 
    icon: 'qrcode', 
    description: 'Pay using UPI apps like Google Pay, PhonePe',
    popular: true 
  },
  { 
    key: 'card', 
    label: 'Credit / Debit Card', 
    icon: 'credit-card', 
    description: 'Visa, Mastercard, RuPay cards',
    popular: false 
  },
  { 
    key: 'wallet', 
    label: 'Digital Wallet', 
    icon: 'wallet', 
    description: 'Paytm, Amazon Pay, other wallets',
    popular: false 
  },
  { 
    key: 'netbanking', 
    label: 'Net Banking', 
    icon: 'bank', 
    description: 'Direct bank transfer',
    popular: false 
  },
];

const PaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { user } = useAuth();
  // Add type for route params
  interface RouteParams {
    amount: number;
    bookingDetails?: {
      bookingId?: string;
      service?: string;
      selectedDate?: string;
      selectedTime?: string;
      selectedDuration?: number;
      selectedClassType?: string;
      mode?: string;
      location?: string;
      category?: string;
      categoryName?: string;
      categoryIcon?: string;
      categoryColor?: string;
      instructor?: any;
    };
    professional?: {
      id: string;
      name: string;
    };
    paymentUrl?: string; // Add paymentUrl to RouteParams
  }
  const { amount, bookingDetails, professional, paymentUrl: initialPaymentUrl } = route.params as RouteParams;

  const [selectedMethod, setSelectedMethod] = useState<string | null>(initialPaymentUrl ? 'upi' : null);
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialPaymentUrl || null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Determine if this is a yoga booking
  const isYogaBooking = bookingDetails?.category === 'yoga';

  const handleSelectMethod = (method: string) => setSelectedMethod(method);

  // Function to start polling payment status
  const startPaymentStatusPolling = (bookingId: string) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start a new polling interval
    const interval = setInterval(async () => {
      try {
        console.log('Polling payment status for booking:', bookingId);
        const statusResponse = await checkPaymentStatus(bookingId);
        
        if (statusResponse.success) {
          const { status } = statusResponse.data;
          
          if (status === PaymentStatus.SUCCESS) {
            // Payment successful, stop polling and navigate to success
            clearInterval(interval);
            navigateToSuccessScreen(bookingId);
          } else if (status === PaymentStatus.FAILED) {
            // Payment failed, stop polling and show error
            clearInterval(interval);
            RNAlert.alert(
              'Payment Failed',
              'Your payment was not successful. Please try again.'
            );
            setLoading(false);
          }
          // If status is PENDING, continue polling
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        // Don't stop polling on error, just log it and continue
      }
    }, 3000); // Poll every 3 seconds

    setPollingInterval(interval);
    return interval;
  };

  // Function to navigate to success screen
  const navigateToSuccessScreen = (transactionId: string) => {
    const successParams = {
      category: bookingDetails?.category || 'consultation',
      categoryName: bookingDetails?.categoryName || 'Consultation',
      categoryIcon: bookingDetails?.categoryIcon || 'account-tie',
      categoryColor: bookingDetails?.categoryColor || colors.primaryGreen,
      professional: professional || {},
      bookingDetails: {
        ...(bookingDetails || {}),
        bookingId: bookingDetails?.bookingId || transactionId,
      },
      paymentDetails: {
        amount: amount,
        method: selectedMethod || 'online',
        transactionId: transactionId,
      },
    };
    
    // Determine the appropriate success screen based on booking type
    const successScreen = isYogaBooking 
      ? ROUTES.BOOKING_SUCCESS 
      : ROUTES.APPOINTMENT_CONFIRMATION;
    
    // Navigate to the success screen
    navigation.navigate(successScreen, successParams);
  };

  // Clean up interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handlePayment = async () => {
    const bookingId = bookingDetails?.bookingId;
    if (!bookingId) {
      RNAlert.alert('Error', 'No booking ID found. Please try again.');
      return;
    }

    if (!selectedMethod) {
      RNAlert.alert('Select Payment Method', 'Please select a payment method to proceed.');
      return;
    }
    
    if (!user) {
      RNAlert.alert('Not Logged In', 'You must be logged in to make a payment.');
      return;
    }
    
    setLoading(true);
    try {
      // Use the paymentUrl passed from the previous screen
      if (paymentUrl) { 
        // 1. Open the PhonePe URL
        const canOpen = await Linking.canOpenURL(paymentUrl);
        if (!canOpen) {
          throw new Error('Could not open payment URL. Please make sure you have a browser or PhonePe app installed.');
        }

        await Linking.openURL(paymentUrl);

        // 2. Start polling for status
        RNAlert.alert(
          'Payment in Progress',
          'Please complete the payment in the opened window. We will verify your status.'
        );
        startPaymentStatusPolling(bookingId);
      } else {
        // This case should not happen if API 4 always returns a paymentUrl
        throw new Error("No payment URL was provided.");
      }
    } catch (error: unknown) {
      console.error('PaymentScreen - Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      RNAlert.alert('Payment Error', errorMessage);
      setLoading(false);
    }
    // Do not set loading to false here, the poller will handle it.
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderPaymentMethod = (method: any) => (
    <TouchableOpacity
      key={method.key}
      style={[
        styles.paymentMethodRow,
        selectedMethod === method.key && styles.selectedPaymentMethod,
      ]}
      onPress={() => handleSelectMethod(method.key)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={styles.methodIconContainer}>
        <MaterialCommunityIcons 
          name={method.icon as any} 
          size={24} 
          color={selectedMethod === method.key ? colors.offWhite : colors.secondaryText} 
        />
      </View>

      {/* Method Info */}
      <View style={styles.methodInfo}>
        <View style={styles.methodHeader}>
          <Text style={[
            styles.methodLabel,
            selectedMethod === method.key && styles.selectedMethodText,
          ]}>
            {method.label}
          </Text>
          {method.popular && (
            <View style={styles.popularBadge}>
              <Text style={styles.popularText}>Popular</Text>
            </View>
          )}
        </View>
        <Text style={[
          styles.methodDescription,
          selectedMethod === method.key && styles.selectedMethodDescription,
        ]}>
          {method.description}
        </Text>
      </View>

      {/* Radio Button */}
      <View style={[
        styles.radioButton,
        selectedMethod === method.key && styles.radioButtonSelected,
      ]}>
        {selectedMethod === method.key && (
          <View style={styles.radioButtonInner} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.offWhite} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Display */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amount}>₹{amount.toLocaleString()}</Text>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <View style={styles.paymentMethodsList}>
            {PAYMENT_METHODS.map(renderPaymentMethod)}
          </View>
        </View>

        {/* Booking Summary */}
        {bookingDetails && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Professional:</Text>
                <Text style={styles.summaryValue}>{professional?.name || bookingDetails?.instructor?.name || 'Expert'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service:</Text>
                <Text style={styles.summaryValue}>{bookingDetails.service || bookingDetails.categoryName || 'Consultation'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{bookingDetails.selectedDate || 'TBD'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{bookingDetails.selectedTime || 'TBD'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{bookingDetails?.selectedDuration || 60} min</Text>
              </View>
              {bookingDetails.selectedClassType && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Type:</Text>
                  <Text style={styles.summaryValue}>
                    {bookingDetails.selectedClassType === 'one_on_one' ? 'One-on-One' : 'Group Class'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Payment Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.payButton,
            (!selectedMethod || loading) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={!selectedMethod || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.offWhite} />
          ) : (
            <Text style={styles.payButtonText}>
              Pay ₹{amount.toLocaleString()}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.offWhite,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  amountLabel: {
    color: colors.secondaryText,
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  amount: {
    color: colors.primaryGreen,
    fontSize: 36,
    fontWeight: '700',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: colors.primaryText,
    fontWeight: '600',
  },
  paymentMethodsList: {
    width: '100%',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectedPaymentMethod: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodInfo: {
    flex: 1,
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  methodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  selectedMethodText: {
    color: colors.offWhite,
  },
  popularBadge: {
    backgroundColor: colors.accentOrange,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  popularText: {
    color: colors.offWhite,
    fontSize: 10,
    fontWeight: '700',
  },
  methodDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 18,
  },
  selectedMethodDescription: {
    color: colors.offWhite,
    opacity: 0.9,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.secondaryText,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  radioButtonSelected: {
    borderColor: colors.offWhite,
    backgroundColor: colors.offWhite,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primaryGreen,
  },
  summaryCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  payButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  payButtonDisabled: {
    backgroundColor: colors.secondaryText,
    shadowOpacity: 0.1,
  },
  payButtonText: {
    color: colors.offWhite,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default PaymentScreen; 