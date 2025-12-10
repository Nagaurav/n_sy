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
        const errorMsg = 'User not authenticated';
        console.error(errorMsg);
        setPaymentError(errorMsg);
        throw new Error(errorMsg);
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
          const errorMsg = 'User ID is required';
          console.error(errorMsg);
          setPaymentError(errorMsg);
          throw new Error(errorMsg);
        }
        
        if (!params.amount || params.amount <= 0) {
          const errorMsg = `Invalid payment amount: ${params.amount}`;
          console.error(errorMsg);
          setPaymentError(errorMsg);
          throw new Error(errorMsg);
        }

        if (!params.professionalId || !params.slotId || !params.duration) {
          const errorMsg = `Missing required booking information - Professional: ${params.professionalId}, Slot: ${params.slotId}, Duration: ${params.duration}`;
          console.error(errorMsg);
          setPaymentError(errorMsg);
          throw new Error(errorMsg);
        }

        console.log('Initiating booking and payment with params:', {
          userId,
          professionalId: params.professionalId,
          slotId: params.slotId,
          serviceType,
          serviceId,
          amount: params.amount,
          couponCode: params.couponCode,
          duration: params.duration,
          hasMetadata: !!params.metadata
        });
        
        try {
          // Use the createBookingAndInitiatePayment function
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

          console.log('Payment initiation response:', {
            hasPaymentUrl: !!response?.payment_url,
            bookingId: response?.booking_id,
            responseKeys: response ? Object.keys(response) : 'No response'
          });

          if (response?.payment_url) {
            return {
              ...response,
              paymentUrl: response.payment_url // Ensure consistent property name
            };
          }

          const errorMsg = 'Failed to initiate payment: No payment URL in response';
          console.error(errorMsg, { response });
          throw new Error(errorMsg);
        } catch (apiError: any) {
          console.error('API Error in initiatePayment:', {
            message: apiError.message,
            response: apiError.response?.data,
            status: apiError.response?.status,
            config: {
              url: apiError.config?.url,
              method: apiError.config?.method,
              data: apiError.config?.data
            }
          });
          throw apiError; // Re-throw to be caught by the outer catch
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Payment processing failed. Please try again.';
        
        console.error('Payment initiation error:', {
          error: errorMessage,
          stack: error.stack,
          response: error.response?.data
        });
        
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
