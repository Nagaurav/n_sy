import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';
import { makeApiRequest } from './apiService';
import { PaymentStatus } from '../types/payment';

export interface PhonePeInitiateRequest {
  amount: number;
  userId: string;
  merchantTransactionId: string;
  mobileNumber?: string;
  bookingDetails: {
    bookingId?: string;
    professionalId?: string;
    service?: string;
  };
}

export interface PhonePeInitiateResponse {
  success: boolean;
  data: {
    merchantId: string;
    merchantTransactionId: string;
    merchantUserId: string;
    amount: number;
    redirectUrl: string;
    redirectMode: string;
    mobileNumber?: string;
    paymentInstrument: {
      type: string;
      targetApp?: string;
    };
    callbackUrl: string;
  };
  message?: string;
}

export interface PhonePeStatusResponse {
  success: boolean;
  data: {
    status: PaymentStatus;
    transactionId: string;
    amount: number;
    timestamp: string;
  };
  message?: string;
}


export const checkPaymentStatus = async (
  bookingId: string
): Promise<PhonePeStatusResponse> => {
  try {
    const endpoint = API_CONFIG.ENDPOINTS.BOOKING.PAYMENT_STATUS.replace(':booking_id', bookingId);
    const response = await makeApiRequest<PhonePeStatusResponse>(endpoint, 'GET');
    // Ensure the response matches the expected type structure
    return {
      success: response.success,
      data: {
        status: response.data.status as PaymentStatus,
        transactionId: response.data.transactionId,
        amount: response.data.amount,
        timestamp: response.data.timestamp
      },
      message: response.message
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw new Error('Failed to check payment status. Please try again.');
  }
};

export const handlePaymentResponse = (response: any) => {
  // Handle the response from PhonePe SDK
  // This will be implemented based on PhonePe's SDK documentation
  console.log('Payment response:', response);
  return response;
};
