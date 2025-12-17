import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Buffer } from 'buffer';
import crypto from 'crypto';
import { PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX } from '@env';
import { api } from './apiService';

// Types
interface PaymentWebhookPayload {
  transactionId: string;
  merchantTransactionId: string;
  amount: number;
  paymentState: string;
  responseCode: string;
  responseMessage: string;
  [key: string]: any;
}

interface InitiatePaymentParams {
  bookingId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  merchantId: string;
  merchantUserId: string;
  redirectUrl: string;
  callbackUrl: string;
}

// Constants
const PHONEPE_BASE_URL = __DEV__ 
  ? 'https://api-preprod.phonepe.com/apis/merchant-simulator' 
  : 'https://api.phonepe.com/apis/hermes';

export const paymentService = {
  // Verify PhonePe webhook signature
  verifyWebhookSignature: (payload: any, headers: any): boolean => {
    try {
      // In a real implementation, verify the webhook signature
      // For now, we'll just log the verification
      console.log('Webhook verification called with headers:', headers);
      return true; // In production, implement proper verification
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  },

  // Handle PhonePe webhook
  handlePhonePeWebhook: async (payload: PaymentWebhookPayload) => {
    try {
      console.log('Processing PhonePe webhook:', payload);
      
      // Update the booking status in your backend
      const response = await api.post('/bookings/update-payment-status', {
        transactionId: payload.transactionId,
        bookingId: payload.merchantTransactionId,
        amount: payload.amount / 100, // Convert to currency units
        status: paymentService.mapPaymentStatus(payload.paymentState || '', payload.responseCode || ''),
        paymentMethod: 'phonepe',
        rawResponse: JSON.stringify(payload)
      });

      return response.data;
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  },

  // Map PhonePe status to your application's status
  mapPaymentStatus: (paymentState: string, responseCode: string): string => {
    if (paymentState === 'COMPLETED' && responseCode === 'PAYMENT_SUCCESS') {
      return 'PAID';
    } else if (paymentState === 'FAILED' || responseCode === 'PAYMENT_ERROR') {
      return 'FAILED';
    } else if (paymentState === 'PENDING') {
      return 'PENDING';
    }
    return 'UNKNOWN';
  },

  // Get payment status for a booking
  getPaymentStatus: async (bookingId: string) => {
    try {
      const response = await api.get(`/bookings/${bookingId}/payment-status`);
      return response.data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  /**
   * Generate X-VERIFY header for PhonePe API requests
   */
  generateXVerifyHeader: function(base64Payload: string, apiPath: string = '/pg/v1/pay'): string {
    try {
      const stringToHash = base64Payload + apiPath + PHONEPE_SALT_KEY;
      const hash = crypto.createHash('sha256').update(stringToHash).digest('hex');
      return `${hash}###${PHONEPE_SALT_INDEX}`;
    } catch (error) {
      console.error('Error generating X-VERIFY header:', error);
      throw new Error('Failed to generate request signature');
    }
  },

  /**
   * Verify PhonePe callback signature
   */
  verifyCallbackSignature: function(response: string, xVerify: string): boolean {
    try {
      const expectedSignature = this.generateXVerifyHeader(response, '');
      return xVerify === expectedSignature;
    } catch (error) {
      console.error('Error verifying callback signature:', error);
      return false;
    }
  },

  /**
   * Initiate a payment with PhonePe
   */
  initiatePayment: async function(params: InitiatePaymentParams) {
    try {
      const { 
        bookingId, 
        amount, 
        customerId, 
        customerEmail, 
        customerPhone,
        merchantId,
        merchantUserId,
        redirectUrl,
        callbackUrl
      } = params;

      // Create payment request payload
      const payload = {
        merchantId,
        merchantTransactionId: `TXN_${Date.now()}_${bookingId}`,
        merchantUserId: merchantUserId || `USER_${customerId}`,
        amount: Math.round(amount * 100), // Convert to paise
        redirectUrl,
        redirectMode: 'POST',
        callbackUrl,
        mobileNumber: customerPhone,
        paymentInstrument: {
          type: 'PAY_PAGE',
        },
        deviceContext: {
          deviceOS: Platform.OS,
        },
        userInfo: {
          email: customerEmail,
          firstName: customerId,
        },
      };

      // Convert payload to base64
      const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
      
      // Generate X-VERIFY header
      const xVerify = this.generateXVerifyHeader(base64Payload);

      // Make API request to PhonePe
      const response = await fetch(`${PHONEPE_BASE_URL}/pg/v1/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
        },
        body: JSON.stringify({
          request: base64Payload,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to initiate payment');
      }

      return {
        ...responseData,
        paymentUrl: responseData.data.instrumentResponse.redirectInfo.url,
        transactionId: payload.merchantTransactionId,
      };
    } catch (error) {
      console.error('Error initiating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initiate payment';
      throw new Error(errorMessage);
    }
  },

  /**
   * Check payment status
   */
  checkPaymentStatus: async function(merchantTransactionId: string, merchantId: string) {
    try {
      const apiPath = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
      const xVerify = this.generateXVerifyHeader(apiPath);
      
      const response = await fetch(`${PHONEPE_BASE_URL}${apiPath}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': merchantId,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw new Error('Failed to check payment status');
    }
  },
};

export default paymentService;
