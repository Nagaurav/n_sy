import axios from 'axios';
import { Alert, Linking } from 'react-native';

// PhonePe Configuration
const PHONEPE_CONFIG = {
  MERCHANT_ID: 'PGTESTPAYUAT', // Replace with your actual merchant ID
  SALT_KEY: '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399', // Replace with your actual salt key
  SALT_INDEX: '1', // Replace with your actual salt index
  BASE_URL: 'https://api-preprod.phonepe.com/apis/pg-sandbox', // Use production URL for live
  REDIRECT_URL: 'https://webhook.site/redirect-url', // Your redirect URL
  CALLBACK_URL: 'https://webhook.site/callback-url', // Your callback URL
  BACKEND_URL: 'http://88.222.241.179:7000/api/v1/user/consultation-booking', // Your backend URL
};

// Generate SHA256 hash using crypto-js (React Native compatible)
const generateSHA256 = (input: string): string => {
  // For React Native, we'll use a simple hash function
  // In production, you should use a proper crypto library
  let hash = 0;
  if (input.length === 0) return hash.toString();
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
};

// Generate X-VERIFY header for PhonePe API
const generateXVerifyHeader = (payload: any, saltKey: string, saltIndex: string): string => {
  const payloadString = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadString).toString('base64');
  const string = base64Payload + '/pg/v1/pay' + saltKey;
  const sha256 = generateSHA256(string);
  const checksum = sha256 + '###' + saltIndex;
  return checksum;
};

// Generate X-VERIFY header for status check
const generateXVerifyHeaderForStatus = (merchantId: string, merchantTransactionId: string, saltKey: string, saltIndex: string): string => {
  const string = '/pg/v1/status/' + merchantId + '/' + merchantTransactionId + saltKey;
  const sha256 = generateSHA256(string);
  const checksum = sha256 + '###' + saltIndex;
  return checksum;
};

// Initialize PhonePe payment through your backend
export const startPhonePePayment = async (
  bookingId: string, 
  amount: number, 
  userPhone?: string,
  userName?: string
): Promise<boolean> => {
  try {
    // First, create the booking through your backend
    const bookingPayload = {
      user_id: 'USER123', // TODO: Replace with actual user ID from context or props
      professional_id: bookingId, // This should be the consultant ID
      consultation_type: 'online', // Default or from form
      preferred_date: new Date().toISOString().split('T')[0], // Default or from form
      preferred_time: '10:00', // Default or from form
      problem: 'General consultation', // Default or from form
      payment_mode: 'phonepe',
      amount: amount,
      user_phone: userPhone,
      user_name: userName,
    };

    // Create booking in your backend
    const bookingResponse = await axios.post(
      `${PHONEPE_CONFIG.BACKEND_URL}/create`,
      bookingPayload
    );

    if (!bookingResponse.data?.booking_id) {
      throw new Error('Failed to create booking');
    }

    const actualBookingId = bookingResponse.data.booking_id;
    const amountInPaise = Math.round(amount * 100); // Convert to paise
    
    // Create the payment request payload for PhonePe
    const payload = {
      merchantId: PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId: actualBookingId,
      amount: amountInPaise,
      redirectUrl: PHONEPE_CONFIG.REDIRECT_URL,
      redirectMode: 'POST',
      callbackUrl: PHONEPE_CONFIG.CALLBACK_URL,
      merchantUserId: 'MUID' + Date.now(),
      mobileNumber: userPhone || '9999999999',
      paymentInstrument: {
        type: 'PAY_PAGE'
      }
    };

    // Generate X-VERIFY header
    const xVerifyHeader = generateXVerifyHeader(
      payload, 
      PHONEPE_CONFIG.SALT_KEY, 
      PHONEPE_CONFIG.SALT_INDEX
    );

    // Make API call to PhonePe to get payment URL
    const response = await axios.post(
      `${PHONEPE_CONFIG.BASE_URL}/pg/v1/pay`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
        }
      }
    );

    console.log('PhonePe API Response:', response.data);

    if (response.data && response.data.data && response.data.data.instrumentResponse) {
      const paymentUrl = response.data.data.instrumentResponse.redirectInfo.url;
      
      // Open PhonePe payment page in device browser
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        Alert.alert(
          'Payment Initiated',
          'PhonePe payment page has been opened. Please complete the payment and return to the app.',
          [{ text: 'OK' }]
        );
        return true;
      } else {
        Alert.alert('Error', 'Cannot open PhonePe payment page. Please try again.');
        return false;
      }
    } else {
      throw new Error('Invalid response from PhonePe');
    }

  } catch (error: any) {
    console.log('PhonePe payment error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Payment failed. Please try again.';
    Alert.alert('Payment Error', errorMessage);
    return false;
  }
};

