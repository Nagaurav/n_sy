import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { supportService } from '../services';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

interface SupportTicket {
  id: number;
  user_id: number;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const SupportScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastTickets, setPastTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
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

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleCall = () => {
    const phoneNumber = 'tel:+911234567890';
    Linking.openURL(phoneNumber).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const handleEmail = () => {
    const email = 'mailto:support@samyayog.com';
    Linking.openURL(email).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleChat = () => {
    Alert.alert('Live Chat', 'Live chat feature coming soon!');
  };

  const handleWhatsApp = () => {
    const whatsappUrl = 'whatsapp://send?phone=+911234567890';
    Linking.openURL(whatsappUrl).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed on your device');
    });
  };

  // Fetch past support tickets with enhanced error handling
  const fetchPastTickets = async () => {
    const userId = (user as any)?._id || (user as any)?.user_id;
    if (!userId) return;

    setIsLoadingTickets(true);
    try {
      const response = await supportService.getUserTickets(userId, 1, 50);
      if (response.success && response.data) {
        setPastTickets(Array.isArray(response.data) ? response.data : response.data.tickets || []);
      }
    } catch (error) {
      console.error('Error fetching past tickets:', error);
    } finally {
      setIsLoadingTickets(false);
      setRefreshing(false);
    }
  };

