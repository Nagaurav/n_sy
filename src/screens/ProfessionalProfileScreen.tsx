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
      
      // Debug: Show all possible about-related fields in the raw data
      if (response.data) {
        const data = response.data;
        console.log('🔍 [ProfessionalProfile] ALL POSSIBLE ABOUT FIELDS:');
        Object.keys(data).forEach(key => {
          if (key.toLowerCase().includes('about') || 
              key.toLowerCase().includes('bio') || 
              key.toLowerCase().includes('description') || 
              key.toLowerCase().includes('summary') || 
              key.toLowerCase().includes('profile') ||
              key.toLowerCase().includes('intro')) {
            console.log(`  - ${key}:`, (data as any)[key]);
          }
        });
        
        // Debug: Check for the fields that should be included according to the API spec
        console.log('🔍 [ProfessionalProfile] EXPECTED API FIELDS:');
        console.log('  - educations:', (data as any).educations);
        console.log('  - experiences:', (data as any).experiences);
        console.log('  - certificates:', (data as any).certificates);
        console.log('  - achievements:', (data as any).achievements);
        console.log('  - yoga_plans:', (data as any).yoga_plans);
        console.log('  - speciality_new:', (data as any).speciality_new);
        
        // Debug: Check if any of these contain about/bio information
        const additionalFields = ['educations', 'experiences', 'certificates', 'achievements'];
        additionalFields.forEach(field => {
          const fieldData = (data as any)[field];
          if (fieldData && Array.isArray(fieldData)) {
            console.log(`🔍 [ProfessionalProfile] Checking ${field} for about info:`);
            fieldData.forEach((item: any, index: number) => {
              if (item.description || item.summary || item.details) {
                console.log(`  - ${field}[${index}].description:`, item.description);
                console.log(`  - ${field}[${index}].summary:`, item.summary);
                console.log(`  - ${field}[${index}].details:`, item.details);
              }
            });
          }
        });
      }
      
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
      console.log('  - about:', data.about);
      console.log('  - bio:', (data as any).bio);
      console.log('  - description:', (data as any).description);
      console.log('  - summary:', (data as any).summary);
      console.log('  - profile_summary:', (data as any).profile_summary);
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
      
      // Debug: Check all possible about fields specifically
      console.log('🔍 [ProfessionalProfile] ABOUT FIELD DEBUG:');
      console.log('  - data.about:', data.about);
      console.log('  - data.bio:', (data as any).bio);
      console.log('  - data.description:', (data as any).description);
      console.log('  - data.summary:', (data as any).summary);
      console.log('  - data.profile_summary:', (data as any).profile_summary);
      console.log('  - data.about type:', typeof data.about);
      console.log('  - data.bio type:', typeof (data as any).bio);
      console.log('  - data.description type:', typeof (data as any).description);
      console.log('  - data.summary type:', typeof (data as any).summary);
      console.log('  - data.profile_summary type:', typeof (data as any).profile_summary);
      
      // Check which field has actual content
      const aboutFields = [
        { name: 'about', value: data.about },
        { name: 'bio', value: (data as any).bio },
        { name: 'description', value: (data as any).description },
        { name: 'summary', value: (data as any).summary },
        { name: 'profile_summary', value: (data as any).profile_summary }
      ];
      
      const fieldWithContent = aboutFields.find(field => 
        field.value && typeof field.value === 'string' && field.value.trim().length > 0
      );
      
      console.log('🎯 [ProfessionalProfile] Field with content:', fieldWithContent);

      // Map the response to match our ProfessionalAuthProfile type
      const profileData: ProfessionalAuthProfile & {
        educations?: any[];
        experiences?: any[];
        certificates?: any[];
        achievements?: any[];
        yoga_plans?: any[];
      } = {
        professional_id:
          data.professional_id ||
          data.id ||
          parseInt(professionalId as string, 10),
        first_name: data.first_name || data.firstName || '',
        last_name: data.last_name || data.lastName || '',
        email: data.email || '',
        phone_number: data.phone || data.phoneNumber || '',
        rating: data.rating || 0,
        review_count: data.review_count || 0,
        starting_price: data.starting_price || 0,
        experience_years: (data as any).total_experience_years || 0,
        work_arrangement: (data.work_arrangement && Object.values(WorkArrangement).includes(data.work_arrangement as WorkArrangement)) 
          ? data.work_arrangement as WorkArrangement 
          : WorkArrangement.FREELANCE,
        language: data.language || (data.languages && data.languages[0]) || 'English',
        specialization,
        speciality: specialization,
        speciality_new_name: data.speciality_new?.name,
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
        about: data.about || 'No bio available',
        dob: data.dob || '',
        // ✅ ADDITIONAL SECTIONS - Using exact field names from API
        educations: (data as any).educations || [],
        experiences: (data as any).experiences || [],
        certificates: (data as any).certificates || [],
        achievements: (data as any).achievements || [],
        yoga_plans: (data as any).yoga_plans || [],
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
      console.log('  - Final about:', profileData.about);
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

  // Debug: Check component state before rendering
  console.log('🎨 [ProfessionalProfile] RENDER STATE DEBUG:');
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);
  console.log('  - profileData exists:', !!profileData);
  console.log('  - profileData keys:', profileData ? Object.keys(profileData) : 'none');
  console.log('  - profileData.name:', profileData ? `${profileData.first_name} ${profileData.last_name}` : 'none');

  // Loading state
  if (isLoading) {
    console.log('🔄 [ProfessionalProfile] Showing loading state');
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
    console.log('❌ [ProfessionalProfile] Showing error state:', error);
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

  console.log('✅ [ProfessionalProfile] Showing main content');
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#008272" />
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
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Professional Profile</Text>
          </View>
        </View>
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
          <View style={styles.profileCard}>
            
            {/* Header with Avatar and Basic Info */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: profileData?.photo_url || DEFAULT_AVATAR }}
                  style={styles.profileAvatar}
                  resizeMode="cover"
                />
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
              </View>
              
              <View style={styles.professionalInfo}>
                <Text style={styles.professionalName}>
                  {profileData?.first_name} {profileData?.last_name}
                </Text>
                <Text style={styles.professionalRole}>
                  {formatRole(profileData?.role || '')}
                </Text>
                
                {/* Rating and Experience */}
                <View style={styles.quickStats}>
                  {profileData?.rating ? (
                    <View style={styles.statItem}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.statText}>
                        {profileData.rating.toFixed(1)} ({profileData.review_count})
                      </Text>
                    </View>
                  ) : null}
                  
                  {profileData?.experience_years ? (
                    <View style={styles.statItem}>
                      <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                      <Text style={styles.statText}>
                        {profileData.experience_years} years
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            
            {/* Specialization */}
            {profileData?.specialization && (
              <View style={styles.specializationSection}>
                <Text style={styles.specializationLabel}>Specialization</Text>
                <View style={styles.specializationBadge}>
                  <Text style={styles.specializationText}>
                    {profileData?.specialization}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Pricing */}
            {profileData?.starting_price ? (
              <View style={styles.pricingSection}>
                <View style={styles.pricingInfo}>
                  <Ionicons name="pricetag-outline" size={16} color="#008272" />
                  <Text style={styles.pricingLabel}>Starting from</Text>
                </View>
                <Text style={styles.pricingAmount}>₹{profileData.starting_price}</Text>
              </View>
            ) : null}
          </View>

        {/* About Section */}
        <View style={styles.aboutCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#008272' + '20' }]}>
              <Ionicons name="person-outline" size={20} color="#008272" />
            </View>
            <Text style={styles.cardTitle}>About</Text>
          </View>
          
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.aboutText} numberOfLines={isExpanded ? undefined : 3}>
              {profileData?.about || 'No information available about this professional.'}
            </Text>
            {profileData?.about && profileData.about.length > 150 && (
              <Text style={styles.readMoreText}>
                {isExpanded ? 'Read less' : 'Read more'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Education Section */}
        <View style={styles.educationCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FF6B6B20' }]}>
              <Ionicons name="school-outline" size={20} color="#FF6B6B" />
            </View>
            <Text style={styles.cardTitle}>Education</Text>
          </View>
          
          {profileData?.educations && Array.isArray(profileData.educations) && profileData.educations.length > 0 ? (
            profileData.educations.map((edu: any, index: number) => (
              <View key={index} style={[
                styles.educationItem,
                index === profileData.educations.length - 1 && styles.lastItem
              ]}>
                <Text style={styles.educationTitle}>{edu.degree || edu.title || 'Education'}</Text>
                <Text style={styles.educationInstitution}>{edu.institution || edu.school || ''}</Text>
                <Text style={styles.educationYear}>{edu.year || edu.graduation_year || ''}</Text>
                {edu.description && (
                  <Text style={styles.educationDescription}>{edu.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No education data available</Text>
          )}
        </View>

        {/* Experience Section */}
        <View style={styles.experienceCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#4ECDC420' }]}>
              <Ionicons name="briefcase-outline" size={20} color="#4ECDC4" />
            </View>
            <Text style={styles.cardTitle}>Experience</Text>
          </View>
          
          {profileData?.experiences && Array.isArray(profileData.experiences) && profileData.experiences.length > 0 ? (
            profileData.experiences.map((exp: any, index: number) => (
              <View key={index} style={[
                styles.experienceItem,
                index === profileData.experiences.length - 1 && styles.lastItem
              ]}>
                <Text style={styles.experienceTitle}>{exp.position || exp.title || 'Experience'}</Text>
                <Text style={styles.experienceCompany}>{exp.company || exp.organization || ''}</Text>
                <Text style={styles.experienceDuration}>{exp.duration || exp.start_date && exp.end_date ? `${exp.start_date} - ${exp.end_date}` : ''}</Text>
                {exp.description && (
                  <Text style={styles.experienceDescription}>{exp.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No experience data available</Text>
          )}
        </View>

        {/* Certificates Section */}
        <View style={styles.certificatesCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#FFD93D20' }]}>
              <Ionicons name="award-outline" size={20} color="#FFD93D" />
            </View>
            <Text style={styles.cardTitle}>Certificates</Text>
          </View>
          
          {profileData?.certificates && Array.isArray(profileData.certificates) && profileData.certificates.length > 0 ? (
            profileData.certificates.map((cert: any, index: number) => (
              <View key={index} style={[
                styles.certificateItem,
                index === profileData.certificates.length - 1 && styles.lastItem
              ]}>
                <Text style={styles.certificateTitle}>{cert.name || cert.title || 'Certificate'}</Text>
                <Text style={styles.certificateIssuer}>{cert.issuer || cert.organization || ''}</Text>
                <Text style={styles.certificateDate}>{cert.date || cert.issue_date || cert.year || ''}</Text>
                {cert.description && (
                  <Text style={styles.certificateDescription}>{cert.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No certificates data available</Text>
          )}
        </View>

        {/* Achievements Section */}
        <View style={styles.achievementsCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#6C63FF20' }]}>
              <Ionicons name="trophy-outline" size={20} color="#6C63FF" />
            </View>
            <Text style={styles.cardTitle}>Achievements</Text>
          </View>
          
          {profileData?.achievements && Array.isArray(profileData.achievements) && profileData.achievements.length > 0 ? (
            profileData.achievements.map((ach: any, index: number) => (
              <View key={index} style={[
                styles.achievementItem,
                index === profileData.achievements.length - 1 && styles.lastItem
              ]}>
                <Text style={styles.achievementTitle}>{ach.title || ach.name || 'Achievement'}</Text>
                <Text style={styles.achievementYear}>{ach.year || ach.date || ''}</Text>
                {ach.description && (
                  <Text style={styles.achievementDescription}>{ach.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No achievements data available</Text>
          )}
        </View>

        {/* Yoga Plans Section */}
        <View style={styles.yogaPlansCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#00D9FF20' }]}>
              <Ionicons name="fitness-outline" size={20} color="#00D9FF" />
            </View>
            <Text style={styles.cardTitle}>Yoga Plans</Text>
          </View>
          
          {profileData?.yoga_plans && Array.isArray(profileData.yoga_plans) && profileData.yoga_plans.length > 0 ? (
            profileData.yoga_plans.map((plan: any, index: number) => (
              <View key={index} style={[
                styles.yogaPlanItem,
                index === profileData.yoga_plans.length - 1 && styles.lastItem
              ]}>
                <Text style={styles.yogaPlanTitle}>{plan.name || plan.title || 'Yoga Plan'}</Text>
                <Text style={styles.yogaPlanDuration}>{plan.duration || plan.sessions || ''}</Text>
                <Text style={styles.yogaPlanPrice}>{plan.price ? `$${plan.price}` : ''}</Text>
                {plan.description && (
                  <Text style={styles.yogaPlanDescription}>{plan.description}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noDataText}>No yoga plans data available</Text>
          )}
        </View>

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
            colors={['#008272', '#4C7360', '#2F5233']}
            style={styles.bookButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
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
  container: { flex: 1, backgroundColor: '#F5F2ED' },
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

  // Modern Header Styles - Green Theme
  header: { 
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
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
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButton: {
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
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Modern Card Styles
  scrollView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, padding: 16 },
  
  // Profile Card
  profileCard: {
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
    position: 'relative',
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  professionalInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  professionalName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  professionalRole: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  
  // Specialization Section
  specializationSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  specializationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  specializationBadge: {
    backgroundColor: '#008272' + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  specializationText: {
    fontSize: 14,
    color: '#008272',
    fontWeight: '600',
  },
  
  // Pricing Section
  pricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  pricingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pricingLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
  },
  pricingAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#008272',
  },
  
  // About Card
  aboutCard: {
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
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  readMoreText: {
    fontSize: 14,
    color: '#008272',
    fontWeight: '500',
    marginTop: 8,
  },
  
  // Contact Card
  contactCard: {
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
    padding: 16,
  },
  contactItems: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  // Footer Button
  footer: {
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  bookButton: {
    borderRadius: 12,
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  bottomSpacing: {
    height: 100,
  },
  
  // Modern Section Cards - Matching Profile Card Style
  educationCard: {
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
    padding: 16,
  },
  educationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  educationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  educationInstitution: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  educationDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Experience Section Styles
  experienceCard: {
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
    padding: 16,
  },
  experienceItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  experienceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  experienceCompany: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  experienceDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Certificates Section Styles
  certificatesCard: {
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
    padding: 16,
  },
  certificateItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  certificateIssuer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  certificateDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  certificateDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Achievements Section Styles
  achievementsCard: {
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
    padding: 16,
  },
  achievementItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  achievementYear: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Yoga Plans Section Styles
  yogaPlansCard: {
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
    padding: 16,
  },
  yogaPlanItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  yogaPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  yogaPlanDuration: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  yogaPlanPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008272',
    marginBottom: 4,
  },
  yogaPlanDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // No Data Text Style
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  
  // Last Item Style (to remove bottom border)
  lastItem: {
    borderBottomWidth: 0,
  },
});

export default ProfessionalProfileScreen;
