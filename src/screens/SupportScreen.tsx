import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

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
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastTickets, setPastTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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

  // Fetch past support tickets
  const fetchPastTickets = async () => {
    if (!user?._id) return;

    setIsLoadingTickets(true);
    try {
      const response = await apiService.getUserSupportTickets(user._id);
      if (response.success && response.data?.tickets) {
        setPastTickets(response.data.tickets);
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
  }, [user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPastTickets();
  };

  // Handle form submission with API integration
  const handleSubmit = async () => {
    // Client-side validation
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

    if (!user?._id) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await apiService.submitSupportTicket(
        user._id,
        subject.trim(),
        message.trim()
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
                fetchPastTickets(); // Refresh the list
              },
            },
          ]
        );
      } else {
        throw new Error(response.message || 'Failed to submit ticket');
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

  const getStatusColor = (status: string) => {
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
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
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
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
          <Ionicons name="menu" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Support Hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support Hours</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#1E88E5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Monday - Friday</Text>
                <Text style={styles.infoValue}>9:00 AM - 6:00 PM IST</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color="#1E88E5" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Saturday - Sunday</Text>
                <Text style={styles.infoValue}>10:00 AM - 4:00 PM IST</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Submit a Ticket */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.ticketForm}>
            <Text style={styles.formInstructions}>
              Have an issue? Fill out the form below and our team will get back to you.
            </Text>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief description of your issue"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your issue in detail..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Ionicons name="send-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>Submit Ticket</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Past Support Tickets */}
        {pastTickets.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Support Tickets</Text>
            {isLoadingTickets ? (
              <ActivityIndicator size="large" color="#1E88E5" />
            ) : (
              <FlatList
                data={pastTickets}
                renderItem={renderTicketCard}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#1E88E5']}
                  />
                }
              />
            )}
          </View>
        )}

        {/* FAQ Link */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.faqCard}
            onPress={() => navigation.navigate('FAQ' as never)}
          >
            <View style={styles.faqContent}>
              <Ionicons name="help-circle-outline" size={32} color="#1E88E5" />
              <View style={styles.faqText}>
                <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
                <Text style={styles.faqDescription}>
                  Find answers to common questions
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  submitButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  faqContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  faqText: {
    marginLeft: 16,
    flex: 1,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  faqDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  formInstructions: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ticketMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ticketId: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default SupportScreen;
