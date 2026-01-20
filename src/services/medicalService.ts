import { apiClient, ApiResult } from './apiClient';
import type {
  PaginatedPrescriptionsResponse,
  SinglePrescriptionResponse,
  Prescription,
} from '../types/medical';

export const medicalService = {
  // Get user's prescriptions with pagination
  getPrescriptions: async (
    page: number = 1,
    limit: number = 20,
  ): Promise<ApiResult<PaginatedPrescriptionsResponse>> => {
    return apiClient.get('/user/prescriptions', {
      params: { page, limit }
    });
  },

  // ✅ 1. Get Prescription by ID
  getPrescription: async (id: string | number): Promise<ApiResult<SinglePrescriptionResponse>> => {
    // WAS: return apiClient.get(`/user/prescriptions/${id}`);  <-- ERROR (Plural)
    return apiClient.get(`/user/prescription/${id}`);        // <-- CORRECT (Singular)
  },

  // ✅ 2. Get Prescription by Booking
  getPrescriptionByBooking: async (bookingId: string | number): Promise<ApiResult<SinglePrescriptionResponse>> => {
    // WAS: return apiClient.get(`/user/prescriptions/booking/${booking_id}`); <-- ERROR
    return apiClient.get(`/user/prescription/booking/${bookingId}`);       // <-- CORRECT
  },

  // Create new prescription
  createPrescription: async (prescriptionData: Partial<Prescription>): Promise<ApiResult<Prescription>> => {
    return apiClient.post('/user/prescriptions', prescriptionData);
  },

  // Update prescription
  updatePrescription: async (id: string | number, prescriptionData: Partial<Prescription>): Promise<ApiResult<Prescription>> => {
    return apiClient.put(`/user/prescriptions/${id}`, prescriptionData);
  },

  // Delete prescription
  deletePrescription: async (id: string | number): Promise<ApiResult<void>> => {
    return apiClient.delete(`/user/prescriptions/${id}`);
  },

  // Get health records
  getHealthRecords: async (userId: string | number): Promise<ApiResult<any>> => {
    return apiClient.get(`/user/health-records/${userId}`);
  },

  // Update health records
  updateHealthRecords: async (userId: string | number, healthData: any): Promise<ApiResult<any>> => {
    return apiClient.put(`/user/health-records/${userId}`, healthData);
  },
};
