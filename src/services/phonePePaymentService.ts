// phonePePaymentService.ts
// PhonePe payment service for SamyaYog app
import { makeApiRequest, API_CONFIG, PhonePeStatusResponse, PhonePeVerifyResponse } from '../config/api';

// Types
interface PhonePeInitiateRequest {
  amount: number;
  bookingId: string;
  userPhone: string;
  userEmail?: string;
  userName: string;
}

interface PhonePeInitiateResponse {
  success: boolean;
  message: string;
  data: {
    paymentUrl: string;
    transactionId: string;
    merchantTransactionId: string;
  };
}

interface PhonePeVerifyRequest {
  transactionId: string;
  merchantTransactionId: string;
}

interface PhonePeWebhookData {
  merchantTransactionId: string;
  transactionId: string;
  amount: number;
  status: string;
  responseCode: string;
  responseMessage: string;
  paymentInstrument: string;
}

class PhonePePaymentService {
  // Initiate PhonePe payment (local simulation for development)
  async initiatePayment(paymentData: PhonePeInitiateRequest): Promise<PhonePeInitiateResponse> {
    const mockResponse: PhonePeInitiateResponse = {
      success: true,
      message: 'Payment initiated successfully',
      data: {
        paymentUrl: `https://phonepe.com/pay?amount=${paymentData.amount}&booking=${paymentData.bookingId}`,
        transactionId: `TXN_${Date.now()}`,
        merchantTransactionId: paymentData.bookingId,
      },
    };

    return mockResponse;
  }

  // Check PhonePe payment status from backend
  async checkPaymentStatus(transactionId: string, merchantTransactionId: string): Promise<any> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.BOOKING.PAYMENT_STATUS.replace(':booking_id', merchantTransactionId),
        'GET'
      );
      
      return response;
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  // Verify PhonePe payment (local simulation for development)
  async verifyPayment(verifyData: PhonePeVerifyRequest): Promise<PhonePeVerifyResponse> {
    const mockResponse: PhonePeVerifyResponse = {
      success: true,
      message: 'Payment verified successfully',
      data: {
        merchant_id: 'MERCHANT_123',
        merchant_transaction_id: verifyData.merchantTransactionId,
        pg_transaction_id: verifyData.transactionId,
        amount: 1000,
        currency: 'INR',
        status: 'SUCCESS',
        is_verified: true,
        verification_signature: 'SIGNATURE_123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    return mockResponse;
  }

  // Process PhonePe webhook from backend
  async processWebhook(webhookData: PhonePeWebhookData): Promise<any> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.BOOKING.PHONEPE_WEBHOOK,
        'POST',
        webhookData
      );
      
      return response;
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      throw new Error(`Failed to process webhook: ${error.message}`);
    }
  }

  // NEW: Verify and complete payment (combines status check and verification)
  async verifyAndCompletePayment(
    merchantTransactionId: string, 
    pgTransactionId: string
  ): Promise<{
    status: PhonePeStatusResponse;
    verified: PhonePeVerifyResponse;
  }> {
    try {
      // First check the payment status
      const statusResponse = await this.checkPaymentStatus(pgTransactionId, merchantTransactionId);
      
      // Then verify the payment
      const verifyResponse = await this.verifyPayment({
        transactionId: pgTransactionId,
        merchantTransactionId: merchantTransactionId
      });

      return {
        status: statusResponse,
        verified: verifyResponse
      };
    } catch (error: any) {
      console.error('Error in verifyAndCompletePayment:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  // NEW: Get color for payment status
  getPaymentStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return '#2ECC40'; // Green
      case 'PENDING':
        return '#FF9800'; // Orange
      case 'FAILED':
        return '#F44336'; // Red
      case 'CANCELLED':
        return '#9E9E9E'; // Gray
      default:
        return '#9E9E9E'; // Default gray
    }
  }

  // NEW: Get display text for payment status
  getPaymentStatusDisplay(status: string): string {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'Payment Successful';
      case 'PENDING':
        return 'Payment Processing';
      case 'FAILED':
        return 'Payment Failed';
      case 'CANCELLED':
        return 'Payment Cancelled';
      default:
        return 'Unknown Status';
    }
  }

  // NEW: Format amount with currency
  formatAmount(amount: number, currency: string = 'INR'): string {
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  }

  // NEW: Format transaction ID for display
  formatTransactionId(transactionId: string): string {
    if (!transactionId) return 'N/A';
    if (transactionId.length <= 12) return transactionId;
    return `${transactionId.substring(0, 8)}...${transactionId.substring(transactionId.length - 4)}`;
  }

  // NEW: Get display text for payment instrument
  getPaymentInstrumentDisplay(instrumentType: string): string {
    switch (instrumentType?.toUpperCase()) {
      case 'UPI':
        return 'UPI Payment';
      case 'CARD':
        return 'Credit/Debit Card';
      case 'NETBANKING':
        return 'Net Banking';
      case 'WALLET':
        return 'Digital Wallet';
      default:
        return instrumentType || 'Unknown Method';
    }
  }

  // NEW: Get display text for response message
  getResponseMessageDisplay(responseCode: string, responseMessage: string): string {
    if (responseMessage) return responseMessage;
    
    switch (responseCode) {
      case '000':
        return 'Transaction Successful';
      case '001':
        return 'Transaction Failed';
      case '002':
        return 'Transaction Pending';
      case '003':
        return 'Transaction Cancelled';
      default:
        return responseCode || 'Unknown Response';
    }
  }
}

export const phonePePaymentService = new PhonePePaymentService();
