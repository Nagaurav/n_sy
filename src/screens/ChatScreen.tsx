import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Platform,
  Animated,
  SafeAreaView,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation, useIsFocused } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send, SystemMessage } from 'react-native-gifted-chat';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dietService } from '../services/dietService';
import { useAuth } from '../hooks/useAuth';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { chatService, apiService } from '../services';
import { socketService } from '../services/socketService';
import type { RootStackParamList } from '../../App';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';

interface ChatScreenParams {
  appointmentId: string;
  title?: string;
}

type ChatScreenRouteProp = RouteProp<Record<'ChatScreen', ChatScreenParams>, 'ChatScreen'>;
type ChatScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChatScreen'>;

const ChatScreen: React.FC = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { user, token, isAuthReady } = useAuth();
  const { theme: appTheme } = useTheme();
  
  const currentAppointment = useSelector((state: RootState) => state.appointment.currentAppointment);

  const { appointmentId: rawAppointmentId, title } = route.params;
  const appointmentId = String(rawAppointmentId || '');
  const chatId = appointmentId; 
  
  const professionalName = currentAppointment?.professional_name || title || 'Professional';
  const professionalId = currentAppointment?.professional_id;

  // State
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [actualChatId, setActualChatId] = useState<string | null>(null);
  const [socketReady, setSocketReady] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Typing & Online state
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dotAnim1 = useRef(new Animated.Value(0)).current;
  const dotAnim2 = useRef(new Animated.Value(0)).current;
  const dotAnim3 = useRef(new Animated.Value(0)).current;

  const socketRef = useRef<any>(null);
  const chatRoomJoined = useRef<string | null>(null);

  // Start entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- User ID Extraction ---
  const getCanonicalUserId = useCallback(() => {
    if (!user) return '';
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id || '';
    return String(userId);
  }, [(user as any)?.user_id, (user as any)?._id, (user as any)?.id]);

  const currentUserId = useRef<string>(getCanonicalUserId());

  useEffect(() => {
    const newUserId = getCanonicalUserId();
    if (newUserId && newUserId !== currentUserId.current) {
      currentUserId.current = newUserId;
    }
  }, [getCanonicalUserId]); 

  // --- Header Setup ---
  useEffect(() => {
    if (title) navigation.setOptions({ headerTitle: title } as any);
  }, [title, navigation]);

  // --- Prescription Navigation ---
  const handlePrescriptionPress = useCallback(async () => {
    // 🔍 Debug Log
    console.log("👉 Checking Prescription for Booking ID:", appointmentId); 
    if (!appointmentId) {
      Alert.alert("Error", "No Appointment ID found for this chat.");
      return;
    }

    console.log('🧭 [ChatScreen] Navigating to PrescriptionDetail with appointmentId:', appointmentId);
    
    navigation.navigate('PrescriptionDetail', { 
      prescriptionId: appointmentId, 
      appointmentId: appointmentId 
    } as any);
  }, [appointmentId, navigation]);

  // --- Diet Plan Navigation ---
  const handleDietPlanPress = useCallback(async () => {
    console.log("👉 Checking Diet Plan for Booking ID:", appointmentId);

    if (!appointmentId) {
      Alert.alert("Error", "No Appointment ID found.");
      return;
    }

    // Always navigate to diet plan screen, let it handle the data loading
    console.log('🧭 [ChatScreen] Navigating to DietPlan with bookingId:', appointmentId);
    
    navigation.navigate('DietPlan', { 
      bookingId: appointmentId 
    } as any);
  }, [navigation, appointmentId]);

  // --- Validation ---
  useEffect(() => {
    if (!appointmentId || appointmentId === 'undefined') {
      navigation.goBack();
    }
  }, [appointmentId, navigation]);

  // --- Chat Session Init ---
  useEffect(() => {
    if (token && appointmentId && !actualChatId) {
      findOrCreateChatSession();
    }
  }, [token, appointmentId]);

  const findOrCreateChatSession = useCallback(async () => {
    try {
      const professionalId = currentAppointment?.professional_id;
      if (!professionalId) return;

      const response = await chatService.createChat(
        String(professionalId),
        'professional'
      );
      
      if (response.success && response.data) {
        const chatSessionId = response.data.id || response.data._id;
        setActualChatId(chatSessionId);
      }
    } catch (error: any) {
      console.error('❌ [ChatScreen] Init error:', error);
    }
  }, [currentAppointment]);

  // --- Message Mapping ---
  const mapBackendMessageToGifted = useCallback((backendMessage: any): IMessage => {
    try {
      const messageId = backendMessage.messageId || backendMessage.id || backendMessage._id;
      const senderId = backendMessage.senderId || backendMessage.userId || backendMessage.user?._id;
      const isSystemMessage = backendMessage.messageType === 'system';
      
      return {
        _id: messageId,
        text: backendMessage.message || backendMessage.content || '',
        createdAt: new Date(backendMessage.createdAt || backendMessage.timestamp || Date.now()),
        user: {
          _id: String(senderId),
          name: backendMessage.sender?.name || backendMessage.user?.name || 'Unknown',
        },
        system: isSystemMessage,
        pending: false,
        sent: true, // Always true if it came from backend
        received: backendMessage.d || false, // Check delivery status
      };
    } catch (error) {
      return {
        _id: `error-${Date.now()}`,
        text: 'Error loading message',
        createdAt: new Date(),
        user: { _id: 'error', name: 'Error' },
      };
    }
  }, []);

  // --- Message Persistence ---
  const saveMessagesToStorage = useCallback(async (messagesToSave: IMessage[]) => {
    try {
      await AsyncStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messagesToSave));
    } catch (error) {
      console.error('[UI] Failed to save messages to storage:', error);
    }
  }, [chatId]);

  const loadMessagesFromStorage = useCallback(async (): Promise<IMessage[]> => {
    try {
      const savedMessages = await AsyncStorage.getItem(`chat_messages_${chatId}`);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      return [];
    }
    return [];
  }, [chatId]);

  // --- Load Messages (FIXED LOGIC) ---
  const loadMessages = useCallback(async (newPage: number = 1, append: boolean = false) => {
    const targetChatId = chatId; 
    if (!token || !targetChatId) return;

    try {
      if (append) setIsLoadingEarlier(true);
      else setIsLoading(true);

      // 1. Load from storage first for instant UI
      const storedMessages = await loadMessagesFromStorage();
      
      if (storedMessages.length > 0 && !append) {
        setMessages(storedMessages);
        // ⚠️ CRITICAL CHANGE: Do NOT return here. Continue to fetch API to get latest ticks.
      }

      // 2. Fetch from API to get latest status (Delivered/Read)
      const response = await chatService.getChatMessages(String(targetChatId), newPage, 20);
      
      if (response.success && response.data) {
        const mapped = response.data.map(mapBackendMessageToGifted);
        const normalized = mapped.reverse();
        setHasMore(normalized.length === 20);
        setPage(newPage);
        
        setMessages((previous) => {
          // Create a map of API messages by ID for fast lookup
          const apiMessageMap = new Map(normalized.map(m => [m._id, m]));
          
          // Keep pending messages that aren't in API yet
          const pendingMessages = previous.filter(m => m.pending && !apiMessageMap.has(m._id));
          
          let combinedMessages;
          
          if (append) {
             // If scrolling up, prepend API messages to existing ones
             // Don't sort here - GiftedChat.prepend handles order correctly
             combinedMessages = GiftedChat.prepend(previous, normalized);
          } else {
             // If refreshing/initial load: Replace stored messages with fresh API messages + pending ones
             combinedMessages = [...pendingMessages, ...normalized];
             // Only sort on initial load, not when appending
             combinedMessages.sort((a, b) => 
               new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
             );
          }

          // Save fresh data to storage so next load has correct ticks
          saveMessagesToStorage(combinedMessages).catch(console.error);
          
          return combinedMessages;
        });
      }
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingEarlier(false);
    }
  }, [chatId, mapBackendMessageToGifted, token, loadMessagesFromStorage, saveMessagesToStorage]);

  // Initial Load
  useEffect(() => {
    if (isAuthReady && token && chatId) {
      loadMessages(1, false);
    }
  }, [isAuthReady, token, chatId]);

  // --- Socket Connection ---
  useEffect(() => {
    if (!isAuthReady || !token || !chatId || !currentUserId.current) return;

    if (!socketService.instance?.connected) {
      socketService.connect(token, String(currentUserId.current), 'patient');
    }

    const socket = socketService.instance;
    socketRef.current = socket;
    
    if (!socket) return;

    const onConnect = () => {
      setSocketReady(prev => {
        if (!prev) return true;
        return prev;
      }); 
    };

    const onDisconnect = () => {
      setSocketReady(false);
      chatRoomJoined.current = null;
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      setSocketReady(false);
    };
  }, [token]);

  // --- Join Room ---
  useEffect(() => {
    if (socketReady && socketRef.current?.connected) {
      const targetChatId = actualChatId || chatId;
      if (targetChatId && targetChatId !== chatRoomJoined.current) {
        socketService.joinChat(String(targetChatId), String(currentUserId.current));
        chatRoomJoined.current = targetChatId;
      }
    }
  }, [socketReady, actualChatId, chatId]);

  // --- Event Listeners (FIXED STORAGE SYNC) ---
  useEffect(() => {
    if (!socketReady) return;

    const handleMessageSent = (payload: any) => {
        if (payload.status === 'sent' && payload.messageId && payload.tempId) {
            setMessages((previousMessages) => {
                let matchFound = false;
                const updatedMessages = previousMessages.map((msg: any) => {
                    const isMatchingMessage = 
                        msg._id === payload.tempId || 
                        msg.tempId === payload.tempId || 
                        msg._id === `pending-${payload.tempId}`;
                    
                    if (isMatchingMessage) {
                        matchFound = true;
                        return {
                            ...msg,
                            _id: payload.messageId,
                            sent: true,
                            received: false, 
                            pending: false,
                            tempId: undefined,
                        };
                    }
                    return msg;
                });
                
                if (matchFound) {
                    saveMessagesToStorage(updatedMessages).catch(console.error);
                }
                return updatedMessages;
            });
        }
    };

    const handleNewMessage = (msg: any) => {
        const senderId = msg.senderId || msg.userId || msg.user?._id;
        const isMe = String(senderId) === String(currentUserId.current);
        
        if (isMe) return; 

        const giftedMsg = mapBackendMessageToGifted(msg);
        setMessages(previous => {
            const updatedMessages = GiftedChat.append(previous, [giftedMsg]);
            saveMessagesToStorage(updatedMessages).catch(console.error);
            return updatedMessages;
        });
        
        // Only mark as delivered if professional is online
        if (chatId && isOnline) {
            socketService.markDelivered(String(chatId), String(msg.messageId || msg._id));
        }
    };

    // ✅ FIX: Update storage when delivery receipt arrives (only if professional is online)
    const handleMessageDelivered = (payload: any) => {
         if (isOnline) {
             setMessages(prev => {
                 const updated = prev.map(m => (m._id === payload.messageId) ? { ...m, received: true } : m);
                 saveMessagesToStorage(updated).catch(console.error);
                 return updated;
             });
         }
    };

    // ✅ FIX: Update storage when read receipt arrives (only if professional is online)
    const handleMessageRead = (payload: any) => {
         if (isOnline) {
             setMessages(prev => {
                 const updated = prev.map(m => (m._id === payload.messageId) ? { ...m, received: true, read: true } : m);
                 saveMessagesToStorage(updated).catch(console.error);
                 return updated;
             });
         }
    };

    const handleUserTyping = (data: any) => {
        if (String(data.chatId) === String(actualChatId || chatId) && 
            String(data.userId) !== String(currentUserId.current)) {
            setOtherUserTyping(data.isTyping);
        }
    };

    const handleUserStatus = (data: any) => {
        if (String(data.userId) === String(professionalId)) {
            setIsOnline(data.isOnline);
        }
    };

    // Register Listeners
    socketService.onMessageSent(handleMessageSent);
    socketService.onNewMessage(handleNewMessage);
    socketService.onMessageDelivered(handleMessageDelivered);
    socketService.onMessageRead(handleMessageRead);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStatus(handleUserStatus);

    if (professionalId) {
        socketService.checkUserStatus(String(professionalId));
    }

    return () => {
        socketService.offMessageSent();
        socketService.offNewMessage();
        socketService.offMessageDelivered();
        socketService.offMessageRead();
        socketService.offUserTyping();
        socketService.offUserStatus();
    };
  }, [socketReady, chatId, mapBackendMessageToGifted, saveMessagesToStorage]);

  // --- Input & Send ---
  const handleInputTextChanged = useCallback((text: string) => {
    const targetChatId = actualChatId || chatId;
    if (text.length > 0 && !isTyping) {
        setIsTyping(true);
        socketService.sendTyping(String(targetChatId), String(currentUserId.current), true);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socketService.sendTyping(String(targetChatId), String(currentUserId.current), false);
    }, 2000);
  }, [actualChatId, chatId]);

  const onSend = useCallback((newMessages: IMessage[] = []) => {
      const msg = newMessages[0];
      if (!msg || !msg.text?.trim()) return;

      const tempId = `pending-${Date.now()}`;
      const effectiveChatId = chatId;

      const optimisticMessage: any = {
          ...msg,
          _id: tempId,
          user: { _id: String(currentUserId.current), name: user?.first_name || 'Me' },
          pending: true,
          sent: false,
          received: false,
          tempId, 
      };

      setMessages((previous) => GiftedChat.append(previous, [optimisticMessage]));
      socketService.sendMessage(String(effectiveChatId), msg.text.trim(), tempId);
    },
    [chatId, user]
  );

  // --- Renders ---
  const renderLoadEarlier = () => {
    if (!hasMore || isLoadingEarlier) return null;
    
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.spacing.s }}>
        <TouchableOpacity 
          onPress={() => loadMessages(page + 1, true)}
          style={styles.loadEarlierButton}
          activeOpacity={0.7}
        >
          {isLoadingEarlier && (
            <ActivityIndicator 
              size="small" 
              color={appTheme.colors.background.surface} 
              style={{ marginRight: theme.spacing.s }}
            />
          )}
          <Text style={styles.loadEarlierText}>
            Load Earlier Messages
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFooter = () => {
    if (otherUserTyping) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim1, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

        return (
            <Animated.View 
              style={[
                styles.typingIndicator,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
                <View style={styles.typingDots}>
                  <Animated.View 
                    style={[styles.dot, { opacity: dotAnim1 }]}
                  />
                  <Animated.View 
                    style={[styles.dot, { opacity: dotAnim2 }]}
                  />
                  <Animated.View 
                    style={[styles.dot, { opacity: dotAnim3 }]}
                  />
                </View>
                <Text style={styles.typingText}>
                  {professionalName} is typing...
                </Text>
            </Animated.View>
        );
    }
    return null;
  };

  const renderBubble = (props: any) => (
    <Bubble
        {...props}
        wrapperStyle={{
            right: { 
              backgroundColor: appTheme.colors.primary, 
              borderRadius: theme.borderRadius.l,
              borderBottomRightRadius: 4,
              ...theme.shadows.card,
            },
            left: { 
              backgroundColor: appTheme.colors.background.surface,
              borderRadius: theme.borderRadius.l,
              borderBottomLeftRadius: 4,
              ...theme.shadows.card,
            },
        }}
        textStyle={{
            right: { 
              color: appTheme.colors.background.surface,
              ...theme.typography.body,
            },
            left: { 
              color: appTheme.colors.text.primary,
              ...theme.typography.body,
            },
        }}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.profileContainer}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={appTheme.colors.background.surface} />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{professionalName}</Text>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: isOnline ? appTheme.colors.feedback.success : '#6B7280' }
                  ]} />
                  <Text style={styles.statusText}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row' }}>
              {/* 🥗 NEW DIET PLAN BUTTON */}
              <TouchableOpacity 
                style={[styles.prescriptionButton, { marginRight: 8 }]} 
                activeOpacity={0.7}
                onPress={handleDietPlanPress}
              >
                <Ionicons name="nutrition" size={20} color={appTheme.colors.background.surface} />
              </TouchableOpacity>

              {/* 💊 EXISTING PRESCRIPTION BUTTON */}
              <TouchableOpacity 
                style={styles.prescriptionButton} 
                activeOpacity={0.7}
                onPress={handlePrescriptionPress}
              >
                <Ionicons name="medical" size={20} color={appTheme.colors.background.surface} />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
        </LinearGradient>
      </Animated.View>

      <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{ _id: String(currentUserId.current) }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          )}
          onInputTextChanged={handleInputTextChanged}
          renderFooter={renderFooter}
          renderLoadEarlier={renderLoadEarlier}
          isTyping={otherUserTyping}
          renderBubble={renderBubble}
          renderSystemMessage={(props) => (
            <SystemMessage
                {...props}
                containerStyle={styles.systemMessageContainer}
                textStyle={styles.systemMessageText}
            />
          )}
          textInputProps={{
            style: styles.textInput,
            placeholder: 'Type a message...',
            placeholderTextColor: appTheme.colors.text.secondary,
          }}
          renderInputToolbar={(props) => (
            <InputToolbar
                {...props}
                containerStyle={styles.inputToolbar}
                primaryStyle={styles.inputToolbarPrimary}
            />
          )}
          renderSend={(props) => (
            <Send
                {...props}
                containerStyle={styles.sendButton}
            >
              <View style={styles.sendButtonInner}>
                <Ionicons name="send" size={18} color={appTheme.colors.background.surface} />
              </View>
            </Send>
          )}
          alignTop={false}
          showAvatarForEveryMessage={false}
          showUserAvatar={false}
          alwaysShowSend={false}
          minInputToolbarHeight={56}
      />
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: { 
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.m,
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center', 
    justifyContent: 'center',
  },
  headerTextContainer: { 
    marginLeft: theme.spacing.s,
  },
  headerTitle: { 
    ...theme.typography.h3,
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  statusText: {
    ...theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  prescriptionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    right: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  // Chat styles
  loadEarlierButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.card,
  },
  loadEarlierText: {
    ...theme.typography.small,
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    backgroundColor: theme.colors.background.surface,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.card,
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: theme.spacing.s,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.secondary,
    marginHorizontal: 2,
  },
  typingText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  systemMessageContainer: {
    marginBottom: 15,
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
  },
  systemMessageText: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
  },
  textInput: {
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    marginLeft: theme.spacing.s,
    marginRight: theme.spacing.s,
    flex: 1,
    borderWidth: 0,
  },
  inputToolbar: {
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.s,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.l : theme.spacing.s,
  },
  inputToolbarPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.s,
    ...theme.shadows.card,
  },
  sendButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
});

export default ChatScreen;
