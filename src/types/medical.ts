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

  // Relations
  professional: {
    professional_id: number;
    first_name: string;
    last_name: string;
    speciality_new?: { name: string };
    photo_url?: string;
    email?: string;
  };
  booking?: {
    id: number;
    booking_date: string;
    status: string;
  };

  // Medical Data
  vitals?: {
    bloodPressure?: string;
    weight?: string;
    pulse?: string;
    [key: string]: any;
  };
  medicines: PrescriptionMedicine[];
  diagnoses: PrescriptionDiagnosis[];
  advices: PrescriptionAdvice[];
  notes?: string;

  // Follow Up
  followUpDate?: string;
  followUpReason?: string;
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
