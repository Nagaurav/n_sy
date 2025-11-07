// customerSupportService.ts
import { 
  makeApiRequest, 
  API_CONFIG, 
  CustomerSupportQueryParams 
} from '../config/api';

// Types for customer support API
export interface CustomerSupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'booking' | 'general' | 'complaint' | 'feedback';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  attachments?: string[];
  tags?: string[];
  user_info?: {
    name: string;
    email: string;
    phone: string;
  };
  responses?: CustomerSupportMessage[];
}

export interface CustomerSupportMessage {
  id: string;
  ticket_id: string;
  user_id?: string;
  support_agent_id?: string;
  message: string;
  is_from_support: boolean;
  created_at: string;
  attachments?: string[];
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'booking' | 'general' | 'complaint' | 'feedback';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  tags?: string[];
}

export interface CustomerSupportResponse {
  success: boolean;
  message: string;
  data: CustomerSupportTicket;
}

export interface CustomerSupportListResponse {
  success: boolean;
  message: string;
  data: CustomerSupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class CustomerSupportService {
  // Create a new support ticket
  async createTicket(request: CreateTicketRequest): Promise<CustomerSupportResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.CUSTOMER_SUPPORT.CREATE,
        'POST',
        request
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to create support ticket: ${error.message}`);
    }
  }

  // Get support tickets for a specific user
  async getUserTickets(
    userId: string, 
    params: CustomerSupportQueryParams = {}
  ): Promise<CustomerSupportListResponse> {
    try {
      // Set default pagination if not provided
      const queryParams = {
        page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params,
      };

      const response = await makeApiRequest(
        `${API_CONFIG.ENDPOINTS.CUSTOMER_SUPPORT.GET_BY_USER}/${userId}`,
        'GET',
        undefined,
        queryParams
      );
      
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch user tickets: ${error.message}`);
    }
  }

  // Get open tickets for a user
  async getOpenTickets(
    userId: string, 
    params: Omit<CustomerSupportQueryParams, 'status'> = {}
  ): Promise<CustomerSupportListResponse> {
    return this.getUserTickets(userId, { ...params, status: 'open' });
  }

  // Get resolved tickets for a user
  async getResolvedTickets(
    userId: string, 
    params: Omit<CustomerSupportQueryParams, 'status'> = {}
  ): Promise<CustomerSupportListResponse> {
    return this.getUserTickets(userId, { ...params, status: 'resolved' });
  }

  // Get tickets by category
  async getTicketsByCategory(
    userId: string,
    category: 'technical' | 'billing' | 'booking' | 'general' | 'complaint' | 'feedback',
    params: Omit<CustomerSupportQueryParams, 'category'> = {}
  ): Promise<CustomerSupportListResponse> {
    return this.getUserTickets(userId, { ...params, category });
  }

  // Get tickets by priority
  async getTicketsByPriority(
    userId: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    params: Omit<CustomerSupportQueryParams, 'priority'> = {}
  ): Promise<CustomerSupportListResponse> {
    return this.getUserTickets(userId, { ...params, priority });
  }

  // Get urgent tickets for a user
  async getUrgentTickets(
    userId: string, 
    params: Omit<CustomerSupportQueryParams, 'priority'> = {}
  ): Promise<CustomerSupportListResponse> {
    return this.getUserTickets(userId, { ...params, priority: 'urgent' });
  }

  // Helper method to get ticket status display name
  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  }

  // Helper method to get priority display name
  getPriorityDisplayName(priority: string): string {
    switch (priority) {
      case 'low':
        return 'Low';
      case 'medium':
        return 'Medium';
      case 'high':
        return 'High';
      case 'urgent':
        return 'Urgent';
      default:
        return priority;
    }
  }

  // Helper method to get category display name
  getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'technical':
        return 'Technical Issue';
      case 'billing':
        return 'Billing & Payment';
      case 'booking':
        return 'Booking Issue';
      case 'general':
        return 'General Inquiry';
      case 'complaint':
        return 'Complaint';
      case 'feedback':
        return 'Feedback';
      default:
        return category;
    }
  }

  // Helper method to get priority color
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'low':
        return '#4CAF50'; // Green
      case 'medium':
        return '#FF9800'; // Orange
      case 'high':
        return '#F44336'; // Red
      case 'urgent':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  }

  // Helper method to get status color
  getStatusColor(status: string): string {
    switch (status) {
      case 'open':
        return '#2196F3'; // Blue
      case 'in_progress':
        return '#FF9800'; // Orange
      case 'resolved':
        return '#4CAF50'; // Green
      case 'closed':
        return '#757575'; // Grey
      default:
        return '#757575'; // Grey
    }
  }

  // Helper method to check if ticket is urgent
  isUrgentTicket(ticket: CustomerSupportTicket): boolean {
    return ticket.priority === 'urgent' || ticket.priority === 'high';
  }

  // Helper method to check if ticket is open
  isOpenTicket(ticket: CustomerSupportTicket): boolean {
    return ticket.status === 'open' || ticket.status === 'in_progress';
  }

  // Helper method to format ticket creation date
  formatTicketDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  }

  // Helper method to get ticket summary
  getTicketSummary(ticket: CustomerSupportTicket): string {
    const words = ticket.description.split(' ');
    if (words.length <= 20) {
      return ticket.description;
    }
    return words.slice(0, 20).join(' ') + '...';
  }

  // Helper method to get response count
  getResponseCount(ticket: CustomerSupportTicket): number {
    return ticket.responses?.length || 0;
  }

  // Helper method to get last response time
  getLastResponseTime(ticket: CustomerSupportTicket): string | null {
    if (!ticket.responses || ticket.responses.length === 0) {
      return null;
    }
    
    const lastResponse = ticket.responses[ticket.responses.length - 1];
    return this.formatTicketDate(lastResponse.created_at);
  }

  // Mock methods for development/testing
  async createTicketMock(request: CreateTicketRequest): Promise<CustomerSupportResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockTicket: CustomerSupportTicket = {
      id: `ticket_${Date.now()}`,
      user_id: 'user_123',
      subject: request.subject,
      description: request.description,
      category: request.category,
      priority: request.priority || 'medium',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attachments: request.attachments || [],
      tags: request.tags || [],
      user_info: {
        name: 'Test User',
        email: 'test@example.com',
        phone: '+919876543210',
      },
      responses: [],
    };
    
    return {
      success: true,
      message: 'Support ticket created successfully',
      data: mockTicket,
    };
  }

  async getUserTicketsMock(
    userId: string, 
    params: CustomerSupportQueryParams = {}
  ): Promise<CustomerSupportListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockTickets: CustomerSupportTicket[] = [
      {
        id: 'ticket_1',
        user_id: userId,
        subject: 'Payment Issue - Transaction Failed',
        description: 'I tried to book a yoga session but the payment failed. I received an error message saying "Transaction declined". I have sufficient balance in my account. Please help me resolve this issue.',
        category: 'billing',
        priority: 'high',
        status: 'open',
        created_at: '2025-01-15T10:30:00.000Z',
        updated_at: '2025-01-15T10:30:00.000Z',
        user_info: {
          name: 'Anya Sharma',
          email: 'anya.sharma@example.com',
          phone: '+919876543210',
        },
        responses: [
          {
            id: 'response_1',
            ticket_id: 'ticket_1',
            support_agent_id: 'agent_1',
            message: 'Thank you for reaching out. We have received your complaint and our team is looking into this issue. We will get back to you within 24 hours.',
            is_from_support: true,
            created_at: '2025-01-15T11:00:00.000Z',
          },
        ],
      },
      {
        id: 'ticket_2',
        user_id: userId,
        subject: 'App Not Loading - Technical Issue',
        description: 'The app is not loading properly on my device. It keeps showing a blank screen after the splash screen. I have tried restarting the app and my device but the issue persists.',
        category: 'technical',
        priority: 'medium',
        status: 'in_progress',
        assigned_to: 'agent_2',
        created_at: '2025-01-14T15:20:00.000Z',
        updated_at: '2025-01-15T09:15:00.000Z',
        user_info: {
          name: 'Anya Sharma',
          email: 'anya.sharma@example.com',
          phone: '+919876543210',
        },
        responses: [
          {
            id: 'response_2',
            ticket_id: 'ticket_2',
            support_agent_id: 'agent_2',
            message: 'We are investigating this issue. Could you please provide your device model and OS version?',
            is_from_support: true,
            created_at: '2025-01-14T16:00:00.000Z',
          },
          {
            id: 'response_3',
            ticket_id: 'ticket_2',
            user_id: userId,
            message: 'I am using iPhone 12 with iOS 17.2',
            is_from_support: false,
            created_at: '2025-01-15T09:15:00.000Z',
          },
        ],
      },
      {
        id: 'ticket_3',
        user_id: userId,
        subject: 'Booking Cancellation Request',
        description: 'I need to cancel my yoga session scheduled for tomorrow at 10 AM. The instructor is Dr. Anya Sharma. Please help me with the cancellation process.',
        category: 'booking',
        priority: 'low',
        status: 'resolved',
        resolved_at: '2025-01-13T14:30:00.000Z',
        created_at: '2025-01-13T10:00:00.000Z',
        updated_at: '2025-01-13T14:30:00.000Z',
        user_info: {
          name: 'Anya Sharma',
          email: 'anya.sharma@example.com',
          phone: '+919876543210',
        },
        responses: [
          {
            id: 'response_4',
            ticket_id: 'ticket_3',
            support_agent_id: 'agent_1',
            message: 'Your booking has been successfully cancelled. A refund will be processed within 3-5 business days.',
            is_from_support: true,
            created_at: '2025-01-13T14:30:00.000Z',
          },
        ],
      },
      {
        id: 'ticket_4',
        user_id: userId,
        subject: 'Great Experience - Positive Feedback',
        description: 'I had an amazing yoga session with Dr. Anya Sharma yesterday. Her teaching style is excellent and she helped me with my back pain issues. Highly recommended!',
        category: 'feedback',
        priority: 'low',
        status: 'closed',
        created_at: '2025-01-12T16:45:00.000Z',
        updated_at: '2025-01-12T17:00:00.000Z',
        user_info: {
          name: 'Anya Sharma',
          email: 'anya.sharma@example.com',
          phone: '+919876543210',
        },
        responses: [
          {
            id: 'response_5',
            ticket_id: 'ticket_4',
            support_agent_id: 'agent_3',
            message: 'Thank you for your positive feedback! We are glad you had a great experience. We will share this with Dr. Anya Sharma.',
            is_from_support: true,
            created_at: '2025-01-12T17:00:00.000Z',
          },
        ],
      },
    ];
    
    // Apply filters if provided
    let filteredTickets = mockTickets;
    
    if (params.status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === params.status);
    }
    
    if (params.priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === params.priority);
    }
    
    if (params.category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === params.category);
    }
    
    // Apply sorting
    if (params.sort_by) {
      switch (params.sort_by) {
        case 'created_at':
          filteredTickets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'updated_at':
          filteredTickets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          filteredTickets.sort((a, b) => priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]);
          break;
        case 'status':
          const statusOrder = { open: 4, in_progress: 3, resolved: 2, closed: 1 };
          filteredTickets.sort((a, b) => statusOrder[b.status as keyof typeof statusOrder] - statusOrder[a.status as keyof typeof statusOrder]);
          break;
      }
    }
    
    return {
      success: true,
      message: 'User tickets fetched successfully',
      data: filteredTickets,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: filteredTickets.length,
        pages: Math.ceil(filteredTickets.length / (params.limit || 10)),
      },
    };
  }
}

export const customerSupportService = new CustomerSupportService(); 