const express = require('express');
const crypto = require('crypto');

// PhonePe Webhook Handler
const handlePhonePeWebhook = async (req, res) => {
  try {
    console.log('PhonePe Webhook Received:', req.body);
    
    const {
      merchantId,
      merchantTransactionId,
      transactionId,
      amount,
      status,
      paymentInstrument,
      responseCode,
      responseMessage,
      checksum
    } = req.body;

    // Verify webhook signature (implement according to PhonePe docs)
    const isValidSignature = verifyPhonePeSignature(req.body, checksum);
    if (!isValidSignature) {
      console.log('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Update booking status in database
    let bookingStatus = 'PENDING';
    let paymentStatus = 'PENDING';

    switch (status) {
      case 'PAYMENT_SUCCESS':
        bookingStatus = 'CONFIRMED';
        paymentStatus = 'PAID';
        break;
      case 'PAYMENT_ERROR':
      case 'PAYMENT_DECLINED':
        bookingStatus = 'CANCELLED';
        paymentStatus = 'FAILED';
        break;
      default:
        bookingStatus = 'PENDING';
        paymentStatus = 'PENDING';
    }

    // Update booking in database
    await updateBookingStatus(merchantTransactionId, {
      status: bookingStatus,
      payment_status: paymentStatus,
      phonepe_transaction_id: transactionId,
      phonepe_response_code: responseCode,
      phonepe_response_message: responseMessage,
      updated_at: new Date()
    });

    // Send notification to user (if needed)
    if (paymentStatus === 'PAID') {
      await sendPaymentSuccessNotification(merchantTransactionId);
    }

    console.log(`Booking ${merchantTransactionId} updated to ${bookingStatus}`);

    // Return success response to PhonePe
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('PhonePe webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify PhonePe webhook signature
const verifyPhonePeSignature = (payload, receivedChecksum) => {
  try {
    // Remove checksum from payload for verification
    const { checksum, ...payloadWithoutChecksum } = payload;
    
    // Create the string to verify (according to PhonePe docs)
    const payloadString = JSON.stringify(payloadWithoutChecksum);
    const saltKey = process.env.PHONEPE_SALT_KEY || '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    const saltIndex = process.env.PHONEPE_SALT_INDEX || '1';
    
    const string = payloadString + saltKey;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const expectedChecksum = sha256 + '###' + saltIndex;
    
    return expectedChecksum === receivedChecksum;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
};

// Update booking status in database
const updateBookingStatus = async (bookingId, updateData) => {
  try {
    // Replace this with your actual database update logic
    // Example for MongoDB:
    // await Booking.findByIdAndUpdate(bookingId, updateData);
    
    // Example for SQL:
    // await db.query('UPDATE bookings SET status = ?, payment_status = ? WHERE id = ?', 
    //   [updateData.status, updateData.payment_status, bookingId]);
    
    console.log(`Updated booking ${bookingId} with data:`, updateData);
  } catch (error) {
    console.error('Database update error:', error);
    throw error;
  }
};

// Send payment success notification
const sendPaymentSuccessNotification = async (bookingId) => {
  try {
    // Get booking details
    const booking = await getBookingDetails(bookingId);
    
    // Send SMS/Email notification
    // await sendSMS(booking.user_phone, 'Payment successful! Your booking is confirmed.');
    // await sendEmail(booking.user_email, 'Booking Confirmation', 'Your payment was successful...');
    
    console.log(`Payment success notification sent for booking ${bookingId}`);
  } catch (error) {
    console.error('Notification error:', error);
  }
};

// Get booking details
const getBookingDetails = async (bookingId) => {
  try {
    // Replace with your actual database query
    // return await Booking.findById(bookingId);
    return { id: bookingId, user_phone: '9999999999', user_email: 'user@example.com' };
  } catch (error) {
    console.error('Get booking details error:', error);
    throw error;
  }
};

// Payment status check endpoint
const getPaymentStatus = async (req, res) => {
  try {
    const { booking_id } = req.params;
    
    // Get booking from database
    const booking = await getBookingDetails(booking_id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    res.json({
      booking_id,
      status: booking.status || 'PENDING',
      payment_status: booking.payment_status || 'PENDING',
      amount: booking.amount,
      created_at: booking.created_at,
      updated_at: booking.updated_at
    });
    
  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create booking endpoint
const createBooking = async (req, res) => {
  try {
    const {
      user_id,
      professional_id,
      consultation_type,
      preferred_date,
      preferred_time,
      problem,
      payment_mode,
      amount,
      user_phone,
      user_name
    } = req.body;

    // Validate required fields
    if (!user_id || !professional_id || !consultation_type || !preferred_date || !preferred_time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique booking ID
    const bookingId = 'BK' + Date.now() + Math.random().toString(36).substr(2, 9);

    // Create booking in database
    const bookingData = {
      id: bookingId,
      user_id,
      professional_id,
      consultation_type,
      preferred_date,
      preferred_time,
      problem,
      payment_mode,
      amount,
      user_phone,
      user_name,
      status: 'PENDING',
      payment_status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date()
    };

    // Save to database
    // await Booking.create(bookingData);
    console.log('Created booking:', bookingData);

    res.status(201).json({
      success: true,
      booking_id: bookingId,
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  handlePhonePeWebhook,
  getPaymentStatus,
  createBooking
}; 