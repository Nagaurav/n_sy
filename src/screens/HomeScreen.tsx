// HomeScreen.tsx
import React, { useState, useEffect, useCallback, FC } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';

// Enhanced category data with proper icons and refined colors
const getCategories = () => [
  {
    id: 'yoga',
    title: 'Yoga',
    icon: 'yoga',
    description: 'Transform your mind and body',
    color: '#4CAF50', // Refined green
    gradient: ['#4CAF50', '#45A049'],
  },
  {
    id: 'dietician',
    title: 'Dietician',
    icon: 'food-apple',
    description: 'Personalized nutrition guidance',
    color: '#FF9800', // Refined orange
    gradient: ['#FF9800', '#F57C00'],
  },
  {
    id: 'ayurveda',
    title: 'Ayurveda',
    icon: 'leaf',
    description: 'Ancient healing wisdom',
    color: '#8BC34A', // Refined light green
    gradient: ['#8BC34A', '#689F38'],
  },
  {
    id: 'mental_health',
    title: 'Mental Health',
    icon: 'brain',
    description: 'Professional mental wellness',
    color: '#9C27B0', // Distinct purple
    gradient: ['#9C27B0', '#7B1FA2'],
  },
  {
    id: 'meditation',
    title: 'Meditation',
    icon: 'meditation',
    description: 'Inner peace and mindfulness',
    color: '#673AB7', // Different purple shade
    gradient: ['#673AB7', '#512DA8'],
  },
  {
    id: 'homeopathy',
    title: 'Homeopathy',
    icon: 'water',
    description: 'Natural healing remedies',
    color: '#2196F3', // Refined blue
    gradient: ['#2196F3', '#1976D2'],
  },
  {
    id: 'nutritionist',
    title: 'Nutritionist',
    icon: 'food-variant',
    description: 'Expert dietary advice',
    color: '#E91E63', // Refined pink
    gradient: ['#E91E63', '#C2185B'],
  },
  {
    id: 'naturopath',
    title: 'Naturopath',
    icon: 'nature',
    description: 'Natural wellness solutions',
    color: '#795548', // Refined brown
    gradient: ['#795548', '#5D4037'],
  },
];

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient: string[];
}

const NUM_COLUMNS = 2;
const CARD_SIZE = 160;
const CARD_MARGIN = 12;

const HomeScreen: FC = () => {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressAnimations] = useState(() => 
    new Map<string, Animated.Value>()
  );

  // Initialize press animations for each category
  useEffect(() => {
    const categoryData = getCategories();
    categoryData.forEach(category => {
      if (!pressAnimations.has(category.id)) {
        pressAnimations.set(category.id, new Animated.Value(1));
      }
    });
    setCategories(categoryData);
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const categoryData = getCategories();
      setCategories(categoryData);
    } catch (err: any) {
      setError('Failed to load categories. Please try again.');
      console.error('Error fetching categories:', err);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, [fetchCategories]);

  const handleCategoryPress = (category: Category) => {
    // Create press animation
    const animation = pressAnimations.get(category.id);
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // Navigate to CategorySelectionScreen with category details
    (navigation as any).navigate(ROUTES.CATEGORY_SELECTION, {
      category: category.id,
      categoryName: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color,
    });
  };

  const renderCategory = ({ item, index }: { item: Category; index: number }) => {
    const animation = pressAnimations.get(item.id) || new Animated.Value(1);
    
    return (
      <Animated.View 
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: animation }],
          }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryCard,
            { 
              backgroundColor: item.color,
              shadowColor: item.color,
              shadowOpacity: 0.3,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 4 },
              elevation: 6,
            }
          ]}
          activeOpacity={0.8}
          onPress={() => handleCategoryPress(item)}
        >
          {/* Icon Container with subtle background */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={item.icon as any} 
              size={48} 
              color={colors.offWhite} 
            />
          </View>
          
          {/* Title with improved typography */}
          <Text style={styles.categoryTitle}>{item.title}</Text>
          
          {/* Description with better readability */}
          <Text style={styles.categoryDescription}>{item.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeTitle}>Welcome to Samyā Yog</Text>
        <Text style={styles.welcomeSubtitle}>Choose your wellness journey</Text>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Categories Grid */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={categories}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[colors.primaryGreen]}
            tintColor={colors.primaryGreen}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="heart-pulse" 
                size={80} 
                color={colors.secondaryText} 
              />
              <Text style={styles.emptyTitle}>No Categories Available</Text>
              <Text style={styles.emptySubtitle}>
                We're working on adding more wellness categories. Please check back later.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.primaryGreen,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: colors.secondaryText,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '500' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 32,
  },
  cardWrapper: {
    flex: 1,
    margin: CARD_MARGIN / 2,
  },
  categoryCard: {
    height: CARD_SIZE,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    // Enhanced shadow for depth
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    // Subtle inner shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.offWhite,
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  categoryDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500' as const,
  },
});

export default HomeScreen;
