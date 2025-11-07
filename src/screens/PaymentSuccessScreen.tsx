import React, { useEffect, useState } from 'react';
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
  const [verifying, setVerifying] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    status: PhonePeStatusResponse;
    verified: PhonePeVerifyResponse;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    merchantTransactionId,
    pgTransactionId,
    paymentStatus,
    amount,
    currency,
    userData
  } = route.params || {};

  useEffect(() => {
    if (merchantTransactionId && pgTransactionId) {
      verifyPayment();
    } else {
      setLoading(false);
      setError('Missing payment information');
    }
  }, [merchantTransactionId, pgTransactionId]);

  const verifyPayment = async () => {
    if (!merchantTransactionId || !pgTransactionId) return;
    
    setVerifying(true);
    try {
      const verification = await phonePePaymentService.verifyAndCompletePayment(
        merchantTransactionId,
        pgTransactionId
      );
      
      setPaymentDetails(verification);
      setError(null);
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setError(error.message || 'Payment verification failed');
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleViewReceipt = () => {
    // Navigate to receipt screen or open receipt
    Alert.alert('Receipt', 'Receipt functionality will be implemented here');
  };

  const handleBookAnother = () => {
    (navigation as any).navigate('YogaSelection');
  };

  const handleGoHome = () => {
    (navigation as any).navigate('Home');
  };

  const handleSupport = () => {
    (navigation as any).navigate('CustomerSupport');
  };

  const openPhonePeApp = async () => {
    try {
      const phonePeUrl = 'phonepe://';
      const supported = await Linking.canOpenURL(phonePeUrl);
      
      if (supported) {
        await Linking.openURL(phonePeUrl);
      } else {
        // Fallback to Play Store
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.phonepe.app';
        await Linking.openURL(playStoreUrl);
      }
    } catch (error) {
      console.error('Error opening PhonePe app:', error);
      Alert.alert('Error', 'Unable to open PhonePe app');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading payment details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorSection}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Payment Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          
          <TouchableOpacity style={styles.retryButton} onPress={verifyPayment}>
            <Text style={styles.retryButtonText}>🔄 Retry Verification</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.supportButton} onPress={handleSupport}>
            <Text style={styles.supportButtonText}>📞 Contact Support</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isSuccess = paymentDetails?.status?.data?.status === 'SUCCESS';
  const statusColor = phonePePaymentService.getPaymentStatusColor(paymentDetails?.status?.data?.status || 'PENDING');
  const statusText = phonePePaymentService.getPaymentStatusDisplay(paymentDetails?.status?.data?.status || 'PENDING');

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>
          {isSuccess ? '🎉' : '📱'}
        </Text>
        <Text style={styles.headerTitle}>
          {isSuccess ? 'Payment Successful!' : 'Payment Processing'}
        </Text>
        <Text style={styles.headerSubtitle}>
          {isSuccess ? 'Your payment has been completed successfully' : 'We are processing your payment'}
        </Text>
      </View>

      {/* Payment Status */}
      <View style={styles.statusSection}>
        <View style={[styles.statusCard, { borderColor: statusColor }]}>
          <Text style={[styles.statusIcon, { color: statusColor }]}>
            {isSuccess ? '✅' : '⏳'}
          </Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusText}
          </Text>
          
          {amount && (
            <Text style={styles.amountText}>
              {phonePePaymentService.formatAmount(amount, currency || 'INR')}
            </Text>
          )}
        </View>
      </View>

      {/* Payment Details */}
      {paymentDetails && (
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>📋 Payment Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID:</Text>
            <Text style={styles.detailValue}>
              {paymentDetails?.status?.data?.transactionId || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>
              {paymentDetails?.status?.data?.status || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Message:</Text>
            <Text style={styles.detailValue}>
              {paymentDetails?.status?.data?.message || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time:</Text>
            <Text style={styles.detailValue}>
              {new Date().toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      )}

      {/* User Information */}
      {userData && (
        <View style={styles.userSection}>
          <Text style={styles.sectionTitle}>👤 User Information</Text>
          
          <View style={styles.userCard}>
            <Text style={styles.userName}>{userData.user_name}</Text>
            <Text style={styles.userEmail}>{userData.user_email}</Text>
            <Text style={styles.userId}>ID: {userData.user_id}</Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {isSuccess && (
          <TouchableOpacity style={styles.primaryButton} onPress={handleViewReceipt}>
            <Text style={styles.primaryButtonText}>📄 View Receipt</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleBookAnother}>
          <Text style={styles.secondaryButtonText}>📚 Book Another Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tertiaryButton} onPress={handleGoHome}>
          <Text style={styles.tertiaryButtonText}>🏠 Go to Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.phonePeButton} onPress={openPhonePeApp}>
          <Text style={styles.phonePeButtonText}>📱 Open PhonePe App</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Information */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ What's Next?</Text>
        
        {isSuccess ? (
          <>
            <Text style={styles.infoText}>
              • Your payment has been confirmed
            </Text>
            <Text style={styles.infoText}>
              • You will receive a confirmation email
            </Text>
            <Text style={styles.infoText}>
              • Your booking is now active
            </Text>
            <Text style={styles.infoText}>
              • Check your email for session details
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.infoText}>
              • Payment is being processed
            </Text>
            <Text style={styles.infoText}>
              • You will receive updates via email
            </Text>
            <Text style={styles.infoText}>
              • Check your PhonePe app for status
            </Text>
            <Text style={styles.infoText}>
              • Contact support if you have questions
            </Text>
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.secondaryText,
    marginTop: 16,
  },
  header: {
    backgroundColor: colors.white,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  statusSection: {
    padding: 20,
  },
  statusCard: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  amountText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryGreen,
  },
  detailsSection: {
    backgroundColor: colors.white,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondaryText,
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 2,
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  userSection: {
    backgroundColor: colors.white,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userCard: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: colors.secondaryText,
    fontFamily: 'monospace',
  },
  actionSection: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.primaryBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: colors.secondaryText,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  phonePeButton: {
    backgroundColor: '#5F259F',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  phonePeButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.white,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  errorSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryRed || '#F44336',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  supportButton: {
    backgroundColor: colors.primaryRed || '#F44336',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  supportButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentSuccessScreen;
