import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { apiService } from '../../services';

const { width } = Dimensions.get('window');

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'appointment' | 'message' | 'booking' | 'system';
  icon: string;
  action?: () => void;
}

interface NotificationDropdownProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  const fetchNotifications = async () => {
    console.log('🔔 [NotificationDropdown] Fetching notifications...');
    setIsLoading(true);
    try {
      const userId = user?.id || (user as any)?.user_id || (user as any)?._id;
      console.log('🔔 [NotificationDropdown] User ID:', userId);
      
      if (!userId) {
        console.log('❌ No user ID found for notifications');
        return;
      }

      const notificationItems: NotificationItem[] = [];

      // Fetch next appointment
      try {
        console.log('🔔 [NotificationDropdown] Fetching next appointment...');
        const appointmentResponse = await apiService.getNextAppointment(userId);
        console.log('🔔 [NotificationDropdown] Appointment response:', appointmentResponse);
        
        if (appointmentResponse.success && appointmentResponse.data?.appointment) {
          const appointment = appointmentResponse.data.appointment;
          notificationItems.push({
            id: `appointment-${appointment.id}`,
            title: 'Upcoming Session',
            message: `${appointment.professional_name} - ${appointment.speciality || 'Wellness Session'} on ${appointment.date} at ${appointment.time}`,
            time: getRelativeTime(appointment.created_at),
            type: 'appointment',
            icon: 'calendar-outline',
            action: () => (navigation.navigate as any)('Appointments'),
          });
          console.log('✅ [NotificationDropdown] Added appointment notification');
        } else {
          console.log('ℹ️ [NotificationDropdown] No upcoming appointment found');
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch next appointment:', error);
      }

      // Fetch user appointments for booking confirmations
      try {
        const appointmentsResponse = await apiService.getUserAppointments(userId);
        if (appointmentsResponse.success && appointmentsResponse.data?.data) {
          const appointments = appointmentsResponse.data.data;
          const recentBookings = appointments
            .filter((apt: any) => apt.booking_status === 'CONFIRMED')
            .slice(0, 2); // Get 2 most recent confirmed bookings

          recentBookings.forEach((apt: any) => {
            notificationItems.push({
              id: `booking-${apt.booking_id}`,
              title: 'Booking Confirmed',
              message: `Your ${apt.mode} session with ${apt.professional_name} is confirmed`,
              time: getRelativeTime(apt.created_at),
              type: 'booking',
              icon: 'checkmark-circle-outline',
              action: () => (navigation.navigate as any)('Appointments'),
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch appointments:', error);
      }

      // Fetch user chats for new messages
      try {
        const chatsResponse = await apiService.getUserChats(userId);
        if (chatsResponse.success && chatsResponse.data) {
          const chats = Array.isArray(chatsResponse.data) ? chatsResponse.data : [];
          const recentChats = chats.slice(0, 2); // Get 2 most recent chats

          recentChats.forEach((chat: any) => {
            notificationItems.push({
              id: `chat-${chat.id}`,
              title: 'New Message',
              message: `New message from ${chat.professional_name || 'Wellness Professional'}`,
              time: getRelativeTime(chat.last_message_time),
              type: 'message',
              icon: 'chatbubble-outline',
              action: () => (navigation.navigate as any)('ChatScreen'),
            });
          });
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch chats:', error);
      }

      // Sort notifications by time (most recent first)
      notificationItems.sort((a, b) => {
        const timeA = parseTime(a.time);
        const timeB = parseTime(b.time);
        return timeB - timeA;
      });

      // If no real notifications, add some demo notifications for testing
      if (notificationItems.length === 0) {
        console.log('ℹ️ [NotificationDropdown] No real notifications, adding demo data');
        notificationItems.push(
          {
            id: 'demo-1',
            title: 'Welcome to SAMYAYOG',
            message: 'Your wellness journey begins here. Book your first session to get started!',
            time: 'Just now',
            type: 'system',
            icon: 'information-circle-outline',
            action: () => (navigation.navigate as any)('ProfessionalsList'),
          },
          {
            id: 'demo-2',
            title: 'Explore Our Services',
            message: 'Discover yoga classes, consultations, and wellness programs tailored for you.',
            time: '5 minutes ago',
            type: 'system',
            icon: 'compass-outline',
            action: () => (navigation.navigate as any)('ClassesList'),
          }
        );
      }

      console.log('🔔 [NotificationDropdown] Final notifications:', notificationItems);
      setNotifications(notificationItems.slice(0, 10)); // Limit to 10 notifications
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const parseTime = (timeString: string) => {
    // Simple parsing for sorting - convert to timestamp
    if (timeString.includes('hour')) {
      const hours = parseInt(timeString);
      return Date.now() - (hours * 60 * 60 * 1000);
    }
    if (timeString.includes('day')) {
      const days = parseInt(timeString);
      return Date.now() - (days * 24 * 60 * 60 * 1000);
    }
    return Date.now(); // Default to now
  };

  useEffect(() => {
    if (visible) {
      fetchNotifications();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [visible, user]);

  const handleNotificationPress = (notification: NotificationItem) => {
    if (notification.action) {
      notification.action();
    }
    onClose();
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return theme.colors.primary;
      case 'booking':
        return theme.colors.feedback.success;
      case 'message':
        return theme.colors.feedback.warning;
      case 'system':
        return theme.colors.text.secondary;
      default:
        return theme.colors.text.secondary;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'calendar-outline';
      case 'booking':
        return 'checkmark-circle-outline';
      case 'message':
        return 'chatbubble-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  if (!visible) return null;

  console.log('🔔 [NotificationDropdown] Render state:', { 
    visible, 
    isLoading, 
    notificationsCount: notifications.length,
    notifications 
  });

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
      <Animated.View style={[styles.dropdown, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off-outline" size={48} color={theme.colors.text.secondary} />
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(notification)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) + '20' }]}>
                  <Ionicons 
                    name={notification.icon} 
                    size={20} 
                    color={getNotificationColor(notification.type)} 
                  />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>{notification.time}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.text.secondary} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.clearButton} onPress={onClose}>
            <Text style={styles.clearButtonText}>Mark all as read</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton} onPress={() => {
            (navigation.navigate as any)('Settings');
            onClose();
          }}>
            <Ionicons name="settings-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    top: 80, // Adjust based on header height
    right: theme.spacing.l,
    width: Math.min(width - theme.spacing.l * 2, 380), // Responsive width
    maxWidth: 380,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    maxHeight: 300,
    paddingHorizontal: theme.spacing.m,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  notificationMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.m,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.m,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.s,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  clearButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.feedback.success + '20',
  },
  settingsButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
});

export default NotificationDropdown;
