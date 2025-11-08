// Payment related types
export enum PaymentStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  // Add other statuses as needed
}

export interface PaymentInitiateResponse {
  success: boolean;
  data: {
    paymentUrl?: string;
    redirectUrl?: string;
    transactionId: string;
    merchantId: string;
    [key: string]: any; // Allow additional properties
  };
  message?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  data: {
    status: PaymentStatus;
    transactionId: string;
    amount: number;
    timestamp: string;
  };
  message?: string;
}
