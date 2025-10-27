import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

type PaymentParams = {
  amount: number;
  bookingId: string;
  professionalId: string | number;
  slotId: string | number;
  duration: number; // in minutes
  serviceType?: 'yoga_class' | 'consultation' | 'membership';
  serviceId?: string;
  couponCode?: string;
  metadata?: Record<string, any>;
};

export const usePayment = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (params: PaymentParams) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setIsProcessing(true);
      setPaymentError(null);

      try {
        // Ensure all required fields have values and handle potential undefined
        const userId = String(user?.user_id || user?._id || '');
        const serviceType = params.serviceType || 'yoga_class';
        const serviceId = params.serviceId || params.bookingId || '';
        
        // Validate required fields
        if (!userId) {
          throw new Error('User ID is required');
        }
        
        if (!params.amount || params.amount <= 0) {
          throw new Error('Invalid payment amount');
        }

        if (!params.professionalId || !params.slotId || !params.duration) {
          throw new Error('Missing required booking information');
        }

        console.log('Initiating booking and payment with params:', {
          userId,
          professionalId: params.professionalId,
          slotId: params.slotId,
          serviceType,
          serviceId,
          couponCode: params.couponCode,
          duration: params.duration,
          metadata: params.metadata
        });
        
        // Use the new createBookingAndInitiatePayment function
        const response = await apiService.createBookingAndInitiatePayment({
          userId,
          professionalId: params.professionalId,
          slotId: params.slotId,
          serviceType,
          serviceId,
          couponCode: params.couponCode,
          duration: params.duration,
          metadata: params.metadata
        });

        if (response?.paymentUrl) {
          return response;
        }

        throw new Error('Failed to initiate payment: No payment URL received');
      } catch (error: any) {
        console.error('Payment initiation error:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Payment failed';
        setPaymentError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setIsProcessing(false);
      }
    },
    [user]
  );

  const getPaymentStatus = useCallback(async (paymentId: string) => {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    try {
      setIsProcessing(true);
      const response = await apiService.getPaymentStatus(paymentId);
      
      if (!response) {
        throw new Error('Invalid response from server');
      }
      
      const status = response.status || 'unknown';
      setPaymentStatus(status);
      return response;
    } catch (error: any) {
      console.error('Payment status check error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check payment status';
      setPaymentError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const verifyPayment = useCallback(async (paymentId: string) => {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    try {
      setIsProcessing(true);
      const response = await apiService.verifyPayment(paymentId);
      
      if (!response) {
        throw new Error('Invalid verification response');
      }
      
      const status = response.status || 'unknown';
      setPaymentStatus(status);
      return response;
    } catch (error: any) {
      console.error('Payment verification error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Payment verification failed';
      setPaymentError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const resetPaymentState = useCallback(() => {
    setPaymentStatus(null);
    setPaymentError(null);
    setIsProcessing(false);
  }, []);

  const checkPaymentStatus = useCallback(async (paymentId: string) => {
    if (!paymentId) {
      throw new Error('Payment ID is required');
    }
    
    try {
      setIsProcessing(true);
      setPaymentError(null);
      
      const response = await apiService.getPaymentStatus(paymentId);
      
      if (!response) {
        throw new Error('Invalid response from payment service');
      }
      
      // Update payment status based on response
      const status = response.status || 'PENDING';
      setPaymentStatus(status);
      
      return {
        success: status === 'SUCCESS' || status === 'COMPLETED',
        status,
        data: response,
      };
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to check payment status';
      setPaymentError(errorMessage);
      
      return {
        success: false,
        status: 'ERROR',
        error: errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    initiatePayment,
    checkPaymentStatus,
    verifyPayment,
    resetPaymentState,
    isProcessing,
    paymentStatus,
    paymentError,
  };
};
