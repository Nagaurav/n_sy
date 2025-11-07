// CustomerSupportScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';

interface SupportTicket {
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

const CustomerSupportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupportTicket>({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });

  const categories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'technical', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing & Payment' },
    { value: 'booking', label: 'Booking Issue' },
    { value: 'account', label: 'Account Issue' },
    { value: 'other', label: 'Other' },
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: colors.success },
    { value: 'medium', label: 'Medium', color: colors.accentYellow },
    { value: 'high', label: 'High', color: colors.error },
  ];

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await makeApiRequest('/support/tickets', 'POST', formData);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your support ticket has been submitted successfully. We will get back to you soon.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit ticket');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof SupportTicket, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderCategoryOption = (category: { value: string; label: string }) => (
    <TouchableOpacity
      key={category.value}
      style={[
        styles.categoryOption,
        formData.category === category.value && styles.selectedOption,
      ]}
      onPress={() => updateFormData('category', category.value)}
    >
      <Text
        style={[
          styles.categoryText,
          formData.category === category.value && styles.selectedOptionText,
        ]}
      >
        {category.label}
      </Text>
      {formData.category === category.value && (
        <MaterialCommunityIcons name="check" size={20} color={colors.offWhite} />
      )}
    </TouchableOpacity>
  );

  const renderPriorityOption = (priority: { value: string; label: string; color: string }) => (
    <TouchableOpacity
      key={priority.value}
      style={[
        styles.priorityOption,
        formData.priority === priority.value && styles.selectedPriority,
      ]}
      onPress={() => updateFormData('priority', priority.value)}
    >
      <View style={[styles.priorityIndicator, { backgroundColor: priority.color }]} />
      <Text
        style={[
          styles.priorityText,
          formData.priority === priority.value && styles.selectedPriorityText,
        ]}
      >
        {priority.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="headset" size={40} color={colors.primaryGreen} />
          <Text style={styles.infoTitle}>Need Help?</Text>
          <Text style={styles.infoSubtitle}>
            We're here to help! Submit a ticket and our support team will get back to you within 24 hours.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={colors.secondaryText}
            value={formData.subject}
            onChangeText={(text) => updateFormData('subject', text)}
            maxLength={100}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryOption)}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <View style={styles.prioritiesContainer}>
            {priorities.map(renderPriorityOption)}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Message *</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={colors.secondaryText}
            value={formData.message}
            onChangeText={(text) => updateFormData('message', text)}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>
            {formData.message.length}/1000 characters
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.offWhite} />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color={colors.offWhite} />
              <Text style={styles.submitButtonText}>Submit Ticket</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>support@samya.com</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>+91 1800-123-4567</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>24/7 Support Available</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
  },
  headerRight: {
    width: 34,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 12,
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.offWhite,
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'right',
    marginTop: 8,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedOption: {
    backgroundColor: colors.primaryGreen,
  },
  categoryText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: colors.white,
  },
  prioritiesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedPriority: {
    backgroundColor: colors.cardBackground,
    borderWidth: 2,
    borderColor: colors.primaryGreen,
  },
  priorityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  selectedPriorityText: {
    color: colors.primaryGreen,
  },
  submitButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  contactInfo: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.secondaryText,
  },
});

export default CustomerSupportScreen;
