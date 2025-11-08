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
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';
import { useTypedNavigation } from '../hooks/useTypedNavigation';

interface FeedbackForm {
  rating: number;
  category: string;
  title: string;
  message: string;
  anonymous: boolean;
}

const CATEGORIES = [
  { value: 'general', label: 'General Feedback' },
  { value: 'app', label: 'App Experience' },
  { value: 'service', label: 'Service Quality' },
  { value: 'professional', label: 'Professional Experience' },
  { value: 'booking', label: 'Booking Process' },
  { value: 'payment', label: 'Payment Experience' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'complaint', label: 'Complaint' },
];

const FeedbackScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0,
    category: 'general',
    title: '',
    message: '',
    anonymous: false,
  });

  /** 🧠 Helper Functions */
  const updateForm = (field: keyof FeedbackForm, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const getRatingText = () => {
    return ['Select Rating', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'][form.rating] || 'Select Rating';
  };

  const handleSubmit = async () => {
    if (loading) return;
    if (form.rating === 0) return Alert.alert('Missing Rating', 'Please provide a rating.');
    if (!form.title.trim() || !form.message.trim())
      return Alert.alert('Missing Details', 'Please fill in all required fields.');

    setLoading(true);
    try {
      const response = await makeApiRequest('/feedback', 'POST', form);
      if (response.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        setForm({ rating: 0, category: 'general', title: '', message: '', anonymous: false });
      } else {
        Alert.alert('Error', response.message || 'Failed to submit feedback.');
      }
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      Alert.alert('Network Error', err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  /** 🧩 Renderers */
  const renderStar = (num: number) => (
    <TouchableOpacity
      key={num}
      onPress={() => updateForm('rating', num)}
      activeOpacity={0.8}
      style={styles.starBtn}
    >
      <MaterialCommunityIcons
        name={num <= form.rating ? 'star' : 'star-outline'}
        size={32}
        color={num <= form.rating ? colors.accentYellow : colors.secondaryText}
      />
    </TouchableOpacity>
  );

  const renderCategory = (item: { value: string; label: string }) => {
    const selected = form.category === item.value;
    return (
      <TouchableOpacity
        key={item.value}
        onPress={() => updateForm('category', item.value)}
        style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
      >
        <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
          {item.label}
        </Text>
        {selected && <MaterialCommunityIcons name="check" size={18} color={colors.offWhite} />}
      </TouchableOpacity>
    );
  };

  /** 🧱 UI */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={{ width: 34 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="message-text" size={42} color={colors.primaryGreen} />
          <Text style={styles.infoTitle}>Share Your Experience</Text>
          <Text style={styles.infoSubtitle}>
            Your feedback helps us improve our services and create better experiences.
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={styles.label}>Overall Rating *</Text>
          <View style={styles.ratingBox}>
            <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(renderStar)}</View>
            <Text style={styles.ratingText}>{getRatingText()}</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>{CATEGORIES.map(renderCategory)}</View>
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your feedback"
            placeholderTextColor={colors.secondaryText}
            value={form.title}
            onChangeText={(text) => updateForm('title', text)}
            maxLength={100}
          />
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.label}>Detailed Feedback *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            multiline
            placeholder="Please share your detailed experience or suggestions..."
            placeholderTextColor={colors.secondaryText}
            value={form.message}
            onChangeText={(text) => updateForm('message', text)}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{form.message.length}/1000 characters</Text>
        </View>

        {/* Anonymous Option */}
        <TouchableOpacity
          style={styles.anonymousRow}
          onPress={() => updateForm('anonymous', !form.anonymous)}
        >
          <MaterialCommunityIcons
            name={form.anonymous ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={22}
            color={form.anonymous ? colors.primaryGreen : colors.secondaryText}
          />
          <Text style={styles.anonymousText}>Submit anonymously</Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={[styles.submitBtn, loading && styles.submitDisabled]}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.offWhite} />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={20} color={colors.offWhite} />
              <Text style={styles.submitText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Thank You */}
        <View style={styles.thankYou}>
          <MaterialCommunityIcons name="heart" size={22} color={colors.primaryGreen} />
          <Text style={styles.thankText}>Thank you for sharing your thoughts with us!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.offWhite,
  },
  backBtn: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText },
  scroll: { padding: 20 },
  infoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  infoTitle: { fontSize: 20, fontWeight: '600', color: colors.primaryText, marginTop: 10 },
  infoSubtitle: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 6 },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 10 },
  ratingBox: { alignItems: 'center' },
  starRow: { flexDirection: 'row', marginBottom: 8 },
  starBtn: { marginHorizontal: 4 },
  ratingText: { fontSize: 15, color: colors.primaryText, fontWeight: '500' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.offWhite,
  },
  categoryBtnSelected: { backgroundColor: colors.primaryGreen, borderColor: colors.primaryGreen },
  categoryLabel: { fontSize: 14, color: colors.primaryText, fontWeight: '500' },
  categoryLabelSelected: { color: colors.offWhite },
  input: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    color: colors.primaryText,
    borderWidth: 1,
    borderColor: colors.offWhite,
  },
  textarea: { height: 120 },
  charCount: { fontSize: 12, color: colors.secondaryText, textAlign: 'right', marginTop: 6 },
  anonymousRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  anonymousText: { fontSize: 15, color: colors.primaryText, fontWeight: '500' },
  submitBtn: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 24,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: colors.offWhite, fontSize: 16, fontWeight: '600' },
  thankYou: {
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 18,
  },
  thankText: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 6 },
});

export default FeedbackScreen;
