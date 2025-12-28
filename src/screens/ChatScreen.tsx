import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useRoute, RouteProp, useNavigation, useIsFocused } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GiftedChat, IMessage, Bubble } from 'react-native-gifted-chat';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import type { HomeStackParamList } from '../../App';
import type { MessageStatus } from '../types/chat';

interface ChatScreenParams {
  appointmentId: string;
  title?: string;
}

type ChatScreenRouteProp = RouteProp<Record<'ChatScreen', ChatScreenParams>, 'ChatScreen'>;
type ChatScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user, token, isAuthReady } = useAuth();
  const isFocused = useIsFocused();
  
  // Get appointment data from Redux store
  const currentAppointment = useSelector((state: RootState) => state.appointment.currentAppointment);

  // Use appointmentId as the room ID
  const { appointmentId: rawAppointmentId, title } = route.params;
  const appointmentId = String(rawAppointmentId || '');
  const chatId = appointmentId; // Use appointmentId as chatId for room identification
  
  // Get professional name from Redux store
  const professionalName = currentAppointment?.professional_name || title || 'Professional';
  
  // Log chatId and appointmentId for debugging
  useEffect(() => {
    console.log('🔍 ChatScreen mounted with chatId:', chatId, 'appointmentId:', appointmentId);
    if (!chatId || chatId === 'undefined' || chatId === 'null') {
      console.error('❌ Invalid chatId received:', chatId);
    }
    if (!appointmentId || appointmentId === 'undefined' || appointmentId === 'null') {
      console.error('❌ Invalid appointmentId received:', rawAppointmentId);
      // Navigate back if no appointmentId - chat should only be accessible via appointment
      navigation.goBack();
    }
  }, [chatId, rawAppointmentId, appointmentId, navigation]);

  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);

  const socketRef = useRef<any>(null);
  // Track which messages have been marked as read to avoid duplicate receipts
  const readMessagesRef = useRef<Set<string>>(new Set());

  // CRITICAL: Use single canonical user_id source to prevent socket registration failures
  // The User type defines user_id as the primary key (number), so we use that exclusively
  const getCanonicalUserId = useCallback((): string => {
    if (!user) {
      console.error('❌ [ChatScreen] User object is null/undefined');
      return '';
    }
    // Use user_id as the single source of truth (primary key from API)
    const userId = (user as any)?.user_id;
    if (!userId && userId !== 0) {
      console.error('❌ [ChatScreen] user_id is missing from user object:', user);
      return '';
    }
    return String(userId);
  }, [user]);

  const currentUserId = useRef<string>(getCanonicalUserId());
  
  // Update userId ref when user changes, but don't trigger re-connection
  useEffect(() => {
    const newUserId = getCanonicalUserId();
    if (newUserId && newUserId !== currentUserId.current) {
      console.log('🔄 [ChatScreen] User ID updated:', { old: currentUserId.current, new: newUserId });
      currentUserId.current = newUserId;
    } else if (!newUserId) {
      console.error('❌ [ChatScreen] Cannot update userId: invalid user_id');
    }
  }, [user, getCanonicalUserId]);

  useEffect(() => {
    if (title) {
      navigation.setOptions({ headerTitle: title } as any);
    }
  }, [navigation, title]);

  const mapBackendMessageToGifted = useCallback(
    (msg: any): IMessage & { status?: MessageStatus; tempId?: string } => {
      const id = String(msg._id || msg.id || msg.messageId || `${chatId}-${Date.now()}`);
      const text = msg.content || msg.text || '';
      const createdAtRaw = msg.createdAt || msg.timestamp || msg.created_at;
      const createdAt = createdAtRaw ? new Date(createdAtRaw) : new Date();
      const senderId = String(
        msg.senderId || msg.userId || msg.sender_id || msg.user?._id || msg.userId || '',
      );
      const senderName = msg.senderName || msg.sender_name || msg.user?.name || 'User';

      const rawStatus = msg.status as MessageStatus | undefined;
      const status: MessageStatus =
        rawStatus === 'pending' ||
        rawStatus === 'sent' ||
        rawStatus === 'delivered' ||
        rawStatus === 'read'
          ? rawStatus
          : 'sent';

      const message: any = {
        _id: id,
        text,
        createdAt,
        user: {
          _id: senderId || 'unknown',
          name: senderName,
        },
        status,
      };

      if (String(senderId) === String(currentUserId.current)) {
        message.pending = status === 'pending';
        message.sent = status === 'sent' || status === 'delivered' || status === 'read';
        message.received = status === 'delivered' || status === 'read';
      }

      return message;
    },
    [chatId],
  );

  const loadMessages = useCallback(
    async (pageToLoad: number, append: boolean = false) => {
      const limit = 20;
      try {
        if (append) {
          setIsLoadingEarlier(true);
        } else {
          setIsLoading(true);
        }

        // CRITICAL: Ensure chatId is passed as string to API
        const chatIdStr = String(chatId);
        console.log('📡 Fetching messages for chatId:', chatIdStr, 'Type:', typeof chatIdStr);
        const response = await apiService.getChatMessages(chatIdStr, pageToLoad, limit);
        if (response.success && response.data) {
          const mapped = response.data.map(mapBackendMessageToGifted);
          const normalized = mapped.reverse();

          setHasMore(normalized.length === limit);
          setPage(pageToLoad);

          setMessages((previous) =>
            append ? GiftedChat.prepend(previous, normalized) : normalized,
          );
        } else if (response.error) {
          // Handle permission errors gracefully (403, 404, etc.)
          console.warn('⚠️ Failed to load messages:', response.error);
          // Don't show error for 403/404 - just show empty chat
          // The user might not have permission or chat might not exist yet
          if (!append) {
            setMessages([]);
          }
          if (append) {
            setHasMore(false);
          }
        } else if (append) {
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load chat messages:', error);
        // On error, just show empty messages (don't break the UI)
        if (!append) {
          setMessages([]);
        }
      } finally {
        setIsLoading(false);
        setIsLoadingEarlier(false);
      }
    },
    [chatId, mapBackendMessageToGifted],
  );

  const handleLoadEarlier = useCallback(() => {
    if (!hasMore || isLoadingEarlier) return;
    const nextPage = page + 1;
    loadMessages(nextPage, true);
  }, [page, hasMore, isLoadingEarlier, loadMessages]);

  // CRITICAL: Isolated socket connection - only depends on token and chatId
  // This prevents unnecessary re-connections when other state changes
  useEffect(() => {
    // Validate chatId is a valid non-empty string (UUID format)
    if (!isAuthReady || !token || !chatId || chatId === 'undefined' || chatId === 'null' || !currentUserId.current) {
      if (!chatId || chatId === 'undefined' || chatId === 'null') {
        console.error('❌ Cannot connect socket: Invalid chatId', chatId);
      }
      return;
    }

    console.log('🔌 Attempting stable socket connection...', { 
      hasToken: !!token, 
      chatId, 
      userId: currentUserId.current 
    });

    // Connect socket with token, userId, and userType - registration is automatic
    const socket = socketService.connect(token, String(currentUserId.current), 'patient');
    socketRef.current = socket;
    
    // Join the specific chat room - ensure chatId is string
    const chatIdStr = String(chatId);
    console.log('🔌 Joining chat room:', chatIdStr);
    socketService.joinChat(chatIdStr, String(currentUserId.current));

    // Cleanup: Only disconnect if chatId or token changes (not on every re-render)
    return () => {
      console.log('🧹 Running cleanup: Removing chat listeners (not disconnecting socket)');
      // Cleanup: Remove chat-specific listeners
    };
  }, [isAuthReady, token, chatId]); // CRITICAL: Only token and chatId trigger re-connection

  // Separate effect for loading messages (depends on auth and chatId)
  useEffect(() => {
    // Validate chatId is a valid non-empty string before loading messages
    if (isAuthReady && token && chatId && chatId !== 'undefined' && chatId !== 'null') {
      loadMessages(1, false);
    } else if (chatId === 'undefined' || chatId === 'null') {
      console.error('❌ Cannot load messages: Invalid chatId', chatId);
    }
  }, [isAuthReady, token, chatId, loadMessages]);

  // Separate effect for socket event listeners (depends on chatId and isFocused)
  useEffect(() => {
    // Validate chatId is a valid non-empty string
    if (!chatId || chatId === 'undefined' || chatId === 'null' || !currentUserId.current) {
      if (!chatId || chatId === 'undefined' || chatId === 'null') {
        console.error('❌ Cannot setup listeners: Invalid chatId', chatId);
      }
      return;
    }

    const handleNewMessage = (msg: any) => {
      // Display the new message in the UI
      const giftedMsg = mapBackendMessageToGifted(msg);
      setMessages((previous) => GiftedChat.append(previous, [giftedMsg]));

      const senderId =
        msg.senderId || msg.userId || msg.sender_id || msg.user?._id || msg.userId;
      const fromCurrentUser = String(senderId || '') === String(currentUserId.current);

      // Skip receipt handling for messages sent by current user
      if (fromCurrentUser) {
        return;
      }

      const messageId = msg.messageId || msg.id || msg._id;
      if (!messageId) {
        console.warn('⚠️ new_message event missing messageId:', msg);
        return;
      }

      // CRITICAL: Immediately emit mark_delivered receipt when message arrives
      // This notifies the sender that their message reached the receiving client
      const chatIdStr = String(chatId);
      console.log(`📬 New message received, marking as delivered: messageId=${messageId}, chatId=${chatIdStr}`);
      socketService.markDelivered(chatIdStr, String(messageId));

      // If chat is focused, also mark as read immediately (user is viewing the chat)
      if (isFocused) {
        const chatIdStr = String(chatId);
        console.log(`👁️ Chat is focused, marking as read: messageId=${messageId}, chatId=${chatIdStr}`);
        socketService.markRead(chatIdStr, String(messageId));
        readMessagesRef.current.add(String(messageId));
      }
    };

    const handleMessageSent = (payload: any) => {
      // Extract tempId and server messageId from the confirmation payload
      const tempId = payload?.tempId || payload?.clientTempId;
      let serverMessageId = payload?.messageId || payload?._id || payload?.id;

      if (!tempId) {
        console.warn('⚠️ message_sent event missing tempId:', payload);
        return;
      }

      // CRITICAL FIX: Handle case where serverMessageId might be a temporary ID initially
      // If it's still a temp ID (starts with "temp-" or "pending-"), wait for the real ID
      if (serverMessageId && (String(serverMessageId).startsWith('temp-') || String(serverMessageId).startsWith('pending-'))) {
        console.log(`⏳ Server returned temporary ID "${serverMessageId}", waiting for final MongoDB ID...`);
        // Update the message with the temporary ID but keep tempId for later correlation
        // This allows us to match it again when the real ID arrives
        setMessages((previous) =>
          previous.map((m: any) => {
            const matchesTempId = m.tempId && String(m.tempId) === String(tempId);
            const matchesId = !m.tempId && String(m._id) === String(tempId);

            if (!matchesTempId && !matchesId) {
              return m;
            }

            // Update with temporary ID but keep tempId for final correlation
            return {
              ...m,
              _id: String(serverMessageId), // Use temporary ID for now
              tempId: tempId, // Keep tempId for final correlation
              status: 'sent' as MessageStatus, // Change status to 'sent' even with temp ID
              pending: false,
              sent: true,
              received: false,
            } as any;
          }),
        );
        return; // Wait for final MongoDB ID in next event
      }

      if (!serverMessageId) {
        console.warn('⚠️ message_sent event missing messageId:', payload);
        return;
      }

      console.log(`✅ Message confirmed with final MongoDB ID: tempId=${tempId} -> messageId=${serverMessageId}`);

      // Find the message by tempId and update it with the real MongoDB ID
      setMessages((previous) =>
        previous.map((m: any) => {
          // Match by tempId (stored separately) or by _id (if tempId was used as _id)
          const matchesTempId = m.tempId && String(m.tempId) === String(tempId);
          const matchesId = !m.tempId && String(m._id) === String(tempId);

          if (!matchesTempId && !matchesId) {
            return m;
          }

          // Swap tempId for permanent MongoDB messageId and update status
          return {
            ...m,
            _id: String(serverMessageId), // Replace tempId with real MongoDB ID
            tempId: undefined, // Clear tempId after successful swap
            status: 'sent' as MessageStatus, // Change status from 'pending' to 'sent'
            pending: false,
            sent: true,
            received: false,
          } as any;
        }),
      );
    };

    const handleMessageDelivered = (payload: any) => {
      // Extract messageId from payload (sent by backend worker via RabbitMQ)
      const messageId = payload?.messageId || payload?._id || payload?.id;
      if (!messageId) {
        console.warn('⚠️ message_delivered event missing messageId:', payload);
        return;
      }

      console.log(`✅ Message delivered confirmation: messageId=${messageId}`);

      // Update sender's UI: Change status from 'sent' to 'delivered' (single check → double check)
      setMessages((previous) =>
        previous.map((m: any) => {
          // Only update messages sent by current user
          if (String(m.user?._id) !== String(currentUserId.current)) {
            return m;
          }

          // Match by messageId
          if (String(m._id) !== String(messageId)) {
            return m;
          }

          // Update status from 'sent' to 'delivered'
          return {
            ...m,
            status: 'delivered' as MessageStatus,
            pending: false,
            sent: true,
            received: true,
          } as any;
        }),
      );
    };

    const handleMessageRead = (payload: any) => {
      // Extract messageId from payload (sent by backend worker via RabbitMQ)
      const messageId = payload?.messageId || payload?._id || payload?.id;
      if (!messageId) {
        console.warn('⚠️ message_read event missing messageId:', payload);
        return;
      }

      console.log(`👁️ Message read confirmation: messageId=${messageId}`);

      // Update sender's UI: Change status from 'delivered' to 'read' (double check gray → double check blue)
      setMessages((previous) =>
        previous.map((m: any) => {
          // Only update messages sent by current user
          if (String(m.user?._id) !== String(currentUserId.current)) {
            return m;
          }

          // Match by messageId
          if (String(m._id) !== String(messageId)) {
            return m;
          }

          // Update status from 'delivered' to 'read'
          return {
            ...m,
            status: 'read' as MessageStatus,
            pending: false,
            sent: true,
            received: true,
          } as any;
        }),
      );
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageSent(handleMessageSent);
    socketService.onMessageDelivered(handleMessageDelivered);
    socketService.onMessageRead(handleMessageRead);

    // Cleanup: Remove event listeners when chatId changes or component unmounts
    return () => {
      socketService.offNewMessage();
      const socket = socketRef.current;
      if (socket) {
        socket.off('message_sent', handleMessageSent);
        socket.off('message_delivered', handleMessageDelivered);
        socket.off('message_read', handleMessageRead);
      }
    };
  }, [chatId, isFocused, mapBackendMessageToGifted]); // Only chatId and isFocused trigger listener updates

  // Manual Read Receipt: Mark messages as read when chat becomes focused
  useEffect(() => {
    if (!isFocused || !chatId || !currentUserId.current) return;

    // When chat screen becomes focused, mark all unread messages from other users as read
    const markVisibleMessagesAsRead = () => {
      messages.forEach((msg: any) => {
        const senderId = msg.user?._id;
        const fromCurrentUser = String(senderId) === String(currentUserId.current);
        const messageId = msg._id;

        // Skip messages sent by current user or already marked as read
        if (fromCurrentUser || !messageId || readMessagesRef.current.has(String(messageId))) {
          return;
        }

        // Emit manual read receipt for messages that are visible
        const chatIdStr = String(chatId);
        console.log(`👁️ Manual read receipt: messageId=${messageId}, chatId=${chatIdStr}`);
        socketService.markRead(chatIdStr, String(messageId));
        readMessagesRef.current.add(String(messageId));
      });
    };

    // Mark messages as read when chat becomes focused
    markVisibleMessagesAsRead();
  }, [isFocused, chatId, messages]);

  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const msg = newMessages[0];
      if (!msg || !msg.text?.trim()) return;

      // Generate a unique tempId for correlation with server response
      // Format: timestamp-random to ensure uniqueness
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create optimistic message with 'pending' status (displayed as 'sending')
      const optimisticMessage: any = {
        ...msg,
        _id: tempId, // Use tempId as _id initially
        text: msg.text.trim(),
        createdAt: msg.createdAt || new Date(),
        user: {
          _id: String(currentUserId.current),
          name: user?.first_name || 'Me',
        },
        status: 'pending' as MessageStatus, // 'pending' = sending state
        pending: true,
        sent: false,
        received: false,
        tempId, // Store tempId separately for correlation
      };

      // Add message to UI immediately (optimistic update)
      setMessages((previous) => GiftedChat.append(previous, [optimisticMessage]));

      // Emit message via socket with tempId for correlation - ensure chatId is string
      const chatIdStr = String(chatId);
      console.log('📤 Sending message to chatId:', chatIdStr);
      socketService.sendMessage(chatIdStr, msg.text.trim(), tempId);
    },
    [chatId, user?.first_name],
  );

  if (isLoading && messages.length === 0) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        {...({
          messages,
          onSend,
          user: {
            _id: currentUserId.current,
            name: user?.first_name || 'Me',
          },
          loadEarlier: hasMore,
          onLoadEarlier: handleLoadEarlier,
          isLoadingEarlier,
          renderBubble: (props: any) => (
            <Bubble
              {...props}
              wrapperStyle={{
                right: { backgroundColor: '#1E88E5' },
                left: { backgroundColor: '#E5E7EB' },
              }}
              textStyle={{
                right: { color: '#FFFFFF' },
                left: { color: '#111827' },
              }}
            />
          ),
          renderTicks: (currentMessage: any) => {
            if (!currentMessage || !currentMessage.user) return null;

            if (String(currentMessage.user._id) !== String(currentUserId.current)) {
              return null;
            }

            const status: MessageStatus =
              currentMessage.status ||
              (currentMessage.pending
                ? 'pending'
                : currentMessage.received
                ? 'delivered'
                : currentMessage.sent
                ? 'sent'
                : 'sent');

            let symbol = '✓';
            let color = '#9CA3AF';

            if (status === 'pending') {
              symbol = '🕒';
              color = '#9CA3AF';
            } else if (status === 'sent') {
              symbol = '✓';
              color = '#9CA3AF';
            } else if (status === 'delivered') {
              symbol = '✓✓';
              color = '#9CA3AF';
            } else if (status === 'read') {
              symbol = '✓✓';
              color = '#3B82F6';
            }

            return (
              <Text style={{ fontSize: 11, color, marginRight: 4 }}>{symbol}</Text>
            );
          },
        } as any)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;
