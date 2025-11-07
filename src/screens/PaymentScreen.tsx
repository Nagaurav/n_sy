// PaymentScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { professionalSlotService } from '../services/professionalSlotService';

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
  const navigation = useNavigation();
  const route = useRoute();
  const { amount, bookingDetails, professional } = route.params as { 
    amount: number; 
    bookingDetails?: any;
    professional?: any;
  };

  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine booking type and get appropriate details
  const isYogaPackage = bookingDetails?.type === 'yoga_package';
  const packageDetails = isYogaPackage ? bookingDetails.package : null;

  const handleSelectMethod = (method: string) => setSelectedMethod(method);

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Select Payment Method', 'Please select a payment method to proceed.');
      return;
    }
    setLoading(true);
    try {
      console.log('PaymentScreen - Starting payment process...');
      console.log('PaymentScreen - Amount:', amount);
      console.log('PaymentScreen - Selected method:', selectedMethod);
      console.log('PaymentScreen - Booking details:', bookingDetails);

      // Create booking using mock API
      const bookingData = {
        professionalId: professional?.id || bookingDetails?.professionalId || 'mock_professional',
        serviceId: bookingDetails?.serviceId || 'default_service',
        userId: 'user_123', // Replace with actual user ID from context
        date: bookingDetails?.selectedDate || new Date().toISOString().split('T')[0],
        time: bookingDetails?.selectedTime || '10:00',
        duration: bookingDetails?.duration || bookingDetails?.selectedDuration || 60,
        paymentMethod: selectedMethod,
        amount: amount,
      };

      console.log('PaymentScreen - Creating booking with data:', bookingData);
      const bookingResult = await professionalSlotService.createBooking(bookingData);
      console.log('PaymentScreen - Booking result:', bookingResult);
      
      if (bookingResult.success) {
        console.log('PaymentScreen - Booking created successfully, checking payment status...');
        
        // Check payment status
        const paymentStatus = await professionalSlotService.getPaymentStatus(bookingResult.bookingId);
        console.log('PaymentScreen - Payment status:', paymentStatus);
        
        if (paymentStatus.status === 'completed') {
          console.log('PaymentScreen - Payment completed, navigating to success screen...');
          
          try {
            // Navigate directly without Alert for smoother flow
            if (bookingDetails?.category === 'yoga') {
              // Navigate to booking success for yoga classes
              console.log('PaymentScreen - Navigating to BOOKING_SUCCESS for yoga');
              (navigation as any).navigate(ROUTES.BOOKING_SUCCESS, {
                category: 'yoga',
                categoryName: bookingDetails?.categoryName || 'Yoga Classes',
                categoryIcon: bookingDetails?.categoryIcon || 'yoga',
                categoryColor: bookingDetails?.categoryColor || colors.primaryGreen,
                instructor: bookingDetails?.instructor,
                professional: professional,
                bookingDetails: {
                  bookingId: bookingResult.bookingId,
                  selectedDate: bookingDetails?.selectedDate,
                  selectedTime: bookingDetails?.selectedTime,
                  selectedDuration: bookingDetails?.selectedDuration,
                  selectedClassType: bookingDetails?.selectedClassType,
                  mode: bookingDetails?.mode,
                  location: bookingDetails?.location,
                },
                paymentDetails: {
                  amount,
                  method: selectedMethod,
                  transactionId: paymentStatus.transactionId,
                },
              });
            } else {
              // Navigate to appointment confirmation for consultations
              console.log('PaymentScreen - Navigating to APPOINTMENT_CONFIRMATION for consultation');
              const now = new Date();
              const appointmentTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
              
              (navigation as any).navigate(ROUTES.APPOINTMENT_CONFIRMATION, {
                professional: professional || { name: 'Expert' },
                appointmentTime: appointmentTime.toISOString(),
                service: bookingDetails?.service || bookingDetails?.categoryName || 'Consultation',
                duration: bookingDetails?.duration || bookingDetails?.selectedDuration || 60,
                bookingId: bookingResult.bookingId,
              });
            }
          } catch (navigationError) {
            console.error('PaymentScreen - Navigation error:', navigationError);
            // Fallback: Show success alert and go back to home
            Alert.alert(
              'Payment Successful!', 
              `Your payment of ₹${amount} has been processed successfully.`,
              [
                {
                  text: 'OK',
                  onPress: () => {
                    // Navigate back to home screen
                    (navigation as any).navigate('Main');
                  },
                },
              ]
            );
          }
        } else {
          console.log('PaymentScreen - Payment status is not completed:', paymentStatus.status);
          Alert.alert('Payment Pending', 'Your payment is being processed. You will receive a confirmation shortly.');
        }
      } else {
        console.log('PaymentScreen - Booking failed:', bookingResult);
        Alert.alert('Booking Failed', 'Unable to create booking. Please try again.');
      }
    } catch (error) {
      console.error('PaymentScreen - Payment error:', error);
      Alert.alert('Payment Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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
                <Text style={styles.summaryValue}>{bookingDetails.duration || bookingDetails.selectedDuration || 60} min</Text>
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