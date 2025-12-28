import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Image,
  StatusBar,
  Dimensions,
  Alert,
  Platform,
  ImageStyle,
  ViewStyle,
  TextStyle,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Services
import { apiService } from '../services/apiService';

// Types
import { 
  ProfessionalAuthProfile, 
  Gender, 
  WorkArrangement, 
  ProfessionalRole,
  Service
} from '../types';
import type { HomeStackParamList } from '../types';

// Theme
import { theme } from '../theme';

// Constants
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';
const { width } = Dimensions.get('window');

// Navigation Types
type ProfessionalProfileRouteProp = RouteProp<HomeStackParamList, 'ProfessionalProfile'>;
type ProfessionalProfileNavigationProp = StackNavigationProp<HomeStackParamList, 'ProfessionalProfile'>;

// Service Types
interface BookingService extends Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string;
  is_online: boolean;
  price_online_15min: number;
  price_online_30min: number;
  price_online_60min: number;
  price_offline_15min: number;
  price_offline_30min: number;
  price_offline_60min: number;
}

// Component Props
interface ProfessionalProfileScreenProps {
  route: ProfessionalProfileRouteProp;
  navigation: ProfessionalProfileNavigationProp;
}

// State Types
interface ProfileState {
  data: ProfessionalAuthProfile | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
}

// Format work arrangement for display
const formatWorkArrangement = (arrangement?: WorkArrangement): string => {
  if (!arrangement) return '';
  
  switch (arrangement) {
    case WorkArrangement.FULL_TIME:
      return 'Full Time';
    case WorkArrangement.PART_TIME:
      return 'Part Time';
    case WorkArrangement.FREELANCE:
      return 'Freelance';
    case WorkArrangement.CONTRACT:
      return 'Contract';
    default:
      return String(arrangement);
  }
};

