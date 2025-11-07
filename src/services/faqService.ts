// faqService.ts
import { 
  makeApiRequest, 
  API_CONFIG, 
  FAQQueryParams 
} from '../config/api';

// Types for FAQ API
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'booking' | 'payment' | 'technical' | 'professional' | 'yoga' | 'wellness';
  tags?: string[];
  is_active: boolean;
  is_featured?: boolean;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  last_updated_by?: string;
}

export interface CreateFAQRequest {
  question: string;
  answer: string;
  category: 'general' | 'booking' | 'payment' | 'technical' | 'professional' | 'yoga' | 'wellness';
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface UpdateFAQRequest {
  question?: string;
  answer?: string;
  category?: 'general' | 'booking' | 'payment' | 'technical' | 'professional' | 'yoga' | 'wellness';
  tags?: string[];
  is_active?: boolean;
  is_featured?: boolean;
}

export interface FAQResponse {
  success: boolean;
  message: string;
  data: FAQ;
}

export interface FAQListResponse {
  success: boolean;
  message: string;
  data: FAQ[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FAQCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  color?: string;
  faq_count: number;
}

class FAQService {
  // Admin: Add new FAQ
  async addFAQ(request: CreateFAQRequest): Promise<FAQResponse> {
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.FAQ.ADMIN_ADD,
        'POST',
        request
      );
      return response;
    } catch (error: any) {
      throw new Error(`Failed to add FAQ: ${error.message}`);
    }
  }

