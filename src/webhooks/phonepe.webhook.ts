import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../utils/logger';
import prisma from '../types/prisma';
import { 
  PhonePeWebhookRequest, 
  PhonePePaymentResponse, 
  WebhookResponse,
  PaymentWithBooking,
  PAYMENT_STATUS_MAP
} from '../types/phonepe';

// Extend the Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

import { Prisma, PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// Type for Prisma transaction
type PrismaTransaction = Omit<PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use">;

/**
 * Maps PhonePe status codes to our internal payment status
 */
function mapPaymentStatus(code: string, state?: string): 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'AUTHORIZED' | 'EXPIRED' | 'REVERSED' | 'INITIATED' | 'IN_PROGRESS' | 'TIMED_OUT' | 'UNKNOWN' {
  // Convert to uppercase for case-insensitive comparison
  const statusCode = (code || '').toUpperCase();
  const statusState = (state || '').toUpperCase();

  // Success states
  if (statusCode === 'PAYMENT_SUCCESS' || statusState === 'COMPLETED') {
    return 'SUCCESS';
  }

  // Pending states
  if ([
    'PAYMENT_PENDING',
    'PENDING',
    'INITIATED',
    'IN_PROGRESS',
    'AWAITING_PAYER_ACTION',
    'AWAITING_PROCESSING'
  ].includes(statusCode) || statusState === 'PENDING') {
    return 'PENDING';
  }

  // Failed states
  if ([
    'PAYMENT_ERROR',
    'PAYMENT_DECLINED',
    'AUTHENTICATION_FAILED',
    'AUTHORIZATION_FAILED',
    'CANCELLED',
    'REJECTED',
    'FAILED'
  ].includes(statusCode) || statusState === 'FAILED') {
    return 'FAILED';
  }

  // Refund states
  if (statusCode === 'REFUNDED' || statusState === 'REFUNDED') {
    return 'REFUNDED';
  }

  // Expired states
  if (statusCode === 'EXPIRED' || statusState === 'EXPIRED') {
    return 'EXPIRED';
  }

  // Default to UNKNOWN for any unhandled status
  return 'UNKNOWN';
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if a client has exceeded the rate limit
 * @param clientIp IP address of the client
 * @returns boolean indicating if the client is rate limited
 */
function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIp);

  if (!clientData) {
    rateLimitStore.set(clientIp, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    });
    return false;
  }

  // Reset the counter if the window has passed
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return false;
  }

  // Increment the counter and check against the limit
  clientData.count++;
  return clientData.count > RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Creates a standardized error response
 */
