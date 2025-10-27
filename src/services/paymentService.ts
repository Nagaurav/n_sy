import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

interface PaymentWebhookPayload {
  transactionId: string;
  merchantTransactionId: string;
  amount: number;
  paymentState: string;
  responseCode: string;
  responseMessage: string;
  [key: string]: any;
}

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
        status: this.mapPaymentStatus(payload.paymentState, payload.responseCode),
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

  // Initiate a payment
  initiatePayment: async (params: {
    bookingId: string;
    amount: number;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
  }) => {
    try {
      const response = await api.post('/payments/initiate', {
        ...params,
        callbackUrl: `${process.env.API_BASE_URL}/api/v1/payments/webhook/phonepe`,
        redirectUrl: 'samyayog://payment-callback', // Your app's deep link
      });
      return response.data;
    } catch (error) {
      console.error('Error initiating payment:', error);
      throw error;
    }
  },
};

export default paymentService;
