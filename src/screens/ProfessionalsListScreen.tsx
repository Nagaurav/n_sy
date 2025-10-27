import React, { useState, useEffect, useCallback } from 'react';
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
import type { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Professional, ProfessionalsResponse, ProfessionalFilters, FilterModalState } from '../types/booking';

const { width } = Dimensions.get('window');

interface RouteParams {
  categoryId?: string;
  searchQuery?: string;
  categoryName?: string;
}

type ProfessionalsListScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const ProfessionalsListScreen = () => {
  // Add missing state
  const [showFilterModal, setShowFilterModal] = useState(false);
  
  // Add missing function implementations
  const handleLoadMore = () => {
    if (!isLoadingMore && hasMoreData && !isLoading) {
      fetchProfessionals(false, page + 1);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfessionals(true, 1).finally(() => setRefreshing(false));
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View 
        style={styles.loadingMoreContainer}
        accessibilityLabel="Loading more professionals"
      >
        <ActivityIndicator 
          size="small" 
          color="#1E88E5" 
          accessibilityLabel="Loading spinner"
        />
        <Text style={styles.loadingMoreText}>Loading more professionals...</Text>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="search-outline" 
        size={48} 
        color="#9CA3AF" 
        accessibilityLabel="No results"
      />
      <Text style={styles.emptyText}>
        {currentSearchQuery || filters.category_id 
          ? 'No matching professionals found' 
          : 'No professionals available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {currentSearchQuery || filters.category_id
          ? 'Try adjusting your search or filters'
          : 'Please check back later or try a different category'}
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
        accessibilityLabel="Refresh list"
      >
        <Ionicons name="refresh" size={16} color="#1E88E5" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
  const navigation = useNavigation<ProfessionalsListScreenNavigationProp>();
  const route = useRoute();
  const { categoryId, searchQuery, categoryName } = (route.params as RouteParams) || {};
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

  // Filter state
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
  }, [categoryId, searchQuery]);

  const fetchProfessionals = async (resetList = true, pageNum = 1) => {
    if (!user?._id) return;

    if (resetList) {
      setIsLoading(true);
      setPage(1);
    } else {
      setIsLoadingMore(true);
    }
    setError('');

    try {
      // Build filter parameters
      const filterParams: ProfessionalFilters = {
        page: pageNum,
        limit: 10,
        ...(searchQuery && { search_query: searchQuery }),
        ...(categoryId && { category_id: categoryId }),
        ...(filters.is_online !== undefined && { is_online: filters.is_online }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.city && { city: filters.city }),
      };

      console.log('🔍 Fetching professionals with filters:', filterParams);

      // Use the enhanced API call with filters
      const response = await apiService.get<ProfessionalsResponse>('/user/professional/getProfessional', { 
        params: filterParams 
      });

      if (response.success && response.data?.data?.professionals) {
        const newProfessionals = response.data.data.professionals;
        
        if (resetList) {
          setProfessionals(newProfessionals);
        } else {
          setProfessionals(prev => [...prev, ...newProfessionals]);
        }

        // Check if there's more data
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

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchProfessionals();
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.get<ProfessionalsResponse>('/user/professional/getProfessional', {
        params: {
          search_query: query.trim(),
          page: 1,
          limit: 10
        }
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
    const fullName = `${item.first_name} ${item.last_name}`;
    const speciality = item.speciality_new?.name || item.specialization || 'Yoga Professional';
    const location = item.city && item.state ? `${item.city}, ${item.state}` : 'Location not specified';
    const profileImage = item.profile_picture_url || item.profileImage;
    
    return (
      <TouchableOpacity
        style={styles.professionalCard}
        onPress={() => navigation.navigate('ProfessionalProfile', { professionalId: item.professional_id?.toString() || item._id || '' })}
      >
        <View style={styles.professionalInfo}>
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.defaultAvatar}>
                <Ionicons name="person" size={24} color="#6B7280" />
              </View>
            )}
          </View>
          
          <View style={styles.professionalDetails}>
            <Text style={styles.professionalName} numberOfLines={1} ellipsizeMode="tail">
              {fullName}
              {item.is_verified && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color="#10B981" 
                  style={styles.verifiedIcon}
                />
              )}
            </Text>
            <Text style={styles.specialization} numberOfLines={1}>
              {speciality}
            </Text>
            
            <View style={styles.metaContainer}>
              {item.language && (
                <View style={styles.languageBadge}>
                  <Ionicons name="language" size={12} color="#4B5563" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.language}
                  </Text>
                </View>
              )}
              
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="#6B7280" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {location}
                </Text>
              </View>
            </View>
            
            {item.rating && (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.ratingText}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.availabilityContainer}>
            {item.is_online && (
              <View style={styles.onlineBadge}>
                <View style={styles.onlineIndicator} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getScreenTitle = () => {
    if (searchQuery) return `Search: "${searchQuery}"`;
    if (categoryName) return categoryName;
    return 'Find Professionals';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {getScreenTitle()}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search professionals..."
            placeholderTextColor="#9CA3AF"
            value={currentSearchQuery}
            onChangeText={setCurrentSearchQuery}
            onSubmitEditing={({ nativeEvent }) => handleSearch(nativeEvent.text)}
            returnKeyType="search"
          />
          {currentSearchQuery ? (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setCurrentSearchQuery('');
                handleSearch('');
              }}
            >
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Finding professionals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>
            {error || 'Failed to load professionals. Please try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchProfessionals()}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={professionals}
          renderItem={renderProfessional}
          keyExtractor={(item) => item.professional_id?.toString() || item._id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!isLoading ? renderEmptyList : null}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1E88E5']}
              tintColor="#1E88E5"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Filter Modal - Implementation needed */}
      
    </SafeAreaView>
  );
};

// Common shadow styles
const commonShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  flex: 1,
  backgroundColor: '#FFFFFF',
};

const styles = StyleSheet.create({
  // Main container
  container: commonShadow,

  // Header Styles
  header: {
    ...commonShadow,
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerRight: {
    width: 40,
  },

  // Search Bar Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // Professional Card Styles
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    ...commonShadow,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  defaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 4,
    fontWeight: '600',
  },
  availabilityContainer: {
    marginTop: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Empty State Styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: '#1E88E5',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Loading State
  loadingContainer: {
    ...commonContainer,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#4B5563',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },

  // Error State
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,

// Search Bar Styles
searchContainer: {
flexDirection: 'row',
alignItems: 'center',
padding: 16,
backgroundColor: '#FFFFFF',
borderBottomWidth: 1,
borderBottomColor: '#E5E7EB',
},
searchInputContainer: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#F3F4F6',
borderRadius: 8,
paddingHorizontal: 12,
height: 48,
},
searchIcon: {
marginRight: 8,
},
searchInput: {
flex: 1,
height: '100%',
color: '#111827',
fontSize: 16,
paddingVertical: 0,
},
clearButton: {
padding: 4,
marginLeft: 4,
},
filterButton: {
width: 48,
height: 48,
borderRadius: 8,
backgroundColor: '#1E88E5',
justifyContent: 'center',
alignItems: 'center',
marginLeft: 12,
},
// Professional Card Styles
professionalCard: {
backgroundColor: '#FFFFFF',
borderRadius: 12,
padding: 16,
marginBottom: 12,
marginHorizontal: 16,
...commonShadow,
},
professionalInfo: {
flexDirection: 'row',
alignItems: 'flex-start',
},
avatarContainer: {
marginRight: 12,
},
avatarImage: {
width: 64,
height: 64,
borderRadius: 32,
backgroundColor: '#F3F4F6',
},
defaultAvatar: {
width: 64,
height: 64,
borderRadius: 32,
backgroundColor: '#E5E7EB',
justifyContent: 'center',
alignItems: 'center',
},
professionalDetails: {
flex: 1,
marginRight: 12,
},
professionalName: {
fontSize: 16,
fontWeight: '600',
color: '#111827',
marginBottom: 2,
},
specialization: {
fontSize: 14,
color: '#6B7280',
marginBottom: 8,
},
verifiedIcon: {
marginLeft: 4,
},
metaContainer: {
flexDirection: 'row',
flexWrap: 'wrap',
marginBottom: 8,
gap: 8,
},
languageBadge: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#F3F4F6',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 4,
marginRight: 4,
},
metaText: {
fontSize: 12,
color: '#4B5563',
marginLeft: 4,
},
locationContainer: {
flexDirection: 'row',
alignItems: 'center',
},
locationText: {
fontSize: 12,
color: '#6B7280',
marginLeft: 4,
},
ratingContainer: {
flexDirection: 'row',
alignItems: 'center',
},
ratingText: {
fontSize: 12,
color: '#1F2937',
fontWeight: '500',
marginLeft: 4,
},
availabilityContainer: {
alignItems: 'flex-end',
},
onlineBadge: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#ECFDF5',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 12,
},
onlineIndicator: {
width: 8,
height: 8,
borderRadius: 4,
backgroundColor: '#10B981',
marginRight: 4,
},
onlineText: {
fontSize: 12,
color: '#065F46',
fontWeight: '500',
},
availabilityBadge: {
marginTop: 4,
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 4,
backgroundColor: '#EFF6FF',
},
availabilityText: {
fontSize: 12,
color: '#1E40AF',
fontWeight: '500',
},
// List and empty states
listContent: {
padding: 16,
paddingBottom: 24,
},
emptyContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 24,
paddingTop: 80,
},
emptyText: {
fontSize: 18,
fontWeight: '600',
color: '#111827',
marginTop: 16,
textAlign: 'center',
},
emptySubtext: {
fontSize: 14,
color: '#6B7280',
marginTop: 8,
textAlign: 'center',
marginBottom: 24,
},
refreshButton: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 10,
paddingHorizontal: 20,
borderRadius: 8,
borderWidth: 1,
borderColor: '#1E88E5',
backgroundColor: '#FFFFFF',
},
refreshButtonText: {
color: '#1E88E5',
fontSize: 14,
fontWeight: '600',
marginLeft: 8,
},
loadingMoreContainer: {
paddingVertical: 16,
alignItems: 'center',
justifyContent: 'center',
flexDirection: 'row',
gap: 8,
},
loadingMoreText: {
marginLeft: 8,
color: '#6B7280',
fontSize: 14,
},
// Error state styles
errorContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 20,
},
errorText: {
marginTop: 12,
marginBottom: 20,
fontSize: 16,
textAlign: 'center',
color: '#4B5563',
paddingHorizontal: 20,
},
// Empty state styles
headerRight: {
width: 40,
},
searchContainer: {
flexDirection: 'row',
alignItems: 'center',
padding: 16,
backgroundColor: '#FFFFFF',
borderBottomWidth: 1,
borderBottomColor: '#E5E7EB',
},
searchInputContainer: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#F3F4F6',
borderRadius: 8,
paddingHorizontal: 12,
height: 48,
},
searchIcon: {
marginRight: 8,
},
searchInput: {
flex: 1,
height: '100%',
color: '#111827',
fontSize: 16,
paddingVertical: 0,
},
clearButton: {
padding: 4,
marginLeft: 8,
},
filterButton: {
width: 48,
height: 48,
borderRadius: 24,
backgroundColor: '#1E88E5',
justifyContent: 'center',
alignItems: 'center',
marginLeft: 12,
...commonShadow,
},
// Professional card
professionalCard: {
backgroundColor: '#FFFFFF',
borderRadius: 12,
padding: 16,
marginBottom: 12,
...commonShadow,
},
professionalInfo: {
flexDirection: 'row',
alignItems: 'flex-start',
},
avatarContainer: {
marginRight: 12,
},
avatarImage: {
width: 64,
height: 64,
borderRadius: 32,
backgroundColor: '#F3F4F6',
},
defaultAvatar: {
width: 64,
height: 64,
borderRadius: 32,
backgroundColor: '#E5E7EB',
justifyContent: 'center',
alignItems: 'center',
},
professionalDetails: {
flex: 1,
marginRight: 12,
},
professionalName: {
fontSize: 16,
fontWeight: '600',
color: '#111827',
marginBottom: 2,
},
specialization: {
fontSize: 14,
color: '#6B7280',
marginBottom: 8,
},
verifiedIcon: {
marginLeft: 4,
},
metaContainer: {
flexDirection: 'row',
flexWrap: 'wrap',
marginBottom: 8,
gap: 8,
},
languageBadge: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#F3F4F6',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 4,
marginRight: 4,
},
metaText: {
fontSize: 12,
color: '#4B5563',
marginLeft: 4,
},
locationContainer: {
flexDirection: 'row',
alignItems: 'center',
},
locationText: {
fontSize: 12,
color: '#6B7280',
marginLeft: 4,
},
ratingContainer: {
flexDirection: 'row',
alignItems: 'center',
},
ratingText: {
fontSize: 12,
color: '#1F2937',
fontWeight: '500',
marginLeft: 4,
},
availabilityContainer: {
alignItems: 'flex-end',
},
onlineBadge: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#ECFDF5',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 12,
},
onlineIndicator: {
width: 8,
height: 8,
borderRadius: 4,
backgroundColor: '#10B981',
marginRight: 4,
},
onlineText: {
fontSize: 12,
color: '#065F46',
fontWeight: '500',
},
availabilityBadge: {
marginTop: 4,
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 4,
backgroundColor: '#EFF6FF',
},
availabilityText: {
fontSize: 12,
color: '#1E40AF',
fontWeight: '500',
},
// Empty state
emptyContainer: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 40,
},
emptyText: {
fontSize: 18,
fontWeight: '600',
color: '#1F2937',
marginTop: 16,
textAlign: 'center',
},
emptySubtext: {
fontSize: 14,
color: '#6B7280',
marginTop: 8,
textAlign: 'center',
marginBottom: 24,
},
loadingMoreText: {
marginLeft: 8,
color: '#6B7280',
fontSize: 14,
},
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: '#111827',
    fontSize: 16,
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  professionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  defaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#111827',
    marginLeft: 4,
    fontWeight: '600',
  },
  availabilityContainer: {
    marginTop: 8,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '500',
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availabilityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
  },
});

export default ProfessionalsListScreen;
