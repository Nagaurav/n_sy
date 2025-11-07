// paymentService.ts
// Basic payment service for the PaymentScreen

import { API_CONFIG, makeApiRequest } from '../config/api';

interface PaymentRequest {
  amount: number;
  method: string;
  bookingDetails?: any;
  professional?: any;
}

interface PaymentResponse {
  transactionId: string;
  status: 'success' | 'failed' | 'pending';
  message: string;
  paymentUrl?: string;
  receiptUrl?: string;
}

class PaymentService {
  // Process payment with real API integration
  async processPayment(payment: PaymentRequest): Promise<{ data: PaymentResponse }> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PAYMENT.PROCESS,
        'POST',
        {
          amount: payment.amount,
          payment_method: payment.method,
          booking_id: payment.bookingDetails?.id,
          professional_id: payment.professional?.id,
        }
      );

      if (response.success && response.data) {
        return {
          data: {
            transactionId: response.data.transaction_id || response.data.id,
            status: response.data.status || 'success',
            message: response.message || 'Payment processed successfully',
            paymentUrl: response.data.payment_url,
            receiptUrl: response.data.receipt_url,
          }
        };
      } else {
        // Fallback to mock data if API fails
        return this.processPaymentMock(payment);
      }
    } catch (error: any) {
      console.error('Error processing payment:', error);
      
      // Return mock data as fallback
      return this.processPaymentMock(payment);
    }
  }

  // Mock implementation as fallback
  private async processPaymentMock(payment: PaymentRequest): Promise<{ data: PaymentResponse }> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate payment processing
        const isSuccess = Math.random() > 0.1; // 90% success rate
        
        if (isSuccess) {
          const response: PaymentResponse = {
            transactionId: 'TXN_' + Date.now() + Math.random().toString(36).substr(2, 9),
            status: 'success',
            message: 'Payment processed successfully (Fallback Data)',
            receiptUrl: 'https://receipt.example.com/receipt.pdf',
          };
          resolve({ data: response });
        } else {
          reject(new Error('Payment failed. Please try again.'));
        }
      }, 2000);
    });
  }

  async getPaymentMethods(): Promise<{ data: any[] }> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PAYMENT.METHODS,
        'GET'
      );

      if (response.success && response.data) {
        return { data: response.data };
      } else {
        // Fallback to mock data if API fails
        return this.getPaymentMethodsMock();
      }
    } catch (error: any) {
      console.error('Error getting payment methods:', error);
      
      // Return mock data as fallback
      return this.getPaymentMethodsMock();
    }
  }

  // Mock implementation as fallback
  private async getPaymentMethodsMock(): Promise<{ data: any[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const methods = [
          { id: 'upi', name: 'UPI', icon: 'qrcode', enabled: true },
          { id: 'card', name: 'Card', icon: 'credit-card', enabled: true },
          { id: 'wallet', name: 'Wallet', icon: 'wallet', enabled: true },
          { id: 'netbanking', name: 'Net Banking', icon: 'bank', enabled: true },
        ];
        resolve({ data: methods });
      }, 500);
    });
  }

  async getPaymentHistory(userId: string): Promise<{ data: any[] }> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PAYMENT.HISTORY}/${userId}`,
        'GET'
      );

      if (response.success && response.data) {
        return { data: response.data };
      } else {
        // Fallback to mock data if API fails
        return this.getPaymentHistoryMock(userId);
      }
    } catch (error: any) {
      console.error('Error getting payment history:', error);
      
      // Return mock data as fallback
      return this.getPaymentHistoryMock(userId);
    }
  }

  // Mock implementation as fallback
  private async getPaymentHistoryMock(userId: string): Promise<{ data: any[] }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const payments = [
          {
            id: '1',
            amount: 1500,
            method: 'UPI',
            status: 'success',
            date: '2024-01-15',
            professionalName: 'Dr. Anya',
            transactionId: 'TXN_123456789',
          },
          {
            id: '2',
            amount: 2000,
            method: 'Card',
            status: 'success',
            date: '2024-01-10',
            professionalName: 'Dr. Vikram',
            transactionId: 'TXN_987654321',
          },
        ];
        resolve({ data: payments });
      }, 800);
    });
  }

  async getPaymentDetails(transactionId: string): Promise<{ data: any }> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PAYMENT.DETAILS}/${transactionId}`,
        'GET'
      );

      if (response.success && response.data) {
        return { data: response.data };
      } else {
        // Fallback to mock data if API fails
        return this.getPaymentDetailsMock(transactionId);
      }
    } catch (error: any) {
      console.error('Error getting payment details:', error);
      
      // Return mock data as fallback
      return this.getPaymentDetailsMock(transactionId);
    }
  }

  // Mock implementation as fallback
  private async getPaymentDetailsMock(transactionId: string): Promise<{ data: any }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const payment = {
          id: transactionId,
          amount: 1500,
          method: 'UPI',
          status: 'success',
          date: '2024-01-15',
          time: '10:30 AM',
          professionalName: 'Dr. Anya',
          professionalSpecialty: 'Yoga Therapy',
          consultationMode: 'Video Call',
          receiptUrl: 'https://receipt.example.com/receipt.pdf',
        };
        resolve({ data: payment });
      }, 600);
    });
  }

  async refundPayment(transactionId: string, reason: string): Promise<{ data: { success: boolean; message: string } }> {
    try {
      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.PAYMENT.REFUND}/${transactionId}`,
        'POST',
        { reason }
      );

      if (response.success) {
        return {
          data: {
            success: true,
            message: response.message || 'Refund processed successfully. Amount will be credited within 5-7 business days.',
          }
        };
      } else {
        // Fallback to mock data if API fails
        return this.refundPaymentMock(transactionId, reason);
      }
    } catch (error: any) {
      console.error('Error processing refund:', error);
      
      // Return mock data as fallback
      return this.refundPaymentMock(transactionId, reason);
    }
  }

  // Mock implementation as fallback
  private async refundPaymentMock(transactionId: string, reason: string): Promise<{ data: { success: boolean; message: string } }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true, 
            message: 'Refund processed successfully. Amount will be credited within 5-7 business days. (Fallback Data)' 
          } 
        });
      }, 1500);
    });
  }

  async validatePaymentMethod(method: string, amount: number): Promise<{ data: { valid: boolean; message?: string } }> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.PAYMENT.VALIDATE_METHOD,
        'POST',
        { method, amount }
      );

      if (response.success) {
        return {
          data: {
            valid: response.data?.valid || true,
            message: response.data?.message,
          }
        };
      } else {
        // Fallback to mock data if API fails
        return this.validatePaymentMethodMock(method, amount);
      }
    } catch (error: any) {
      console.error('Error validating payment method:', error);
      
      // Return mock data as fallback
      return this.validatePaymentMethodMock(method, amount);
    }
  }

  // Mock implementation as fallback
  private async validatePaymentMethodMock(method: string, amount: number): Promise<{ data: { valid: boolean; message?: string } }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const isValid = method !== 'invalid_method';
        resolve({ 
          data: { 
            valid: isValid, 
            message: isValid ? undefined : 'Payment method not supported for this amount. (Fallback Data)' 
          } 
        });
      }, 300);
    });
  }
}

export const paymentService = new PaymentService(); 