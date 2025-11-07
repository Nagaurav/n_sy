// consultationService.ts
// Basic consultation service for the BookConsultationScreen

interface ConsultationBooking {
  professionalId: string;
  time: string;
  mode: 'chat' | 'audio' | 'video';
  date?: string;
  userId?: string;
}

interface BookingResponse {
  bookingId: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  message: string;
  paymentUrl?: string;
}

class ConsultationService {
  // Mock implementation - replace with actual API calls
  async book(booking: ConsultationBooking): Promise<{ data: BookingResponse }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const response: BookingResponse = {
          bookingId: 'consultation_' + Date.now(),
          status: 'confirmed',
          message: 'Consultation booked successfully',
          paymentUrl: 'https://payment.example.com/pay',
        };
        resolve({ data: response });
      }, 1500);
    });
  }

  async getConsultationHistory(userId: string): Promise<{ data: any[] }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const consultations = [
          {
            id: '1',
            professionalName: 'Dr. Anya',
            specialty: 'Yoga Therapy',
            date: '2024-01-15',
            time: '10:00 AM',
            mode: 'video',
            status: 'completed',
          },
          {
            id: '2',
            professionalName: 'Dr. Vikram',
            specialty: 'Ayurveda',
            date: '2024-01-10',
            time: '2:00 PM',
            mode: 'chat',
            status: 'upcoming',
          },
        ];
        resolve({ data: consultations });
      }, 800);
    });
  }

  async cancelConsultation(bookingId: string): Promise<{ data: { success: boolean; message: string } }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            success: true, 
            message: 'Consultation cancelled successfully' 
          } 
        });
      }, 1000);
    });
  }

  async rescheduleConsultation(bookingId: string, newTime: string, newDate: string): Promise<{ data: BookingResponse }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const response: BookingResponse = {
          bookingId,
          status: 'confirmed',
          message: 'Consultation rescheduled successfully',
        };
        resolve({ data: response });
      }, 1200);
    });
  }

  async getConsultationDetails(bookingId: string): Promise<{ data: any }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const consultation = {
          id: bookingId,
          professionalName: 'Dr. Anya',
          specialty: 'Yoga Therapy',
          date: '2024-01-15',
          time: '10:00 AM',
          mode: 'video',
          status: 'upcoming',
          duration: 60,
          price: 1500,
          notes: 'Focus on stress management techniques',
        };
        resolve({ data: consultation });
      }, 600);
    });
  }
}

export const consultationService = new ConsultationService(); 