  // Load past tickets on mount
  useEffect(() => {
    fetchPastTickets();
  }, [user?._id, user?.user_id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPastTickets();
  };

  // Handle form submission with simplified data
  const handleSubmit = async () => {
    // Enhanced validation
    if (!subject.trim()) {
      setError('Please enter a subject');
      Alert.alert('Validation Error', 'Please enter a subject');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      Alert.alert('Validation Error', 'Please enter a message');
      return;
    }

    if (!user?._id && !user?.user_id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Simplified payload without category and priority
      const ticketData = {
        subject: subject.trim(),
        message: message.trim(),
      };
      
      const userId = (user as any)?._id || (user as any)?.user_id;
      const response = await supportService.submitTicket(
        userId,
        ticketData.subject,
        ticketData.message
      );

      if (response.success) {
        Alert.alert(
          'Ticket Submitted Successfully!',
          'Our support team will get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => {
                setSubject('');
                setMessage('');
                fetchPastTickets(); // Refresh list
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || 'Failed to submit ticket');
      }
    } catch (error: any) {
      console.error('Error submitting ticket:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit ticket. Please try again.';
      setError(errorMessage);
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) {
      return '#6B7280'; // Default gray color for null/undefined status
    }
    
    switch (status.toLowerCase()) {
      case 'open':
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'resolved':
      case 'closed':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderTicketCard = ({ item }: { item: SupportTicket }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.ticketSubject} numberOfLines={1}>
          {item.subject}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status ? item.status.toUpperCase().replace('_', ' ') : 'UNKNOWN'}</Text>
        </View>
      </View>
      <Text style={styles.ticketMessage} numberOfLines={2}>
        {item.message}
      </Text>
      <View style={styles.ticketFooter}>
        <View style={styles.ticketMeta}>
          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
          <Text style={styles.ticketDate}>{formatDate(item.created_at)}</Text>
        </View>
        <Text style={styles.ticketId}>#{item.id}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header matching ProfessionalHomeScreen */}
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
          colors={['#008272', '#4C7360', '#2F5233']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={openDrawer}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>SUPPORT</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Contact Options */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Contact</Text>
          <View style={styles.contactGrid}>
            <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
              <View style={[styles.contactIconContainer, { backgroundColor: appTheme.colors.feedback.success + '20' }]}>
                <Ionicons name="call-outline" size={24} color={appTheme.colors.feedback.success} />
              </View>
              <Text style={styles.contactTitle}>Call Us</Text>
              <Text style={styles.contactSubtitle}>+91 12345 67890</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
              <View style={[styles.contactIconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                <Ionicons name="mail-outline" size={24} color={appTheme.colors.primary} />
              </View>
              <Text style={styles.contactTitle}>Email</Text>
              <Text style={styles.contactSubtitle}>support@samyayog.com</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactCard} onPress={handleChat}>
              <View style={[styles.contactIconContainer, { backgroundColor: appTheme.colors.accent + '20' }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={24} color={appTheme.colors.accent} />
              </View>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Chat with our team</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactCard} onPress={handleWhatsApp}>
              <View style={[styles.contactIconContainer, { backgroundColor: '#25D366' + '20' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              </View>
              <Text style={styles.contactTitle}>WhatsApp</Text>
              <Text style={styles.contactSubtitle}>Chat on WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Support Form */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Submit a Ticket</Text>
          <View style={styles.ticketForm}>
            <Text style={styles.formInstructions}>
              Describe your issue in detail and we'll get back to you within 24 hours.
            </Text>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color={appTheme.colors.feedback.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <View style={styles.inputContainer}>
              <FloatingLabelInput
                label="Subject"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputContainer}>
              <FloatingLabelInput
                label="Message"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                inputStyle={styles.textArea}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton, 
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color={appTheme.colors.background.surface} />
                  <Text style={styles.submitButtonText}>Submitting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color={appTheme.colors.background.surface} />
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Enhanced Past Support Tickets */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Your Support Tickets</Text>
          {isLoadingTickets ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={appTheme.colors.primary} />
              <Text style={styles.loadingText}>Loading your tickets...</Text>
            </View>
          ) : pastTickets.length > 0 ? (
            <View style={styles.ticketsList}>
              {pastTickets.map((ticket) => (
                <Animated.View
                  key={ticket.id}
                  style={[
                    styles.ticketCard,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>
                      {ticket.subject}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Text style={styles.statusText}>{ticket.status ? ticket.status.toUpperCase().replace('_', ' ') : 'UNKNOWN'}</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage} numberOfLines={2}>
                    {ticket.message}
                  </Text>
                  <View style={styles.ticketFooter}>
                    <View style={styles.ticketMeta}>
                      <Ionicons name="calendar-outline" size={14} color={appTheme.colors.text.secondary} />
                      <Text style={styles.ticketDate}>{formatDate(ticket.created_at)}</Text>
                    </View>
                    <Text style={styles.ticketId}>#{ticket.id}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyTicketsContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="chatbubble-ellipses-outline" size={48} color={appTheme.colors.text.secondary} />
              </View>
              <Text style={styles.emptyTitle}>No Support Tickets Yet</Text>
              <Text style={styles.emptySubtitle}>Submit your first ticket and we'll help you resolve any issues</Text>
            </View>
          )}
          
          {pastTickets.length > 0 && (
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="refresh" size={16} color={appTheme.colors.primary} />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* FAQ Section */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => navigation.navigate('FAQ' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.faqContent}>
              <View style={[styles.faqIconContainer, { backgroundColor: appTheme.colors.accent + '20' }]}>
                <Ionicons name="help-outline" size={28} color={appTheme.colors.accent} />
              </View>
              <View style={styles.faqText}>
                <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                <Text style={styles.faqDescription}>Find answers to common questions</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
          </TouchableOpacity>
        </Animated.View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  
  // Header Styles - matching ProfessionalHomeHeader
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  placeholder: {
    width: 44,
  },
  
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  sectionWrapper: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  
  // Contact Grid Styles
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.m,
    justifyContent: 'space-between',
  },
  contactCard: {
    width: '47%', // Adjusted from 48% to account for gaps and ensure proper alignment
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    marginBottom: theme.spacing.s,
    ...theme.shadows.card,
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  contactSubtitle: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Form Styles
  ticketForm: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  formInstructions: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.l,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: theme.spacing.l,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  
  // Submit Button
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.m,
    paddingVertical: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
  
  // Error Styles
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.feedback.error + '10',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.feedback.error,
    fontWeight: '500',
  },
  
  // Tickets List
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  ticketsList: {
    gap: theme.spacing.m,
  },
  ticketCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  ticketMessage: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.m,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  ticketDate: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  ticketId: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  // Empty States
  emptyTicketsContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Refresh Button
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s,
    gap: theme.spacing.xs,
  },
  refreshButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  
  // FAQ Card
  faqCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  faqContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  faqText: {
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
  
  // Legacy styles for compatibility
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
});

export default SupportScreen;
