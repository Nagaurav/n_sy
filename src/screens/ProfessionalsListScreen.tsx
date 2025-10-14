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
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Professional } from '../types/booking';

const { width } = Dimensions.get('window');

interface RouteParams {
  categoryId?: string;
  searchQuery?: string;
  categoryName?: string;
}

type ProfessionalsListScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

import { ProfessionalFilters, FilterModalState } from '../types/booking';

const ProfessionalsListScreen = () => {
  const navigation = useNavigation<ProfessionalsListScreenNavigationProp>();
  const route = useRoute();
  const { categoryId, searchQuery, categoryName } = (route.params as RouteParams) || {};
  const { user } = useAuth();

  // State management
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState(searchQuery || '');
  const [showFilterModal, setShowFilterModal] = useState(false);
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
        ...(filters.category_id && { category_id: filters.category_id }),
        ...(filters.is_online !== undefined && { is_online: filters.is_online }),
        ...(filters.min_price > 0 && { min_price: filters.min_price }),
        ...(filters.max_price < 1000 && { max_price: filters.max_price }),
        ...(filters.gender && { gender: filters.gender }),
        ...(filters.sort_by && { sort_by: filters.sort_by }),
        ...(filters.city && { city: filters.city }),
      };

      console.log('🔍 Fetching professionals with filters:', filterParams);

      // Use the enhanced API call with filters
      const response = await apiService.searchProfessionalsWithFilters(filterParams);

      if (response.success && response.data?.professionals) {
        const newProfessionals = response.data.professionals;
        
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
      const response = await apiService.searchProfessionals(query.trim());
      if (response.success && response.data?.professionals) {
        setProfessionals(response.data.professionals);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfessional = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.professionalCard}
      onPress={() => navigation.navigate('ProfessionalProfile', { professionalId: item._id })}
    >
      <View style={styles.professionalInfo}>
        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image source={{ uri: item.profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={24} color="#6B7280" />
            </View>
          )}
        </View>
        
        <View style={styles.professionalDetails}>
          <Text style={styles.professionalName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.specialization}>{item.specialization}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FCD34D" />
            <Text style={styles.rating}>{item.rating || 'N/A'}</Text>
            <Text style={styles.experience}>• {item.experience} years exp</Text>
          </View>
        </View>
        
        <View style={styles.availabilityContainer}>
          <View style={[
            styles.availabilityBadge,
            { backgroundColor: item.availability ? '#10B981' : '#EF4444' }
          ]}>
            <Text style={styles.availabilityText}>
              {item.availability ? 'Available' : 'Busy'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getScreenTitle = () => {
    if (searchQuery) return `Search Results for "${searchQuery}"`;
    if (categoryId) return 'Professionals';
    return 'All Professionals';
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
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search professionals..."
          placeholderTextColor="#6B7280"
          value={currentSearchQuery}
          onChangeText={setCurrentSearchQuery}
          onSubmitEditing={() => handleSearch(currentSearchQuery)}
          returnKeyType="search"
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading professionals...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfessionals()}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={professionals}
          renderItem={renderProfessional}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No professionals found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search criteria
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: '#1E88E5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight || 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  professionalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  professionalDetails: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  specialization: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
    fontWeight: '500',
  },
  experience: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  availabilityContainer: {
    alignItems: 'flex-end',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default ProfessionalsListScreen;
