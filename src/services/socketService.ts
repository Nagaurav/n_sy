import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'https://samya-be.oetech.co';

class SocketService {
  private socket: Socket | null = null;
  private pendingUserId: string | number | null = null;
  private pendingUserType: string | null = null;

  /**
   * Connect to Socket.IO server with authentication token.
   * Registration is automatically emitted upon successful connection.
   * 
   * @param token - JWT authentication token (required by backend authenticateSocket middleware)
   * @param userId - User ID to register with the socket
   * @param userType - User type (e.g., 'patient', 'professional')
   * @returns The socket instance
   */
  connect(token: string, userId: string | number, userType: string): Socket {
    // If already connected with same credentials, return existing socket
    if (this.socket && this.socket.connected) {
      // If credentials changed, disconnect and reconnect
      if (this.pendingUserId !== userId || this.pendingUserType !== userType) {
        console.log('🔄 Socket credentials changed, reconnecting...');
        this.disconnect();
      } else {
        return this.socket;
      }
    }

    // Store credentials for registration after connection
    this.pendingUserId = userId;
    this.pendingUserType = userType;

    console.log('🔌 Initializing Socket.IO connection...');

    // Initialize socket client (lazy connection - not connected until connect() is called)
    this.socket = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      // Token is sent in handshake auth payload (required by backend authenticateSocket middleware)
      auth: {
        token,
      },
      // Auto-connect is enabled by default, but we control when connect() is called
      autoConnect: true,
    });

    // Set up connection event listener to emit registration immediately upon connection
    this.socket.on('connect', () => {
      console.log('✅ Socket.IO connected successfully');
      
      // Immediately emit registration event to link user ID to socket ID on server
      if (this.pendingUserId && this.pendingUserType && this.socket) {
        console.log(`📝 Registering socket: userId=${this.pendingUserId}, userType=${this.pendingUserType}`);
        this.socket.emit('register', {
          userId: this.pendingUserId,
          userType: this.pendingUserType,
        });
      }
    });

    // Handle connection errors
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      
      // Handle authentication errors specifically
      if (error.message.includes('jwt') || error.message.includes('token') || error.message.includes('auth')) {
        console.error('🔒 Authentication error in socket connection:', error.message);
        // Emit an event that can be handled by the app to trigger a logout
        this.socket?.emit('auth_error', { 
          code: 'AUTH_ERROR', 
          message: 'Authentication failed. Please log in again.' 
        });
      }
    });

    // Handle disconnection
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });

    return this.socket;
  }

  get instance() {
    return this.socket;
  }

  /**
   * @deprecated Use connect() with userId and userType parameters instead.
   * Registration is now automatic upon connection.
   */
  register(userId: string | number, userType: string) {
    console.warn('⚠️ register() is deprecated. Registration is now automatic in connect().');
    if (!this.socket) {
      console.error('❌ Cannot register: socket not connected');
      return;
    }
    this.socket.emit('register', { userId, userType });
  }

  joinChat(chatId: string, userId: string | number) {
    if (!this.socket) return;
    // CRITICAL: Ensure chatId is always a string (UUID format)
    const chatIdStr = String(chatId || '').trim();
    if (!chatIdStr || chatIdStr === 'undefined' || chatIdStr === 'null') {
      console.error('❌ Cannot join chat: Invalid chatId', chatId);
      return;
    }
    console.log('🔌 Joining chat via socket:', chatIdStr);
    this.socket.emit('join_chat', { chatId: chatIdStr, userId });
  }

  // Advanced message send with tempId (for pending -> sent mapping)
  sendMessage(chatId: string, content: string, tempId?: string) {
    if (!this.socket) return;
    // CRITICAL: Ensure chatId is always a string (UUID format)
    const chatIdStr = String(chatId || '').trim();
    if (!chatIdStr || chatIdStr === 'undefined' || chatIdStr === 'null') {
      console.error('❌ Cannot send message: Invalid chatId', chatId);
      return;
    }
    this.socket.emit('send_message', { chatId: chatIdStr, content, tempId });
  }

  // Delivery / read receipts emitters
  markDelivered(chatId: string, messageId: string) {
    if (!this.socket) return;
    // CRITICAL: Ensure chatId is always a string (UUID format)
    const chatIdStr = String(chatId || '').trim();
    if (!chatIdStr || chatIdStr === 'undefined' || chatIdStr === 'null') {
      console.error('❌ Cannot mark delivered: Invalid chatId', chatId);
      return;
    }
    this.socket.emit('mark_delivered', { chatId: chatIdStr, messageId: String(messageId) });
  }

  markRead(chatId: string, messageId: string) {
    if (!this.socket) return;
    // CRITICAL: Ensure chatId is always a string (UUID format)
    const chatIdStr = String(chatId || '').trim();
    if (!chatIdStr || chatIdStr === 'undefined' || chatIdStr === 'null') {
      console.error('❌ Cannot mark read: Invalid chatId', chatId);
      return;
    }
    this.socket.emit('mark_read', { chatId: chatIdStr, messageId: String(messageId) });
  }

  // Listeners
  onMessageSent(callback: (payload: any) => void) {
    if (!this.socket) return;
    this.socket.on('message_sent', callback);
  }

  onNewMessage(callback: (message: any) => void) {
    if (!this.socket) return;
    this.socket.on('new_message', (message: any) => {
      try {
        const chatId =
          message?.chatId || message?.chat_id || message?.chat?.id || message?.chat?._id;
        const messageId = message?.messageId || message?.id || message?._id;

        if (chatId && messageId) {
          this.markDelivered(String(chatId), String(messageId));
        }
      } catch (e) {
        // Swallow errors to avoid breaking the listener chain
        console.warn('Failed to auto mark message as delivered:', e);
      }

      callback(message);
    });
  }

  onMessageDelivered(callback: (payload: any) => void) {
    if (!this.socket) return;
    this.socket.on('message_delivered', callback);
  }

  onMessageRead(callback: (payload: any) => void) {
    if (!this.socket) return;
    this.socket.on('message_read', callback);
  }

  offNewMessage() {
    if (!this.socket) return;
    this.socket.off('new_message');
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    // Clear pending credentials
    this.pendingUserId = null;
    this.pendingUserType = null;
  }
}

export const socketService = new SocketService();
