import { Request, Response } from 'express';
import crypto from 'crypto';
import { 
  PhonePeWebhookRequest, 
  PaymentTransaction,
  WebhookResponse
} from '../types/payment';
import { logger } from '../utils/logger';
import apiService, { api } from '../services/apiService';

// Extend the payment data type to include all required fields
interface PaymentInitiationData {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  email: string;
  phone: string;
  userId: string | number;
  professionalId: string | number;
  slotId: string | number;
  serviceType?: 'yoga_class' | 'consultation' | 'membership';
  duration?: number;
  couponCode?: string;
}

// Extend the API response type to include all possible fields
interface PaymentInitiationResponse {
  success: boolean;
  payment_url: string;
  transaction_id?: string; // Make transaction_id optional
  transactionId?: string;  // Also support camelCase
  order_id?: string;
  booking_id?: string;
  data?: any;
  [key: string]: any; // For any additional fields
}

// API Response type
type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
};

/**
 * Handles PhonePe payment webhook callbacks
 */
export const handlePhonePeWebhook = async (req: Request, res: Response<WebhookResponse>) => {
  // Input validation
  if (!req.body?.response) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required field: response' 
    });
  }

  const { response } = req.body as PhonePeWebhookRequest;
  const receivedChecksum = req.headers['x-verify'] as string;

  if (!receivedChecksum) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing X-Verify header' 
    });
  }

  try {
    // Verify checksum
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(response + process.env.PHONEPE_SALT_KEY)
      .digest('hex') + '###' + (process.env.PHONEPE_SALT_INDEX || '1');

    if (receivedChecksum !== calculatedChecksum) {
      logger.warn('Invalid checksum received', { 
        receivedChecksum, 
        calculatedChecksum 
      });
      return res.status(400).json({ 
        success: false,
        message: 'Invalid checksum' 
      });
    }

    // Parse and validate response
    let decodedResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    } catch (e) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid response format' 
      });
    }

    const { merchantTransactionId, code } = decodedResponse;

    if (!merchantTransactionId) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing merchantTransactionId in response' 
      });
    }

    try {
      // Forward the webhook to your backend API
      const response = await api.post<ApiResponse<{ success: boolean }>>(
        '/payments/webhook/phonepe',
        { 
          response: req.body.response,
          headers: {
            'x-verify': receivedChecksum
          }
        }
      );

      return res.status(200).json({ 
        success: response.data.success, 
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      logger.error('Error forwarding webhook to backend:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Error processing payment',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error: any) {
    logger.error('Error processing webhook:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get payment status by transaction ID
 */
export const getPaymentStatus = async (transactionId: string): Promise<ApiResponse<PaymentTransaction>> => {
  try {
    const response = await apiService.getPaymentStatus(transactionId);
    return {
      success: true,
      data: response
    };
  } catch (error: any) {
    logger.error('Error getting payment status:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment status',
    };
  }
};

/**
 * Initiate a payment
 */
export const initiatePayment = async (paymentData: {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  email: string;
  phone: string;
  userId: string | number;
  professionalId: string | number;
  slotId: string | number;
  serviceType?: 'yoga_class' | 'consultation' | 'membership';
  duration?: number;
  couponCode?: string;
}): Promise<ApiResponse<{ paymentUrl: string; transactionId: string }>> => {
  try {
    // Validate required fields
    if (!paymentData.amount || !paymentData.currency || !paymentData.orderId) {
      throw new Error('Missing required payment fields: amount, currency, and orderId are required');
    }
    
    // Calculate amount in the smallest currency unit (e.g., paise for INR)
    const amountInPaise = Math.round(paymentData.amount * 100); // Convert to paise

    // Create the booking and get the payment URL
    const response: PaymentInitiationResponse = await apiService.createBookingAndInitiatePayment({
      userId: paymentData.userId,
      professionalId: paymentData.professionalId,
      slotId: paymentData.slotId,
      serviceType: paymentData.serviceType || 'yoga_class',
      duration: paymentData.duration || 30,
      couponCode: paymentData.couponCode,
      metadata: {
        // Include payment details in metadata
        amount: amountInPaise,
        currency: paymentData.currency,
        orderId: paymentData.orderId,
        customerId: paymentData.customerId,
        email: paymentData.email,
        phone: paymentData.phone,
        serviceType: paymentData.serviceType,
        professionalId: paymentData.professionalId,
        slotId: paymentData.slotId
      }
    });
    
    // Check if we have a payment URL and either transaction_id or transactionId
    const transactionId = response.transaction_id || response.transactionId;
    if (!response.payment_url || !transactionId) {
      throw new Error('Invalid response from payment service: missing required fields');
    }

    return {
      success: true,
      data: {
        paymentUrl: response.payment_url,
        transactionId: transactionId,
        ...(response.order_id && { orderId: response.order_id }),
        ...(response.booking_id && { bookingId: response.booking_id })
      }
    };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to initiate payment';
    logger.error('Error initiating payment:', {
      error: errorMessage,
      paymentData: {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        currency: paymentData.currency
      },
      stack: error.stack
    });
    
    // Attempt to rollback coupon if payment fails and coupon was used
    if (paymentData.couponCode) {
      try {
        await handleCouponRollback(paymentData.couponCode);
      } catch (rollbackError) {
        logger.error('Failed to rollback coupon after payment failure:', {
          couponCode: paymentData.couponCode,
          error: rollbackError
        });
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      code: error.code || 'PAYMENT_INITIATION_FAILED'
    };
  }
};

/**
 * Handle coupon rollback by calling the backend API
 * @param couponCode - The coupon code to rollback
 * @returns Promise that resolves when the rollback is complete
 */
export const handleCouponRollback = async (couponCode: string): Promise<{ success: boolean; message?: string }> => {
  try {
    if (!couponCode) {
      logger.warn('Attempted to rollback empty coupon code');
      return { success: false, message: 'Coupon code is required' };
    }
    
    const response = await apiService.rollbackCoupon(couponCode);
    logger.info('Successfully rolled back coupon', { couponCode });
    return { success: true, message: 'Coupon rolled back successfully' };
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to rollback coupon';
    logger.error('Error rolling back coupon:', { 
      couponCode, 
      error: errorMessage,
      stack: error.stack 
    });
    
    // Return failure but don't throw, as this is a background operation
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};
