// Centralized service exports
// Import individual services for focused functionality

export { apiClient, buildApiErrorResponse, type ApiResult } from './apiClient';
export { authService } from './authService';
export { bookingService } from './bookingService';
export { chatService } from './chatService';
export { professionalService } from './professionalService';
export { medicalService } from './medicalService';
export { supportService } from './supportService';
export { yogaService } from './yogaService';

// Re-export types for convenience
export type { 
  LoginCredentials, 
  SignupData, 
  AuthResponse 
} from './authService';

export type {
  BookingData,
  PriceCalculationParams,
  BookingPrice,
  BookingPaymentParams
} from './bookingService';

export type {
  SupportTicketData
} from './supportService';

// Legacy export for backward compatibility
// This maintains the existing apiService interface while delegating to modular services
import { authService } from './authService';
import { bookingService } from './bookingService';
import { chatService } from './chatService';
import { professionalService } from './professionalService';
import { medicalService } from './medicalService';
import { supportService } from './supportService';
import { yogaService } from './yogaService';

export const apiService = {
  // Auth methods
  login: authService.login,
  signup: authService.signup,
  sendOTP: authService.sendOTP,
  verifyOTP: authService.verifyOTP,
  
  // Booking methods
  getUserAppointments: bookingService.getUserAppointments,
  getNextAppointment: bookingService.getNextAppointment,
  createConsultationBooking: bookingService.createBookingAndInitiatePayment,
  calculateBookingPrice: bookingService.calculatePrice,
  searchProfessionalsWithFilters: bookingService.searchProfessionals,
  getAllAvailableSlots: bookingService.getAvailableSlots,
  createBookingAndInitiatePayment: bookingService.createBookingAndInitiatePayment,
  checkSlotAvailability: bookingService.checkSlotAvailability,
  // ✅ FIX: Added missing getBookingDetails method
  getBookingDetails: bookingService.getBookingDetails,
  
  // Professional methods
  getProfessionalProfile: professionalService.getProfile,
  getProfessionalSlots: professionalService.getSlots,
  
  // Chat methods
  getUserChats: chatService.getUserChats,
  getChatMessages: chatService.getChatMessages,
  createChat: chatService.createChat,
  
  // Medical methods
  getPrescription: medicalService.getPrescription,
  
  // 🟢 CHANGE THIS LINE:
  getBookingPrescription: medicalService.getPrescriptionByBooking,
  
  // Support methods
  submitSupportTicket: supportService.submitTicket,
  getFaqs: supportService.getFaqs,
  
  // Yoga methods
  getYogaClasses: yogaService.getClasses,
  getClassById: yogaService.getClassById,
  getYogaBookings: yogaService.getUserBookings,
  
  // Payment methods (legacy compatibility)
  // ✅ UPDATED METHOD
  getBookingPaymentStatus: async (id: string, type: string = 'consultation') => {
    try {
      // Import apiClient directly to avoid circular dependency
      const { apiClient } = await import('./apiClient');
      
      // ✅ FIX: Use correct endpoint defined in your backend routes
      const endpointVariations = type === 'yoga_class' 
        ? [`/user/yoga-booking/payment-status/${id}`]
        : [
            `/user/consultation-booking/payment-status/${id}`, // CORRECTED: Added 'payment-' prefix
            `/user/consultation-booking/details/${id}`        // Safe fallback
          ];
      
      // Try primary endpoint first, then fallback if needed
      const primaryEndpoint = endpointVariations[0];
      const fallbackEndpoint = endpointVariations[1];
      
      console.log(`📡 Getting payment status for ${type} booking: ${id} via ${primaryEndpoint}`);
      
      const response = await apiClient.get(primaryEndpoint);
      
      if (response.success && response.data) {
        let bookingData = response.data;

        // 🛠️ FIX 1: Unwrap double-nested data (if response.data.data exists)
        if (bookingData.data && !bookingData.booking_status) {
          bookingData = bookingData.data;
        }
        
        // 🔍 Debug: Log the unwrapped data to be sure
        console.log('🔍 [getBookingPaymentStatus] Unwrapped Booking Data:', {
           id: bookingData.booking_id,
           paymentStatus: bookingData.payment?.status,
           bookingStatus: bookingData.booking_status
        });

        // 🛠️ FIX 2: Prioritize 'payment.status', then 'booking_status'
        let status = 
            bookingData.payment?.status || 
            bookingData.payment_status || 
            bookingData.booking_status || 
            bookingData.status || 
            'UNKNOWN';

        // 🛑 CRITICAL FIX: DO NOT convert PENDING to CONFIRMED.
        // If it is PENDING, we want to UI to know so it triggers sync.
        if (status === 'CONFIRMED') {
          status = 'SUCCESS';
        } 
        // ❌ REMOVED: else if (status === 'PENDING') status = 'CONFIRMED';

        // 🛠️ FIX 4: Correctly extract amount (it might be in amounts.final or payment.amount)
        const amount = 
            bookingData.payment?.amount || 
            bookingData.amounts?.final || 
            bookingData.final_amount || 
            bookingData.amount || 
            0;

        return {
          success: true,
          data: {
            status: status,
            amount: amount,
            bookingDetails: bookingData
          }
        };
      }
      
      // If primary endpoint fails, try fallback
      if (fallbackEndpoint && type !== 'yoga_class') {
        console.log(`📡 Trying fallback endpoint: ${fallbackEndpoint}`);
        const fallbackResponse = await apiClient.get(fallbackEndpoint);
        
        if (fallbackResponse.success && fallbackResponse.data) {
          return {
            success: true,
            data: {
              status: fallbackResponse.data.booking_status || 'UNKNOWN',
              amount: fallbackResponse.data.amount || 0,
              bookingDetails: fallbackResponse.data
            }
          };
        }
      }
      
      return {
        success: false,
        error: response.error || 'Failed to get payment status'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get payment status'
      };
    }
  },
  
  // ✅ NEW: Manual sync endpoint to force status update from PENDING to SUCCESS
  syncPaymentStatus: async (transactionId: string, bookingType: 'consultation' | 'yoga' | 'yoga_class' = 'consultation') => {
    try {
      // Import apiClient directly to avoid circular dependency
      const { apiClient } = await import('./apiClient');
      
      // Map yoga_class to yoga for endpoint selection
      const normalizedBookingType = bookingType === 'yoga_class' ? 'yoga' : bookingType;
      
      // Determine the correct endpoint based on booking type
      const endpoint = normalizedBookingType === 'yoga' 
        ? `/user/yoga-booking/payment-status/${transactionId}`
        : `/user/consultation-booking/sync-payment/${transactionId}`;
      
      console.log(`📡 Syncing payment status for ${normalizedBookingType} booking: ${transactionId} via ${endpoint}`);
      
      // Use different HTTP methods based on booking type
      const response = normalizedBookingType === 'yoga' 
        ? await apiClient.get(endpoint)
        : await apiClient.post(endpoint, {});
      
      if (response.data) {
        return {
          success: true,
          data: response.data
        };
      }
      
      return {
        success: false,
        error: 'No response from sync endpoint'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Sync failed'
      };
    }
  },
  getPaymentStatus: async (paymentId: string) => {
    // For payment status, we need to check if there's a dedicated endpoint
    // For now, use booking details if paymentId looks like a booking ID
    if (paymentId.startsWith('TXN_')) {
      const bookingId = paymentId.replace('TXN_', '').split('_')[0];
      return apiService.getBookingPaymentStatus(bookingId);
    }
    
    // Mock for actual payment IDs (would need real payment gateway integration)
    return {
      success: true,
      data: {
        status: 'SUCCESS',
        amount: 0
      }
    };
  },
  verifyPayment: async (paymentId: string) => {
    // Similar to getPaymentStatus, use booking details for TXN_ prefixed IDs
    if (paymentId.startsWith('TXN_')) {
      const bookingId = paymentId.replace('TXN_', '').split('_')[0];
      return apiService.getBookingPaymentStatus(bookingId);
    }
    
    // Mock for actual payment IDs
    return {
      success: true,
      data: {
        status: 'SUCCESS',
        amount: 0
      }
    };
  },
  
  // Generic methods
  get: authService.getCurrentUser, // Reuse for generic GET
  post: authService.updateProfile, // Reuse for generic POST
  
  // Profile methods (legacy compatibility)
  getUserProfile: authService.getCurrentUser,
  updateUserProfile: authService.updateProfile,
  
  // Profile picture upload
  uploadProfilePicture: async (formData: FormData) => {
    try {
      // Import apiClient directly to avoid circular dependency
      const { apiClient } = await import('./apiClient');
      
      console.log('📤 Uploading profile picture...');
      
      const response = await apiClient.post('/user/profile/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.success && response.data?.success) {
        return {
          success: true,
          data: response.data.data,
        };
      }
      
      return {
        success: false,
        error: response.data?.message || 'Failed to upload profile picture'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to upload profile picture'
      };
    }
  },
};
