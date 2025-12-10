/**
 * PhonePe Webhook Request
 * @see https://developer.phonepe.com/docs/phonepe-for-merchants/webhooks
 */
export interface PhonePeWebhookRequest {
  /**
   * Base64 encoded payment response from PhonePe
   * Contains the complete payment details
   */
  response: string;
  
  /**
   * The X-VERIFY header value from the request
   * Used for checksum verification
   */
  xVerify?: string;
}

/**
 * PhonePe Payment Response
 * @see https://developer.phonepe.com/docs/phonepe-for-merchants/payment-response
 */
export interface PhonePeResponse {
  /** Unique merchant transaction ID */
  merchantTransactionId: string;
  
  /** Payment status code (e.g., PAYMENT_SUCCESS, PAYMENT_ERROR) */
  code: string;
  
  /** Payment status message */
  message?: string;
  
  /** PhonePe transaction ID */
  transactionId?: string;
  
  /** Payment amount in smallest currency unit (e.g., paise for INR) */
  amount?: number;
  
  /** Payment currency (e.g., "INR") */
  currency?: string;
  
  /** Payment method details */
  paymentInstrument?: {
    /** Payment method type (e.g., CARD, UPI, NETBANKING) */
    type: string;
    /** Last 4 digits for card, UPI ID for UPI, etc. */
    cardNumber?: string;
    /** Card network (for card payments) */
    cardNetwork?: string;
    /** Card issuer (for card payments) */
    cardIssuer?: string;
    /** Bank name (for netbanking/UPI) */
    bankName?: string;
  };
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Timestamp of the transaction */
  timestamp?: number;
  
  /** State of the transaction */
  state?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  
  /** Response code from the payment gateway */
  responseCode?: string;
  
  /** Allow additional properties */
  [key: string]: any;
}

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  booking_id: string;
  status: string;
  gateway_response?: any;
  booking?: {
    id: string;
    coupon_code?: string;
    status: string;
  };
}

export interface WebhookResponse {
  success: boolean;
  message: string;
  error?: string;
  details?: any;
}
