import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import { socketService } from '../services/socketService';
import type { ChatSession } from '../types/chat';
import type { HomeStackParamList } from '../../App';

type ChatListNavigationProp = StackNavigationProp<HomeStackParamList, 'ChatList'>;

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation<ChatListNavigationProp>();
  const { user, token, isAuthReady } = useAuth();

  const [chats, setChats] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getUserChats();
      if (response.success && response.data) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // CRITICAL: Check if both authentication is ready AND user data is present
    if (isAuthReady && userId && token) {
      // Connect socket with token, userId, and userType - registration is automatic
      socketService.connect(token, String(userId), 'patient');

      // Fetch REST data here, now guaranteed to have the token
      fetchChats();

      const handleIncomingMessage = (msg: any) => {
        const chatIdFromMsg =
          msg?.chatId || msg?.chat_id || msg?.chat?.id || msg?.chat?._id;
        if (!chatIdFromMsg) {
          return;
        }

        const chatIdStr = String(chatIdFromMsg);
        const text = msg?.content || msg?.text || '';
        const timestampRaw = msg?.createdAt || msg?.timestamp || msg?.created_at;
        const timestamp =
          typeof timestampRaw === 'string'
            ? timestampRaw
            : timestampRaw
            ? new Date(timestampRaw).toISOString()
            : new Date().toISOString();

        const senderId =
          msg?.senderId || msg?.userId || msg?.sender_id || msg?.user?._id || msg?.userId;
        const fromCurrentUser =
          senderId && userId && String(senderId) === String(userId);

        setChats((previous) =>
          previous.map((chat) => {
            if (chat.id !== chatIdStr) {
              return chat;
            }

            const currentUnread = chat.unreadCount || 0;

            return {
              ...chat,
              lastMessage: {
                content: text,
                timestamp,
              },
              unreadCount: fromCurrentUser ? currentUnread : currentUnread + 1,
            };
          }),
        );
      };

      socketService.onNewMessage(handleIncomingMessage);

      // CRITICAL: Return cleanup function to disconnect when navigating away
      return () => {
        socketService.offNewMessage();
        socketService.disconnect();
      };
    }
  }, [isAuthReady, userId, token, fetchChats]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchChats();
  };

  const getOtherParticipant = (chat: ChatSession) => {
    if (!userId) return undefined;
    return chat.participants?.find((p) => p.userId !== String(userId));
  };

  const formatTimeAgo = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return `${diffD}d ago`;
  };

  const renderItem = ({ item }: { item: ChatSession }) => {
    const other = getOtherParticipant(item);
    const lastMsg = item.lastMessage?.content || 'Start chatting';
    const timeAgo = formatTimeAgo(item.lastMessage?.timestamp);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          // CRITICAL: Ensure chatId is passed as string (UUID format)
          const chatIdToNavigate = String(item.id || '');
          console.log('🧭 Navigating to ChatScreen with chatId:', chatIdToNavigate, 'Type:', typeof chatIdToNavigate, 'Original:', item.id);
          
          if (!chatIdToNavigate || chatIdToNavigate === 'undefined' || chatIdToNavigate === 'null') {
            console.error('❌ Cannot navigate: Invalid chatId', item.id);
            return;
          }
          
          navigation.navigate('ChatScreen', {
            chatId: chatIdToNavigate, // Explicitly pass as string
            title: item.title,
            receiverId: other?.userId,
          });

          setChats((previous) =>
            previous.map((chat) =>
              chat.id === item.id ? { ...chat, unreadCount: 0 } : chat,
            ),
          );
        }}
      >
        <Image
          source={item.avatar ? { uri: item.avatar } : { uri: 'https://via.placeholder.com/48' }}
          style={styles.avatar}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!!timeAgo && <Text style={styles.time}>{timeAgo}</Text>}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {lastMsg}
          </Text>
        </View>
        <View style={styles.trailingContainer}>
          {!!item.unreadCount && item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) {
      return null;
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No conversations yet</Text>
        <Text style={styles.emptySubText}>Start a new chat with a professional.</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {isLoading && chats.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('ProfessionalsList', {
            categoryName: 'Consultations',
            searchQuery: 'consultation',
          } as any)
        }
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 13,
    color: '#6B7280',
  },
  trailingContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#1E88E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
});

export default ChatListScreen;
