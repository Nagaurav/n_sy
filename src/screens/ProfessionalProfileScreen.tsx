import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Platform,
  Alert,
  Animated,
  Share,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

// Services
import { professionalService } from '../services';

// Types
import { 
  ProfessionalAuthProfile, 
  Gender, 
  WorkArrangement, 
  ProfessionalRole,
} from '../types';
import type { HomeStackParamList } from '../types/navigation';
import type { RootStackParamList } from '../../App';

// Theme
import { theme } from '../theme';

// Constants
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMGMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';
const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.35;

// Navigation Types
type ProfessionalProfileRouteProp = RouteProp<HomeStackParamList, 'ProfessionalProfile'>;
type ProfessionalProfileNavigationProp = StackNavigationProp<RootStackParamList>;

// Component Props
interface ProfessionalProfileScreenProps {
  route: ProfessionalProfileRouteProp;
  navigation: ProfessionalProfileNavigationProp;
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

const ProfessionalProfileScreen: React.FC<ProfessionalProfileScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { professionalId } = route.params as { professionalId: string };
  const [profileData, setProfileData] = useState<ProfessionalAuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;

  // Fetch professional profile data
  const fetchProfessionalProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching profile for professional ID:', professionalId);
      
      const response = await professionalService.getProfile(professionalId);
      
      console.log('📦 API Response received:', response);
      
      if (!response.success || !response.data) {
        throw new Error('No data received from the server');
      }

      const data = response.data;
      const specialization =
        data.speciality_new?.name ||
        data.specialization ||
        (data as any).speciality ||
        undefined;

      // Map the response to match our ProfessionalAuthProfile type
      const profileData: ProfessionalAuthProfile = {
        professional_id:
          data.professional_id ||
          data.id ||
          parseInt(professionalId as string, 10),
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || '',
        phone_number: data.phone || data.phoneNumber || '',
        dob: data.dob || new Date().toISOString().split('T')[0],
        pin_code: data.pin_code || data.pinCode || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        gender: data.gender || Gender.OTHER,
        location_latitude: data.location_latitude || data.location?.latitude?.toString() || null,
        location_longitude: data.location_longitude || data.location?.longitude?.toString() || null,
        adhaar_number: data.adhaar_number || data.adhaarNumber || '',
        photo_url: data.photo_url || data.profile_picture || data.profileImage || null,
        role: data.role || ProfessionalRole.YOGA_TEACHER,
        about: data.about || data.bio || 'No bio available',
        work_arrangement: (data.work_arrangement && Object.values(WorkArrangement).includes(data.work_arrangement as WorkArrangement)) 
          ? data.work_arrangement as WorkArrangement 
          : WorkArrangement.FREELANCE,
        language: data.language || (data.languages && data.languages[0]) || 'English',
        specialization,
        speciality: specialization,
        speciality_new_name: data.speciality_new?.name,
        // ✅ NEW FIELDS FROM BACKEND
        rating: data.rating || 0,
        review_count: data.review_count || 0,
        starting_price: data.starting_price || 0,
        experience_years: data.experience_years || 0,
        created_at: data.created_at || data.createdAt || new Date().toISOString(),
        updated_at: data.updated_at || data.updatedAt || new Date().toISOString(),
      };

      console.log('✅ Profile data mapped successfully:', {
        professional_id: profileData.professional_id,
        name: `${profileData.first_name} ${profileData.last_name}`,
      });