// Check payment status through your backend
export const checkPhonePePaymentStatus = async (bookingId: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${PHONEPE_CONFIG.BACKEND_URL}/payment-status/${bookingId}`
    );

    console.log('Payment Status Response:', response.data);
    return response.data;

  } catch (error: any) {
    console.log('Payment status check error:', error);
    throw error;
  }
};

// Direct PhonePe status check (if needed)
export const checkPhonePeStatusDirect = async (merchantTransactionId: string): Promise<any> => {
  try {
    const xVerifyHeader = generateXVerifyHeaderForStatus(
      PHONEPE_CONFIG.MERCHANT_ID,
      merchantTransactionId,
      PHONEPE_CONFIG.SALT_KEY,
      PHONEPE_CONFIG.SALT_INDEX
    );

    const response = await axios.get(
      `${PHONEPE_CONFIG.BASE_URL}/pg/v1/status/${PHONEPE_CONFIG.MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerifyHeader,
          'X-MERCHANT-ID': PHONEPE_CONFIG.MERCHANT_ID,
        }
      }
    );

    console.log('PhonePe Direct Status Response:', response.data);
    return response.data;

  } catch (error: any) {
    console.log('PhonePe direct status check error:', error);
    throw error;
  }
};

// Get PhonePe configuration for different environments
export const getPhonePeConfig = (environment: 'sandbox' | 'production' = 'sandbox') => {
  if (environment === 'production') {
    return {
      ...PHONEPE_CONFIG,
      BASE_URL: 'https://api.phonepe.com/apis/hermes',
      MERCHANT_ID: 'YOUR_PRODUCTION_MERCHANT_ID',
      SALT_KEY: 'YOUR_PRODUCTION_SALT_KEY',
    };
  }
  return PHONEPE_CONFIG;
};

// Handle PhonePe webhook response
export const handlePhonePeWebhook = (webhookData: any) => {
  console.log('PhonePe Webhook Data:', webhookData);
  
  // Extract relevant information from webhook
  const {
    merchantId,
    merchantTransactionId,
    transactionId,
    amount,
    status,
    paymentInstrument,
    responseCode,
    responseMessage
  } = webhookData;

  // Handle different payment statuses
  switch (status) {
    case 'PAYMENT_SUCCESS':
      console.log('Payment successful for booking:', merchantTransactionId);
      return { success: true, bookingId: merchantTransactionId, status: 'PAID' };
    
    case 'PAYMENT_ERROR':
      console.log('Payment failed for booking:', merchantTransactionId);
      return { success: false, bookingId: merchantTransactionId, status: 'FAILED', error: responseMessage };
    
    case 'PAYMENT_DECLINED':
      console.log('Payment declined for booking:', merchantTransactionId);
      return { success: false, bookingId: merchantTransactionId, status: 'DECLINED', error: responseMessage };
    
    default:
      console.log('Unknown payment status:', status);
      return { success: false, bookingId: merchantTransactionId, status: 'UNKNOWN', error: responseMessage };
  }
}; 