// Format role for display
const formatRole = (role?: string): string => {
  if (!role) return '';
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Skeleton Component
const SkeletonLoader = ({ style }: { style: ViewStyle }) => (
  <View style={[styles.skeleton, style]}>
    <View style={styles.shimmer} />
  </View>
);

const ProfessionalProfileScreen = ({ route, navigation }: ProfessionalProfileScreenProps) => {
  const { professionalId } = route.params;
  const [profileData, setProfileData] = useState<ProfessionalAuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Start fade in animation when data is loaded
  const startFadeIn = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const fetchProfessionalProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching profile for professional ID:', professionalId);
      
      // Use the getProfessionalProfile method to fetch the professional data
      const response = await apiService.getProfessionalProfile(professionalId);
      
      console.log('📦 API Response received:', response);
      
      if (!response) {
        throw new Error('No data received from the server');
      }

      const specialization =
        response.speciality_new?.name ||
        response.specialization ||
        (response as any).speciality ||
        undefined;

      // Map the response to match our ProfessionalAuthProfile type
      const profileData: ProfessionalAuthProfile = {
        professional_id:
          response.professional_id ||
          response.id ||
          parseInt(professionalId as string, 10),
        first_name: response.first_name || response.firstName || '',
        last_name: response.last_name || response.lastName || '',
        email: response.email || '',
        phone_number: response.phone || response.phoneNumber || '',
        dob: response.dob || new Date().toISOString().split('T')[0],
        pin_code: response.pin_code || response.pinCode || '',
        address: response.address || '',
        city: response.city || '',
        state: response.state || '',
        gender: response.gender || Gender.OTHER,
        location_latitude: response.location_latitude || response.location?.latitude?.toString() || null,
        location_longitude: response.location_longitude || response.location?.longitude?.toString() || null,
        adhaar_number: response.adhaar_number || response.adhaarNumber || '',
        photo_url: response.photo_url || response.profile_picture || response.profileImage || null,
        role: response.role || ProfessionalRole.YOGA_TEACHER,
        about: response.about || response.bio || 'No bio available',
        work_arrangement: response.work_arrangement || WorkArrangement.FREELANCE,
        language: response.language || (response.languages && response.languages[0]) || 'English',
        specialization,
        speciality: specialization,
        speciality_new_name: response.speciality_new?.name,
        created_at: response.created_at || response.createdAt || new Date().toISOString(),
        updated_at: response.updated_at || response.updatedAt || new Date().toISOString(),
      };

      console.log('✅ Profile data mapped successfully:', {
        professional_id: profileData.professional_id,
        name: `${profileData.first_name} ${profileData.last_name}`,
      });

      setProfileData(profileData);
      setError(null);
      startFadeIn();
    } catch (error) {
      console.error('❌ Error fetching professional profile:', error);
      setError('Failed to load professional profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [professionalId]);

  const handleBookAppointment = useCallback(async () => {
    console.log('📅 Book Appointment button pressed');
    
    if (!profileData || !profileData.professional_id) {
      console.log('❌ Cannot navigate: Missing profile data or professional_id', {
        hasProfileData: !!profileData,
        professionalId: profileData?.professional_id
      });
      Alert.alert('Error', 'Unable to book appointment. Please try again.');
      return;
    }
    
    console.log('✅ Profile data available, preparing navigation...');
    
    // Define default service details for booking
    const defaultService = {
      id: 'default_consultation',
      name: 'Standard Consultation',
      duration: 30,
      price: 0,
      description: 'Standard consultation session',
      is_online: true,
      price_online_15min: 0,
      price_online_30min: 0,
      price_online_60min: 0,
      price_offline_15min: 0,
      price_offline_30min: 0,
      price_offline_60min: 0,
    };
    
    const navigationParams = {
      professionalId: String(profileData.professional_id),
      professionalName: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
      serviceId: defaultService.id,
      serviceName: defaultService.name,
      price: defaultService.price,
      duration: defaultService.duration,
      serviceDetails: defaultService
    };
    
    console.log('🚀 Navigation params prepared:', navigationParams);
    
    try {
      console.log('🚀 Attempting to navigate to DateTimeSelection...');
      navigation.navigate('DateTimeSelection', navigationParams);
      console.log('✅ Navigation called successfully');
      
      // Add a small delay to check if navigation actually happens
      setTimeout(() => {
        console.log('🔍 Navigation check - 500ms after navigate call');
      }, 500);
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', 'Unable to proceed with booking. Please try again.');
    }
  }, [navigation, profileData]);

  useEffect(() => {
    fetchProfessionalProfile();
  }, [fetchProfessionalProfile]);

  // Skeleton Loader UI
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ScrollView style={styles.scrollView}>
          {/* Header Skeleton */}
          <View style={styles.headerSkeleton}>
            <SkeletonLoader style={styles.avatarSkeleton} />
            <View style={styles.headerTextSkeleton}>
              <SkeletonLoader style={styles.nameSkeleton} />
              <SkeletonLoader style={styles.specialtySkeleton} />
            </View>
          </View>
          
          {/* About Section Skeleton */}
          <View style={styles.section}>
            <SkeletonLoader style={styles.sectionTitleSkeleton} />
            <SkeletonLoader style={styles.aboutSkeleton} />
            <SkeletonLoader style={styles.aboutSkeleton} />
            <View style={styles.aboutSkeleton}>
              <View style={[styles.skeleton, { width: '60%', height: 16, borderRadius: 8 }]}>
                <View style={styles.shimmer} />
              </View>
            </View>
          </View>
          
          {/* Services Section Skeleton */}
          <View style={styles.section}>
            <SkeletonLoader style={styles.sectionTitleSkeleton} />
            <View style={styles.servicesContainer}>
              {[1, 2, 3].map((item) => (
                <SkeletonLoader key={item} style={styles.serviceCardSkeleton} />
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !profileData) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons 
          name="alert-circle-outline" 
          size={48} 
          color={theme.colors.error || '#FF3B30'} 
        />
        <Text style={styles.errorText}>{error || 'Failed to load professional profile'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfessionalProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // This check is redundant since we already check profileData in the error state
  // and show a loading indicator in the loading state

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        contentContainerStyle={styles.scrollViewContent}>
        
        {/* Header with back button */}
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {profileData.first_name} {profileData.last_name}
        </Text>

        <View style={styles.headerRight} />
      </View>

      {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileData.photo_url || DEFAULT_AVATAR }}
              style={styles.profileImage}
              resizeMode="cover"
              defaultSource={{ uri: DEFAULT_AVATAR }}
              accessibilityLabel={`${profileData.first_name}'s profile picture`}
              onError={(e) => {
                console.log('Error loading profile image:', e.nativeEvent.error);
                console.log('Falling back to default avatar for:', profileData.first_name);
                // Force fallback to default avatar
                e.currentTarget.setNativeProps({ 
                  source: { uri: DEFAULT_AVATAR } 
                });
              }}
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={2}>
              {profileData.first_name} {profileData.last_name}
            </Text>
            
            {profileData.role && (
              <Text style={styles.profession}>
                {formatRole(profileData.role)}
              </Text>
            )}

            <View style={styles.detailItem}>
              <Ionicons name="briefcase-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                {formatWorkArrangement(profileData.work_arrangement)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Ionicons name="language-outline" size={16} color="#666" />
              <Text style={styles.detailText}>
                Speaks {profileData.language || 'English'}
              </Text>
            </View>

            {(profileData.city || profileData.state) && (
              <View style={styles.detailItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.detailText} numberOfLines={2}>
                  {[profileData.city, profileData.state, profileData.pin_code]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* About Section */}
        {profileData.about ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.aboutText}>
                {profileData.about}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.sectionContent}>
            {profileData.email ? (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
                  {profileData.email}
                </Text>
              </View>
            ) : null}

            {profileData.phone_number ? (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText}>
                  {profileData.phone_number}
                </Text>
              </View>
            ) : null}

            {profileData.address ? (
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.contactText} numberOfLines={2}>
                  {[profileData.address, profileData.city, profileData.state, profileData.pin_code]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Fixed Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => {
            console.log('🔘 TouchableOpacity pressed');
            console.log('Profile Data:', !!profileData);
            console.log('Professional ID:', profileData?.professional_id);
            handleBookAppointment();
          }}
          activeOpacity={0.8}
          disabled={false}
          accessibilityRole="button"
          accessibilityLabel="Book a consultation"
          accessibilityHint="Double tap to book a consultation with this professional"
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}} // Increase touchable area
        >
          <Text style={styles.bookButtonText}>Book Consultation</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.white,
    paddingBottom: 100, // Add padding to prevent content from being hidden behind the fixed button
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.white,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error || '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionContent: {
    padding: 16,
    backgroundColor: theme.colors.background.white,
    borderRadius: 8,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  contactText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
    zIndex: 1000,
    elevation: 10,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bookButtonText: {
    color: theme.colors.background.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 90, // Match this with container's paddingBottom
  },
  scrollViewContent: {
    paddingBottom: 100, // Space for the fixed footer button
  },
  // Skeleton Loader Styles
  skeleton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8f8f8',
  },
  // Skeleton Layout
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerTextSkeleton: {
    marginLeft: 16,
    flex: 1,
  },
  nameSkeleton: {
    width: '60%',
    height: 24,
    marginBottom: 8,
    borderRadius: 4,
  },
  specialtySkeleton: {
    width: '80%',
    height: 16,
    borderRadius: 4,
  },
  section: {
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionTitleSkeleton: {
    width: '40%',
    height: 20,
    marginBottom: 16,
    borderRadius: 4,
  },
  aboutSkeleton: {
    width: '100%',
    height: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCardSkeleton: {
    width: '48%',
    height: 100,
    marginBottom: 16,
    borderRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        paddingTop: 10,
      },
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40, // Same as back button for balance
  },
  profileHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: '#f0f0f0',
  } as ImageStyle,
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profession: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detailText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E88E5',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  selectServiceButton: {
    backgroundColor: '#1E88E5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  selectServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  reviewsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  averageRatingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  // Review related styles
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  } as TextStyle,
  reviewRating: {
    flexDirection: 'row',
    marginBottom: 8,
  } as ViewStyle,
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  } as TextStyle,
  
  // Layout helpers
  bottomSpacing: {
    height: 100,
  } as ViewStyle,
  
});

export default ProfessionalProfileScreen;
