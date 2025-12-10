export interface ChatUser {
  _id: string;
  name: string;
  avatar?: string;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  _id: string;
  text: string;
  createdAt: Date | string;
  user: ChatUser;
  // Status from backend
  status: MessageStatus;
  // Convenience flags for UI / GiftedChat mapping
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
}

export interface ChatSessionParticipant {
  userId: string;
  userType: string;
  role: string;
}

export interface ChatSession {
  id: string; // chatId
  title: string;
  participants: ChatSessionParticipant[];
  lastMessage?: {
    content: string;
    timestamp: string;
  };
  unreadCount?: number;
  avatar?: string; // Helper for UI
}

export interface ChatListResponse {
  msg?: string;
  data: ChatSession[] | { items: ChatSession[] };
}

export interface ChatMessagesResponse {
  msg?: string;
  data: ChatMessage[] | { items: ChatMessage[] };
}
