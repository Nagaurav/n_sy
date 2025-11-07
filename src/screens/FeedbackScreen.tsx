// FeedbackScreen.tsx
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
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';

interface Feedback {
  rating: number;
  category: string;
  title: string;
  message: string;
  anonymous: boolean;
}

const FeedbackScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Feedback>({
    rating: 0,
    category: 'general',
    title: '',
    message: '',
    anonymous: false,
  });

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'app', label: 'App Experience' },
    { value: 'service', label: 'Service Quality' },
    { value: 'professional', label: 'Professional Experience' },
    { value: 'booking', label: 'Booking Process' },
    { value: 'payment', label: 'Payment Experience' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'complaint', label: 'Complaint' },
  ];

  const handleSubmit = async () => {
    if (formData.rating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }

    if (!formData.title.trim() || !formData.message.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await makeApiRequest('/feedback', 'POST', formData);

      if (response.success) {
        Alert.alert(
          'Thank You!',
          'Your feedback has been submitted successfully. We appreciate your input!',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to submit feedback');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof Feedback, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStar = (starNumber: number) => (
    <TouchableOpacity
      key={starNumber}
      onPress={() => updateFormData('rating', starNumber)}
      style={styles.starContainer}
    >
      <MaterialCommunityIcons
        name={starNumber <= formData.rating ? 'star' : 'star-outline'}
        size={32}
        color={starNumber <= formData.rating ? colors.accentYellow : colors.secondaryText}
      />
    </TouchableOpacity>
  );

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

  const getRatingText = () => {
    switch (formData.rating) {
      case 1: return 'Very Poor';
      case 2: return 'Poor';
      case 3: return 'Average';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

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
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="message-text" size={40} color={colors.primaryGreen} />
          <Text style={styles.infoTitle}>Share Your Experience</Text>
          <Text style={styles.infoSubtitle}>
            Your feedback helps us improve our services and provide better experiences for everyone.
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Overall Rating *</Text>
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(renderStar)}
            </View>
            <Text style={styles.ratingText}>{getRatingText()}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map(renderCategoryOption)}
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="Brief summary of your feedback"
            placeholderTextColor={colors.secondaryText}
            value={formData.title}
            onChangeText={(text) => updateFormData('title', text)}
            maxLength={100}
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Detailed Feedback *</Text>
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Please share your detailed experience, suggestions, or concerns..."
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

        <View style={styles.formSection}>
          <TouchableOpacity
            style={styles.anonymousContainer}
            onPress={() => updateFormData('anonymous', !formData.anonymous)}
          >
            <MaterialCommunityIcons
              name={formData.anonymous ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={formData.anonymous ? colors.primaryGreen : colors.secondaryText}
            />
            <Text style={styles.anonymousText}>Submit anonymously</Text>
          </TouchableOpacity>
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
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.thankYouNote}>
          <MaterialCommunityIcons name="heart" size={24} color={colors.primaryGreen} />
          <Text style={styles.thankYouText}>
            Thank you for taking the time to share your feedback with us!
          </Text>
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
  ratingContainer: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  starContainer: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
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
    color: colors.offWhite,
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  anonymousText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '500',
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
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600',
  },
  thankYouNote: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  thankYouText: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default FeedbackScreen;
