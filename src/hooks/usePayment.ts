import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { apiService } from '../services';
import { useAuth } from '../hooks/useAuth';

type PaymentParams = {
  amount: number;
  bookingId: string;
  professionalId: string | number;
  slotId?: string | number; // 👈 Make Optional
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

        // 1. Check Professional (Always required)
        if (!params.professionalId) {
           throw new Error('Professional ID is required');
        }

        // 2. Check Slot ID (ONLY required for Consultations)
        const isConsultation = !params.serviceType || params.serviceType === 'consultation';
        
        if (isConsultation && (!params.slotId || Number(params.slotId) === 0)) {
           throw new Error(`Slot ID is required for consultations.`);
        }

        // 3. Check Duration (Optional for classes, required for slots)
        if (isConsultation && (!params.duration || params.duration <= 0)) {
           throw new Error(`Duration is required.`);
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
        // For consultations, check slot availability first
        if (!params.serviceType || params.serviceType === 'consultation') {
          console.log('🔍 [usePayment] Checking slot availability before booking...');
          const availabilityCheck = await apiService.checkSlotAvailability(params.slotId!, params.professionalId!);
          
          if (!availabilityCheck.success || !availabilityCheck.data) {
            throw new Error('Unable to verify slot availability. Please try again.');
          }
          
          if (!availabilityCheck.data.available) {
            const reason = availabilityCheck.data.reason || 'This time slot is no longer available';
            throw new Error(reason);
          }
          
          console.log('✅ [usePayment] Slot is available, proceeding with booking');
        }

        // Use the createBookingAndInitiatePayment function
          console.log('🚀 [usePayment] Calling apiService.createBookingAndInitiatePayment with:', {
            userId,
            professionalId: params.professionalId,
            slotId: params.slotId,
            serviceType,
            serviceId,
            amount: params.amount,
            couponCode: params.couponCode,
            duration: params.duration,
            metadata: params.metadata
          });

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
            success: response?.success,
            hasPaymentUrl: !!response?.data?.payment_url,
            hasDataPaymentUrl: !!response?.data?.data?.payment_url,
            bookingId: response?.data?.booking_id,
            responseKeys: response ? Object.keys(response) : 'No response',
            dataKeys: response?.data ? Object.keys(response.data) : 'No data',
            innerDataKeys: response?.data?.data ? Object.keys(response.data.data) : 'No inner data',
            fullResponse: response,
            errorMessage: response?.error
          });

          if (response?.success && response?.data?.payment_url) {
            console.log('✅ Payment initiation successful - returning payment URL');
            return {
              ...response,
              paymentUrl: response.data.payment_url // Ensure consistent property name
            };
          }

          const errorMsg = response?.success 
            ? 'Failed to initiate payment: No payment URL in response' 
            : `Failed to initiate payment: ${response?.error || 'API call failed'}`;
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
        // Handle specific HTTP status codes with user-friendly messages
        let errorMessage = 'Payment processing failed. Please try again.';
        
        if (error.response?.status === 409) {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        'This time slot is already booked. Please choose a different time.';
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        'Invalid booking details. Please check and try again.';
        } else if (error.response?.status === 403) {
          errorMessage = error.response.data?.message || 
                        error.response.data?.error || 
                        'Access denied. Please log in again.';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        console.error('Payment initiation error:', {
          message: errorMessage,
          status: error.response?.status,
          responseData: error.response?.data,
          originalError: error
        });
        
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
      
      const status = response.data?.status || 'unknown';
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
      
      const status = response.data?.status || 'unknown';
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
      const status = response.data?.status || 'PENDING';
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
