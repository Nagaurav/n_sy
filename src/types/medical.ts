export interface PrescriptionMedicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface PrescriptionDiagnosis {
  id: number;
  condition: string;
  severity?: string;
  duration?: string;
}

export interface PrescriptionAdvice {
  id: number;
  title: string;
  description: string;
}

export interface Prescription {
  id: string;
  prescriptionId: string;
  prescriptionType: string;
  prescriptionDate: string;
  professional_id: number;
  user_id: number;
  booking_id: number;

  // Patient Information (from API)
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  practitionerName?: string;
  practitionerQualification?: string;

  // Relations
  professional?: {
    professional_id: number;
    first_name: string;
    last_name: string;
    speciality_new?: { name: string; type?: string };
    photo_url?: string;
    email?: string;
    phone_number?: string;
  };
  booking?: {
    id: number;
    booking_date: string;
    status: string;
    duration?: number;
    mode?: string;
    final_amount?: number;
  };

  // Medical Data
  vitals?: Array<{
    type: string;
    value: string;
  }> | {
    [key: string]: any;
  };
  medicines: PrescriptionMedicine[];
  diagnoses: PrescriptionDiagnosis[];
  advices: PrescriptionAdvice[];
  notes?: string;

  // Follow Up
  followUpDate?: string;
  followUpReason?: string;
  followUpReminderSet?: boolean;

  // Metadata
  isActive?: boolean;
  isDeleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PaginatedPrescriptionsResponse {
  msg: string;
  // API can return data as array directly OR as nested object with items
  data: Prescription[] | {
    items: Prescription[];
    page: number;
    limit: number;
    total: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface SinglePrescriptionResponse {
  msg: string;
  data: Prescription;
}
