import { apiClient, ApiResult } from './apiClient';
import type { ChatSession, ChatMessage } from '../types/chat';

export const chatService = {
  // Get user's chat sessions
  getUserChats: async (page: number = 1, limit: number = 20): Promise<ApiResult<ChatSession[]>> => {
    const response = await apiClient.get('/chat/list', { params: { page, limit } });
    const raw = response.data as any;
    const dataField = raw?.data ?? raw;
    let chats: ChatSession[] = [];
    
    if (Array.isArray(dataField)) {
      chats = dataField;
    } else if (Array.isArray(dataField?.items)) {
      chats = dataField.items;
    }
    
    return {
      success: true,
      data: chats,
    };
  },

  // Get messages for a specific chat
  getChatMessages: async (
    chatId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<ApiResult<ChatMessage[] | any[]>> => {
    // Ensure chatId is explicitly a string (UUID format)
    const chatIdStr = String(chatId || '').trim();
    
    if (!chatIdStr || chatIdStr === 'undefined' || chatIdStr === 'null') {
      console.error('❌ Invalid chatId provided to getChatMessages:', chatId);
      return {
        success: false,
        error: 'Invalid chat ID. Please try again.',
      };
    }
    
    console.log('📡 API: Fetching messages for chatId:', chatIdStr, 'Type:', typeof chatIdStr);
    
    const response = await apiClient.get(`/chat/${chatIdStr}/messages`, {
      params: { page, limit },
    });
    const raw = response.data as any;
    const dataField = raw?.data ?? raw;
    let messages: any[] = [];
    
    if (Array.isArray(dataField)) {
      messages = dataField;
    } else if (Array.isArray(dataField?.items)) {
      messages = dataField.items;
    }
    
    return {
      success: true,
      data: messages,
    };
  },

  // Create a new private chat
  createChat: async (
    participantId: string,
    participantType: string,
  ): Promise<ApiResult<any>> => {
    const payload = {
      participantIds: [participantId],
      participantTypes: [participantType],
      chatType: 'private',
    };
    
    const response = await apiClient.post('/chat/create', payload);
    
    // Unwrap the nested data
    const raw = response.data;
    const chatData = raw?.data ?? raw;

    return {
      success: true,
      data: chatData, 
    };
  },

  // Send a message
  sendMessage: async (chatId: string, message: string, messageType: string = 'text'): Promise<ApiResult<any>> => {
    const payload = {
      chatId,
      message,
      messageType,
    };
    
    return apiClient.post(`/chat/${chatId}/send`, payload);
  },

  // Mark messages as read
  markAsRead: async (chatId: string, messageIds: string[]): Promise<ApiResult<any>> => {
    const payload = {
      messageIds,
    };
    
    return apiClient.post(`/chat/${chatId}/read`, payload);
  },
};
