import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ msg: 'Method not allowed' });
  }

  try {
    const { response } = req.body;
    
    // Verify the checksum
    const receivedChecksum = req.headers['x-verify'] as string;
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(response + process.env.PHONEPE_SALT_KEY)
      .digest('hex') + '###' + process.env.PHONEPE_SALT_INDEX;

    if (receivedChecksum !== calculatedChecksum) {
      return res.status(400).json({ msg: "Invalid checksum" });
    }

    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
    const { merchantTransactionId, code } = decodedResponse;

    // Find the payment record
    const paymentRecord = await prisma.payment_transaction.findUnique({
      where: { transaction_id: merchantTransactionId },
      include: { booking: true }
    });

    if (!paymentRecord) {
      return res.status(404).json({ msg: "Payment record not found" });
    }

    if (code === 'PAYMENT_SUCCESS') {
      // Update payment and booking status
      await prisma.$transaction(async (tx: any) => {
        await tx.payment_transaction.update({
          where: { id: paymentRecord.id },
          data: { 
            status: 'SUCCESS',
            gateway_response: decodedResponse
          }
        });

        // Update booking status
        await tx.booking.update({
          where: { id: paymentRecord.booking_id },
          data: { status: 'CONFIRMED' }
        });
      });

      // TODO: Send confirmation email/SMS here
      
    } else {
      // Payment failed
      await prisma.$transaction(async (tx: any) => {
        await tx.payment_transaction.update({
          where: { id: paymentRecord.id },
          data: { 
            status: 'FAILED',
            gateway_response: decodedResponse
          }
        });

        await tx.booking.update({
          where: { id: paymentRecord.booking_id },
          data: { status: 'CANCELLED' }
        });

        // Handle coupon rollback if applicable
        if (paymentRecord.booking?.coupon_code) {
          const profCoupon = await tx.professional_coupon.findFirst({
            where: { coupon_code: paymentRecord.booking.coupon_code }
          });

          if (profCoupon) {
            await tx.professional_coupon.update({
              where: { coupon_code: paymentRecord.booking.coupon_code },
              data: { current_redemptions: { decrement: 1 } }
            });
          } else {
            await tx.coupon.update({
              where: { coupon_code: paymentRecord.booking.coupon_code },
              data: { current_redemptions: { decrement: 1 } }
            });
          }
        }
      });
    }

    return res.status(200).json({ msg: "Webhook processed successfully" });
  } catch (error) {
    console.error("Error processing PhonePe webhook:", error);
    return res.status(500).json({ 
      msg: "Webhook processing failed",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Prevent Next.js from parsing the body as we need it raw for checksum verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper function to parse the raw body
async function getRawBody(req: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
