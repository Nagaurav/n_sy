// Types for PhonePe webhook handling

export interface PhonePeWebhookRequest {
  response: string;
  [key: string]: any;
}

export interface PhonePePaymentResponse {
  merchantTransactionId: string;
  transactionId: string;
  code: string;
  paymentId?: string;
  state?: string;
  responseCode?: string;
  message?: string;
  [key: string]: any;
}

export interface WebhookResponse {
  success: boolean;
  msg?: string;
  error?: string;
  errorId?: string;
  message?: string; // User-friendly message
  details?: any;    // Additional error details for debugging
  requestId?: string; // Unique ID for tracking the request
  timestamp?: string; // When the response was generated
}

export interface PaymentWithBooking {
  id: string;
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: Date;
  updated_at: Date;
  booking: {
    id: string;
    status: string;
    coupon_code?: string;
    professional?: {
      id: string;
      name: string;
      email: string;
    };
    user?: {
      id: string;
      name: string;
      email: string;
      phone?: string;
    };
  };
  [key: string]: any;
}

export const PAYMENT_STATUS_MAP: Record<string, string> = {
  'PAYMENT_SUCCESS': 'SUCCESS',
  'PAYMENT_ERROR': 'FAILED',
  'PAYMENT_PENDING': 'PENDING',
  'PAYMENT_DECLINED': 'FAILED',
  'TIMED_OUT': 'FAILED',
  'AUTHORIZATION_FAILED': 'FAILED',
  'AUTHENTICATION_FAILED': 'FAILED',
  'API_FAILED': 'FAILED',
  'BAD_REQUEST': 'FAILED'
};
