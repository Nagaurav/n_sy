import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/apiService';

// Types - Updated to match actual API response structure
export interface Appointment {
  booking_id: number;
  appointment_id: string;
  user_id: number;
  professional_id: number;
  professional?: {
    name: string;
    speciality?: string;
  };
  slot?: {
    date: string;
    start_time: string;
    end_time: string;
  };
  amounts?: {
    original: number;
    final: number;
    discount?: number;
  };
  mode: 'online' | 'offline';
  booking_status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  payment_status: 'PENDING' | 'COMPLETED';
  chat_enabled: boolean;
  video_enabled: boolean;
  prescription_count?: number;
  chat_id?: string; // Chat ID associated with this appointment
  
  // Backward compatibility properties
  professional_name?: string; // Computed from professional.name
  date?: string; // Computed from slot.date
  time?: string; // Computed from slot.start_time
  amount?: number; // Computed from amounts.final
}

export interface AppointmentState {
  currentAppointment: Appointment | null;
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  chatActive: boolean;
  videoCallActive: boolean;
}

// Transform API response to match UI expectations
const transformAppointmentData = (apiData: any): Appointment => {
  return {
    ...apiData,
    // Map nested API data to flat UI properties for backward compatibility
    professional_name: apiData.professional?.name || apiData.professional_name || '',
    date: apiData.slot?.date || apiData.date || '',
    time: apiData.slot?.start_time || apiData.time || '',
    amount: apiData.amounts?.final || apiData.amount || 0,
    // Ensure professional_id is properly mapped from nested structure
    professional_id: apiData.professional?.id || apiData.professional_id || apiData.professional_id,
  };
};

// Async thunks
export const fetchAppointmentById = createAsyncThunk(
  'appointment/fetchById',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      // Use the correct details endpoint
      const response = await apiService.getBookingDetails(appointmentId);
      console.log('📋 [fetchAppointmentById] API response:', response);
      
      // Extract the actual appointment data from nested response
      const appointmentData = response.data?.data || response.data;
      console.log('📋 [fetchAppointmentById] Extracted appointment data:', appointmentData);
      
      // Transform to match UI expectations
      const transformedData = transformAppointmentData(appointmentData);
      console.log('📋 [fetchAppointmentById] Transformed appointment data:', transformedData);
      
      return transformedData;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch appointment');
    }
  }
);

// Note: Chat status check removed as endpoint doesn't exist
// Chat functionality can be determined from appointment data directly

// Initial state
const initialState: AppointmentState = {
  currentAppointment: null,
  appointments: [],
  loading: false,
  error: null,
  chatActive: false,
  videoCallActive: false,
};

// Slice
const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setCurrentAppointment: (state, action: PayloadAction<Appointment>) => {
      state.currentAppointment = action.payload;
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
      state.chatActive = false;
      state.videoCallActive = false;
    },
    setChatActive: (state, action: PayloadAction<boolean>) => {
      state.chatActive = action.payload;
    },
    setVideoCallActive: (state, action: PayloadAction<boolean>) => {
      state.videoCallActive = action.payload;
    },
    updateAppointmentStatus: (state, action: PayloadAction<{ id: string; status: Appointment['booking_status'] }>) => {
      if (state.currentAppointment && state.currentAppointment.appointment_id === action.payload.id) {
        state.currentAppointment.booking_status = action.payload.status;
      }
      const appointmentIndex = state.appointments.findIndex(
        apt => apt.appointment_id === action.payload.id
      );
      if (appointmentIndex !== -1) {
        state.appointments[appointmentIndex].booking_status = action.payload.status;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch appointment by ID
      .addCase(fetchAppointmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAppointmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAppointment = action.payload;
        // Set chat/video status from appointment data
        if (action.payload) {
          state.chatActive = action.payload.chat_enabled || false;
          state.videoCallActive = action.payload.video_enabled || false;
        }
      })
      .addCase(fetchAppointmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setCurrentAppointment,
  clearCurrentAppointment,
  setChatActive,
  setVideoCallActive,
  updateAppointmentStatus,
  clearError,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;
