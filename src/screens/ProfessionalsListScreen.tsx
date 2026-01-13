import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Image,
  StatusBar,
  RefreshControl,
  Dimensions,
  Animated,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services';
import type { ProfessionalFilters, ProfessionalsResponse, FilterModalState } from '../types/booking';
import type { Professional } from '../types/professional';

import Card from '../components/Card';
import CollapsibleCard from '../components/CollapsibleCard';

// Simple inline SVG avatar fallback to avoid missing local asset
const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  bookingType?: 'class' | 'consultation';
  categoryId?: string;
  searchQuery?: string;
  categoryName?: string;
}

type ProfessionalsListScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const ProfessionalsListScreen = () => {
  const navigation = useNavigation<ProfessionalsListScreenNavigationProp>();
  const route = useRoute();
  const { categoryId, searchQuery, categoryName, bookingType } = (route.params as RouteParams) || {};
  const { user } = useAuth();

  // State management
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery || '');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [scrollY] = useState(new Animated.Value(0));

  // Filters
  const [filters, setFilters] = useState<FilterModalState>({
    category_id: categoryId,
    is_online: undefined,
    min_price: 0,
    max_price: 1000,
    gender: undefined,
    sort_by: 'rating',
    city: undefined,
  });

  useEffect(() => {
    fetchProfessionals();
  }, [categoryId, searchQuery, bookingType]);

  const fetchProfessionals = async (resetList = true, pageNum = 1) => {
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    if (!userId) return;

    if (resetList) {
      setIsLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      // Determine role based on bookingType
      let roleFilter = filters.role;
      if (bookingType === 'consultation') {
        // Do NOT force 'doctor'. 
        // Leaving it undefined tells the backend: "Show me ALL valid professionals"
        // (Therapists, Nutritionists, Yoga Therapists, etc.)
        roleFilter = filters.role; 
      } else if (bookingType === 'class') {
        // Keep restricting Classes to Yoga Teachers only
        roleFilter = 'yoga_teacher';
      }

      const filterParams: ProfessionalFilters = {
        page: pageNum,
        limit: 10,
        search_query: undefined,
        category_id: undefined,
        is_online: filters.is_online,
        gender: filters.gender,
        sort_by: filters.sort_by,
        city: filters.city,
        
        // FRONTEND FIX 1: Send undefined to stop the Backend Crash
        min_price: undefined, 
        max_price: undefined, 
        
        // FRONTEND FIX 2: Ensure we don't send invalid roles like 'doctor'
        role: bookingType === 'class' ? 'yoga_teacher' : filters.role,
      };

      console.log(' [ProfessionalsList] Fetching with bookingType:', bookingType, 'roleFilter:', roleFilter);
      console.log(' [ProfessionalsList] Filter params:', filterParams);

      const response = await apiService.searchProfessionalsWithFilters(filterParams);

      // FRONTEND FIX 3: Correctly extract the array
      // The backend sends the array directly in response.data.data
      const rawData = response.data?.data;
      const professionalsList = Array.isArray(rawData) ? rawData : rawData?.professionals || [];

      // FRONTEND FIX 4: Client-side Price Filtering
      let filteredList = professionalsList;
      if (filters.min_price > 0 || filters.max_price < 1000) {
        filteredList = professionalsList.filter((pro: any) => {
          // Assuming you have a price field. If not, this part is tricky.
          // If price is missing from the API, you cannot filter by it.
          const proPrice = pro.price || 0; 
          return proPrice >= filters.min_price && proPrice <= filters.max_price;
        });
      }

      if (response.success) {
        setProfessionals(resetList ? filteredList : [...professionals, ...filteredList]);
        setHasMoreData(professionalsList.length === 10);
        setPage(pageNum);
      } else {
        setError(response.error || 'Failed to load professionals');
      }
    } catch (err) {
      console.error('Error fetching professionals:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData && !isLoading) {
      fetchProfessionals(false, page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfessionals(true, 1).finally(() => setRefreshing(false));
  };

  const handleApplyFilters = () => {
    fetchProfessionals(true, 1);
    setShowFilterModal(false);
  };

  const handleResetFilters = () => {
    setFilters({
      category_id: categoryId,
      is_online: undefined,
      min_price: 0,
      max_price: 1000,
      gender: undefined,
      sort_by: 'rating',
      city: undefined,
      role: undefined,
    });
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchProfessionals();
      return;
    }
    const trimmed = query.trim();
    setCurrentSearchQuery(trimmed);
    setIsLoading(true);
    try {
      const response = await apiService.searchProfessionalsWithFilters({
        search_query: trimmed,
        page: 1,
        limit: 10,
        category_id: categoryId,
        is_online: filters.is_online,
        gender: filters.gender,
        sort_by: filters.sort_by,
        city: filters.city,
        min_price: undefined,
        max_price: undefined,
        role: bookingType === 'class' ? 'yoga_teacher' : filters.role,
      });

      const rawData = response.data?.data;
      const professionalsList = Array.isArray(rawData) ? rawData : rawData?.professionals || [];

      if (response.success) {
        setProfessionals(professionalsList);
        setHasMoreData(professionalsList.length === 10);
        setPage(1);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfessionalItem = ({ item }: { item: Professional }) => {
    const fullName = `${item.first_name} ${item.last_name}`.trim() || 'Unknown Professional';
    const speciality = item.specialization || item.speciality || 'General Practitioner';
    const location = [item.city, item.state].filter(Boolean).join(', ') || 'Location not specified';
    const rating = item.rating || 0;
    const about = item.about;
    const isVerified = item.is_verified;
    const avatar = item.profile_picture;
    const isAvailable = item.is_available;

    return (
      <Card style={styles.professionalCard}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() =>
            navigation.navigate('ProfessionalProfile', {
              professionalId: item.professional_id?.toString() || item.id?.toString() || '',
            })
          }
        >
          <View style={styles.cardContent}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Image
                source={
                  avatar
                    ? { uri: avatar }
                    : { uri: DEFAULT_AVATAR }
                }
                style={styles.avatarImage}
              />
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                </View>
              )}
              {isAvailable && (
                <View style={styles.availableBadge}>
                  <Text style={styles.availableText}>Available</Text>
                </View>
              )}
            </View>

            {/* Content Section */}
            <View style={styles.contentSection}>
              {/* Header with name and experience */}
              <View style={styles.headerRow}>
                <Text style={styles.professionalName} numberOfLines={1}>
                  {fullName}
                </Text>
                {item.experience_years && (
                  <View style={styles.experienceBadge}>
                    <Text style={styles.experienceText}>{item.experience_years}y</Text>
                  </View>
                )}
              </View>

              {/* Specialization */}
              <Text style={styles.specialization} numberOfLines={1}>
                {speciality}
              </Text>

              {/* Location with icon */}
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>

              {/* Rating and Price Row */}
              <View style={styles.statsRow}>
                <View style={styles.ratingContainer}>
                  {rating > 0 ? (
                    <>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                      {item.review_count && (
                        <Text style={styles.reviewCount}>({item.review_count})</Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.noRatingText}>New Professional</Text>
                  )}
                </View>
              </View>

              {/* Languages if available */}
              {item.languages && item.languages.length > 0 && (
                <View style={styles.languagesRow}>
                  <Ionicons name="language-outline" size={12} color="#6B7280" />
                  <Text style={styles.languagesText} numberOfLines={1}>
                    {item.languages.slice(0, 3).join(', ')}
                    {item.languages.length > 3 && ` +${item.languages.length - 3}`}
                  </Text>
                </View>
              )}

              {/* About section */}
              {about && (
                <Text style={styles.aboutText} numberOfLines={2}>
                  {about}
                </Text>
              )}

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() =>
                    navigation.navigate('ProfessionalProfile', {
                      professionalId: item.professional_id?.toString() || item.id?.toString() || '',
                    })
                  }
                >
                  <Ionicons name="person-outline" size={16} color="#1E88E5" />
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() =>
                    navigation.navigate('ProfessionalProfile', {
                      professionalId: item.professional_id?.toString() || item.id?.toString() || '',
                    })
                  }
                >
                  <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.bookButtonText}>Book Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderFooter = () =>
    isLoadingMore ? (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#1E88E5" />
        <Text style={styles.loadingMoreText}>Loading more professionals...</Text>
      </View>
    ) : null;

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="search-outline" size={64} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>No professionals found</Text>
        <Text style={styles.emptySubtitle}>
          {currentSearchQuery 
            ? `No results for "${currentSearchQuery}"`
            : 'Try adjusting your filters or search terms'
          }
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{categoryName || 'Professionals'}</Text>
          <TouchableOpacity style={styles.headerIconButton}>
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, specialization, location..."
            value={currentSearchQuery}
            onChangeText={setCurrentSearchQuery}
            onSubmitEditing={({ nativeEvent }) => handleSearch(nativeEvent.text)}
            placeholderTextColor="#9CA3AF"
          />
          {currentSearchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={() => setCurrentSearchQuery('')}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, showFilterModal && styles.filterChipActive]}
            onPress={() => setShowFilterModal(!showFilterModal)}
          >
            <Ionicons name="options-outline" size={16} color={showFilterModal ? "#FFFFFF" : "#6B7280"} />
            <Text style={[styles.filterChipText, showFilterModal && styles.filterChipTextActive]}>
              Filters
            </Text>
            {(filters.city || filters.role || filters.min_price > 0 || filters.max_price < 1000) && (
              <View style={styles.filterActiveDot} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.is_online === true && styles.filterChipActive]}
            onPress={() => setFilters(prev => ({ ...prev, is_online: prev.is_online === true ? undefined : true }))}
          >
            <Ionicons name="videocam-outline" size={16} color={filters.is_online === true ? "#FFFFFF" : "#6B7280"} />
            <Text style={[styles.filterChipText, filters.is_online === true && styles.filterChipTextActive]}>
              Online
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filters.is_online === false && styles.filterChipActive]}
            onPress={() => setFilters(prev => ({ ...prev, is_online: prev.is_online === false ? undefined : false }))}
          >
            <Ionicons name="location-outline" size={16} color={filters.is_online === false ? "#FFFFFF" : "#6B7280"} />
            <Text style={[styles.filterChipText, filters.is_online === false && styles.filterChipTextActive]}>
              In-Person
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Filter Panel */}
      {showFilterModal && (
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelHeader}>
            <Text style={styles.filterPanelTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.filterLabel}>City</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Enter city"
            value={filters.city || ''}
            onChangeText={(text) => setFilters((prev) => ({ ...prev, city: text }))}
          />

          <Text style={styles.filterLabel}>Professional Type</Text>
          <View style={styles.roleChipsRow}>
            {[
              { label: 'All', value: undefined },
              { label: 'Yoga Teacher', value: 'yoga_teacher' },
              { label: 'Nutritionist', value: 'nutritionist' },
              { label: 'Therapist', value: 'therapist' },
            ].map((option) => {
              const isActive = filters.role === option.value || (!filters.role && option.value === undefined);
              return (
                <TouchableOpacity
                  key={option.label}
                  style={[styles.roleChip, isActive && styles.roleChipActive]}
                  onPress={() =>
                    setFilters((prev) => ({
                      ...prev,
                      role: option.value,
                    }))
                  }
                >
                  <Text style={[styles.roleChipText, isActive && styles.roleChipTextActive]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.priceRowFilters}>
            <View style={styles.priceColumn}>
              <Text style={styles.filterLabel}>Min Price</Text>
              <TextInput
                style={styles.filterInput}
                keyboardType="numeric"
                placeholder="0"
                value={String(filters.min_price ?? 0)}
                onChangeText={(text) =>
                  setFilters((prev) => ({
                    ...prev,
                    min_price: Number(text) || 0,
                  }))
                }
              />
            </View>
            <View style={styles.priceColumn}>
              <Text style={styles.filterLabel}>Max Price</Text>
              <TextInput
                style={styles.filterInput}
                keyboardType="numeric"
                placeholder="1000"
                value={String(filters.max_price ?? 1000)}
                onChangeText={(text) =>
                  setFilters((prev) => ({
                    ...prev,
                    max_price: Number(text) || 0,
                  }))
                }
              />
            </View>
          </View>

          <View style={styles.filterActionsRow}>
            <TouchableOpacity style={styles.filterResetButton} onPress={handleResetFilters}>
              <Text style={styles.filterResetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterApplyButton} onPress={handleApplyFilters}>
              <Text style={styles.filterApplyText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Finding professionals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          </View>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.FlatList
          data={professionals}
          renderItem={renderProfessionalItem}
          keyExtractor={(item) => item.id?.toString() || item.professional_id?.toString() || ''}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 60,
    paddingBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.float,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.background.white,
    flex: 1,
    textAlign: 'center',
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSection: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.s,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    ...theme.shadows.card,
  },
  searchIcon: {
    marginRight: theme.spacing.m,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    height: 20,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  filterSection: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.s,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.surface,
    marginRight: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
    ...theme.shadows.card,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    marginLeft: theme.spacing.s,
    ...theme.typography.small,
    fontWeight: '500',
    color: theme.colors.text.secondary,
  },
  filterChipTextActive: {
    color: theme.colors.background.white,
  },
  filterActiveDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
  },
  filterPanel: {
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.background.surface,
    ...theme.shadows.float,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filterPanelTitle: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
  },
  filterLabel: {
    ...theme.typography.small,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    ...theme.typography.body,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.primary,
  },
  priceRowFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceColumn: {
    flex: 1,
    marginRight: 12,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  roleChipActive: {
    borderColor: '#1E88E5',
    backgroundColor: '#1E88E5',
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterResetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterResetText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterApplyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E88E5',
  },
  filterApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  professionalCard: {
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  cardContent: {
    padding: theme.spacing.m,
  },
  avatarSection: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 20,
    backgroundColor: theme.colors.feedback.success,
    borderRadius: theme.borderRadius.m,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.white,
  },
  availableBadge: {
    position: 'absolute',
    top: 0,
    right: 20,
    backgroundColor: theme.colors.feedback.success,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.m,
  },
  availableText: {
    ...theme.typography.caption,
    color: theme.colors.background.white,
    fontWeight: '600',
  },
  contentSection: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  professionalName: {
    ...theme.typography.h3,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  experienceBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.s,
  },
  experienceText: {
    ...theme.typography.caption,
    color: theme.colors.background.white,
    fontWeight: '600',
  },
  specialization: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  locationText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.xs,
  },
  reviewCount: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  noRatingText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  priceLabel: {
    ...theme.typography.caption,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  languagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  languagesText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.s,
    flex: 1,
  },
  aboutText: {
    ...theme.typography.small,
    color: theme.colors.text.secondary,
    lineHeight: 18,
    marginBottom: theme.spacing.m,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  viewProfileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background.surface,
  },
  viewProfileText: {
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: theme.spacing.s,
  },
  bookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
  },
  bookButtonText: {
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.background.white,
    marginLeft: theme.spacing.s,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.m,
    ...theme.typography.body,
    color: theme.colors.text.secondary,
  },
  loadingMoreContainer: {
    padding: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreText: {
    marginLeft: theme.spacing.s,
    ...theme.typography.small,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    ...theme.typography.h2,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  emptySubtitle: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.l,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
  },
  refreshButtonText: {
    marginLeft: theme.spacing.s,
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.background.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorText: {
    ...theme.typography.body,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    fontWeight: '500',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
  },
  retryButtonText: {
    marginLeft: theme.spacing.s,
    ...theme.typography.small,
    fontWeight: '600',
    color: theme.colors.background.white,
  },
});

export default ProfessionalsListScreen;
