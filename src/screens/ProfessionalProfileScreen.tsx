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
  RefreshControl,
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
import { useTheme } from '../contexts/ThemeContext';

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
  const { theme: appTheme } = useTheme();
  const [profileData, setProfileData] = useState<ProfessionalAuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Fetch professional profile data
  const fetchProfessionalProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 [ProfessionalProfile] Fetching profile for professional ID:', professionalId);
      console.log('🔍 [ProfessionalProfile] API Endpoint:', `/user/professional/getProfessional?id=${professionalId}`);
      
      const response = await professionalService.getProfile(professionalId);
      
      console.log('📦 [ProfessionalProfile] Raw API Response:', JSON.stringify(response, null, 2));
      console.log('📊 [ProfessionalProfile] Response Success:', response.success);
      console.log('📊 [ProfessionalProfile] Response Data Keys:', response.data ? Object.keys(response.data) : 'No data');
      
      if (!response.success || !response.data) {
        console.log('❌ [ProfessionalProfile] API Response Error:', response);
        throw new Error('No data received from the server');
      }

      const data = response.data;
      console.log('🔍 [ProfessionalProfile] Processing data fields:');
      console.log('  - professional_id:', data.professional_id || data.id);
      console.log('  - first_name:', data.first_name || data.firstName);
      console.log('  - last_name:', data.last_name || data.lastName);
      console.log('  - email:', data.email);
      console.log('  - phone:', data.phone || data.phoneNumber);
      console.log('  - rating:', data.rating);
      console.log('  - review_count:', data.review_count);
      console.log('  - starting_price:', data.starting_price);
      console.log('  - experience_years:', data.experience_years);
      console.log('  - work_arrangement:', data.work_arrangement);
      console.log('  - language:', data.language);
      console.log('  - specialization:', data.specialization);
      console.log('  - speciality_new:', data.speciality_new);
      console.log('  - about:', data.about || data.bio);
      console.log('  - photo_url:', data.photo_url || data.profile_picture);
      console.log('  - address:', data.address);
      console.log('  - city:', data.city);
      console.log('  - state:', data.state);
      console.log('  - pin_code:', data.pin_code || data.pinCode);
      console.log('  - role:', data.role);
      console.log('  - created_at:', data.created_at || data.createdAt);
      console.log('  - updated_at:', data.updated_at || data.updatedAt);
      
      const specialization =
        data.speciality_new?.name ||
        data.specialization ||
        (data as any).speciality ||
        undefined;

      console.log('🎯 [ProfessionalProfile] Final specialization:', specialization);

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

      console.log('✅ [ProfessionalProfile] Profile data mapped successfully:');
      console.log('  - Final professional_id:', profileData.professional_id);
      console.log('  - Final name:', `${profileData.first_name} ${profileData.last_name}`);
      console.log('  - Final rating:', profileData.rating);
      console.log('  - Final review_count:', profileData.review_count);
      console.log('  - Final starting_price:', profileData.starting_price);
      console.log('  - Final experience_years:', profileData.experience_years);
      console.log('  - Final work_arrangement:', profileData.work_arrangement);
      console.log('  - Final language:', profileData.language);
      console.log('  - Final specialization:', profileData.specialization);
      console.log('  - Final about length:', profileData.about?.length || 0);
      console.log('  - Final photo_url:', profileData.photo_url);

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
    console.log('📅 [ProfessionalProfile] Book Appointment button pressed');
    console.log('📊 [ProfessionalProfile] Profile data check:', {
      hasProfileData: !!profileData,
      professionalId: profileData?.professional_id,
      professionalName: profileData ? `${profileData.first_name} ${profileData.last_name}` : 'N/A',
      startingPrice: profileData?.starting_price,
      experience: profileData?.experience_years,
      rating: profileData?.rating
    });
    
    if (!profileData || !profileData.professional_id) {
      console.log('❌ [ProfessionalProfile] Cannot navigate: Missing profile data or professional_id', {
        hasProfileData: !!profileData,
        professionalId: profileData?.professional_id
      });
      Alert.alert('Error', 'Unable to book appointment. Please try again.');
      return;
    }
    
    console.log('✅ [ProfessionalProfile] Profile data available, preparing navigation...');
    
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
    
    console.log('💰 [ProfessionalProfile] Service data prepared:', {
      serviceName: defaultService.name,
      servicePrice: defaultService.price,
      backendPrice: profileData.starting_price,
      usingFallback: !profileData.starting_price || profileData.starting_price === 0
    });
    
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
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
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
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
      <LinearGradient 
        colors={[appTheme.colors.primary, appTheme.colors.secondary]}
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Professional Profile</Text>
            <Text style={styles.headerSubtitle}>View professional details</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleShare}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchProfessionalProfile} />
          }
        >
          {/* Profile Info Card */}
          <View style={[styles.card, { borderLeftColor: theme.colors.primary, borderLeftWidth: 5 }]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {profileData?.first_name} {profileData?.last_name}
                </Text>
                <Text style={styles.sub}>
                  {formatRole(profileData?.role || '')}
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                <Ionicons name="person" size={14} color={theme.colors.primary} />
                <Text style={[styles.typeText, { color: theme.colors.primary }]}>PRO</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              {/* Profile Image and Basic Info */}
              <View style={styles.profileSection}>
                <Image
                  source={{ uri: profileData?.photo_url || DEFAULT_AVATAR }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
                <View style={styles.profileInfo}>
                  {/* Rating */}
                  {profileData?.rating ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={styles.ratingText}>
                        {profileData.rating.toFixed(1)} ({profileData.review_count} reviews)
                      </Text>
                    </View>
                  ) : null}
                  
                  {/* Experience */}
                  {profileData?.experience_years ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="briefcase-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Experience: </Text>
                        {profileData.experience_years} years
                      </Text>
                    </View>
                  ) : null}
                  
                  {/* Starting Price */}
                  {profileData?.starting_price ? (
                    <View style={styles.detailRow}>
                      <Ionicons name="pricetag-outline" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Starting from: </Text>
                        ₹{profileData.starting_price}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: theme.colors.primary }]}>
                {profileData?.specialization || 'General Practice'}
              </Text>
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
      </Animated.View>

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
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
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
    color: '#fff',
    fontWeight: '600',
  },

  // Consistent Header Styles (matching AppointmentsScreen)
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: theme.colors.background.surface, 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: theme.colors.background.surface,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  topCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomWave: {
    position: 'absolute',
    bottom: -20,
    left: -50,
    right: -50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },

  // Consistent Card Styles (matching AppointmentsScreen)
  scrollView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, padding: 16 },
  card: { 
    backgroundColor: theme.colors.background.surface, 
    marginBottom: 16, 
    borderRadius: theme.borderRadius.l, 
    padding: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  sub: { fontSize: 14, color: theme.colors.text.secondary },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' },
  cardContent: {
    marginBottom: 8,
  },

  // Profile Specific Styles
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
    marginLeft: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },

  // Section Styles
  section: {
    backgroundColor: theme.colors.background.surface,
    marginBottom: 16,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginLeft: 8,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 8,
  },

  // Contact Styles
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },

  // Specialization Badge
  specializationBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  specializationText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
  },
  bookButton: {
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ProfessionalProfileScreen;
