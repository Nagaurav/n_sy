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
  TextInput,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { YogaCard } from '../components/yoga';
import { yogaClassService, type YogaClass } from '../services/yogaClassService';

// Define navigation types
type RootStackParamList = {
  ProfessionalProfile: {
    professionalId: string;
    yogaClass: YogaClass;
    mode: 'online' | 'offline';
    location?: {
      city: string;
      latitude: number;
      longitude: number;
    };
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };
  // Add other screens as needed
};

type YogaSelectionScreenRouteProp = RouteProp<{ params: RouteParams }, 'params'>;
type YogaSelectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProfessionalProfile'>;

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;

interface RouteParams {
  mode: 'online' | 'offline';
  location?: {
    city: string;
    latitude: number;
    longitude: number;
  };
  [key: string]: any; // For any additional params
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
  const navigation = useNavigation<YogaSelectionScreenNavigationProp>();
  const route = useRoute<YogaSelectionScreenRouteProp>();
  const { mode, location } = route.params;

  const [yogaClasses, setYogaClasses] = useState<YogaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSort, setSelectedSort] = useState<'popular' | 'price_low' | 'price_high' | 'rating'>('popular');
  const [searchQuery, setSearchQuery] = useState('');

  const loadInstructors = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: 1,
        limit: 20,
        city: location?.city,
        group_online: mode === 'online',
        one_to_one_online: mode === 'online',
        group_offline: mode === 'offline',
        one_to_one_offline: mode === 'offline',
        home_visit: mode === 'offline',
      };

      console.log("Fetching yoga classes with filters:", filters);
      const response = await yogaClassService.getYogaClasses(filters);

      if (response && response.data) {
        setYogaClasses(response.data);
      } else {
        Alert.alert('Error', 'Failed to load yoga classes');
      }
    } catch (error: any) {
      console.error('Error loading yoga classes:', error);
      Alert.alert('Error', error.message || 'Failed to load yoga classes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [mode, location]);

  useEffect(() => {
    loadInstructors();
  }, [loadInstructors]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInstructors();
  }, [loadInstructors]);

  const handleClassPress = (yogaClass: YogaClass) => {
    console.log('Selected yoga class:', yogaClass.title);
    navigation.navigate('ProfessionalProfile', {
      professionalId: yogaClass.professional_id.toString(),
      yogaClass: yogaClass,
      mode,
      location,
      category: 'yoga',
      categoryName: 'Yoga Classes',
      categoryIcon: 'yoga',
      categoryColor: colors.primaryGreen,
    });
  };

  const sortClasses = (classes: YogaClass[]) => {
    switch (selectedSort) {
      case 'popular':
        return [...classes].sort((a, b) => 
          (a.effective_price || a.price_group_online || 0) - 
          (b.effective_price || b.price_group_online || 0)
        );
      case 'price_low':
        return [...classes].sort((a, b) => 
          (a.effective_price || a.price_group_online || 0) - 
          (b.effective_price || b.price_group_online || 0)
        );
      case 'price_high':
        return [...classes].sort((a, b) => 
          (b.effective_price || b.price_group_online || 0) - 
          (a.effective_price || a.price_group_online || 0)
        );
      case 'rating':
        return [...classes].sort((a, b) => 
          (a.effective_price || a.price_group_online || 0) - 
          (b.effective_price || b.price_group_online || 0)
        );
      default:
        return classes;
    }
  };

  const filterClasses = (classes: YogaClass[]) => {
    if (!searchQuery.trim()) return classes;
    const query = searchQuery.toLowerCase();
    return classes.filter(cls =>
      cls.title.toLowerCase().includes(query) ||
      cls.description.toLowerCase().includes(query) ||
      (cls.disease?.toLowerCase() || '').includes(query)
    );
  };

  const renderItem = ({ item, index }: { item: YogaClass; index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 100)}>
      <YogaCard
        title={item.title}
        description={item.description}
        price={item.effective_price || item.price_group_online || 0}
        originalPrice={item.price_one_to_one_online || undefined}
        icon="yoga"
        badge={item.is_disease_specific ? { type: 'recommended', text: item.disease || '' } : { type: 'popular', text: 'Popular' }}
        stats={[
          { icon: 'calendar', value: yogaClassService.formatDuration(item.duration), label: 'Duration' },
          { icon: 'account-group', value: `${item.max_participants_online || 'N/A'}`, label: 'Slots' },
        ]}
        features={yogaClassService.getSessionTypesAvailable(item)}
        variant="package"
        onPress={() => handleClassPress(item)}
      />
    </Animated.View>
  );

  const renderSortButton = (sort: typeof selectedSort, label: string, icon: string) => (
    <TouchableOpacity
      key={sort}
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
      <Text style={styles.emptyStateTitle}>No Classes Found</Text>
      <Text style={styles.emptyStateSubtitle}>
        Try adjusting your search or filters
      </Text>
    </View>
  );

  if (loading && yogaClasses.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primaryGreen} />
        <Text style={styles.loadingText}>Loading yoga classes...</Text>
      </View>
    );
  }

  const filteredAndSortedClasses = sortClasses(filterClasses(yogaClasses));

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
          <Text style={styles.headerTitle}>Available Yoga Classes</Text>
          <Text style={styles.headerSubtitle}>
            {mode === 'online' ? 'Online' : 'In-person'} classes in {location?.city || 'your area'}
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
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
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScrollContainer}
        >
          {renderSortButton('popular', 'Popular', 'fire')}
          {renderSortButton('rating', 'Top Rated', 'star')}
          {renderSortButton('price_low', 'Price Low', 'trending-down')}
          {renderSortButton('price_high', 'Price High', 'trending-up')}
        </ScrollView>
      </View>

      {/* Classes List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading yoga classes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedClasses}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
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
  sortScrollContainer: {
    paddingRight: 20,
    gap: 8,
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
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});

export default YogaSelectionScreen;
