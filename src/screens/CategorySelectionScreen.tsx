// CategorySelectionScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';

// Define types for better type safety
interface CategoryOption {
  title: string;
  icon: string;
  description: string;
  color: string;
  features: string[];
}

interface CategoryConfig {
  classes?: CategoryOption;
  consultation: CategoryOption;
}

// Enhanced category configuration with better visual design
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  yoga: {
    classes: {
      title: 'Yoga Classes',
      icon: 'yoga',
      description: 'Join structured yoga sessions with expert instructors',
      color: '#4CAF50',
      features: ['Flexible scheduling', 'Multiple styles', 'Progress tracking'],
    },
    consultation: {
      title: 'Yoga Consultation',
      icon: 'account-star',
      description: 'Get personalized yoga guidance and therapy',
      color: '#8BC34A',
      features: ['One-on-one sessions', 'Customized plans', 'Health assessment'],
    },
  },
  dietician: {
    consultation: {
      title: 'Diet Consultation',
      icon: 'account-heart',
      description: 'Personalized nutrition advice and meal plans',
      color: '#FFB74D',
      features: ['Custom meal plans', 'Health monitoring', 'Lifestyle coaching'],
    },
  },
  ayurveda: {
    consultation: {
      title: 'Ayurveda Consultation',
      icon: 'account-multiple-check',
      description: 'Personalized Ayurvedic treatment plans',
      color: '#9CCC65',
      features: ['Body constitution analysis', 'Herbal remedies', 'Detox programs'],
    },
  },
  mental_health: {
    consultation: {
      title: 'Mental Health Consultation',
      icon: 'account-psychology',
      description: 'Professional mental health therapy and counseling',
      color: '#BA68C8',
      features: ['Individual therapy', 'Crisis support', 'Treatment plans'],
    },
  },
  meditation: {
    classes: {
      title: 'Meditation Classes',
      icon: 'meditation',
      description: 'Learn meditation techniques and mindfulness',
      color: '#673AB7',
      features: ['Guided sessions', 'Breathing techniques', 'Mindfulness practice'],
    },
    consultation: {
      title: 'Meditation Consultation',
      icon: 'account-lightbulb',
      description: 'Personalized meditation guidance and therapy',
      color: '#9575CD',
      features: ['Custom techniques', 'Progress tracking', 'Lifestyle integration'],
    },
  },
  homeopathy: {
    consultation: {
      title: 'Homeopathy Consultation',
      icon: 'account-clock',
      description: 'Personalized homeopathic treatment',
      color: '#64B5F6',
      features: ['Individual assessment', 'Remedy selection', 'Follow-up care'],
    },
  },
  nutritionist: {
    consultation: {
      title: 'Nutrition Consultation',
      icon: 'account-supervisor',
      description: 'Personalized nutrition advice and plans',
      color: '#F06292',
      features: ['Diet analysis', 'Custom plans', 'Progress monitoring'],
    },
  },
  naturopath: {
    consultation: {
      title: 'Naturopathy Consultation',
      icon: 'account-tree',
      description: 'Personalized natural treatment plans',
      color: '#A1887F',
      features: ['Health assessment', 'Natural remedies', 'Lifestyle guidance'],
    },
  },
};

const CategorySelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category, categoryName, categoryIcon, categoryColor } = route.params as any;

  const categoryOptions = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];

  const handleOptionPress = (optionType: 'classes' | 'consultation') => {
    const option = categoryOptions[optionType];
    
    if (!option) {
      console.error(`Option ${optionType} not available for category ${category}`);
      return;
    }
    
    // For categories that only have consultation, use the base category name
    // For categories with both options, use the specific category ID
    const categoryId = categoryOptions.classes 
      ? `${category}_${optionType}` 
      : category;
    
    (navigation as any).navigate(ROUTES.CATEGORY_MODE_SELECTION, {
      category: categoryId,
      categoryName: option.title,
      categoryIcon: option.icon,
      categoryColor: option.color,
      categoryDescription: option.description,
    });
  };

  if (!categoryOptions) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>Category not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={[styles.categoryIconContainer, { backgroundColor: categoryColor }]}>
            <MaterialCommunityIcons 
              name={categoryIcon as any} 
              size={32} 
              color={colors.offWhite} 
            />
          </View>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            Choose how you'd like to experience {categoryName.toLowerCase()}
          </Text>
        </View>

        {/* Options Section */}
        <View style={styles.optionsContainer}>
          {/* Classes Option */}
          {categoryOptions.classes && (
            <TouchableOpacity
              style={[
                styles.optionCard,
                { 
                  backgroundColor: colors.offWhite,
                  shadowColor: categoryOptions.classes!.color,
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 8,
                }
              ]}
              activeOpacity={0.8}
              onPress={() => handleOptionPress('classes')}
            >
              <View style={[styles.optionIconContainer, { backgroundColor: categoryOptions.classes!.color }]}>
                <MaterialCommunityIcons 
                  name={categoryOptions.classes!.icon as any} 
                  size={32} 
                  color={colors.offWhite} 
                />
              </View>
              
              <Text style={styles.optionTitle}>{categoryOptions.classes!.title}</Text>
              <Text style={styles.optionDescription}>{categoryOptions.classes!.description}</Text>
              
              <View style={styles.featuresContainer}>
                {categoryOptions.classes!.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureItem}>
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={16} 
                      color={categoryOptions.classes!.color} 
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.optionButton, { backgroundColor: categoryOptions.classes!.color }]}>
                <Text style={styles.optionButtonText}>Choose Classes</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color={colors.offWhite} />
              </View>
            </TouchableOpacity>
          )}

          {/* Consultation Option */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              { 
                backgroundColor: colors.offWhite,
                shadowColor: categoryOptions.consultation.color,
                shadowOpacity: 0.2,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 6 },
                elevation: 8,
              }
            ]}
            activeOpacity={0.8}
            onPress={() => handleOptionPress('consultation')}
          >
            <View style={[styles.optionIconContainer, { backgroundColor: categoryOptions.consultation.color }]}>
              <MaterialCommunityIcons 
                name={categoryOptions.consultation.icon as any} 
                size={32} 
                color={colors.offWhite} 
              />
            </View>
            
            <Text style={styles.optionTitle}>{categoryOptions.consultation.title}</Text>
            <Text style={styles.optionDescription}>{categoryOptions.consultation.description}</Text>
            
            <View style={styles.featuresContainer}>
              {categoryOptions.consultation.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialCommunityIcons 
                    name="check-circle" 
                    size={16} 
                    color={categoryOptions.consultation.color} 
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.optionButton, { backgroundColor: categoryOptions.consultation.color }]}>
              <Text style={styles.optionButtonText}>Choose Consultation</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={colors.offWhite} />
            </View>
          </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  categoryIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  categoryTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  categorySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 24,
  },
  optionCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  optionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500' as const,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.primaryText,
    marginLeft: 8,
    fontWeight: '500' as const,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  optionButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600' as const,
    marginRight: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    marginTop: 16,
    fontWeight: '600' as const,
  },
});

export default CategorySelectionScreen;
