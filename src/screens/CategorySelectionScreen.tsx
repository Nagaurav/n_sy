import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 🧠 Navigation type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

// ✅ Central category config
const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  yoga: {
    classes: {
      title: 'Yoga Classes',
      icon: 'yoga',
      description: 'Join structured yoga sessions with expert instructors.',
      color: '#4CAF50',
      features: ['Flexible schedule', 'Multiple styles', 'Progress tracking'],
    },
    consultation: {
      title: 'Yoga Consultation',
      icon: 'account-star',
      description: 'Get personalized yoga guidance and therapy.',
      color: '#8BC34A',
      features: ['One-on-one sessions', 'Custom plans', 'Health assessment'],
    },
  },
  meditation: {
    classes: {
      title: 'Meditation Classes',
      icon: 'meditation',
      description: 'Learn mindfulness and guided meditation techniques.',
      color: '#673AB7',
      features: ['Guided sessions', 'Focus improvement', 'Stress reduction'],
    },
    consultation: {
      title: 'Meditation Consultation',
      icon: 'account-lightbulb',
      description: 'Personalized meditation guidance and therapy.',
      color: '#9575CD',
      features: ['Custom techniques', 'Progress tracking', 'Lifestyle integration'],
    },
  },
  dietician: {
    consultation: {
      title: 'Diet Consultation',
      icon: 'food-apple',
      description: 'Personalized nutrition advice and meal plans.',
      color: '#FFB74D',
      features: ['Custom meal plans', 'Lifestyle tracking', 'Weight management'],
    },
  },
  ayurveda: {
    consultation: {
      title: 'Ayurveda Consultation',
      icon: 'leaf',
      description: 'Traditional Ayurvedic treatment and dosha balance.',
      color: '#9CCC65',
      features: ['Herbal remedies', 'Detox programs', 'Body constitution analysis'],
    },
  },
  mental_health: {
    consultation: {
      title: 'Mental Health Consultation',
      icon: 'brain',
      description: 'Professional therapy and mental wellness support.',
      color: '#BA68C8',
      features: ['Therapy sessions', 'Crisis support', 'Personalized care'],
    },
  },
  homeopathy: {
    consultation: {
      title: 'Homeopathy Consultation',
      icon: 'pill',
      description: 'Personalized homeopathic medicine and guidance.',
      color: '#64B5F6',
      features: ['Remedy selection', 'Follow-ups', 'Individual treatment'],
    },
  },
  nutritionist: {
    consultation: {
      title: 'Nutrition Consultation',
      icon: 'food-variant',
      description: 'Science-based diet and fitness guidance.',
      color: '#F06292',
      features: ['Diet analysis', 'Progress tracking', 'Custom plans'],
    },
  },
  naturopath: {
    consultation: {
      title: 'Naturopathy Consultation',
      icon: 'flower',
      description: 'Holistic healing with natural remedies.',
      color: '#A1887F',
      features: ['Lifestyle coaching', 'Natural therapies', 'Wellness tracking'],
    },
  },
};

// ✅ Reusable Option Card
const OptionCard: React.FC<{
  option: CategoryOption;
  label: string;
  onPress: () => void;
}> = ({ option, label, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={[styles.card, { shadowColor: option.color }]}
  >
    <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
      <MaterialCommunityIcons name={option.icon as any} size={32} color={colors.offWhite} />
    </View>

    <Text style={styles.cardTitle}>{option.title}</Text>
    <Text style={styles.cardDesc}>{option.description}</Text>

    <View style={styles.featureList}>
      {option.features.map((feature, i) => (
        <View key={i} style={styles.featureItem}>
          <MaterialCommunityIcons name="check-circle" size={16} color={option.color} />
          <Text style={styles.featureText}>{feature}</Text>
        </View>
      ))}
    </View>

    <View style={[styles.actionButton, { backgroundColor: option.color }]}>
      <Text style={styles.actionText}>{label}</Text>
      <MaterialCommunityIcons name="arrow-right" size={20} color={colors.offWhite} />
    </View>
  </TouchableOpacity>
);

const CategorySelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { category, categoryName, categoryIcon, categoryColor } = route.params as any;

  const categoryOptions = CATEGORY_CONFIG[category];

  if (!categoryOptions) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>Category not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleOptionPress = (type: 'classes' | 'consultation') => {
    const option = categoryOptions[type];
    if (!option) return Alert.alert('Unavailable', `No ${type} available for this category.`);
    const categoryId = categoryOptions.classes ? `${category}_${type}` : category;

    navigation.navigate(ROUTES.CATEGORY_MODE_SELECTION, {
      category: categoryId,
      categoryName: option.title,
      categoryIcon: option.icon,
      categoryColor: option.color,
      categoryDescription: option.description,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: categoryColor }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={32} color={colors.offWhite} />
          </View>
          <Text style={styles.headerTitle}>{categoryName}</Text>
          <Text style={styles.headerSubtitle}>
            Choose how you'd like to experience {categoryName.toLowerCase()}.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionContainer}>
          {categoryOptions.classes && (
            <OptionCard
              option={categoryOptions.classes}
              label="Choose Classes"
              onPress={() => handleOptionPress('classes')}
            />
          )}
          <OptionCard
            option={categoryOptions.consultation}
            label="Choose Consultation"
            onPress={() => handleOptionPress('consultation')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  optionContainer: { paddingHorizontal: 20, gap: 24 },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 18,
    padding: 22,
    elevation: 5,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    marginVertical: 12,
  },
  featureList: { marginBottom: 16 },
  featureItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  featureText: { marginLeft: 8, color: colors.primaryText, fontSize: 14 },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionText: { color: colors.offWhite, fontSize: 15, fontWeight: '600', marginRight: 8 },
  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  errorText: { color: colors.error, fontWeight: '600', fontSize: 18 },
  retryText: { color: colors.primaryGreen, fontWeight: '500', fontSize: 16, marginTop: 6 },
});

export default CategorySelectionScreen;
