import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Alert,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';
import type { HomeStackParamList } from '../types/navigation';
import type { Prescription } from '../types/medical';
import Ionicons from 'react-native-vector-icons/Ionicons';

type PrescriptionsListNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'PrescriptionsList'
>;

const PrescriptionsListScreen: React.FC = () => {
  const navigation = useNavigation<PrescriptionsListNavigationProp>();
  const { isAuthenticated, user, isAuthReady } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(false); // Start as false, will be set to true when auth is ready
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false); // Track if initial load has been triggered
  const isLoadingRef = useRef(false); // Track loading state with ref to prevent dependency issues

  const PAGE_SIZE = 10;

  const loadPrescriptions = useCallback(
    async (pageToLoad: number, isRefresh = false) => {
      // Prevent concurrent calls (except for refresh) using ref
      if (isLoadingRef.current && !isRefresh) {
        console.log('⏸️ Prescription load already in progress, skipping...');
        return;
      }

      try {
        setError(null);
        setIsLoading(prev => !isRefresh && pageToLoad === 1 ? true : prev);
        setIsRefreshing(prev => isRefresh ? true : prev);
        isLoadingRef.current = true;

        console.log(`📋 Loading prescriptions: page=${pageToLoad}, refresh=${isRefresh}`);
        const response = await apiService.getUserPrescriptions(pageToLoad, PAGE_SIZE);
        
        // Log the full response for debugging
        console.log('📦 Raw API response:', JSON.stringify(response, null, 2));
        
        // CRITICAL FIX: The API returns { msg: string, data: Array, pagination: {...} }
        // But the type says data.items. Let's handle both cases for robustness
        let items: Prescription[] = [];
        let totalItems = 0;
        
        if (Array.isArray(response?.data)) {
          // API returns data as array directly
          items = response.data;
          totalItems = response.pagination?.total || items.length;
          console.log(`✅ API returned array directly: ${items.length} items`);
        } else if (response?.data?.items) {
          // API returns data.items structure (as per type definition)
          items = response.data.items;
          totalItems = response.data.total || items.length;
          console.log(`✅ API returned nested structure: ${items.length} items`);
        } else {
          console.warn('⚠️ Unexpected API response structure:', response);
        }
        
        if (!items.length) {
          console.warn('⚠️ No prescriptions found in response.');
          // Check if this is the first page and show a message to the user
          if (pageToLoad === 1) {
            setError(null); // Don't show error, just show empty state
          }
        } else {
          console.log(`✅ Found ${items.length} prescriptions (total: ${totalItems})`);
          setError(null); // Clear any previous error messages
        }
        
        // Update the prescriptions list
        if (isRefresh || pageToLoad === 1) {
          setPrescriptions(items);
        } else {
          // For pagination, append new items and remove duplicates
          setPrescriptions(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newItems = items.filter(item => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
        }

        // Update pagination state
        setHasMore(items.length === PAGE_SIZE);
        setPage(pageToLoad);
        hasLoadedRef.current = true; // Mark as loaded successfully
        
      } catch (err: any) {
        console.error('Failed to load prescriptions:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.message || 'Failed to load prescriptions. Please try again.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        isLoadingRef.current = false;
      }
    },
    [] // Empty dependency array as we use stable setters and refs
  );

  // CRITICAL: Wait for Auth Context to be ready before making API calls
  // Only load once on mount, not on every focus
  useEffect(() => {
    // Reset refs when user changes (e.g., logout/login)
    if (!user?.user_id) {
      hasLoadedRef.current = false;
      isLoadingRef.current = false;
      setIsLoading(false);
      setError('Authentication required. Please sign in.');
      return;
    }

    // Only fetch once when auth is ready and user_id is available
    // Check both refs to ensure we don't call multiple times
    if (isAuthReady && user?.user_id && !hasLoadedRef.current && !isLoadingRef.current) {
      console.log('✅ Auth ready, loading prescriptions (single call)...');
      hasLoadedRef.current = true; // Set immediately to prevent duplicate calls
      isLoadingRef.current = true; // Set immediately to prevent concurrent calls
      loadPrescriptions(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthReady, user?.user_id]); // Intentionally exclude loadPrescriptions to prevent infinite loops

  const handleRefresh = () => {
    hasLoadedRef.current = false; // Reset to allow refresh
    loadPrescriptions(1, true);
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    loadPrescriptions(page + 1);
  };

  const renderItem = ({ item }: { item: Prescription }) => {
    const date = item.prescriptionDate || item.booking?.booking_date || '';
    const doctorName = `${item.professional?.first_name ?? ''} ${
      item.professional?.last_name ?? ''
    }`.trim() || 'Doctor';
    const speciality = item.professional?.speciality_new?.name || '';
    const type = item.prescriptionType || 'CONSULTATION';
    const visibleId = item.prescriptionId;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('PrescriptionDetail', {
            prescriptionId: item.id,
          })
        }
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.doctorText}>{doctorName}</Text>
            {!!speciality && <Text style={styles.specialityText}>{speciality}</Text>}
          </View>
          <Text style={styles.dateText}>{date}</Text>
        </View>

        <View style={styles.cardMiddleRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{type}</Text>
          </View>
          <Text style={styles.idText}>{visibleId}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.viewLabel}>View Details</Text>
          <Ionicons name="chevron-forward" size={18} color="#1E88E5" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="medkit-outline" size={48} color="#9CA3AF" style={{ marginBottom: 12 }} />
        <Text style={styles.emptyText}>No records found</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>My Prescriptions</Text>
        <Ionicons name="filter-outline" size={22} color="#111827" />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPrescriptions(1)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading && prescriptions.length === 0 ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={prescriptions.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={renderEmpty}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  typeText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  doctorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  specialityText: {
    fontSize: 13,
    color: '#6B7280',
  },
  cardMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E88E5',
  },
  idText: {
    fontSize: 12,
    color: '#6B7280',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  viewLabel: {
    marginRight: 4,
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrescriptionsListScreen;
