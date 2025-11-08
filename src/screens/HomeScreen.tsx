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
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';
import { makeApiRequest } from '../config/api';

interface Category {
  id: string;
  title: string;
  icon: string;
  description: string;
  color: string;
  gradient?: string[];
}

/** Default fallback categories */
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'yoga', title: 'Yoga', icon: 'yoga', description: 'Transform your mind and body', color: '#4CAF50' },
  { id: 'dietician', title: 'Dietician', icon: 'food-apple', description: 'Personalized nutrition guidance', color: '#FF9800' },
  { id: 'ayurveda', title: 'Ayurveda', icon: 'leaf', description: 'Ancient healing wisdom', color: '#8BC34A' },
  { id: 'mental_health', title: 'Mental Health', icon: 'brain', description: 'Professional mental wellness', color: '#9C27B0' },
  { id: 'meditation', title: 'Meditation', icon: 'meditation', description: 'Inner peace and mindfulness', color: '#673AB7' },
  { id: 'homeopathy', title: 'Homeopathy', icon: 'water', description: 'Natural healing remedies', color: '#2196F3' },
  { id: 'nutritionist', title: 'Nutritionist', icon: 'food-variant', description: 'Expert dietary advice', color: '#E91E63' },
  { id: 'naturopath', title: 'Naturopath', icon: 'nature', description: 'Natural wellness solutions', color: '#795548' },
];

const NUM_COLUMNS = 2;
const CARD_SIZE = 160;
const CARD_MARGIN = 12;

const HomeScreen: FC = () => {
  const navigation = useTypedNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pressAnimations] = useState<Map<string, Animated.Value>>(() => new Map());

  /** 🔄 Fetch categories (API + fallback) */
  const fetchCategories = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      // Simulate or fetch from API endpoint
      const response = await makeApiRequest('/categories', 'GET');
      if (response.success && response.data?.length > 0) {
        setCategories(response.data);
      } else {
        console.warn('Falling back to default categories');
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Unable to load categories. Please check your connection.');
      setCategories(DEFAULT_CATEGORIES); // graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** 🔁 Pull-to-refresh */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories(true);
  }, [fetchCategories]);

  /** 🧠 Initialize on mount */
  useEffect(() => {
    DEFAULT_CATEGORIES.forEach(cat => {
      if (!pressAnimations.has(cat.id)) {
        pressAnimations.set(cat.id, new Animated.Value(1));
      }
    });
    fetchCategories();
  }, [fetchCategories]);

  /** 💫 Press animation handler */
  const handleCategoryPress = (category: Category) => {
    const animation = pressAnimations.get(category.id);
    if (animation) {
      Animated.sequence([
        Animated.timing(animation, { toValue: 0.96, duration: 100, useNativeDriver: true }),
        Animated.timing(animation, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    }

    navigation.navigate(ROUTES.CATEGORY_SELECTION, {
      category: category.id,
      categoryName: category.title,
      categoryIcon: category.icon,
      categoryColor: category.color,
    });
  };

  /** 🧱 Category card */
  const renderCategory = ({ item }: { item: Category }) => {
    const animation = pressAnimations.get(item.id) || new Animated.Value(1);
    return (
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale: animation }] }]}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: item.color }]}
          activeOpacity={0.9}
          onPress={() => handleCategoryPress(item)}
        >
          <MaterialCommunityIcons name={item.icon as any} size={48} color={colors.offWhite} />
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.description}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  /** 🧾 Error / Loading / Empty states */
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.statusText}>Loading categories...</Text>
      </SafeAreaView>
    );
  }

  if (error && categories.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialCommunityIcons name="wifi-off" size={70} color={colors.error} />
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.statusText}>{error}</Text>
        <TouchableOpacity onPress={() => fetchCategories()} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (categories.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <MaterialCommunityIcons name="heart-pulse" size={70} color={colors.secondaryText} />
        <Text style={styles.errorTitle}>No Categories Available</Text>
        <Text style={styles.statusText}>Please check back later.</Text>
      </SafeAreaView>
    );
  }

  /** 🏠 Main Render */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Samyā Yog</Text>
        <Text style={styles.subtitle}>Choose your wellness journey</Text>
        {error && <Text style={styles.errorHint}>{error}</Text>}
      </View>

      {/* Category Grid */}
      <FlatList
        contentContainerStyle={styles.list}
        data={categories}
        numColumns={NUM_COLUMNS}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primaryGreen]}
          />
        }
      />
    </SafeAreaView>
  );
};

/** 💅 Styles */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  header: { paddingVertical: 32, paddingHorizontal: 24, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', color: colors.primaryGreen, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: colors.secondaryText, textAlign: 'center' },
  errorHint: { color: colors.error, fontSize: 13, textAlign: 'center', marginTop: 8 },
  list: { paddingHorizontal: CARD_MARGIN, paddingBottom: 40 },
  cardWrapper: { flex: 1, margin: CARD_MARGIN / 2 },
  card: {
    height: CARD_SIZE,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.offWhite, marginTop: 8 },
  cardSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
  statusText: { fontSize: 14, color: colors.secondaryText, textAlign: 'center', marginTop: 8 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.primaryText, marginTop: 12 },
  retryBtn: {
    marginTop: 20,
    backgroundColor: colors.primaryGreen,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: colors.offWhite, fontWeight: '600' },
});

export default HomeScreen;
