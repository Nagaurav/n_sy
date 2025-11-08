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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { makeApiRequest } from '../config/api';
import type { RootStackParamList } from '../navigation/constants';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SupportTicket {
  subject: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

interface ApiResponse {
  success: boolean;
  message?: string;
  data?: any;
}

const SUPPORT_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'billing', label: 'Billing & Payment' },
  { value: 'booking', label: 'Booking Issue' },
  { value: 'account', label: 'Account Issue' },
  { value: 'other', label: 'Other' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: colors.success },
  { value: 'medium', label: 'Medium', color: colors.accentYellow },
  { value: 'high', label: 'High', color: colors.error },
];

const SUPPORT_CONTACTS = {
  email: 'support@samya.com',
  phone: '+91 1800-123-4567',
  availability: '24/7 Support Available',
};

const CustomerSupportScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SupportTicket>({
    subject: '',
    message: '',
    category: 'general',
    priority: 'medium',
  });

  const updateFormData = (field: keyof SupportTicket, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.subject.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const response: ApiResponse = await makeApiRequest('/support/tickets', 'POST', formData);
      if (response.success) {
        Alert.alert(
          'Ticket Submitted',
          'Your support ticket has been successfully submitted. Our team will get back to you soon.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Error', response.message || 'Something went wrong. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit ticket. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Customer Support</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Info Section */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="headset" size={40} color={colors.primaryGreen} />
          <Text style={styles.infoTitle}>Need Help?</Text>
          <Text style={styles.infoSubtitle}>
            Submit a support ticket and our team will respond within 24 hours.
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          {/* Subject */}
          <Text style={styles.label}>Subject *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief description of your issue"
            placeholderTextColor={colors.secondaryText}
            value={formData.subject}
            onChangeText={(text) => updateFormData('subject', text)}
            maxLength={100}
          />

          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <View style={styles.rowWrap}>
            {SUPPORT_CATEGORIES.map((cat) => {
              const isActive = formData.category === cat.value;
              return (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => updateFormData('category', cat.value)}
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {cat.label}
                  </Text>
                  {isActive && (
                    <MaterialCommunityIcons name="check" size={18} color={colors.offWhite} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Priority */}
          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {PRIORITIES.map((p) => {
              const isActive = formData.priority === p.value;
              return (
                <TouchableOpacity
                  key={p.value}
                  style={[styles.priorityCard, isActive && styles.priorityActive]}
                  onPress={() => updateFormData('priority', p.value)}
                >
                  <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                  <Text
                    style={[styles.priorityText, isActive && { color: colors.primaryGreen }]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Please describe your issue in detail..."
            placeholderTextColor={colors.secondaryText}
            value={formData.message}
            onChangeText={(text) => updateFormData('message', text)}
            multiline
            maxLength={1000}
          />
          <Text style={styles.charCount}>{formData.message.length}/1000 characters</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.offWhite} />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={20} color={colors.offWhite} />
                <Text style={styles.submitText}>Submit Ticket</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Other Ways to Reach Us</Text>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="email" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>{SUPPORT_CONTACTS.email}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="phone" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>{SUPPORT_CONTACTS.phone}</Text>
          </View>
          <View style={styles.contactItem}>
            <MaterialCommunityIcons name="clock" size={20} color={colors.primaryGreen} />
            <Text style={styles.contactText}>{SUPPORT_CONTACTS.availability}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomColor: colors.offWhite,
    borderBottomWidth: 1,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  scrollContainer: { padding: 20, paddingBottom: 60 },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    alignItems: 'center',
    padding: 20,
    marginBottom: 24,
    elevation: 3,
  },
  infoTitle: { fontSize: 20, fontWeight: '600', color: colors.primaryText, marginTop: 10 },
  infoSubtitle: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 8 },
  form: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 8 },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderColor: colors.offWhite,
    borderWidth: 1,
    padding: 14,
    color: colors.primaryText,
    marginBottom: 16,
  },
  textArea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: colors.secondaryText, textAlign: 'right', marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: { backgroundColor: colors.primaryGreen },
  chipText: { color: colors.primaryText, fontSize: 14, fontWeight: '500' },
  chipTextActive: { color: colors.offWhite },
  priorityRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  priorityCard: {
    flex: 1,
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityActive: { borderWidth: 2, borderColor: colors.primaryGreen, backgroundColor: colors.white },
  priorityDot: { width: 12, height: 12, borderRadius: 6 },
  priorityText: { fontSize: 14, color: colors.primaryText, fontWeight: '500' },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  submitText: { color: colors.offWhite, fontSize: 16, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
  contactCard: { backgroundColor: colors.cardBackground, borderRadius: 12, padding: 20 },
  contactTitle: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  contactText: { fontSize: 14, color: colors.secondaryText },
});

export default CustomerSupportScreen;