function createErrorResponse(
  statusCode: number,
  message: string,
  errorDetails?: any,
  requestId?: string
): { status: number; response: WebhookResponse } {
  const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    status: statusCode,
    response: {
      success: false,
      error: message,
      errorId,
      message: statusCode === 500 ? 'Internal server error' : message,
      details: process.env.NODE_ENV === 'production' ? undefined : errorDetails,
      requestId,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Handles PhonePe payment webhook callbacks
 * Verifies the request signature, processes the payment status,
 * and updates the relevant records in the database
 */
export const handlePhonePeWebhook = async (req: Request<{}, {}, PhonePeWebhookRequest>, res: Response<WebhookResponse>) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // Log the incoming request
  logger.info('Received webhook request', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'user-agent': req.headers['user-agent']
    },
    timestamp: new Date().toISOString()
  });

  // Rate limiting
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    logger.warn('Rate limit exceeded', { requestId, clientIp });
    return res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  try {
    // 1. Validate request method
    if (req.method !== 'POST') {
      logger.warn('Invalid HTTP method for webhook', { 
        requestId, 
        method: req.method 
      });
      const { status, response } = createErrorResponse(
        405, 
        'Method not allowed',
        { allowedMethods: ['POST'] },
        requestId
      );
      return res.status(status).json(response);
    }

    // 2. Validate required environment variables
    const { PHONEPE_SALT_KEY, PHONEPE_SALT_INDEX } = process.env;
    if (!PHONEPE_SALT_KEY || !PHONEPE_SALT_INDEX) {
      const error = new Error('Missing required environment variables');
      logger.error('Configuration error', { 
        requestId, 
        error: error.message,
        missingVariables: [
          PHONEPE_SALT_KEY ? null : 'PHONEPE_SALT_KEY',
          PHONEPE_SALT_INDEX ? null : 'PHONEPE_SALT_INDEX'
        ].filter(Boolean)
      });
      
      const { status, response } = createErrorResponse(
        500,
        'Server configuration error',
        { error: error.message },
        requestId
      );
      return res.status(status).json(response);
    }

    // 3. Validate request body
    const { response: responseData } = req.body;
    if (!responseData) {
      logger.warn('Missing response in webhook payload', { requestId });
      const { status, response } = createErrorResponse(
        400,
        'Missing response in payload',
        { field: 'response' },
        requestId
      );
      return res.status(status).json(response);
    }
    
    // 4. Verify checksum
    const receivedChecksum = req.headers['x-verify'] as string;
    if (!receivedChecksum) {
      logger.warn('Missing X-VERIFY header in request', { requestId });
      const { status, response } = createErrorResponse(
        400,
        'Missing X-VERIFY header',
        { header: 'x-verify' },
        requestId
      );
      return res.status(status).json(response);
    }
    
    // Calculate and verify checksum
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(responseData + PHONEPE_SALT_KEY)
      .digest('hex') + '###' + PHONEPE_SALT_INDEX;

    if (receivedChecksum !== calculatedChecksum) {
      logger.warn('Invalid checksum received', { 
        requestId,
        receivedPrefix: receivedChecksum.substring(0, 10) + '...',
        calculatedPrefix: calculatedChecksum.substring(0, 10) + '...',
        receivedLength: receivedChecksum.length,
        calculatedLength: calculatedChecksum.length
      });
      
      const { status, response } = createErrorResponse(
        400,
        'Invalid checksum',
        {
          checksumValid: false,
          receivedLength: receivedChecksum.length,
          expectedLength: calculatedChecksum.length
        },
        requestId
      );
      return res.status(status).json(response);
    }

    // 5. Parse and validate the response
    let decodedResponse: PhonePePaymentResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(responseData, 'base64').toString('utf-8'));
      logger.info('Successfully parsed webhook response', {
        requestId,
        merchantTransactionId: decodedResponse.merchantTransactionId,
        transactionId: decodedResponse.transactionId,
        code: decodedResponse.code
      });
    } catch (error) {
      logger.error('Failed to parse webhook response', { 
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseData: String(responseData).substring(0, 200) + '...'
      });
      
      const { status, response } = createErrorResponse(
        400,
        'Invalid response format',
        { 
          error: error instanceof Error ? error.message : 'Unknown error',
          responseSample: String(responseData).substring(0, 200) + '...'
        },
        requestId
      );
      return res.status(status).json(response);
    }

    const { merchantTransactionId, code, paymentId, state, responseCode, message } = decodedResponse;
    
    if (!merchantTransactionId) {
      logger.warn('Missing merchantTransactionId in webhook', { 
        requestId,
        decodedResponse: JSON.stringify(decodedResponse, null, 2).substring(0, 200) + '...' 
      });
      
      const { status, response } = createErrorResponse(
        400,
        'Missing merchant transaction ID',
        { field: 'merchantTransactionId' },
        requestId
      );
      return res.status(status).json(response);
    }

    // Log the incoming webhook data
    logger.info('Processing webhook', { 
      requestId,
      merchantTransactionId,
      paymentId,
      code,
      state,
      responseCode,
      message: message?.substring(0, 100) + (message?.length > 100 ? '...' : '')
    });

    // 6. Process the payment status
    let transaction: PrismaTransaction | null = null;
    
    try {
      // Start a database transaction
      transaction = await prisma.$transaction(
        async (tx) => {
          // 6.1. Find the payment record
          const payment = await tx.payment.findUnique({
            where: { transaction_id: merchantTransactionId },
            include: { booking: true }
          });

          if (!payment) {
            logger.error('Payment not found', { requestId, merchantTransactionId });
            throw new Error(`Payment not found for transaction ID: ${merchantTransactionId}`);
          }

          // 6.2. Check if payment is already processed
          if (payment.status === 'SUCCESS') {
            logger.info('Payment already processed', { 
              requestId, 
              paymentId: payment.id,
              status: payment.status 
            });
            return { 
              payment, 
              isDuplicate: true,
              message: 'Payment already processed successfully' 
            };
          }

          // 6.3. Update payment status based on PhonePe response
          const paymentStatus = mapPaymentStatus(code, state);
          const updateData: any = {
            status: paymentStatus,
            gateway_response: decodedResponse,
            updated_at: new Date()
          };

          // Add payment ID and timestamp if this is a success response
          if (paymentId) {
            updateData.gateway_payment_id = paymentId;
            updateData.paid_at = new Date();
          }

          // 6.4. Update the payment record
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: updateData,
            include: { booking: true }
          });

          // 6.5. If payment is successful, update the booking status
          if (paymentStatus === 'SUCCESS' && updatedPayment.booking) {
            await tx.booking.update({
              where: { id: updatedPayment.booking.id },
              data: { 
                status: 'CONFIRMED',
                payment_status: 'PAID',
                updated_at: new Date()
              }
            });

            // TODO: Trigger any post-payment actions (emails, notifications, etc.)
            logger.info('Booking confirmed after successful payment', {
              requestId,
              bookingId: updatedPayment.booking.id,
              paymentId: updatedPayment.id
            });
          }

          return { 
            payment: updatedPayment, 
            isDuplicate: false,
            message: 'Payment processed successfully' 
          };
        },
        {
          maxWait: 10000, // 10 seconds
          timeout: 30000, // 30 seconds
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
        }
      );

      // 7. Log success and send response
      const responseTime = Date.now() - startTime;
      logger.info('Webhook processed successfully', {
        requestId,
        merchantTransactionId,
        paymentId: transaction.payment.id,
        status: transaction.payment.status,
        responseTime: `${responseTime}ms`
      });

      return res.status(200).json({
        success: true,
        requestId,
        message: transaction.message,
        isDuplicate: transaction.isDuplicate,
        payment: {
          id: transaction.payment.id,
          status: transaction.payment.status,
          amount: transaction.payment.amount,
          currency: transaction.payment.currency,
          bookingId: transaction.payment.booking_id
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      // Log the error with as much context as possible
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      logger.error('Error processing webhook', {
        requestId,
        merchantTransactionId,
        error: errorMessage,
        stack: errorStack,
        response: JSON.stringify(decodedResponse, null, 2).substring(0, 500) + '...'
      });

      // Send error response
      const { status, response } = createErrorResponse(
        500,
        'Failed to process payment',
        { 
          error: errorMessage,
          requestId,
          timestamp: new Date().toISOString()
        },
        requestId
      );
      
      return res.status(status).json(response);
    } finally {
      // Clean up any resources if needed
      if (transaction) {
        // End any open database connections
        await prisma.$disconnect().catch(error => {
          logger.error('Error disconnecting Prisma client', { 
            requestId,
            error: error.message 
          });
        });
      }
      
      // Log the total request processing time
      const totalTime = Date.now() - startTime;
      logger.info('Webhook request completed', {
        requestId,
        processingTime: `${totalTime}ms`,
        status: res.statusCode
      });
    }
      merchantTransactionId,
      code,
      paymentId,
      timestamp: new Date().toISOString()
    });

    // Find the payment record with transaction locking to prevent race conditions
    const paymentRecord = await prisma.$transaction(async (tx: PrismaTransaction) => {
      const record = await tx.payment_transaction.findUnique({
        where: { transaction_id: merchantTransactionId },
        include: { 
          booking: {
            include: {
              professional: {
                select: { name: true, email: true }
              },
              user: {
                select: { name: true, email: true, phone: true }
              }
            }
          } 
        }
      });
      
      if (!record) {
        logger.warn('Payment record not found', { merchantTransactionId });
        return null;
      }
      
      // If payment is already processed, skip further processing
      if (['SUCCESS', 'FAILED'].includes(record.status)) {
        logger.info('Payment already processed', { 
          transactionId: merchantTransactionId,
          currentStatus: record.status
        });
        return record;
      }
      
      return record;
    });

    if (!paymentRecord) {
      logger.warn('Payment record not found', { merchantTransactionId });
      return res.status(404).json({ success: false, msg: 'Payment record not found' });
    }

    // Map PhonePe status to our system status
    const status = PAYMENT_STATUS_MAP[code] || 'PENDING';
    const isSuccess = status === 'SUCCESS';
    
    try {
      // Use a single transaction for all database updates
await prisma.$transaction(async (tx: PrismaTransaction) => {
        // Update payment transaction
        await tx.payment_transaction.update({
          where: { id: paymentRecord.id },
          data: { 
            status,
            gateway_payment_id: paymentId,
            gateway_response: decodedResponse as any, // Store full response for debugging
            updated_at: new Date()
          }
        });

        // Update booking status based on payment status
        const updateBooking = tx.booking.update({
          where: { id: paymentRecord.booking_id },
          data: { 
            status: isSuccess ? 'CONFIRMED' : 'CANCELLED',
            updated_at: new Date(),
            ...(isSuccess ? { confirmed_at: new Date() } : { cancelled_at: new Date() })
          },
          include: { professional: true, user: true }
        });

        // If payment failed, handle slot and coupon rollback
        if (!isSuccess) {
          // Mark slot as available again if applicable
          if (paymentRecord.booking?.slot_id) {
            await tx.consultation_slot.update({
              where: { id: paymentRecord.booking.slot_id },
              data: { is_available: true }
            });
          }

          // Handle coupon rollback if applicable
          if (paymentRecord.booking?.coupon_code) {
            const couponCode = paymentRecord.booking.coupon_code;
            
            // Check in professional_coupons first
            const profCoupon = await tx.professional_coupon.findFirst({
              where: { coupon_code: couponCode }
            });

            if (profCoupon) {
              await tx.professional_coupon.update({
                where: { id: profCoupon.id },
                data: { 
                  current_redemptions: { decrement: 1 },
                  updated_at: new Date()
                }
              });
              logger.info('Reverted professional coupon redemption', { couponCode });
            } else {
              // Fall back to global coupons
              const globalCoupon = await tx.coupon.findUnique({
                where: { coupon_code: couponCode }
              });

              if (globalCoupon) {
                await tx.coupon.update({
                  where: { id: globalCoupon.id },
                  data: { 
                    current_redemptions: { decrement: 1 },
                    updated_at: new Date()
                  }
                });
                logger.info('Reverted global coupon redemption', { couponCode });
              }
            }
          }
        }

        const updatedBooking = await updateBooking;
        
        // Log the successful update
        logger.info(`Payment ${status.toLowerCase()} for booking`, {
          bookingId: updatedBooking.id,
          paymentId: paymentRecord.id,
          status,
          amount: paymentRecord.amount,
          currency: paymentRecord.currency,
          customerEmail: updatedBooking.user_email,
          professionalId: updatedBooking.professional_id,
          durationMs: Date.now() - startTime
        });

        // TODO: Trigger async notifications (email/SMS)
        // This should be handled by a separate background job/queue
        if (isSuccess) {
          // Trigger confirmation email/notification
          await triggerConfirmationEmail(updatedBooking);
        } else {
          // Trigger payment failed notification
          await triggerPaymentFailedEmail(updatedBooking, decodedResponse);
        }
      });

      return res.status(200).json({ 
        success: true, 
        msg: `Payment ${status.toLowerCase()} processed successfully` 
      });

    } catch (error) {
      logger.error('Error processing payment update', {
        error,
        transactionId: merchantTransactionId,
        paymentId: paymentRecord.id,
        status
      });
      throw error; // Let the outer catch handle this
    }
  } catch (error) {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Webhook processing failed', {
      errorId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      request: {
        method: req.method,
        url: req.originalUrl,
        headers: {
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'user-agent': req.headers['user-agent']
        }
      },
      durationMs: Date.now() - startTime
    });

    // Return error response without exposing sensitive information
    return res.status(500).json({ 
      success: false, 
      msg: 'Error processing webhook',
      errorId,
      ...(process.env.NODE_ENV === 'development' ? { error: errorMessage } : {})
    });
  } finally {
    try {
      await prisma.$disconnect();
    } catch (e) {
      logger.error('Error disconnecting from database', { error: e });
    }
  }
};

// Helper function to trigger confirmation email (implement as needed)
async function triggerConfirmationEmail(booking: any) {
  try {
    // TODO: Implement email sending logic
    // This should be moved to a separate service/queue
    logger.info('Sending confirmation email', { bookingId: booking.id });
  } catch (error) {
    logger.error('Failed to send confirmation email', { 
      bookingId: booking.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}

// Helper function to trigger payment failed email (implement as needed)
async function triggerPaymentFailedEmail(booking: any, errorDetails: any) {
  try {
    // TODO: Implement email sending logic for failed payments
    logger.info('Sending payment failed email', { 
      bookingId: booking.id,
      errorCode: errorDetails?.code,
      errorMessage: errorDetails?.message
    });
  } catch (error) {
    logger.error('Failed to send payment failed email', { 
      bookingId: booking.id, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}
