import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/apiService';

// Types
export interface Appointment {
  booking_id: number;
  appointment_id: string;
  user_id: number;
  professional_id: number;
  professional_name: string;
  time: string;
  date: string;
  mode: 'online' | 'offline';
  amount: number;
  booking_status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  payment_status: 'PENDING' | 'COMPLETED';
  chat_enabled: boolean;
  video_enabled: boolean;
  prescription_count?: number;
  chat_id?: string; // Chat ID associated with this appointment
}

export interface AppointmentState {
  currentAppointment: Appointment | null;
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  chatActive: boolean;
  videoCallActive: boolean;
}

// Async thunks
export const fetchAppointmentById = createAsyncThunk(
  'appointment/fetchById',
  async (appointmentId: string, { rejectWithValue }) => {
    try {
      // Use consultation-booking endpoint with booking_id
      const response = await apiService.get(`/user/consultation-booking/${appointmentId}`);
      return response.data;
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
