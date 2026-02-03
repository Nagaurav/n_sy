import { apiClient, ApiResult } from './apiClient';

export interface SupportTicketData {
  user_id: number;
  subject: string;
  message: string;
  category?: string;
  priority?: string;
}

export const supportService = {
  // Submit customer support ticket
  submitTicket: async (userId: string | number, subject: string, message: string, category?: string, priority?: string): Promise<ApiResult<any>> => {
    const payload: SupportTicketData = {
      user_id: Number(userId),
      subject,
      message,
      category,
      priority,
    };
    
    return apiClient.post('/user/customer-support/create', payload);
  },

  // Get user's support tickets
  getUserTickets: async (userId: string | number, page: number = 1, limit: number = 20): Promise<ApiResult<any>> => {
    // ✅ FIX: Pass userId in URL path, not as a query param
    return apiClient.get(`/user/customer-support/${userId}`, {
      params: { page, limit } // (Note: Your backend currently ignores page/limit, but it's good to keep)
    });
  },

  // Get ticket details
  getTicket: async (ticketId: string | number): Promise<ApiResult<any>> => {
    return apiClient.get(`/user/customer-support/${ticketId}`);
  },

  // Update ticket
  updateTicket: async (ticketId: string | number, updateData: any): Promise<ApiResult<any>> => {
    return apiClient.put(`/user/customer-support/${ticketId}`, updateData);
  },

  // Get FAQs
  getFaqs: async (): Promise<ApiResult<any>> => {
    return apiClient.get('/user/faq/get');
  },
};