  // Get FAQs for users
  async getUserFAQs(params: FAQQueryParams = {}): Promise<FAQListResponse> {
    try {
      // Set default pagination if not provided
      const queryParams = {
        page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params,
      };

      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.FAQ.USER_GET,
        'GET',
        undefined,
        queryParams
      );
      
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch user FAQs: ${error.message}`);
    }
  }

  // Get FAQs for professionals
  async getProfessionalFAQs(params: FAQQueryParams = {}): Promise<FAQListResponse> {
    try {
      // Set default pagination if not provided
      const queryParams = {
        page: API_CONFIG.PAGINATION.DEFAULT_PAGE,
        limit: API_CONFIG.PAGINATION.DEFAULT_LIMIT,
        ...params,
      };

      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.FAQ.PROFESSIONAL_GET,
        'GET',
        undefined,
        queryParams
      );
      
      return response;
    } catch (error: any) {
      throw new Error(`Failed to fetch professional FAQs: ${error.message}`);
    }
  }

  // Get FAQs by category
  async getFAQsByCategory(
    category: 'general' | 'booking' | 'payment' | 'technical' | 'professional' | 'yoga' | 'wellness',
    params: Omit<FAQQueryParams, 'category'> = {}
  ): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, category });
  }

  // Get featured FAQs
  async getFeaturedFAQs(params: Omit<FAQQueryParams, 'is_featured'> = {}): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, is_featured: true });
  }

  // Search FAQs
  async searchFAQs(
    searchTerm: string,
    params: Omit<FAQQueryParams, 'search'> = {}
  ): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, search: searchTerm });
  }

  // Get active FAQs only
  async getActiveFAQs(params: Omit<FAQQueryParams, 'is_active'> = {}): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, is_active: true });
  }

  // Get FAQs sorted by most viewed
  async getMostViewedFAQs(params: Omit<FAQQueryParams, 'sort_by'> = {}): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, sort_by: 'created_at' });
  }

  // Get FAQs sorted by most helpful
  async getMostHelpfulFAQs(params: Omit<FAQQueryParams, 'sort_by'> = {}): Promise<FAQListResponse> {
    return this.getUserFAQs({ ...params, sort_by: 'created_at' });
  }

  // Helper method to get category display name
  getCategoryDisplayName(category: string): string {
    switch (category) {
      case 'general':
        return 'General';
      case 'booking':
        return 'Booking & Appointments';
      case 'payment':
        return 'Payment & Billing';
      case 'technical':
        return 'Technical Support';
      case 'professional':
        return 'Professional Services';
      case 'yoga':
        return 'Yoga & Wellness';
      case 'wellness':
        return 'Health & Wellness';
      default:
        return category;
    }
  }

  // Helper method to get category icon
  getCategoryIcon(category: string): string {
    switch (category) {
      case 'general':
        return 'help-circle';
      case 'booking':
        return 'calendar-check';
      case 'payment':
        return 'credit-card';
      case 'technical':
        return 'cog';
      case 'professional':
        return 'account-tie';
      case 'yoga':
        return 'yoga';
      case 'wellness':
        return 'heart-pulse';
      default:
        return 'help-circle';
    }
  }

  // Helper method to get category color
  getCategoryColor(category: string): string {
    switch (category) {
      case 'general':
        return '#2196F3'; // Blue
      case 'booking':
        return '#4CAF50'; // Green
      case 'payment':
        return '#FF9800'; // Orange
      case 'technical':
        return '#9C27B0'; // Purple
      case 'professional':
        return '#607D8B'; // Blue Grey
      case 'yoga':
        return '#8BC34A'; // Light Green
      case 'wellness':
        return '#E91E63'; // Pink
      default:
        return '#757575'; // Grey
    }
  }

  // Helper method to format FAQ answer for display
  formatFAQAnswer(answer: string, maxLength: number = 150): string {
    if (answer.length <= maxLength) {
      return answer;
    }
    return answer.substring(0, maxLength) + '...';
  }

  // Helper method to get FAQ summary
  getFAQSummary(faq: FAQ): string {
    return this.formatFAQAnswer(faq.answer, 100);
  }

  // Helper method to check if FAQ is helpful
  isFAQHelpful(faq: FAQ): boolean {
    if (!faq.helpful_count || !faq.not_helpful_count) {
      return false;
    }
    return faq.helpful_count > faq.not_helpful_count;
  }

  // Helper method to get FAQ rating percentage
  getFAQRatingPercentage(faq: FAQ): number {
    if (!faq.helpful_count || !faq.not_helpful_count) {
      return 0;
    }
    const total = faq.helpful_count + faq.not_helpful_count;
    return Math.round((faq.helpful_count / total) * 100);
  }

  // Helper method to format FAQ creation date
  formatFAQDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  // Helper method to get FAQ categories
  getFAQCategories(): FAQCategory[] {
    return [
      {
        id: 'general',
        name: 'General',
        description: 'General questions about the platform',
        icon: 'help-circle',
        color: '#2196F3',
        faq_count: 0,
      },
      {
        id: 'booking',
        name: 'Booking & Appointments',
        description: 'Questions about booking sessions and appointments',
        icon: 'calendar-check',
        color: '#4CAF50',
        faq_count: 0,
      },
      {
        id: 'payment',
        name: 'Payment & Billing',
        description: 'Questions about payments, billing, and refunds',
        icon: 'credit-card',
        color: '#FF9800',
        faq_count: 0,
      },
      {
        id: 'technical',
        name: 'Technical Support',
        description: 'Technical issues and app-related questions',
        icon: 'cog',
        color: '#9C27B0',
        faq_count: 0,
      },
      {
        id: 'professional',
        name: 'Professional Services',
        description: 'Questions about professional services and features',
        icon: 'account-tie',
        color: '#607D8B',
        faq_count: 0,
      },
      {
        id: 'yoga',
        name: 'Yoga & Wellness',
        description: 'Questions about yoga practices and wellness',
        icon: 'yoga',
        color: '#8BC34A',
        faq_count: 0,
      },
      {
        id: 'wellness',
        name: 'Health & Wellness',
        description: 'General health and wellness questions',
        icon: 'heart-pulse',
        color: '#E91E63',
        faq_count: 0,
      },
    ];
  }

  // Helper method to filter FAQs by search term
  filterFAQsBySearch(faqs: FAQ[], searchTerm: string): FAQ[] {
    if (!searchTerm.trim()) {
      return faqs;
    }
    
    const term = searchTerm.toLowerCase();
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(term) ||
      faq.answer.toLowerCase().includes(term) ||
      faq.tags?.some(tag => tag.toLowerCase().includes(term))
    );
  }

  // Helper method to group FAQs by category
  groupFAQsByCategory(faqs: FAQ[]): Record<string, FAQ[]> {
    const grouped: Record<string, FAQ[]> = {};
    
    faqs.forEach(faq => {
      if (!grouped[faq.category]) {
        grouped[faq.category] = [];
      }
      grouped[faq.category].push(faq);
    });
    
    return grouped;
  }

  // Mock methods for development/testing
  async addFAQMock(request: CreateFAQRequest): Promise<FAQResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockFAQ: FAQ = {
      id: `faq_${Date.now()}`,
      question: request.question,
      answer: request.answer,
      category: request.category,
      tags: request.tags || [],
      is_active: request.is_active ?? true,
      is_featured: request.is_featured ?? false,
      view_count: 0,
      helpful_count: 0,
      not_helpful_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: 'admin_123',
    };
    
    return {
      success: true,
      message: 'FAQ added successfully',
      data: mockFAQ,
    };
  }

  async getUserFAQsMock(params: FAQQueryParams = {}): Promise<FAQListResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockFAQs: FAQ[] = [
      {
        id: 'faq_1',
        question: 'How do I book a yoga session?',
        answer: 'To book a yoga session, follow these steps: 1. Browse available professionals in the Explore section, 2. Select a professional and view their profile, 3. Choose your preferred date and time slot, 4. Complete the booking process and payment. You will receive a confirmation email with session details.',
        category: 'booking',
        tags: ['booking', 'yoga', 'session'],
        is_active: true,
        is_featured: true,
        view_count: 1250,
        helpful_count: 89,
        not_helpful_count: 12,
        created_at: '2024-12-01T10:00:00.000Z',
        updated_at: '2024-12-15T14:30:00.000Z',
      },
      {
        id: 'faq_2',
        question: 'What payment methods are accepted?',
        answer: 'We accept various payment methods including: Credit/Debit cards (Visa, MasterCard, American Express), UPI payments, Net Banking, Digital wallets (Paytm, PhonePe, Google Pay), and Cash on Delivery for offline sessions. All online payments are secured with SSL encryption.',
        category: 'payment',
        tags: ['payment', 'security', 'methods'],
        is_active: true,
        is_featured: true,
        view_count: 890,
        helpful_count: 67,
        not_helpful_count: 8,
        created_at: '2024-11-20T09:15:00.000Z',
        updated_at: '2024-12-10T11:45:00.000Z',
      },
      {
        id: 'faq_3',
        question: 'Can I cancel my booking?',
        answer: 'Yes, you can cancel your booking up to 24 hours before the scheduled session. Cancellations made within 24 hours may be subject to cancellation fees. To cancel, go to your appointments section and select the booking you want to cancel. Refunds will be processed within 3-5 business days.',
        category: 'booking',
        tags: ['cancellation', 'refund', 'policy'],
        is_active: true,
        is_featured: false,
        view_count: 567,
        helpful_count: 45,
        not_helpful_count: 15,
        created_at: '2024-11-15T16:20:00.000Z',
        updated_at: '2024-12-05T10:30:00.000Z',
      },
      {
        id: 'faq_4',
        question: 'How do I reset my password?',
        answer: 'To reset your password: 1. Go to the login screen, 2. Tap on "Forgot Password", 3. Enter your registered email address, 4. Check your email for a password reset link, 5. Click the link and create a new password. If you don\'t receive the email, check your spam folder.',
        category: 'technical',
        tags: ['password', 'reset', 'security'],
        is_active: true,
        is_featured: false,
        view_count: 432,
        helpful_count: 34,
        not_helpful_count: 6,
        created_at: '2024-11-10T12:00:00.000Z',
        updated_at: '2024-11-25T15:20:00.000Z',
      },
      {
        id: 'faq_5',
        question: 'What are the benefits of regular yoga practice?',
        answer: 'Regular yoga practice offers numerous benefits including: improved flexibility and strength, better posture, reduced stress and anxiety, enhanced mental clarity, better sleep quality, increased energy levels, improved cardiovascular health, and better overall well-being. Yoga also helps in managing chronic conditions and promoting mindfulness.',
        category: 'yoga',
        tags: ['benefits', 'health', 'wellness'],
        is_active: true,
        is_featured: true,
        view_count: 2100,
        helpful_count: 156,
        not_helpful_count: 23,
        created_at: '2024-10-25T08:30:00.000Z',
        updated_at: '2024-12-20T13:15:00.000Z',
      },
      {
        id: 'faq_6',
        question: 'How do I become a professional on the platform?',
        answer: 'To become a professional: 1. Apply through our professional registration form, 2. Submit required documents (certifications, experience proof), 3. Complete our verification process, 4. Attend an orientation session, 5. Set up your profile and availability. We review applications within 5-7 business days.',
        category: 'professional',
        tags: ['registration', 'professional', 'application'],
        is_active: true,
        is_featured: false,
        view_count: 345,
        helpful_count: 28,
        not_helpful_count: 4,
        created_at: '2024-11-05T14:45:00.000Z',
        updated_at: '2024-11-30T09:10:00.000Z',
      },
      {
        id: 'faq_7',
        question: 'Is my personal information secure?',
        answer: 'Yes, we take your privacy and security seriously. All personal information is encrypted and stored securely. We follow industry-standard security practices and comply with data protection regulations. We never share your personal information with third parties without your explicit consent.',
        category: 'general',
        tags: ['privacy', 'security', 'data'],
        is_active: true,
        is_featured: false,
        view_count: 678,
        helpful_count: 52,
        not_helpful_count: 9,
        created_at: '2024-10-30T11:20:00.000Z',
        updated_at: '2024-12-12T16:40:00.000Z',
      },
      {
        id: 'faq_8',
        question: 'What should I wear for a yoga session?',
        answer: 'For yoga sessions, wear comfortable, stretchable clothing that allows free movement. Avoid loose-fitting clothes that might get in the way. For online sessions, ensure you have enough space and a yoga mat. For offline sessions, bring your own mat or check if the studio provides one.',
        category: 'yoga',
        tags: ['clothing', 'preparation', 'equipment'],
        is_active: true,
        is_featured: false,
        view_count: 789,
        helpful_count: 61,
        not_helpful_count: 11,
        created_at: '2024-11-08T13:30:00.000Z',
        updated_at: '2024-12-18T12:25:00.000Z',
      },
    ];
    
    // Apply filters if provided
    let filteredFAQs = mockFAQs;
    
    if (params.category) {
      filteredFAQs = filteredFAQs.filter(faq => faq.category === params.category);
    }
    
    if (params.search) {
      filteredFAQs = this.filterFAQsBySearch(filteredFAQs, params.search);
    }
    
    if (params.is_active !== undefined) {
      filteredFAQs = filteredFAQs.filter(faq => faq.is_active === params.is_active);
    }
    
    // Apply sorting
    if (params.sort_by) {
      switch (params.sort_by) {
        case 'created_at':
          filteredFAQs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          break;
        case 'updated_at':
          filteredFAQs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          break;
        case 'title':
          filteredFAQs.sort((a, b) => a.question.localeCompare(b.question));
          break;
        case 'category':
          filteredFAQs.sort((a, b) => a.category.localeCompare(b.category));
          break;
      }
    }
    
    return {
      success: true,
      message: 'FAQs fetched successfully',
      data: filteredFAQs,
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: filteredFAQs.length,
        pages: Math.ceil(filteredFAQs.length / (params.limit || 10)),
      },
    };
  }

  async getProfessionalFAQsMock(params: FAQQueryParams = {}): Promise<FAQListResponse> {
    // For professionals, return a subset of FAQs focused on professional-related topics
    const userFAQs = await this.getUserFAQsMock(params);
    
    // Filter to include mostly professional, booking, and payment FAQs
    const professionalFAQs = userFAQs.data.filter(faq => 
      ['professional', 'booking', 'payment', 'technical'].includes(faq.category)
    );
    
    return {
      ...userFAQs,
      data: professionalFAQs,
      pagination: {
        ...userFAQs.pagination,
        total: professionalFAQs.length,
        pages: Math.ceil(professionalFAQs.length / (params.limit || 10)),
      },
    };
  }
}

export const faqService = new FAQService(); 