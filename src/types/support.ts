// Support-related TypeScript interfaces

export interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  tags: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}
