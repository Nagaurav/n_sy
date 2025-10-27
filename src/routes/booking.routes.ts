import express from 'express';
import { createBooking, handlePhonePeWebhook } from '../controllers/booking.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = express.Router();

// Create a new booking (requires authentication)
router.post('/create', authenticateUser, createBooking);

// PhonePe webhook (no authentication needed)
router.post('/webhook/phonepe', handlePhonePeWebhook);

export default router;
