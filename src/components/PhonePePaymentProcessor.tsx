import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
  AppState,
  AppStateStatus,
} from 'react-native';
import { colors } from '../theme/colors';
import { phonePePaymentService } from '../services/phonePePaymentService';
import { PhonePeInitiateRequest, PhonePeInitiateResponse, PhonePeStatusResponse } from '../config/api';

interface PhonePePaymentProcessorProps {
  onPaymentSuccess?: (paymentData: any) => void;
  onPaymentFailure?: (error: string) => void;
  onPaymentCancelled?: () => void;
  initialAmount?: number;
  initialCurrency?: string;
  initialUserData?: {
    user_id: string;
    user_name: string;
    user_email: string;
    user_phone: string;
  };
}

const PhonePePaymentProcessor: React.FC<PhonePePaymentProcessorProps> = ({
  onPaymentSuccess,
  onPaymentFailure,
  onPaymentCancelled,
  initialAmount = 1000,
  initialCurrency = 'INR',
  initialUserData
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<PhonePeInitiateRequest | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string>('pending');
  const [currentStep, setCurrentStep] = useState<'input' | 'processing' | 'redirecting' | 'verifying' | 'completed'>('input');
  
  const [amount, setAmount] = useState(initialAmount.toString());
  const [currency, setCurrency] = useState(initialCurrency);
  const [userData, setUserData] = useState({
    user_id: initialUserData?.user_id || '',
    user_name: initialUserData?.user_name || '',
    user_email: initialUserData?.user_email || '',
    user_phone: initialUserData?.user_phone || ''
  });
  
  const [currentPayment, setCurrentPayment] = useState<{
    merchantTransactionId: string;
    pgTransactionId?: string;
    initiatedResponse?: PhonePeInitiateResponse;
  } | null>(null);
  
  const appState = useRef(AppState.currentState);
  const statusPollingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground, check payment status
        if (currentPayment?.merchantTransactionId) {
          checkPaymentStatus();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [currentPayment]);

  useEffect(() => {
    return () => {
      if (statusPollingInterval.current) {
        clearInterval(statusPollingInterval.current);
      }
    };
  }, []);

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return false;
    }
    
    if (!userData.user_id.trim()) {
      Alert.alert('Error', 'User ID is required');
      return false;
    }
    
    if (!userData.user_name.trim()) {
      Alert.alert('Error', 'User name is required');
      return false;
    }
    
    if (!userData.user_email.trim()) {
      Alert.alert('Error', 'User email is required');
      return false;
    }
    
    if (!userData.user_phone.trim()) {
      Alert.alert('Error', 'User phone is required');
      return false;
    }
    
    if (!phonePePaymentService.validateEmail(userData.user_email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (!phonePePaymentService.validatePhoneNumber(userData.user_phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return false;
    }
    
    if (!phonePePaymentService.validateAmount(parseFloat(amount))) {
      Alert.alert('Error', 'Amount must be between ₹1 and ₹10,00,000');
      return false;
    }
    
    return true;
  };

  const initiatePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    setCurrentStep('processing');
    
    try {
      const bookingId = `BOOKING_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const paymentRequest: PhonePeInitiateRequest = {
        booking_id: bookingId,
        amount: parseFloat(amount),
        currency: currency,
        merchant_transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        redirect_url: 'samya://payment/success',
        callback_url: 'samya://payment/callback',
        user_id: userData.user_id,
        user_name: userData.user_name,
        user_email: userData.user_email,
        user_phone: userData.user_phone,
        payment_instrument_type: 'PAY_PAGE',
        theme: 'DEFAULT',
        language: 'en'
      };
      
      const response = await phonePePaymentService.initiatePayment(paymentRequest);
      
      if (response.success && response.data) {
        setPaymentData(paymentRequest);
        setCurrentPayment({
          merchantTransactionId: response.data.merchant_transaction_id,
          initiatedResponse: response
        });
        
        setCurrentStep('redirecting');
        
        // Start polling for payment status
        startStatusPolling(response.data.merchant_transaction_id);
        
        // Redirect to PhonePe payment page
        await redirectToPaymentPage(response.data.instrument_response.redirect_info.url);
      } else {
        throw new Error(response.message || 'Failed to initiate payment');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      setCurrentStep('input');
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment');
      onPaymentFailure?.(error.message || 'Payment initiation failed');
    } finally {
      setLoading(false);
    }
  };

  const redirectToPaymentPage = async (paymentUrl: string) => {
    try {
      const supported = await Linking.canOpenURL(paymentUrl);
      
      if (supported) {
        await Linking.openURL(paymentUrl);
      } else {
        // Fallback: open in web browser
        const webUrl = paymentUrl.replace('phonepe://', 'https://www.phonepe.com/');
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening payment URL:', error);
      Alert.alert('Error', 'Unable to open payment page. Please try again.');
    }
  };

  const startStatusPolling = (merchantTransactionId: string) => {
    // Poll every 3 seconds
    statusPollingInterval.current = setInterval(async () => {
      try {
        const status = await phonePePaymentService.checkPaymentStatus({
          merchant_transaction_id: merchantTransactionId
        });
        
        if (status.success && status.data) {
          const paymentStatus = status.data.status;
          setPaymentStatus(paymentStatus);
          
          if (paymentStatus === 'SUCCESS') {
            clearInterval(statusPollingInterval.current!);
            setCurrentStep('verifying');
            await verifyPayment(merchantTransactionId, status.data.pg_transaction_id);
          } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
            clearInterval(statusPollingInterval.current!);
            setCurrentStep('completed');
            handlePaymentFailure(paymentStatus, status.data.response_message);
          }
        }
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 3000);
  };

  const checkPaymentStatus = async () => {
    if (!currentPayment?.merchantTransactionId) return;
    
    try {
      const status = await phonePePaymentService.checkPaymentStatus({
        merchant_transaction_id: currentPayment.merchantTransactionId
      });
      
      if (status.success && status.data) {
        const paymentStatus = status.data.status;
        setPaymentStatus(paymentStatus);
        
        if (paymentStatus === 'SUCCESS') {
          setCurrentStep('verifying');
          await verifyPayment(currentPayment.merchantTransactionId, status.data.pg_transaction_id);
        } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
          setCurrentStep('completed');
          handlePaymentFailure(paymentStatus, status.data.response_message);
        }
      }
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  const verifyPayment = async (merchantTransactionId: string, pgTransactionId: string) => {
    try {
      const verification = await phonePePaymentService.verifyAndCompletePayment(
        merchantTransactionId,
        pgTransactionId
      );
      
      if (verification.verified.data.is_verified) {
        setCurrentStep('completed');
        handlePaymentSuccess(verification);
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      setCurrentStep('completed');
      handlePaymentFailure('FAILED', 'Payment verification failed');
    }
  };

  const handlePaymentSuccess = (verification: any) => {
    Alert.alert(
      'Payment Successful! 🎉',
      'Your payment has been processed successfully.',
      [
        {
          text: 'OK',
          onPress: () => {
            onPaymentSuccess?.(verification);
            resetForm();
          }
        }
      ]
    );
  };

  const handlePaymentFailure = (status: string, message: string) => {
    const title = status === 'CANCELLED' ? 'Payment Cancelled' : 'Payment Failed';
    const messageText = status === 'CANCELLED' 
      ? 'Payment was cancelled by you.'
      : `Payment failed: ${message}`;
    
    Alert.alert(title, messageText, [
      {
        text: 'OK',
        onPress: () => {
          if (status === 'CANCELLED') {
            onPaymentCancelled?.();
          } else {
            onPaymentFailure?.(message);
          }
          resetForm();
        }
      }
    ]);
  };

  const resetForm = () => {
    setCurrentStep('input');
    setPaymentStatus('pending');
    setCurrentPayment(null);
    setPaymentData(null);
    if (statusPollingInterval.current) {
      clearInterval(statusPollingInterval.current);
    }
  };

  const cancelPayment = () => {
    if (statusPollingInterval.current) {
      clearInterval(statusPollingInterval.current);
    }
    setCurrentStep('input');
    setPaymentStatus('pending');
    setCurrentPayment(null);
    onPaymentCancelled?.();
  };

  const renderInputForm = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>💰 Payment Details</Text>
      
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Amount:</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="Enter amount"
          keyboardType="numeric"
          editable={currentStep === 'input'}
        />
        <Text style={styles.currencyText}>{currency}</Text>
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>User ID:</Text>
        <TextInput
          style={styles.input}
          value={userData.user_id}
          onChangeText={(text) => setUserData(prev => ({ ...prev, user_id: text }))}
          placeholder="Enter user ID"
          editable={currentStep === 'input'}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Name:</Text>
        <TextInput
          style={styles.input}
          value={userData.user_name}
          onChangeText={(text) => setUserData(prev => ({ ...prev, user_name: text }))}
          placeholder="Enter full name"
          editable={currentStep === 'input'}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Email:</Text>
        <TextInput
          style={styles.input}
          value={userData.user_email}
          onChangeText={(text) => setUserData(prev => ({ ...prev, user_email: text }))}
          placeholder="Enter email address"
          keyboardType="email-address"
          editable={currentStep === 'input'}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>Phone:</Text>
        <TextInput
          style={styles.input}
          value={userData.user_phone}
          onChangeText={(text) => setUserData(prev => ({ ...prev, user_phone: text }))}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          editable={currentStep === 'input'}
        />
      </View>

      <TouchableOpacity
        style={[styles.payButton, loading && styles.payButtonDisabled]}
        onPress={initiatePayment}
        disabled={loading}
      >
        <Text style={styles.payButtonText}>
          {loading ? '🔄 Processing...' : '💳 Pay with PhonePe'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessingStatus = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>🔄 Payment Processing</Text>
      
      <View style={styles.statusCard}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.statusText}>Initiating payment...</Text>
        <Text style={styles.amountText}>
          {phonePePaymentService.formatAmount(parseFloat(amount), currency)}
        </Text>
      </View>
    </View>
  );

  const renderRedirectingStatus = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>📱 Redirecting to PhonePe</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusIcon}>📱</Text>
        <Text style={styles.statusText}>Opening PhonePe payment page...</Text>
        <Text style={styles.amountText}>
          {phonePePaymentService.formatAmount(parseFloat(amount), currency)}
        </Text>
        
        <View style={styles.paymentInfo}>
          <Text style={styles.infoLabel}>Transaction ID:</Text>
          <Text style={styles.infoValue}>
            {phonePePaymentService.formatTransactionId(currentPayment?.merchantTransactionId || '')}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.cancelButton} onPress={cancelPayment}>
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVerifyingStatus = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>✅ Verifying Payment</Text>
      
      <View style={styles.statusCard}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.statusText}>Verifying payment details...</Text>
        <Text style={styles.amountText}>
          {phonePePaymentService.formatAmount(parseFloat(amount), currency)}
        </Text>
      </View>
    </View>
  );

  const renderCompletedStatus = () => (
    <View style={styles.statusSection}>
      <Text style={styles.sectionTitle}>
        {paymentStatus === 'SUCCESS' ? '🎉 Payment Successful' : '❌ Payment Failed'}
      </Text>
      
      <View style={[styles.statusCard, { 
        backgroundColor: paymentStatus === 'SUCCESS' ? '#E8F5E8' : '#FFEBEE' 
      }]}>
        <Text style={styles.statusIcon}>
          {paymentStatus === 'SUCCESS' ? '✅' : '❌'}
        </Text>
        <Text style={[styles.statusText, { 
          color: paymentStatus === 'SUCCESS' ? colors.primaryGreen : colors.primaryRed 
        }]}>
          {phonePePaymentService.getPaymentStatusDisplay(paymentStatus)}
        </Text>
        
        {currentPayment && (
          <View style={styles.paymentInfo}>
            <Text style={styles.infoLabel}>Transaction ID:</Text>
            <Text style={styles.infoValue}>
              {phonePePaymentService.formatTransactionId(currentPayment.merchantTransactionId)}
            </Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.resetButton} onPress={resetForm}>
          <Text style={styles.resetButtonText}>Make Another Payment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'input':
        return renderInputForm();
      case 'processing':
        return renderProcessingStatus();
      case 'redirecting':
        return renderRedirectingStatus();
      case 'verifying':
        return renderVerifyingStatus();
      case 'completed':
        return renderCompletedStatus();
      default:
        return renderInputForm();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📱 PhonePe Payment Gateway</Text>
      
      {renderCurrentStep()}
      
      {currentStep !== 'input' && (
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ℹ️ Payment Information</Text>
          <Text style={styles.infoText}>
            • Payment is processed securely through PhonePe
          </Text>
          <Text style={styles.infoText}>
            • You will be redirected to PhonePe for payment
          </Text>
          <Text style={styles.infoText}>
            • Payment status will be updated automatically
          </Text>
          <Text style={styles.infoText}>
            • You can cancel payment at any time
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 24,
  },
  formSection: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primaryText,
    width: 80,
    marginRight: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.primaryText,
    backgroundColor: colors.white,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 12,
  },
  payButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  payButtonDisabled: {
    backgroundColor: colors.secondaryText,
  },
  payButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusCard: {
    alignItems: 'center',
    padding: 20,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primaryGreen,
    marginBottom: 16,
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.secondaryText,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    fontFamily: 'monospace',
  },
  cancelButton: {
    backgroundColor: colors.primaryRed || '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    backgroundColor: colors.primaryBlue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
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
});

export default PhonePePaymentProcessor;
