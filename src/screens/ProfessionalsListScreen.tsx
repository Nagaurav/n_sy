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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services';
import { theme } from '../theme';
import Card from '../components/Card';
import CollapsibleCard from '../components/CollapsibleCard';
import {
  Professional,
  ProfessionalsResponse,
  ProfessionalFilters,
  FilterModalState,
} from '../types/booking';

const { width } = Dimensions.get('window');

interface RouteParams {
  bookingType?: 'class' | 'consultation';
  categoryId?: string;
  searchQuery?: string;
  categoryName?: string;
}

type ProfessionalsListScreenNavigationProp =
  StackNavigationProp<HomeStackParamList>;

const ProfessionalsListScreen = () => {
  const navigation = useNavigation<ProfessionalsListScreenNavigationProp>();
  const route = useRoute();
  const { categoryId, searchQuery, categoryName, bookingType } =
    (route.params as RouteParams) || {};
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
        roleFilter = 'doctor';
      } else if (bookingType === 'class') {
        roleFilter = 'yoga_teacher';
      }

      const filterParams: ProfessionalFilters = {
        page: pageNum,
        limit: 10,
        search_query: currentSearchQuery || searchQuery,
        category_id: categoryId,
        is_online: filters.is_online,
        gender: filters.gender,
        sort_by: filters.sort_by,
        city: filters.city,
        min_price: filters.min_price,
        max_price: filters.max_price,
        role: roleFilter,
      };

      console.log('📋 [ProfessionalsList] Fetching with bookingType:', bookingType, 'roleFilter:', roleFilter);
      console.log('📋 [ProfessionalsList] Filter params:', filterParams);

      const response = await apiService.searchProfessionalsWithFilters(filterParams);

      if (response.success && response.data?.data?.professionals) {
        const newProfessionals = response.data.data.professionals;
        setProfessionals(resetList ? newProfessionals : [...professionals, ...newProfessionals]);
        setHasMoreData(newProfessionals.length === 10);
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
    // Simply refetch with current filters and search query
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
        min_price: filters.min_price,
        max_price: filters.max_price,
        role: filters.role,
      });

      if (response.success && response.data?.data?.professionals) {
        setProfessionals(response.data.data.professionals);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search professionals');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfessional = ({ item }: { item: Professional }) => {
    const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || 'Professional';
    const speciality = item.speciality_new?.name || item.specialization || 'Yoga Professional';
    const location = item.city && item.state ? `${item.city}, ${item.state}` : 'Location not specified';
    const rating = item.rating ?? 0;
    const price = item.min_session_price;
    const profileImage = item.profile_picture_url || item.profileImage;
    const about = item.description;

    return (
      <Card style={styles.professionalCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ProfessionalProfile', {
              professionalId: item.professional_id?.toString() || item._id || '',
            })
          }
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <Image
            source={profileImage ? { uri: profileImage } : { uri: 'https://via.placeholder.com/64' }}
            style={styles.avatarImage}
          />
          <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Text style={styles.professionalName}>{fullName}</Text>
            {item.is_verified && (
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
          <Text style={styles.specialization}>{speciality}</Text>
          <Text style={styles.locationText}>{location}</Text>

          {/* Rating & Price Row */}
          <View style={styles.ratingPriceRow}>
            <View style={styles.ratingRow}>
              {rating > 0 && (
                <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
              )}
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={14}
                  color={theme.colors.accent}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            {typeof price === 'number' && (
              <Text style={styles.priceText}>₹{price}</Text>
            )}
          </View>

            {about ? (
              <CollapsibleCard
                title="About"
                content={<Text style={styles.aboutText}>{about}</Text>}
                containerStyle={{ marginTop: theme.spacing.s }}
              />
            ) : null}

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.bookButton}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ProfessionalProfile', {
                    professionalId: item.professional_id?.toString() || item._id || '',
                  })
                }
              >
                <Text style={styles.bookButtonText}>Book Now</Text>
              </TouchableOpacity>
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
      <Ionicons name="search-outline" size={48} color="#9CA3AF" />
      <Text style={styles.emptyText}>No professionals found</Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Ionicons name="refresh" size={16} color="#1E88E5" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName || 'Professionals'}</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search professionals..."
          value={currentSearchQuery}
          onChangeText={setCurrentSearchQuery}
          onSubmitEditing={({ nativeEvent }) => handleSearch(nativeEvent.text)}
        />
        {currentSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setCurrentSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters toggle and panel */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(!showFilterModal)}
        >
          <Ionicons name="options-outline" size={18} color="#1E88E5" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {showFilterModal && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>City</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Enter city"
            value={filters.city || ''}
            onChangeText={(text) => setFilters((prev) => ({ ...prev, city: text }))}
          />

          <Text style={styles.filterLabel}>Role</Text>
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
              <Text style={styles.filterApplyText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={professionals}
          renderItem={renderProfessional}
          keyExtractor={(item) =>
            item.professional_id?.toString() || item._id || Math.random().toString()
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E88E5']} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginRight: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: theme.colors.background.surface,
  },
  filterButtonText: {
    marginLeft: 4,
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPanel: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
    marginTop: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  priceRowFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceColumn: {
    flex: 1,
    marginRight: 8,
  },
  roleChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginRight: 8,
    marginBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  roleChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background.primary,
  },
  roleChipText: {
    fontSize: 13,
    color: '#4B5563',
  },
  roleChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  filterActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  filterResetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  filterResetText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterApplyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  filterApplyText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, color: '#111827' },
  professionalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.card,
  },
  avatarImage: { width: 64, height: 64, borderRadius: 32, marginRight: 12 },
  professionalName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  specialization: { fontSize: 14, color: '#6B7280' },
  locationText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  aboutText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  ratingPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    marginRight: 4,
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  actionsRow: {
    marginTop: theme.spacing.s,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  bookButton: {
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
  },
  bookButtonText: {
    color: theme.colors.background.surface,
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingMoreContainer: { padding: 12, flexDirection: 'row', justifyContent: 'center' },
  loadingMoreText: { marginLeft: 8, color: '#6B7280' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { marginTop: 8, color: '#1F2937', fontSize: 16 },
  refreshButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderColor: '#1E88E5',
    borderWidth: 1,
  },
  refreshButtonText: { marginLeft: 6, color: '#1E88E5', fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  errorText: { marginTop: 8, color: '#EF4444', textAlign: 'center' },
});

export default ProfessionalsListScreen;
