// ProfessionalListingScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ProfessionalService, Professional } from '../services/professional/ProfessionalService';
import { ROUTES } from '../navigation/constants';
import type { RootStackParamList } from '../types/navigation';
import { StackNavigationProp } from '@react-navigation/stack';

// ✅ Type-safe navigation
type ProfessionalListingNavigationProp = StackNavigationProp<
  RootStackParamList,
  typeof ROUTES.PROFESSIONAL_LISTING
>;

const CATEGORY_CONFIG = {
  ayurveda: { icon: 'leaves', color: colors.accentYellow, title: 'Ayurveda', description: 'Ayurveda practitioners' },
  dietician: { icon: 'food-apple', color: colors.accentOrange, title: 'Dietician', description: 'Dietician professionals' },
  homeopathy: { icon: 'flask', color: colors.accentBlue, title: 'Homeopathy', description: 'Homeopathy practitioners' },
  meditation: { icon: 'meditation', color: colors.accentPurple, title: 'Meditation', description: 'Meditation experts' },
  'mental-health': { icon: 'brain', color: colors.accentPink, title: 'Mental Health', description: 'Mental health professionals' },
  naturopath: { icon: 'leaf', color: colors.accentGreen, title: 'Naturopath', description: 'Naturopathy practitioners' },
  nutritionist: { icon: 'food-variant', color: colors.accentOrange, title: 'Nutritionist', description: 'Nutrition experts' },
};

type CategoryType = keyof typeof CATEGORY_CONFIG;

const ProfessionalListingScreen: React.FC = () => {
  const navigation = useNavigation<ProfessionalListingNavigationProp>();
  const route = useRoute();
  const { category, mode, location, serviceType } = route.params as {
    category: CategoryType;
    mode: 'online' | 'offline';
    location?: { city: string; latitude: number; longitude: number };
    serviceType?: 'classes' | 'consultation';
  };

  const categoryConfig = CATEGORY_CONFIG[category];
  const professionalService = ProfessionalService.getInstance();

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const fetchProfessionals = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const queryParams = {
          category,
          is_online: mode === 'online',
          page: isRefresh ? 1 : pagination.page,
          limit: pagination.limit,
          service_type: serviceType === 'classes' ? 'class' : 'consultation',
          ...(location?.city ? { city: location.city } : {}),
          ...(location?.latitude && location?.longitude
            ? { latitude: location.latitude, longitude: location.longitude }
            : {}),
        };

        const response = await professionalService.getProfessionals(queryParams);

        if (response.success && response.data) {
          const fetchedData = Array.isArray(response.data) ? response.data : [];
          setProfessionals(isRefresh ? fetchedData : [...professionals, ...fetchedData]);

          if (response.pagination) {
            setPagination({
              page: response.pagination.page || 1,
              limit: response.pagination.limit || 10,
              totalPages: response.pagination.totalPages || 1,
            });
          }
        } else {
          throw new Error(response.message || 'Failed to load professionals');
        }
      } catch (err: any) {
        console.error('Error fetching professionals:', err);
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, mode, location, pagination.page, pagination.limit, serviceType, professionals]
  );

  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]);

  const onRefresh = () => fetchProfessionals(true);

  const loadMore = () => {
    if (!loading && pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
      fetchProfessionals();
    }
  };

  const handleProfessionalPress = (professional: Professional) => {
    navigation.navigate(ROUTES.PROFESSIONAL_PROFILE, { professional });
  };

  const renderProfessional = ({ item }: { item: Professional }) => (
    <TouchableOpacity
      style={styles.professionalCard}
      onPress={() => handleProfessionalPress(item)}
      activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Text style={styles.avatarText}>
              {item.firstName?.charAt(0)}
              {item.lastName?.charAt(0)}
            </Text>
          ) : (
            <MaterialCommunityIcons name="account" size={24} color={colors.offWhite} />
          )}
        </View>

        <View style={styles.professionalInfo}>
          <Text style={styles.professionalName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.professionalExpertise}>{item.specializations?.join(', ')}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color={colors.accentYellow} />
            <Text style={styles.rating}>
              {item.rating} ({item.totalRatings} reviews)
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{item.serviceTypes?.[0]?.price || 'N/A'}</Text>
          <Text style={styles.duration}>{item.serviceTypes?.[0]?.duration} min</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.bio} numberOfLines={2}>
          {item.bio || 'No bio available'}
        </Text>
        <View style={styles.tags}>
          {item.isOnline && (
            <View style={styles.tag}>
              <MaterialCommunityIcons name="video" size={12} color={colors.primaryGreen} />
              <Text style={styles.tagText}>Online</Text>
            </View>
          )}
          {item.serviceTypes?.some(st => st.type === 'in_person') && (
            <View style={styles.tag}>
              <MaterialCommunityIcons name="map-marker" size={12} color={colors.primaryGreen} />
              <Text style={styles.tagText}>In-person</Text>
            </View>
          )}
          {item.serviceTypes?.some(st => st.type === 'home_visit') && (
            <View style={styles.tag}>
              <MaterialCommunityIcons name="home" size={12} color={colors.primaryGreen} />
              <Text style={styles.tagText}>Home Visit</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && professionals.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {categoryConfig.title}
            {serviceType && ` - ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}`}
          </Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading {categoryConfig.description}...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryConfig.title}
          {serviceType && ` - ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}`}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <FlatList
        data={professionals}
        renderItem={renderProfessional}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name={categoryConfig.icon} size={80} color={categoryConfig.color} />
              <Text style={styles.emptyTitle}>No {categoryConfig.title} Professionals Found</Text>
              <Text style={styles.emptySubtitle}>{mode === 'online' ? 'Online' : 'Offline'} consultation mode</Text>
              {location && (
                <Text style={[styles.location, { color: categoryConfig.color }]}>Location: {location.city}</Text>
              )}
              <Text style={styles.emptyDescription}>
                No {categoryConfig.description} are currently available in your area. Please try a different location or
                check back later.
              </Text>
            </View>
          )
            : null
        }
        ListFooterComponent={
          loading && professionals.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.primaryGreen} />
              <Text style={styles.loadingFooterText}>Loading more...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  placeholder: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, color: colors.secondaryText },
  listContainer: { padding: 16 },
  professionalCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.offWhite, fontSize: 20, fontWeight: '600' },
  professionalInfo: { flex: 1 },
  professionalName: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginBottom: 4 },
  professionalExpertise: { fontSize: 14, color: colors.secondaryText, marginBottom: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  rating: { fontSize: 14, color: colors.secondaryText, marginLeft: 4 },
  priceContainer: { alignItems: 'flex-end' },
  price: { fontSize: 18, fontWeight: '600', color: colors.primaryGreen },
  duration: { fontSize: 12, color: colors.secondaryText },
  cardBody: { marginTop: 8 },
  bio: { fontSize: 14, color: colors.secondaryText, lineHeight: 20, marginBottom: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: { fontSize: 12, color: colors.primaryGreen, marginLeft: 4, fontWeight: '500' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: colors.primaryText, marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, color: colors.secondaryText, marginBottom: 16, textAlign: 'center' },
  location: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  emptyDescription: { fontSize: 16, color: colors.secondaryText, textAlign: 'center', lineHeight: 24 },
  loadingFooter: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
  loadingFooterText: { marginLeft: 8, fontSize: 14, color: colors.secondaryText },
});

export default ProfessionalListingScreen;
