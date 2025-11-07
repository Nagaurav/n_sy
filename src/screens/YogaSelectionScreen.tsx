// src/screens/YogaSelectionScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { YogaCard } from '../components/yoga';
import { dataTransform, calculatePrice, timeUtils } from '../utils/yogaUtils';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;

interface RouteParams {
  mode: 'online' | 'offline';
  location?: {
    city: string;
    latitude: number;
    longitude: number;
  };
}

// Simplified data structure for yoga instructors only
interface YogaInstructor {
  id: string;
  name: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  icon: string;
  badge?: {
    type: 'popular' | 'recommended' | 'new';
    text: string;
  };
  stats?: Array<{
    icon: string;
    value: string;
    label: string;
  }>;
  features?: string[];
  rating?: number;
  experience?: number;
  totalStudents?: number;
  totalClasses?: number;
  availableSlots?: any[];
  specialization?: string[];
  languages?: string[];
  bio?: string;
  hourlyRate?: number;
  groupClasses?: boolean;
  oneOnOneClasses?: boolean;
  homeVisit?: boolean;
  onlineClasses?: boolean;
  isAvailable?: boolean;
}

const YogaSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { mode, location } = route.params as RouteParams;

  const [instructors, setInstructors] = useState<YogaInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for yoga instructors
  const mockInstructors: YogaInstructor[] = [
    {
      id: 'inst_1',
      name: 'Priya Sharma',
      title: 'Senior Yoga Instructor',
      description: 'Certified yoga instructor with 8+ years of experience in Hatha, Vinyasa, and Ashtanga yoga. Specializes in therapeutic yoga and stress relief.',
      price: 800,
      originalPrice: 1000,
      icon: 'yoga',
      badge: { type: 'popular', text: 'Most Popular' },
      stats: [
        { icon: 'star', value: '4.8', label: 'Rating' },
        { icon: 'account-group', value: '500+', label: 'Students' },
        { icon: 'calendar-check', value: '2000+', label: 'Classes' },
      ],
      features: ['Hatha Yoga', 'Vinyasa Flow', 'Stress Relief', 'Therapeutic'],
      rating: 4.8,
      experience: 8,
      totalStudents: 500,
      totalClasses: 2000,
      specialization: ['Hatha Yoga', 'Vinyasa Flow', 'Therapeutic Yoga'],
      languages: ['English', 'Hindi'],
      bio: 'Dedicated yoga instructor helping students achieve physical and mental wellness through traditional and modern yoga practices.',
      hourlyRate: 800,
      groupClasses: true,
      oneOnOneClasses: true,
      homeVisit: mode === 'offline',
      onlineClasses: mode === 'online',
      isAvailable: true,
    },
    {
      id: 'inst_2',
      name: 'Rajesh Kumar',
      title: 'Yoga & Meditation Expert',
      description: 'Experienced instructor specializing in meditation, pranayama, and gentle yoga. Perfect for beginners and those seeking inner peace.',
      price: 600,
      originalPrice: 750,
      icon: 'meditation',
      badge: { type: 'recommended', text: 'Recommended' },
      stats: [
        { icon: 'star', value: '4.9', label: 'Rating' },
        { icon: 'account-group', value: '300+', label: 'Students' },
        { icon: 'calendar-check', value: '1500+', label: 'Classes' },
      ],
      features: ['Meditation', 'Pranayama', 'Gentle Yoga', 'Mindfulness'],
      rating: 4.9,
      experience: 6,
      totalStudents: 300,
      totalClasses: 1500,
      specialization: ['Meditation', 'Pranayama', 'Gentle Yoga'],
      languages: ['English', 'Hindi', 'Sanskrit'],
      bio: 'Passionate about helping others find inner peace and balance through meditation and gentle yoga practices.',
      hourlyRate: 600,
      groupClasses: true,
      oneOnOneClasses: true,
      homeVisit: mode === 'offline',
      onlineClasses: mode === 'online',
      isAvailable: true,
    },
    {
      id: 'inst_3',
      name: 'Anjali Patel',
      title: 'Power Yoga Specialist',
      description: 'Dynamic power yoga instructor focusing on strength, flexibility, and weight loss. High-energy sessions for fitness enthusiasts.',
      price: 900,
      originalPrice: 1200,
      icon: 'fire',
      badge: { type: 'new', text: 'New' },
      stats: [
        { icon: 'star', value: '4.7', label: 'Rating' },
        { icon: 'account-group', value: '200+', label: 'Students' },
        { icon: 'calendar-check', value: '800+', label: 'Classes' },
      ],
      features: ['Power Yoga', 'Strength Training', 'Weight Loss', 'High Energy'],
      rating: 4.7,
      experience: 4,
      totalStudents: 200,
      totalClasses: 800,
      specialization: ['Power Yoga', 'Strength Training', 'Weight Loss'],
      languages: ['English', 'Gujarati'],
      bio: 'Energetic instructor helping students build strength, flexibility, and confidence through dynamic power yoga sessions.',
      hourlyRate: 900,
      groupClasses: true,
      oneOnOneClasses: true,
      homeVisit: mode === 'offline',
      onlineClasses: mode === 'online',
      isAvailable: true,
    },
    {
      id: 'inst_4',
      name: 'Dr. Meera Singh',
      title: 'Therapeutic Yoga Expert',
      description: 'Medical professional and yoga therapist specializing in injury recovery, chronic pain management, and rehabilitation.',
      price: 1200,
      originalPrice: 1500,
      icon: 'heart-pulse',
      badge: { type: 'recommended', text: 'Expert' },
      stats: [
        { icon: 'star', value: '4.9', label: 'Rating' },
        { icon: 'account-group', value: '150+', label: 'Students' },
        { icon: 'calendar-check', value: '1000+', label: 'Classes' },
      ],
      features: ['Therapeutic Yoga', 'Injury Recovery', 'Pain Management', 'Rehabilitation'],
      rating: 4.9,
      experience: 12,
      totalStudents: 150,
      totalClasses: 1000,
      specialization: ['Therapeutic Yoga', 'Injury Recovery', 'Pain Management'],
      languages: ['English', 'Hindi', 'Punjabi'],
      bio: 'Medical professional combining traditional yoga with modern therapeutic techniques for healing and wellness.',
      hourlyRate: 1200,
      groupClasses: false,
      oneOnOneClasses: true,
      homeVisit: mode === 'offline',
      onlineClasses: mode === 'online',
      isAvailable: true,
    },
  ];

  useEffect(() => {
    loadInstructors();
  }, [mode, location]);

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter instructors based on mode
      const filteredInstructors = mockInstructors.filter(instructor => {
        if (mode === 'online') {
          return instructor.onlineClasses;
        } else {
          return instructor.homeVisit || instructor.groupClasses;
        }
      });
      
      setInstructors(filteredInstructors);
    } catch (error) {
      console.error('Error loading instructors:', error);
      Alert.alert('Error', 'Failed to load yoga instructors');
    } finally {
      setLoading(false);
    }
  }, [mode, location]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInstructors();
    setRefreshing(false);
  }, [loadInstructors]);

  const handleInstructorPress = (instructor: YogaInstructor) => {
    console.log('Selected instructor:', instructor.name);
    
    // Navigate directly to booking confirmation with instructor details
    navigation.navigate(ROUTES.BOOKING_CONFIRMATION as never, {
      instructor,
      mode,
      location,
      category: 'yoga',
      categoryName: 'Yoga Classes',
      categoryIcon: 'yoga',
      categoryColor: colors.primaryGreen,
    } as never);
  };

  const sortInstructors = (instructors: YogaInstructor[]) => {
    switch (selectedSort) {
      case 'popular':
        return [...instructors].sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
      case 'price_low':
        return [...instructors].sort((a, b) => a.price - b.price);
      case 'price_high':
        return [...instructors].sort((a, b) => b.price - a.price);
      case 'rating':
        return [...instructors].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return instructors;
    }
  };

  const filterInstructors = (instructors: YogaInstructor[]) => {
    if (!searchQuery.trim()) return instructors;
    
    const query = searchQuery.toLowerCase();
    return instructors.filter(instructor =>
      instructor.name.toLowerCase().includes(query) ||
      instructor.title.toLowerCase().includes(query) ||
      instructor.description.toLowerCase().includes(query) ||
      instructor.specialization?.some(spec => spec.toLowerCase().includes(query))
    );
  };

  const renderItem = ({ item, index }: { item: YogaInstructor; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)}>
      <YogaCard
        title={item.name}
        subtitle={item.title}
        description={item.description}
        price={item.price}
        originalPrice={item.originalPrice}
        icon={item.icon}
        badge={item.badge}
        stats={item.stats}
        features={item.features}
        variant="instructor"
        onPress={() => handleInstructorPress(item)}
      />
    </Animated.View>
  );

  const renderSortButton = (sort: typeof selectedSort, label: string, icon: string) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        selectedSort === sort && styles.sortButtonActive
      ]}
      onPress={() => setSelectedSort(sort)}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={16}
        color={selectedSort === sort ? colors.offWhite : colors.secondaryText}
      />
      <Text style={[
        styles.sortButtonText,
        selectedSort === sort && styles.sortButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="yoga" size={64} color={colors.secondaryText} />
      <Text style={styles.emptyStateTitle}>No Instructors Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  const filteredAndSortedInstructors = sortInstructors(filterInstructors(instructors));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.offWhite} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Yoga Classes</Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'online' ? 'Online Classes' : 'In-Person Classes'}
            {location?.city && ` • ${location.city}`}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search instructors..."
            placeholderTextColor={colors.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close" size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderSortButton('popular', 'Popular', 'fire')}
          {renderSortButton('rating', 'Top Rated', 'star')}
          {renderSortButton('price_low', 'Price Low', 'trending-down')}
          {renderSortButton('price_high', 'Price High', 'trending-up')}
        </ScrollView>
      </View>

      {/* Instructors List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading instructors...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedInstructors}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primaryGreen]}
              tintColor={colors.primaryGreen}
            />
          }
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: CARD_MARGIN }} />}
        />
      )}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.primaryText,
  },
  sortContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.offWhite,
    gap: 4,
  },
  sortButtonActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.primaryGreen,
    fontWeight: '600',
  },
  sortButtonTextActive: {
    color: colors.offWhite,
  },
  listContainer: {
    paddingHorizontal: CARD_MARGIN,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.secondaryText,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default YogaSelectionScreen;
