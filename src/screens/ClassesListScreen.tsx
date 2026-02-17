import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Dimensions,
  Alert,
  ImageBackground,
  TextInput,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { apiService } from '../services';
import { YogaClass, YogaClassesFilters, PaginationInfo } from '../types/yogaClasses';
import { HomeStackParamList } from '../types/navigation';
import { formatDisplayDate, formatDisplayTime, formatSlotTimeRange } from '../utils/dateUtils';

type ClassesListScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ClassesList'>;

const { width, height } = Dimensions.get('window');

const ClassesListScreen = () => {
  const navigation = useNavigation<ClassesListScreenNavigationProp>();
  const { theme: appTheme } = useTheme();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<YogaClassesFilters>({
    page: 1,
    limit: 10,
    sort_by: 'effective_price',
  });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Categories for quick filter
  const categories = [
    { id: 'all', name: 'All Classes', icon: 'grid' },
    { id: 'group_online', name: 'Group Online', icon: 'people' },
    { id: 'group_offline', name: 'Group In-Person', icon: 'location' },
    { id: 'one_to_one_online', name: '1:1 Online', icon: 'videocam' },
    { id: 'one_to_one_offline', name: '1:1 In-Person', icon: 'person' },
    { id: 'home_visit', name: 'Home Visit', icon: 'home' },
  ];

  // Fetch classes from API
  const fetchClasses = useCallback(async (isRefreshing = false) => {
    console.log('fetchClasses called with:', { isRefreshing, filters, searchQuery, selectedCategory });
    try {
      if (isRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const filtersWithSearch = { ...filters };
      if (searchQuery) {
        filtersWithSearch.title = searchQuery;
      }
      if (selectedCategory !== 'all') {
        filtersWithSearch.delivery_mode = selectedCategory as any;
      }

      const response = await apiService.getYogaClasses(filtersWithSearch);
      console.log('API Response:', response);
      
      if (response?.success && response?.data) {
        const classesData = response.data;
        console.log('Classes data:', classesData);
        
        // Handle both array and paginated response formats
        if (Array.isArray(classesData)) {
          setClasses(classesData || []);
          setPaginationInfo({
            page: filters.page || 1,
            limit: 20,
            total: classesData?.length || 0,
            pages: 1
          });
        } else {
          const paginatedResponse = classesData as any;
          if (paginatedResponse.data && paginatedResponse.pagination) {
            setPaginationInfo(paginatedResponse.pagination);
            setClasses(paginatedResponse.data || []);
          } else if (paginatedResponse.data) {
            setClasses(paginatedResponse.data || []);
            setPaginationInfo({
              page: filters.page || 1,
              limit: 20,
              total: paginatedResponse.data?.length || 0,
              pages: 1
            });
          }
        }
      } else {
        throw new Error('No data in response');
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, searchQuery, selectedCategory]);

  // Initial fetch
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle class card press
  const handleClassPress = useCallback((classItem: YogaClass) => {
    try {
      if (!classItem.professional_id) {
        throw new Error('Professional ID is missing');
      }
      navigation.navigate('ClassDetails', { 
        classData: classItem 
      });
    } catch (error) {
      console.error('Error navigating to class details:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to load the class details. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }, [navigation]);

  // Format price display
  const formatPrice = useCallback((price: number | null) => {
    if (price === null) return 'Price not available';
    return `₹${price.toLocaleString()}`;
  }, []);

  // Get available delivery modes for a class
  const getAvailableModes = useCallback((classItem: YogaClass) => {
    const modes = [];
    if (classItem.group_online) modes.push('Group Online');
    if (classItem.group_offline) modes.push('Group In-Person');
    if (classItem.one_to_one_online) modes.push('1:1 Online');
    if (classItem.one_to_one_offline) modes.push('1:1 In-Person');
    if (classItem.home_visit) modes.push('Home Visit');
    return modes;
  }, []);

  // Get effective price based on delivery mode
  const getEffectivePrice = useCallback((classItem: YogaClass) => {
    if (classItem.effective_price) return classItem.effective_price;
    
    // Fallback to minimum available price
    const prices = [
      classItem.price_group_online,
      classItem.price_group_offline,
      classItem.price_one_to_one_online,
      classItem.price_one_to_one_offline,
      classItem.price_home_visit,
    ].filter(p => p !== null) as number[];
    
    return prices.length > 0 ? Math.min(...prices) : null;
  }, []);

  // Render class card
  const renderClassItem = useCallback(({ item }: { item: YogaClass }) => {
    console.log('📋 ClassesListScreen rendering item:', item);
    const availableModes = getAvailableModes(item);
    const effectivePrice = getEffectivePrice(item);
    console.log('📊 Available modes in list:', availableModes);
    console.log('💰 Effective price in list:', effectivePrice);
    
    // Use appropriate image based on class type
    const imageUrl = item.home_visit 
      ? 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800' 
      : item.group_offline || item.location
      ? 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800'
      : 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800';

    return (
      <TouchableOpacity 
        style={styles.classCard}
        onPress={() => handleClassPress(item)}
        activeOpacity={0.9}
      >
        {/* Available Status Badge - Top Right Corner */}
        <View style={styles.availableBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
        </View>

        {/* Header with Image and Basic Info */}
        <View style={styles.cardHeader}>
          <View style={styles.imageSection}>
            <ImageBackground source={{ uri: imageUrl }} style={styles.classImage} imageStyle={styles.classImageBorder}>
              {/* Category Badge */}
              {item.is_disease_specific && item.disease && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.disease}</Text>
                </View>
              )}
            </ImageBackground>
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.classTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.classMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText}>{item.duration.replace('_', ' ')}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.metaText} numberOfLines={1}>{item.days}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.cardContent}>
          <View style={styles.infoSection}>
            {/* Description */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#008272' + '20' }]}>
                <Ionicons name="information-circle-outline" size={16} color="#008272" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>About</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
            
            {/* Location */}
            {(item.city || item.location) && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                  <Ionicons name="location-outline" size={16} color="#4CAF50" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoValue}>{item.city || 'Center'}</Text>
                </View>
              </View>
            )}
            
            {/* Languages */}
            {item.languages && (
              <View style={styles.infoItem}>
                <View style={[styles.infoIcon, { backgroundColor: '#FFA500' + '20' }]}>
                  <Ionicons name="language-outline" size={16} color="#FFA500" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Languages</Text>
                  <Text style={styles.infoValue}>{item.languages}</Text>
                </View>
              </View>
            )}
            
            {/* Available Modes */}
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#9333EA' + '20' }]}>
                <Ionicons name="grid-outline" size={16} color="#9333EA" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Available Modes</Text>
                <View style={styles.modesContainer}>
                  {availableModes.slice(0, 3).map((mode, index) => (
                    <View key={index} style={styles.modeChip}>
                      <Text style={styles.modeText}>{mode}</Text>
                    </View>
                  ))}
                  {availableModes.length > 3 && (
                    <View style={styles.moreChip}>
                      <Text style={styles.moreText}>+{availableModes.length - 3}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Section - Full Button */}
        <TouchableOpacity 
          style={styles.cardFooterButton}
          onPress={() => handleClassPress(item)}
        >
          <Text style={styles.footerButtonText}>View Details • {formatPrice(effectivePrice)}</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }, [handleClassPress, getAvailableModes, getEffectivePrice, formatPrice]);

  // Render empty state
  const renderEmpty = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fitness-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Classes Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedCategory !== 'all' 
          ? 'Try adjusting your filters or search query'
          : 'Check back later for new classes'
        }
      </Text>
      <TouchableOpacity style={styles.clearFiltersButton} onPress={() => {
        setSearchQuery('');
        setSelectedCategory('all');
        setFilters({ page: 1, limit: 10, sort_by: 'effective_price' });
      }}>
        <Text style={styles.clearFiltersText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  ), [searchQuery, selectedCategory]);

  // Render loading state
  if (isLoading && classes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading amazing classes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Modern Header - Matching ProfessionalHomeHeader */}
      <LinearGradient 
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Yoga Classes</Text>
            <Text style={styles.headerSubtitle}>Find your perfect class</Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => setShowFilters(true)}
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {error ? (
          <View style={styles.center}>
            <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchClasses()}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={classes}
            renderItem={renderClassItem}
            keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); fetchClasses(true); }} />
            }
            ListEmptyComponent={!isLoading ? renderEmpty : null}
            ListHeaderComponent={
              selectedCategory !== 'all' || searchQuery ? (
                <View style={styles.activeFiltersContainer}>
                  <Text style={styles.activeFiltersTitle}>Active Filters:</Text>
                  {selectedCategory !== 'all' && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </Text>
                      <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                        <Ionicons name="close-circle" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                  {searchQuery && (
                    <View style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterText}>Search: {searchQuery}</Text>
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : null
            }
          />
        )}
      </Animated.View>

      {/* Filter Modal */}
      {showFilters && (
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Classes</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Sort By</Text>
                {[
                  { value: 'effective_price', label: 'Price: Low to High' },
                  { value: 'created_at', label: 'Newest First' },
                  { value: 'title', label: 'Alphabetical' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      filters.sort_by === option.value && styles.sortOptionActive,
                    ]}
                    onPress={() => 
                      setFilters(prev => ({ 
                        ...prev, 
                        sort_by: option.value as any 
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        filters.sort_by === option.value && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => {
                  setFilters({
                    page: 1,
                    limit: 10,
                    sort_by: 'effective_price',
                  });
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background.primary 
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFiltersContainer: {
    backgroundColor: theme.colors.background.surface,
    padding: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  activeFiltersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginRight: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  clearFiltersButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 24,
  },
  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  sortOption: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary + '20',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: 16,
    color: '#333',
  },
  sortOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    marginLeft: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  // Modern Card Styles matching ProfessionalHomeScreen stats cards
  classCard: {
    backgroundColor: theme.colors.background.surface,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  
  // Header Section
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  imageSection: {
    marginRight: 16,
    position: 'relative',
  },
  classImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  classImageBorder: {
    borderRadius: 12,
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
  },
  priceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  availableBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  classTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  classMeta: {
    alignItems: 'flex-start',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  
  // Content Section
  cardContent: {
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  // Footer Section - Full Button
  cardFooterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
    backgroundColor: theme.colors.primary,
    gap: 8,
  },
  footerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10B981',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginRight: 12,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  footerLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Mode chips (keep existing)
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  modeChip: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  modeText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  moreChip: {
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moreText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
});

export default ClassesListScreen;
