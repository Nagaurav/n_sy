import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Alert,
  AccessibilityInfo,
  findNodeHandle
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from 'react-native-geolocation-service';

import { apiService } from '../services';
import { YogaClass, YogaClassesFilters, PaginationInfo } from '../types/yogaClasses';
import { HomeStackParamList } from '../types/navigation';
import { theme } from '../theme';
import CollapsibleCard from '../components/CollapsibleCard';

type ClassesListScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ClassesList'>;

const { width } = Dimensions.get('window');

const ClassesListScreen = () => {
  const navigation = useNavigation<ClassesListScreenNavigationProp>();
  
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<YogaClassesFilters>({
    page: 1,
    limit: 10,
    sort_by: 'effective_price',
  });
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);

  // Request location permission and get current position
  const requestLocationPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show nearby classes.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else {
          console.log('Location permission denied');
          return false;
        }
      } catch (err) {
        console.warn('Error requesting location permission:', err);
        return false;
      }
    }
    return true; // For iOS, we'll rely on the native permission prompt
  }, []);

  // Location handling with react-native-geolocation-service
  const getCurrentLocation = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setError('Location permission is required for nearby class features');
      return;
    }

    try {
      const position = await new Promise<Geolocation.GeoPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      });

      setUserLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (error: any) {
      console.error('Error getting location:', error);
      setError('Could not get your location. Showing all classes.');
    }
  }, [requestLocationPermission]);

  // Get location when component mounts or when sort changes to near_to_far
  useEffect(() => {
    if (filters.sort_by === 'near_to_far') {
      getCurrentLocation();
    }
  }, [filters.sort_by, getCurrentLocation]);

  // Fetch classes with current filters and retry logic
  const fetchClasses = useCallback(async (isRefreshing = false) => {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    let lastError: Error | null = null;

    const attemptFetch = async (): Promise<void> => {
      try {
        if (isFetchingMore || (paginationInfo && filters.page && filters.page > paginationInfo.pages)) {
          return;
        }

        setIsLoading(true);
        setError(null);

        const filtersWithLocation = { ...filters };
        if (filters.sort_by === 'near_to_far' && userLocation) {
          filtersWithLocation.latitude = userLocation.latitude;
          filtersWithLocation.longitude = userLocation.longitude;
        }

        const response = await apiService.getYogaClasses(filtersWithLocation);
        
        if (response?.success && response?.data) {
          const classesData = response.data;
          
          // Handle both array and paginated response formats
          if (Array.isArray(classesData)) {
            // Direct array response
            const classesArray = classesData as YogaClass[];
            if (filters.page === 1 || isRefreshing) {
              setClasses(classesArray || []);
            } else {
              setClasses(prev => [...prev, ...(classesArray || [])]);
            }
            // Set basic pagination info for array responses
            setPaginationInfo({
              page: filters.page || 1,
              limit: 20,
              total: classesArray?.length || 0,
              pages: 1
            });
          } else {
            // Paginated response with nested structure
            const paginatedResponse = classesData as any;
            if (paginatedResponse.data && paginatedResponse.pagination) {
              setPaginationInfo(paginatedResponse.pagination);
              
              if (filters.page === 1 || isRefreshing) {
                setClasses(paginatedResponse.data || []);
              } else {
                setClasses(prev => [...prev, ...(paginatedResponse.data || [])]);
              }
            }
          }
          return; // Success, exit retry loop
        } else {
          throw new Error('No data in response');
        }
      } catch (err) {
        lastError = err as Error;
        console.error(`Attempt ${retryCount + 1} failed:`, err);
        
        if (retryCount < MAX_RETRIES - 1) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const delay = 1000 * Math.pow(2, retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          return attemptFetch(); // Retry
        }4
        throw lastError; // Max retries reached
      } finally {
        if (retryCount >= MAX_RETRIES - 1) {
          setIsLoading(false);
          setIsFetchingMore(false);
          setIsRefreshing(false);
        }
      }
    };

    try {
      await attemptFetch();
    } catch (err) {
      console.error('All fetch attempts failed:', err);
      let errorMessage = 'Failed to fetch classes. Please check your connection and try again.';
      
      if (lastError) {
        if (typeof lastError === 'object' && lastError !== null) {
          errorMessage = (lastError as Error).message || JSON.stringify(lastError);
        } else {
          errorMessage = String(lastError);
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsFetchingMore(false);
      setIsRefreshing(false);
    }
  }, [filters, userLocation, isFetchingMore, paginationInfo]);

  // Initial fetch
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Handle pull-to-refresh
  const handleRefresh = useCallback(() => {
    setFilters(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle loading more data when reaching the end of the list
  const handleLoadMore = () => {
    if (!isLoading && !isFetchingMore && paginationInfo && filters.page && filters.page < paginationInfo.pages) {
      setFilters(prev => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  };

  // Handle applying filters
  const handleApplyFilters = (appliedFilters: Partial<YogaClassesFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...appliedFilters,
      page: 1, // Reset to first page when filters change
    }));
    setShowFilters(false);
  };

  // Handle class card press with error boundary
  const handleClassPress = useCallback((classItem: YogaClass) => {
    try {
      if (!classItem.professional_id) {
        throw new Error('Professional ID is missing');
      }
      navigation.navigate('ProfessionalProfile', { 
        professionalId: classItem.professional_id.toString() 
      });
    } catch (error) {
      console.error('Error navigating to professional profile:', error);
      Alert.alert(
        'Navigation Error',
        'Unable to load the professional profile. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }, [navigation]);

  // Memoized price formatter to prevent recreation on each render
  const formatPrice = useCallback((price: number | null) => {
    if (price === null) return 'Price not available';
    return `₹${price.toLocaleString()}`;
  }, []);

  // Memoized class item component for better performance
  const ClassItem = React.memo(({ item, onPress }: { item: YogaClass; onPress: (item: YogaClass) => void }) => {
    const viewRef = React.useRef<View>(null);
    
    // Set accessibility focus when the component mounts
    useEffect(() => {
      if (viewRef.current) {
        const reactTag = findNodeHandle(viewRef.current);
        if (reactTag) {
          setTimeout(() => {
            AccessibilityInfo.setAccessibilityFocus(reactTag);
          }, 100);
        }
      }
    }, [item.id]);

    return (
      <TouchableOpacity 
        ref={viewRef}
        style={styles.classCard}
        onPress={() => onPress(item)}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}. ${item.description}. ${formatPrice(item.effective_price)}. ${item.duration.replace('_', ' ')}. ${item.days}. ${item.city ? `Located in ${item.city}.` : ''}${item.disease ? ` Specializes in ${item.disease}.` : ''}`}
        accessibilityHint="Double tap to view professional details"
      >
        <View style={styles.classHeader}>
          <Text 
            style={styles.classTitle} 
            numberOfLines={1}
            accessibilityElementsHidden={true} // Hide from accessibility tree as we're handling it at the parent level
          >
            {item.title}
          </Text>
          <Text 
            style={styles.classPrice}
            accessibilityElementsHidden={true}
          >
            {formatPrice(item.effective_price)}
          </Text>
        </View>
        
        <CollapsibleCard
          title="Class Description"
          content={(
            <Text style={styles.classDescription} accessibilityElementsHidden={true}>
              {item.description}
            </Text>
          )}
        />
        
        <View style={styles.classMeta}>
          <View style={styles.metaItem} accessibilityElementsHidden={true}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.metaText}>{item.duration.replace('_', ' ')}</Text>
          </View>
          
          <View style={styles.metaItem} accessibilityElementsHidden={true}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.metaText} numberOfLines={1}>{item.days}</Text>
          </View>
          
          {item.city && (
            <View style={styles.metaItem} accessibilityElementsHidden={true}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.metaText} numberOfLines={1}>{item.city}</Text>
            </View>
          )}
        </View>
        
        {item.disease && (
          <View style={styles.tag} accessibilityElementsHidden={true}>
            <Text style={styles.tagText}>{item.disease}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  });

  // Memoize the class item renderer to prevent unnecessary re-renders
  const renderClassItem = useCallback(({ item }: { item: YogaClass }) => (
    <ClassItem item={item} onPress={handleClassPress} />
  ), []);

  // Render loading indicator for pagination
  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  // Render empty state with accessibility
  const renderEmpty = useCallback(() => (
    <View 
      style={styles.emptyContainer}
      accessible={true}
      accessibilityLabel="No classes found. Try adjusting your filters."
    >
      <Ionicons 
        name="sad-outline" 
        size={48} 
        color="#999" 
        accessible={false}
      />
      <Text 
        style={styles.emptyText}
        accessibilityElementsHidden={true}
      >
        No classes found
      </Text>
      <Text 
        style={styles.emptySubtext}
        accessibilityElementsHidden={true}
      >
        Try adjusting your filters
      </Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Find a Class</Text>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="filter" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={classes}
          renderItem={renderClassItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
              accessibilityLabel="Pull to refresh"
            />
          }
          ListEmptyComponent={!isLoading ? renderEmpty : null}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={11} // Render one screen worth of items
          removeClippedSubviews={true}
          accessibilityElementsHidden={false}
          importantForAccessibility="yes"
        />
      )}

      {/* Loading Indicator */}
      {isLoading && classes.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading classes...</Text>
        </View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Classes</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* City Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>City</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter city"
                value={filters.city || ''}
                onChangeText={(text) => 
                  setFilters(prev => ({ ...prev, city: text || undefined }))
                }
              />
            </View>
            
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={styles.priceRangeContainer}>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="Min"
                  keyboardType="numeric"
                  value={filters.min_price?.toString() || ''}
                  onChangeText={(text) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      min_price: text ? Number(text) : undefined 
                    }))
                  }
                />
                <Text style={styles.priceSeparator}>-</Text>
                <TextInput
                  style={[styles.input, styles.priceInput]}
                  placeholder="Max"
                  keyboardType="numeric"
                  value={filters.max_price?.toString() || ''}
                  onChangeText={(text) => 
                    setFilters(prev => ({ 
                      ...prev, 
                      max_price: text ? Number(text) : undefined 
                    }))
                  }
                />
              </View>
            </View>
            
            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { value: 'effective_price', label: 'Price: Low to High' },
                  { value: 'near_to_far', label: 'Distance: Near to Far' },
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
            </View>
            
            {/* Delivery Mode */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Delivery Mode</Text>
              <View style={styles.deliveryModes}>
                {[
                  { key: 'group_online', label: 'Group Online' },
                  { key: 'group_offline', label: 'Group In-Person' },
                  { key: 'one_to_one_online', label: '1:1 Online' },
                  { key: 'one_to_one_offline', label: '1:1 In-Person' },
                  { key: 'home_visit', label: 'Home Visit' },
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.key}
                    style={[
                      styles.deliveryMode,
                      filters.delivery_mode === mode.key && styles.deliveryModeActive,
                    ]}
                    onPress={() => 
                      setFilters(prev => ({ 
                        ...prev, 
                        delivery_mode: filters.delivery_mode === mode.key 
                          ? undefined 
                          : mode.key as any 
                      }))
                    }
                  >
                    <Text
                      style={[
                        styles.deliveryModeText,
                        filters.delivery_mode === mode.key && styles.deliveryModeTextActive,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setFilters({
                  page: 1,
                  limit: 10,
                });
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => handleApplyFilters({})}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 85,
  },
  backButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  filterButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 24,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  classTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
    lineHeight: 24,
  },
  classPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  classDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  classMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#a5d6a7',
  },
  tagText: {
    color: '#2e7d32',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resetButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginRight: 10,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Filter section styles
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceInput: {
    flex: 1,
  },
  priceSeparator: {
    marginHorizontal: 10,
    fontSize: 16,
    color: '#666',
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 4,
    backgroundColor: '#f9f9f9',
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#666',
  },
  sortOptionTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  deliveryModes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  deliveryMode: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    margin: 4,
    backgroundColor: '#f9f9f9',
  },
  deliveryModeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  deliveryModeText: {
    fontSize: 14,
    color: '#666',
  },
  deliveryModeTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
});

export default ClassesListScreen;
