import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface CreateBookingInput {
  user_id: number;
  professional_id: number;
  slot_id: number;
  duration: number;
  coupon_code?: string;
}

export async function createBookingService(bookingData: CreateBookingInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Validate professional and slot availability
    const professional = await tx.professional.findUnique({
      where: { id: bookingData.professional_id },
      include: { consultation_fee: true }
    });

    if (!professional) {
      throw new Error('Professional not found');
    }

    const slot = await tx.consultation_slot.findUnique({
      where: { id: bookingData.slot_id }
    });

    if (!slot || !slot.is_available) {
      throw new Error('Slot not available');
    }

    // 2. Calculate pricing
    const basePrice = professional.consultation_fee?.amount || 0;
    let discountAmount = 0;
    let finalAmount = basePrice * (bookingData.duration / 60); // Convert to hours

    // 3. Apply coupon if provided
    if (bookingData.coupon_code) {
      const coupon = await tx.coupon.findUnique({
        where: { coupon_code: bookingData.coupon_code }
      });

      if (coupon && coupon.is_active && new Date() < new Date(coupon.valid_until)) {
        discountAmount = (finalAmount * coupon.discount_percentage) / 100;
        finalAmount -= discountAmount;
      }
    }

    // 4. Create booking record
    const booking = await tx.booking.create({
      data: {
        user_id: bookingData.user_id,
        professional_id: bookingData.professional_id,
        slot_id: bookingData.slot_id,
        coupon_code: bookingData.coupon_code || null,
        date: slot.date,
        start_time: slot.start_time,
        end_time: new Date(new Date(slot.start_time).getTime() + bookingData.duration * 60000),
        status: 'PENDING_PAYMENT',
        original_amount: basePrice,
        discount_amount: discountAmount,
        final_amount: finalAmount,
      }
    });

    // 5. Mark slot as booked
    await tx.consultation_slot.update({
      where: { id: bookingData.slot_id },
      data: { is_available: false }
    });

    // 6. Generate payment details
    const paymentId = `TXN_${bookingData.user_id}_${Date.now()}`;
    
    // 7. Create payment record
    const payment = await tx.payment_transaction.create({
      data: {
        booking_id: booking.id,
        transaction_id: paymentId,
        amount: finalAmount,
        status: 'PENDING',
        payment_method: 'PHONEPE',
      }
    });

    // 8. Generate PhonePe payment URL
    const paymentUrl = await generatePhonePePaymentUrl({
      transactionId: paymentId,
      amount: finalAmount * 100, // Convert to paise
      userId: bookingData.user_id,
      bookingId: booking.id
    });

    return {
      booking_id: booking.id,
      user_id: booking.user_id,
      professional_id: booking.professional_id,
      coupon_code: booking.coupon_code,
      date: booking.date,
      time: `${slot.start_time} - ${slot.end_time}`,
      mode: 'online',
      duration: bookingData.duration,
      payment_id: payment.transaction_id,
      final_amount: finalAmount,
      original_amount: basePrice,
      discount_amount: discountAmount,
      payment_url: paymentUrl
    };
  });
}

async function generatePhonePePaymentUrl(params: {
  transactionId: string;
  amount: number;
  userId: number;
  bookingId: number;
}): Promise<string> {
  const payload = {
    merchantId: process.env.PHONEPE_MERCHANT_ID,
    merchantTransactionId: params.transactionId,
    merchantUserId: `USER_${params.userId}`,
    amount: params.amount,
    redirectUrl: `samyayog://payment/confirmation/${params.bookingId}`,
    redirectMode: 'POST',
    callbackUrl: `${process.env.BACKEND_URL}/api/v1/bookings/webhook/phonepe`,
    mobileNumber: '',
    paymentInstrument: {
      type: 'PAY_PAGE'
    }
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64');
  const string = payloadBase64 + "/pg/v1/pay" + process.env.PHONEPE_SALT_KEY;
  const sha256 = crypto.createHash('sha256').update(string).digest('hex');
  const xVerify = sha256 + '###' + process.env.PHONEPE_SALT_INDEX;

  const response = await axios.post(
    `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
    { request: payloadBase64 },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'X-MERCHANT-ID': process.env.PHONEPE_MERCHANT_ID,
      },
    }
  );

  const responseData = response.data;
  return responseData.data.instrumentResponse.redirectInfo.url;
}
