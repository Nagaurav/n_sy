import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
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
import { useRoute } from '@react-navigation/native';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { ROUTES } from '../navigation/constants';
import { useAuth } from '../utils/AuthContext';
import { checkPaymentStatus } from '../services/phonepeService';
import { PaymentStatus } from '../types/payment';

type PaymentMethodKey = 'upi' | 'card' | 'wallet' | 'netbanking';

interface RouteParams {
  amount: number;
  bookingDetails?: {
    bookingId?: string;
    service?: string;
    selectedDate?: string;
    selectedTime?: string;
    selectedDuration?: number;
    selectedClassType?: 'one_on_one' | 'group';
    mode?: 'online' | 'offline' | 'home_visit';
    category?: string;
    categoryName?: string;
    categoryIcon?: string;
    categoryColor?: string;
    instructor?: any;
    location?: string;
  };
  professional?: {
    id: string;
    name: string;
  };
  paymentUrl?: string;
}

const PAYMENT_METHODS = [
  { key: 'upi', label: 'UPI', icon: 'qrcode', description: 'Pay via Google Pay, PhonePe, etc.', popular: true },
  { key: 'card', label: 'Credit / Debit Card', icon: 'credit-card', description: 'Visa, Mastercard, RuPay' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet', description: 'Paytm, Amazon Pay' },
  { key: 'netbanking', label: 'Net Banking', icon: 'bank', description: 'Direct bank transfer' },
];

const PaymentScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const {
    amount,
    bookingDetails,
    professional,
    paymentUrl: initialPaymentUrl,
  } = route.params as RouteParams;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodKey | null>(
    initialPaymentUrl ? 'upi' : null
  );
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialPaymentUrl || null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const isYogaBooking = bookingDetails?.category === 'yoga';

  /** ✅ Centralized alert wrapper */
  const showAlert = (title: string, msg: string) => Alert.alert(title, msg);

  /** 🧾 Clear interval safely */
  const clearPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  /** 🕒 Start polling for payment confirmation */
  const startPaymentPolling = useCallback(
    (bookingId: string) => {
      clearPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const res = await checkPaymentStatus(bookingId);
          if (!res.success) return;
          const { status } = res.data;

          if (status === PaymentStatus.SUCCESS) {
            clearPolling();
            navigateToSuccess(bookingId);
          } else if (status === PaymentStatus.FAILED) {
            clearPolling();
            showAlert('Payment Failed', 'Your payment could not be processed.');
            setLoading(false);
          }
        } catch (err) {
          console.warn('Polling error:', err);
        }
      }, 3000);
    },
    []
  );

  /** 🧭 Navigate to booking success screen */
  const navigateToSuccess = useCallback(
    (transactionId: string) => {
      const details = bookingDetails || {};
      const paymentData = {
        amount,
        method: selectedMethod || 'upi',
        transactionId,
      };

      if (isYogaBooking) {
        navigation.navigate(ROUTES.BOOKING_SUCCESS, {
          category: details.category || 'yoga',
          categoryName: details.categoryName || 'Yoga',
          categoryIcon: details.categoryIcon || 'yoga',
          categoryColor: details.categoryColor || colors.primaryGreen,
          instructor: details.instructor || professional || {},
          bookingDetails: {
            bookingId: transactionId,
            selectedDate: details.selectedDate || new Date().toISOString().split('T')[0],
            selectedTime: details.selectedTime || '12:00',
            selectedDuration: details.selectedDuration || 60,
            selectedClassType: details.selectedClassType || 'one_on_one',
            mode: details.mode || 'online',
            location: details.location,
          },
          paymentDetails: paymentData,
        });
      } else {
        navigation.navigate(ROUTES.APPOINTMENT_CONFIRMATION, {
          bookingId: transactionId,
          professional: professional || details.instructor || {},
          bookingDetails: { ...details, bookingId: transactionId },
          paymentDetails: paymentData,
        });
      }
    },
    [navigation, selectedMethod, amount, bookingDetails]
  );

  /** 🧹 Cleanup polling on unmount */
  useEffect(() => clearPolling, []);

  /** 💰 Handle Payment */
  const handlePayment = async () => {
    if (!user) return showAlert('Login Required', 'Please log in to make a payment.');
    if (!bookingDetails?.bookingId) return showAlert('Error', 'Booking ID missing.');
    if (!selectedMethod) return showAlert('Select Method', 'Choose a payment method first.');

    try {
      setLoading(true);
      if (!paymentUrl) throw new Error('Payment URL missing.');

      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (!canOpen) throw new Error('Could not open payment app or browser.');

      await Linking.openURL(paymentUrl);
      showAlert('Payment in Progress', 'Please complete your payment. Checking status...');
      startPaymentPolling(bookingDetails.bookingId);
    } catch (err: any) {
      console.error('Payment error:', err);
      showAlert('Payment Error', err.message || 'Please try again later.');
      setLoading(false);
    }
  };

  /** 💳 Payment Method Card */
  const renderMethod = (m: typeof PAYMENT_METHODS[number]) => {
    const selected = selectedMethod === m.key;
    return (
      <TouchableOpacity
        key={m.key}
        style={[styles.methodRow, selected && styles.methodSelected]}
        onPress={() => setSelectedMethod(m.key)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name={m.icon as any}
          size={28}
          color={selected ? colors.offWhite : colors.primaryGreen}
        />
        <View style={styles.methodInfo}>
          <Text style={[styles.methodLabel, selected && styles.selectedText]}>{m.label}</Text>
          <Text style={[styles.methodDesc, selected && styles.selectedText]}>{m.description}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  /** 🧾 Booking Summary Card */
  const renderSummary = () => {
    if (!bookingDetails) return null;
    const { service, categoryName, selectedDate, selectedTime, selectedDuration } = bookingDetails;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Booking Summary</Text>
        <View style={styles.summaryCard}>
          {[
            { label: 'Professional', value: professional?.name || 'Expert' },
            { label: 'Service', value: service || categoryName || 'Consultation' },
            { label: 'Date', value: selectedDate || 'TBD' },
            { label: 'Time', value: selectedTime || 'TBD' },
            { label: 'Duration', value: `${selectedDuration || 60} min` },
          ].map(({ label, value }) => (
            <View key={label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{label}</Text>
              <Text style={styles.summaryValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  /** 🖼️ UI */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.offWhite} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Amount to Pay</Text>
          <Text style={styles.amount}>₹{amount.toLocaleString()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          {PAYMENT_METHODS.map(renderMethod)}
        </View>

        {renderSummary()}
      </ScrollView>

      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.payButton, (!selectedMethod || loading) && styles.disabled]}
          disabled={!selectedMethod || loading}
          onPress={handlePayment}
        >
          {loading ? (
            <ActivityIndicator color={colors.offWhite} />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{amount.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 6 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: colors.primaryText },
  placeholder: { width: 40 },
  content: { flex: 1, padding: 20 },
  amountContainer: { alignItems: 'center', marginBottom: 24 },
  amountLabel: { fontSize: 15, color: colors.secondaryText },
  amount: { fontSize: 36, color: colors.primaryGreen, fontWeight: '800', marginTop: 6 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.primaryText },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.offWhite,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  methodSelected: { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen, elevation: 4 },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodLabel: { fontSize: 16, fontWeight: '600', color: colors.primaryText },
  methodDesc: { fontSize: 13, color: colors.secondaryText },
  selectedText: { color: colors.offWhite },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.secondaryText, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.offWhite, backgroundColor: colors.offWhite },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primaryGreen },
  summaryCard: { borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, backgroundColor: colors.offWhite },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: colors.secondaryText, fontSize: 14 },
  summaryValue: { color: colors.primaryText, fontSize: 14, fontWeight: '600' },
  bottomAction: { position: 'absolute', bottom: 20, left: 20, right: 20 },
  payButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
  },
  disabled: { backgroundColor: colors.secondaryText, opacity: 0.6 },
  payButtonText: { color: colors.offWhite, fontSize: 18, fontWeight: '700' },
});

export default PaymentScreen;
