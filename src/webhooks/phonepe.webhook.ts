import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const handlePhonePeWebhook = async (req: Request, res: Response) => {
  try {
    const { response } = req.body;
    
    // Verify checksum
    const receivedChecksum = req.headers['x-verify'] as string;
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(response + process.env.PHONEPE_SALT_KEY)
      .digest('hex') + '###' + process.env.PHONEPE_SALT_INDEX;

    if (receivedChecksum !== calculatedChecksum) {
      console.error('Invalid checksum received');
      return res.status(400).json({ success: false, msg: 'Invalid checksum' });
    }

    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    const { merchantTransactionId, code, paymentId } = decodedResponse;

    // Find the payment record
    const paymentRecord = await prisma.payment_transaction.findUnique({
      where: { transaction_id: merchantTransactionId },
      include: { booking: true }
    });

    if (!paymentRecord) {
      console.error('Payment record not found:', merchantTransactionId);
      return res.status(404).json({ success: false, msg: 'Payment record not found' });
    }

    // Handle successful payment
    if (code === 'PAYMENT_SUCCESS') {
      await prisma.$transaction([
        // Update payment status
        prisma.payment_transaction.update({
          where: { id: paymentRecord.id },
          data: { 
            status: 'SUCCESS',
            gateway_payment_id: paymentId,
            gateway_response: decodedResponse,
            updated_at: new Date()
          }
        }),
        // Update booking status
        prisma.booking.update({
          where: { id: paymentRecord.booking_id },
          data: { 
            status: 'CONFIRMED',
            updated_at: new Date()
          }
        })
      ]);

      // TODO: Send confirmation email/notification
      console.log('Payment successful for booking:', paymentRecord.booking_id);
      
    } else {
      // Handle failed payment
      await prisma.$transaction([
        // Update payment status
        prisma.payment_transaction.update({
          where: { id: paymentRecord.id },
          data: { 
            status: 'FAILED',
            gateway_payment_id: paymentId,
            gateway_response: decodedResponse,
            updated_at: new Date()
          }
        }),
        // Update booking status
        prisma.booking.update({
          where: { id: paymentRecord.booking_id },
          data: { 
            status: 'CANCELLED',
            updated_at: new Date()
          }
        }),
        // Mark slot as available again
        prisma.consultation_slot.update({
          where: { id: paymentRecord.booking.slot_id },
          data: { is_available: true }
        })
      ]);

      // Handle coupon rollback if applicable
      if (paymentRecord.booking?.coupon_code) {
        await prisma.$transaction(async (tx) => {
          const profCoupon = await tx.professional_coupon.findFirst({
            where: { coupon_code: paymentRecord.booking!.coupon_code }
          });

          if (profCoupon) {
            await tx.professional_coupon.update({
              where: { coupon_code: paymentRecord.booking!.coupon_code },
              data: { current_redemptions: { decrement: 1 } }
            });
          } else {
            await tx.coupon.update({
              where: { coupon_code: paymentRecord.booking!.coupon_code },
              data: { current_redemptions: { decrement: 1 } }
            });
          }
        });
      }

      console.log('Payment failed for booking:', paymentRecord.booking_id);
    }

    return res.status(200).json({ success: true, msg: 'Webhook processed' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ 
      success: false, 
      msg: 'Error processing webhook',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
};
