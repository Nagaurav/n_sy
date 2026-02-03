import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services';
import type { ProfessionalFilters, FilterModalState } from '../types/booking';
import type { Professional } from '../types/professional';

// Import modern components
import {
  ModernProfessionalCard,
  ModernProfessionalsHeader,
  ModernSearchBar,
  ModernFilterChips,
  ModernEmptyState,
} from '../components/professionals';

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
  const [scrollY] = useState(new Animated.Value(0));

  // Refs
  const searchInputRef = useRef<any>(null);

  // Filters
  const [filters, setFilters] = useState<FilterModalState>({
    category_id: categoryId,
    is_online: undefined,
    min_price: 0,
    max_price: 1000,
    gender: undefined,
    sort_by: 'rating',
    city: undefined,
    role: undefined,
  });

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.city) count++;
    if (filters.role) count++;
    if (filters.min_price > 0) count++;
    if (filters.max_price < 1000) count++;
    if (filters.gender) count++;
    return count;
  };

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
        roleFilter = filters.role;
      } else if (bookingType === 'class') {
        roleFilter = 'yoga_teacher';
      }

      const filterParams: ProfessionalFilters = {
        page: pageNum,
        limit: 10,
        search_query: currentSearchQuery || undefined,
        category_id: categoryId,
        is_online: filters.is_online,
        gender: filters.gender,
        sort_by: filters.sort_by,
        city: filters.city,
        min_price: undefined,
        max_price: undefined,
        role: bookingType === 'class' ? 'yoga_teacher' : filters.role,
      };

      console.log('[ModernProfessionalsList] Fetching with bookingType:', bookingType);
      console.log('[ModernProfessionalsList] Filter params:', filterParams);

      const response = await apiService.searchProfessionalsWithFilters(filterParams);

      const rawData = response.data?.data;
      const professionalsList = Array.isArray(rawData) ? rawData : rawData?.professionals || [];

      // Client-side Price Filtering
      let filteredList = professionalsList;
      if (filters.min_price > 0 || filters.max_price < 1000) {
        filteredList = professionalsList.filter((pro: any) => {
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfessionals(true, 1).finally(() => setRefreshing(false));
  }, []);

  const handleSearch = (query: string) => {
    setCurrentSearchQuery(query);
    if (!query.trim()) {
      fetchProfessionals();
      return;
    }
    fetchProfessionals(true, 1);
  };

  const handleFilterPress = (filterType: 'all' | 'online' | 'inPerson' | 'more') => {
    switch (filterType) {
      case 'all':
        setFilters(prev => ({ ...prev, is_online: undefined }));
        break;
      case 'online':
        setFilters(prev => ({ 
          ...prev, 
          is_online: prev.is_online === true ? undefined : true 
        }));
        break;
      case 'inPerson':
        setFilters(prev => ({ 
          ...prev, 
          is_online: prev.is_online === false ? undefined : false 
        }));
        break;
      case 'more':
        // TODO: Show filter modal/sheet
        console.log('Show more filters');
        break;
    }
    fetchProfessionals(true, 1);
  };

  const handleProfessionalPress = (professional: Professional) => {
    navigation.navigate('ProfessionalProfile', {
      professionalId: professional.professional_id?.toString() || professional.id?.toString() || '',
    });
  };

  const handleBookPress = (professional: Professional) => {
    navigation.navigate('ProfessionalProfile', {
      professionalId: professional.professional_id?.toString() || professional.id?.toString() || '',
    });
  };

  const handleProfilePress = (professional: Professional) => {
    navigation.navigate('ProfessionalProfile', {
      professionalId: professional.professional_id?.toString() || professional.id?.toString() || '',
    });
  };

  const handleClearSearch = () => {
    setCurrentSearchQuery('');
    fetchProfessionals();
  };

  const renderProfessionalItem = ({ item }: { item: Professional }) => (
    <ModernProfessionalCard
      professional={item}
      onPress={handleProfessionalPress}
      onBookPress={handleBookPress}
      onProfilePress={handleProfilePress}
    />
  );

  const renderFooter = () =>
    isLoadingMore ? (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingMoreText}>Loading more professionals...</Text>
      </View>
    ) : null;

  const renderEmptyList = () => (
    <ModernEmptyState
      searchQuery={currentSearchQuery}
      onRefresh={onRefresh}
      onClearSearch={handleClearSearch}
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernProfessionalsHeader
          title={categoryName || 'PROFESSIONALS'}
          onBackPress={() => navigation.goBack()}
          showFavorite={false}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Finding professionals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ModernProfessionalsHeader
          title={categoryName || 'PROFESSIONALS'}
          onBackPress={() => navigation.goBack()}
          showFavorite={false}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ModernProfessionalsHeader
        title={categoryName || 'PROFESSIONALS'}
        onBackPress={() => navigation.goBack()}
        showFavorite={false}
        showSearch={true}
        onSearchPress={() => {
          // Focus on the search bar
          searchInputRef.current?.focus();
        }}
      />

      {/* Search Bar */}
      <ModernSearchBar
        ref={searchInputRef}
        value={currentSearchQuery}
        onChangeText={setCurrentSearchQuery}
        onSubmit={handleSearch}
      />

      {/* Filter Chips */}
      <ModernFilterChips
        filters={{
          isOnline: filters.is_online,
          hasActiveFilters: getActiveFilterCount() > 0,
        }}
        onFilterPress={handleFilterPress}
        onMoreFiltersPress={() => console.log('More filters')}
        activeCount={getActiveFilterCount()}
      />

      {/* Professionals List */}
      <Animated.FlatList
        data={professionals}
        renderItem={renderProfessionalItem}
        keyExtractor={(item) => item.id?.toString() || item.professional_id?.toString() || ''}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingBottom: theme.spacing.xl,
  },
  loadingMoreContainer: {
    padding: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreText: {
    marginLeft: theme.spacing.s,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
});

export default ProfessionalsListScreen;