      setProfileData(profileData);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching professional profile:', error);
      setError('Failed to load professional profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [professionalId]);

  // Handle book appointment button press
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
    
    // ✅ USE REAL BACKEND PRICE
    const defaultService = {
      id: 'default_consultation',
      name: 'Standard Consultation',
      duration: 60, 
      price: profileData.starting_price || 500, // Fallback to 500 if 0
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
      serviceDetails: {
        id: defaultService.id,
        name: defaultService.name,
        duration: defaultService.duration,
        price: defaultService.price
      }
    };
    
    console.log('🚀 Navigation params prepared:', navigationParams);
    
    try {
      console.log('🚀 Attempting to navigate to SelectTime...');
      
      // Navigate to SelectTime using parent navigation
      navigation.getParent()?.navigate('SelectTime', navigationParams);
      console.log('✅ Navigation called successfully');
      
    } catch (error) {
      console.error('❌ Navigation error:', error);
      Alert.alert('Error', 'Unable to proceed with booking. Please try again.');
    }
  }, [navigation, profileData]);

  // Load data on component mount
  useEffect(() => {
    fetchProfessionalProfile();
  }, [fetchProfessionalProfile]);

  // Handle share functionality
  const handleShare = useCallback(async () => {
    if (!profileData) return;
    
    try {
      const result = await Share.share({
        message: `Check out ${profileData.first_name} ${profileData.last_name}, ${formatRole(profileData.role)} at SamyaYog`,
        url: `samyayog://professional/${profileData.professional_id}`,
      });
    } catch (error) {
      console.error('Error sharing profile:', error);
    }
  }, [profileData]);

  // Handle contact actions
  const handleContact = useCallback((type: 'email' | 'phone' | 'location') => {
    if (!profileData) return;
    
    switch (type) {
      case 'email':
        if (profileData.email) {
          Linking.openURL(`mailto:${profileData.email}`);
        }
        break;
      case 'phone':
        if (profileData.phone_number) {
          Linking.openURL(`tel:${profileData.phone_number}`);
        }
        break;
      case 'location':
        if (profileData.address) {
          const address = [profileData.address, profileData.city, profileData.state]
            .filter(Boolean)
            .join(', ');
          Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`);
        }
        break;
    }
  }, [profileData]);

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>Failed to load profile</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfessionalProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.header,
        {
          height: scrollY.interpolate({
            inputRange: [0, HEADER_HEIGHT - 100],
            outputRange: [HEADER_HEIGHT, 100],
            extrapolate: 'clamp',
          }),
        },
      ]}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.gradientHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back and Share buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShare}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          {/* Profile Info */}
          <Animated.View style={[
            styles.profileInfo,
            {
              opacity: scrollY.interpolate({
                inputRange: [0, HEADER_HEIGHT / 2],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              }),
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [0, HEADER_HEIGHT / 2],
                    outputRange: [0, -20],
                    extrapolate: 'clamp',
                  }),
                },
              ],
            },
          ]}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ uri: profileData?.photo_url || DEFAULT_AVATAR }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <View style={styles.statusIndicator} />
            </View>
            
            <Animated.Text style={styles.profileName} numberOfLines={1}>
              {profileData?.first_name} {profileData?.last_name}
            </Animated.Text>
            
            {profileData?.role && (
              <Text style={styles.profession}>
                {formatRole(profileData.role)}
              </Text>
            )}

            {/* ✅ RATING SECTION */}
            {profileData?.rating ? (
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>
                  {profileData.rating.toFixed(1)} 
                  <Text style={styles.reviewCountText}> ({profileData.review_count} reviews)</Text>
                </Text>
              </View>
            ) : null}
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="briefcase-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{formatWorkArrangement(profileData?.work_arrangement)}</Text>
            <Text style={styles.statLabel}>Work Type</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue}>{profileData?.language || 'English'}</Text>
            <Text style={styles.statLabel}>Language</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Ionicons name="location-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.statValue} numberOfLines={1}>
              {[profileData?.city, profileData?.state]
                .filter(Boolean)
                .join(', ') || 'Remote'}
            </Text>
            <Text style={styles.statLabel}>Location</Text>
          </View>
        </View>

        {/* About Section */}
        {profileData?.about && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>About</Text>
            </View>
            
            <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
              <Text style={styles.aboutText} numberOfLines={isExpanded ? undefined : 3}>
                {profileData?.about}
              </Text>
              {profileData?.about && profileData.about.length > 150 && (
                <Text style={styles.readMoreText}>
                  {isExpanded ? 'Read less' : 'Read more'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Get in Touch</Text>
          </View>
          
          {profileData?.email && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('email')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={20} color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
                  {profileData?.email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {profileData?.phone_number && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('phone')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={20} color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactText}>
                  {profileData?.phone_number}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {profileData?.address && (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleContact('location')}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="location-outline" size={20} color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Address</Text>
                <Text style={styles.contactText} numberOfLines={2}>
                  {[profileData?.address, profileData?.city, profileData?.state, profileData?.pin_code]
                    .filter(Boolean)
                    .join(', ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Specialization */}
        {profileData?.specialization && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Specialization</Text>
            </View>
            
            <View style={styles.specializationBadge}>
              <Text style={styles.specializationText}>
                {profileData?.specialization}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookAppointment}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            style={styles.bookButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.bookButtonText}>
              Book Consultation
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background.surface,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.m,
  },
  retryButtonText: {
    color: theme.colors.background.surface,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'System',
  },
  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  gradientHeader: {
    flex: 1,
    marginTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.l,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    paddingTop: theme.spacing.s,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.xs,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.background.surface,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.background.surface,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.background.surface,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    letterSpacing: 0.3,
    fontFamily: 'System',
  },
  profession: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'System',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.m,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: '#FFF',
    fontWeight: '700',
    marginLeft: 4,
    fontSize: 14,
  },
  reviewCountText: {
    fontWeight: '400',
    fontSize: 12,
    opacity: 0.9,
  },
  // Content
  scrollView: {
    flex: 1,
    marginTop: HEADER_HEIGHT,
  },
  scrollViewContent: {
    paddingBottom: 140,
    paddingTop: theme.spacing.m,
  },
  // Stats
  statsContainer: {
    backgroundColor: theme.colors.background.surface,
    marginHorizontal: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...theme.shadows.card,
    marginBottom: theme.spacing.m,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: 'System',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: theme.spacing.m,
  },
  // Sections
  section: {
    backgroundColor: theme.colors.background.surface,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    ...theme.shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.s,
    fontFamily: 'System',
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text.primary,
    fontFamily: 'System',
    textAlign: 'justify',
  },
  readMoreText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
    marginTop: theme.spacing.s,
    fontFamily: 'System',
  },
  // Contact
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginBottom: 2,
    fontFamily: 'System',
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
    fontFamily: 'System',
  },
  // Specialization
  specializationBadge: {
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  specializationText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    fontFamily: 'System',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: theme.spacing.m,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  bookButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.large,
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    gap: theme.spacing.xs,
  },
  bookButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'System',
    textTransform: 'uppercase',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfessionalProfileScreen;
