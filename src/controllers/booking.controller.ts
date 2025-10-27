import { Request, Response } from 'express';
import { createBookingService } from '../services/booking.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { user_id, professional_id, slot_id, duration, coupon_code } = req.body;

    // Input validation
    if (!user_id || !professional_id || !slot_id || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create booking
    const booking = await createBookingService({
      user_id,
      professional_id,
      slot_id,
      duration,
      coupon_code
    });

    return res.status(201).json({
      msg: 'Booking created successfully',
      data: booking,
      payment_url: booking.payment_url
    });
  } catch (error: any) {
    console.error('Error creating booking:', error);
    
    // Handle known error types
    if (error.message.includes('not found') || error.message.includes('not available')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Default error response
    return res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
};

// Webhook handler (moved to a separate file)
export { handlePhonePeWebhook } from '../webhooks/phonepe.webhook';
