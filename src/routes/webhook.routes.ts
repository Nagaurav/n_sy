import express from 'express';
import { handlePhonePeWebhook } from '../webhooks/phonepe.webhook';

const router = express.Router();

/**
 * @route   POST /api/v1/user/consultation-booking/webhook/phonepe
 * @desc    Handle PhonePe payment webhook callbacks
 * @access  Public (PhonePe will call this endpoint)
 */
router.post('/phonepe', handlePhonePeWebhook);

export default router;
