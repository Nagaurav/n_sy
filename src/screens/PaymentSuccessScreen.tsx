import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { phonePePaymentService } from '../services/phonePePaymentService';
import { PhonePeStatusResponse, PhonePeVerifyResponse } from '../config/api';
import { ROUTES } from '../navigation/constants';

type PaymentSuccessRouteProp = RouteProp<{
  PaymentSuccess: {
    merchantTransactionId?: string;
    pgTransactionId?: string;
    paymentStatus?: string;
    amount?: number;
    currency?: string;
    userData?: {
      user_id: string;
      user_name: string;
      user_email: string;
    };
  };
}, 'PaymentSuccess'>;

const PaymentSuccessScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PaymentSuccessRouteProp>();

  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<{
    status: PhonePeStatusResponse;
    verified: PhonePeVerifyResponse;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { merchantTransactionId, pgTransactionId, amount, currency, userData } =
    route.params || {};

  const isMounted = useRef(true);

  const showAlert = (title: string, message: string) => Alert.alert(title, message);

  /** 🔄 Verify payment with backend */
  const verifyPayment = useCallback(async () => {
    if (!merchantTransactionId || !pgTransactionId) {
      setError('Missing payment information.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const verification = await phonePePaymentService.verifyAndCompletePayment(
        merchantTransactionId,
        pgTransactionId
      );
      if (isMounted.current) {
        setPaymentDetails(verification);
        setError(null);
      }
    } catch (err: any) {
      console.error('Payment verification error:', err);
      if (isMounted.current) {
        setError(err.message || 'Payment verification failed.');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [merchantTransactionId, pgTransactionId]);

  useEffect(() => {
    verifyPayment();
    return () => {
      isMounted.current = false;
    };
  }, [verifyPayment]);

  /** 📄 Action handlers */
  const handleViewReceipt = () => showAlert('Receipt', 'Receipt functionality coming soon!');
  const handleGoHome = () => navigation.navigate(ROUTES.HOME as never);
  const handleBookAnother = () => navigation.navigate(ROUTES.YOGA_SELECTION as never);
  const handleSupport = () => navigation.navigate(ROUTES.CUSTOMER_SUPPORT as never);

  const openPhonePeApp = async () => {
    try {
      const appUrl = 'phonepe://';
      const fallbackUrl =
        'https://play.google.com/store/apps/details?id=com.phonepe.app';

      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : fallbackUrl);
    } catch (err) {
      console.error('Error opening PhonePe app:', err);
      showAlert('Error', 'Unable to open PhonePe app.');
    }
  };

  /** 🕒 Loading State */
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Verifying your payment...</Text>
      </View>
    );
  }

  /** ❌ Error State */
  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorTitle}>Payment Verification Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={verifyPayment}>
          <Text style={styles.retryText}>🔄 Retry Verification</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
          <Text style={styles.supportText}>📞 Contact Support</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** ✅ Success or Pending State */
  const status = paymentDetails?.status?.data?.status || 'PENDING';
  const isSuccess = status === 'SUCCESS';
  const statusColor = phonePePaymentService.getPaymentStatusColor(status);
  const statusText = phonePePaymentService.getPaymentStatusDisplay(status);
  const transactionId = paymentDetails?.status?.data?.transactionId || merchantTransactionId;

  return (
    <ScrollView style={styles.container}>
      {/* 🎉 Header */}
      <View style={styles.header}>
        <Text style={styles.emoji}>{isSuccess ? '🎉' : '⏳'}</Text>
        <Text style={styles.headerTitle}>
          {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isSuccess
            ? 'Your payment was completed successfully.'
            : 'We’re verifying your payment, please wait.'}
        </Text>
      </View>

      {/* 💳 Status */}
      <View style={styles.statusCard}>
        <Text style={[styles.statusIcon, { color: statusColor }]}>
          {isSuccess ? '✅' : '⏳'}
        </Text>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        {amount && (
          <Text style={styles.amountText}>
            {phonePePaymentService.formatAmount(amount, currency || 'INR')}
          </Text>
        )}
      </View>

      {/* 📋 Payment Details */}
      {paymentDetails && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          {[
            { label: 'Transaction ID', value: transactionId || 'N/A' },
            { label: 'Status', value: statusText },
            { label: 'Message', value: paymentDetails.status?.data?.message || 'N/A' },
            {
              label: 'Date & Time',
              value:
                paymentDetails.status?.data?.transactionDate ||
                new Date().toLocaleString('en-IN'),
            },
          ].map(({ label, value }) => (
            <View style={styles.detailRow} key={label}>
              <Text style={styles.detailLabel}>{label}</Text>
              <Text style={styles.detailValue}>{String(value)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 👤 User Details */}
      {userData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Information</Text>
          <View style={styles.userCard}>
            <Text style={styles.userName}>{userData.user_name}</Text>
            <Text style={styles.userEmail}>{userData.user_email}</Text>
            <Text style={styles.userId}>ID: {userData.user_id}</Text>
          </View>
        </View>
      )}

      {/* 🧭 Actions */}
      <View style={styles.actionContainer}>
        {isSuccess && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewReceipt}>
            <Text style={styles.primaryText}>📄 View Receipt</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBookAnother}>
          <Text style={styles.secondaryText}>📚 Book Another Session</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tertiaryButton} onPress={handleGoHome}>
          <Text style={styles.tertiaryText}>🏠 Go Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.phonePeButton} onPress={openPhonePeApp}>
          <Text style={styles.phonePeText}>📱 Open in PhonePe</Text>
        </TouchableOpacity>
      </View>

      {/* ℹ️ Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>What’s Next?</Text>
        {isSuccess ? (
          <>
            <Text style={styles.infoText}>• Your booking is now confirmed</Text>
            <Text style={styles.infoText}>• A confirmation email has been sent</Text>
            <Text style={styles.infoText}>• You can now view your appointment</Text>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>• Payment is being processed</Text>
            <Text style={styles.infoText}>• Check PhonePe app for confirmation</Text>
            <Text style={styles.infoText}>• Contact support if delayed</Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 12, fontSize: 15, color: colors.secondaryText },
  header: { alignItems: 'center', padding: 28, borderBottomWidth: 1, borderColor: colors.border },
  emoji: { fontSize: 48, marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.primaryText, marginBottom: 6 },
  headerSubtitle: { fontSize: 15, color: colors.secondaryText, textAlign: 'center' },
  statusCard: {
    margin: 20,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusIcon: { fontSize: 48 },
  statusText: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  amountText: { fontSize: 26, fontWeight: '800', color: colors.primaryGreen, marginTop: 8 },
  section: { marginHorizontal: 20, marginVertical: 10, backgroundColor: colors.white, borderRadius: 12, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText, marginBottom: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 8 },
  detailLabel: { color: colors.secondaryText, fontSize: 14 },
  detailValue: { color: colors.primaryText, fontSize: 14, fontWeight: '600', textAlign: 'right' },
  userCard: { alignItems: 'center', padding: 14, backgroundColor: colors.lightGray, borderRadius: 10 },
  userName: { fontSize: 18, fontWeight: '600' },
  userEmail: { fontSize: 14, color: colors.secondaryText },
  userId: { fontSize: 12, color: colors.secondaryText },
  actionContainer: { padding: 20, gap: 10 },
  primaryButton: { backgroundColor: colors.primaryGreen, borderRadius: 12, padding: 14, alignItems: 'center' },
  primaryText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  secondaryButton: { backgroundColor: colors.primaryBlue, borderRadius: 12, padding: 14, alignItems: 'center' },
  secondaryText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  tertiaryButton: { backgroundColor: colors.secondaryText, borderRadius: 12, padding: 14, alignItems: 'center' },
  tertiaryText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  phonePeButton: { backgroundColor: '#5F259F', borderRadius: 12, padding: 14, alignItems: 'center' },
  phonePeText: { color: colors.white, fontWeight: '600', fontSize: 16 },
  infoCard: { backgroundColor: colors.white, margin: 20, borderRadius: 12, padding: 16 },
  infoTitle: { fontWeight: '600', fontSize: 16, color: colors.primaryText, marginBottom: 10 },
  infoText: { fontSize: 14, color: colors.secondaryText, marginBottom: 4 },
  errorIcon: { fontSize: 64 },
  errorTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8, color: colors.error },
  errorMessage: { textAlign: 'center', color: colors.secondaryText, marginBottom: 16 },
  retryButton: { backgroundColor: colors.primaryBlue, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 10 },
  retryText: { color: colors.white, fontWeight: '600' },
  supportButton: { backgroundColor: colors.error, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  supportText: { color: colors.white, fontWeight: '600' },
});

export default PaymentSuccessScreen;
