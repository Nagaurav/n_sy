import React, { useState, useEffect, useCallback } from 'react';
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
  ImageStyle,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Services
import { professionalService } from '../services';

// Types
import { 
  ProfessionalAuthProfile, 
  Gender, 
  WorkArrangement, 
  ProfessionalRole,
  Service
} from '../types';
import type { HomeStackParamList } from '../types/navigation';
import type { RootStackParamList } from '../../App';

// Theme
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';

// Constants
const DEFAULT_AVATAR = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';
const { width } = Dimensions.get('window');

// Navigation Types
type ProfessionalProfileRouteProp = RouteProp<HomeStackParamList, 'ProfessionalProfile'>;
type ProfessionalProfileNavigationProp = StackNavigationProp<RootStackParamList>;

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

const ProfessionalProfileScreen: React.FC<ProfessionalProfileScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { professionalId } = route.params;
  const [profileData, setProfileData] = useState<ProfessionalAuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        work_arrangement: data.work_arrangement || WorkArrangement.FREELANCE,
        language: data.language || (data.languages && data.languages[0]) || 'English',
        specialization,
        speciality: specialization,
        speciality_new_name: data.speciality_new?.name,
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

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.errorContainer}>
          <Ionicons 
            name="alert-circle-outline" 
            size={48} 
            color={theme.colors.error || '#FF3B30'} 
          />
          <Text style={styles.errorText}>{error || 'Failed to load professional profile'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProfessionalProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header with back button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {profileData.first_name} {profileData.last_name}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: profileData.photo_url || DEFAULT_AVATAR }}
              style={styles.profileImage}
              resizeMode="cover"
              defaultSource={{ uri: DEFAULT_AVATAR }}
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

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Ionicons name="briefcase-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailText}>
                  {formatWorkArrangement(profileData.work_arrangement)}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Ionicons name="language-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.detailText}>
                  {profileData.language || 'English'}
                </Text>
              </View>

              {(profileData.city || profileData.state) && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {[profileData.city, profileData.state]
                      .filter(Boolean)
                      .join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* About Section */}
        {profileData.about && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>
              {profileData.about}
            </Text>
          </View>
        )}

        {/* Contact Information Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          {profileData.email && (
            <View style={styles.contactItem}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText} numberOfLines={1} ellipsizeMode="tail">
                {profileData.email}
              </Text>
            </View>
          )}

          {profileData.phone_number && (
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText}>
                {profileData.phone_number}
              </Text>
            </View>
          )}

          {profileData.address && (
            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.contactText} numberOfLines={2}>
                {[profileData.address, profileData.city, profileData.state, profileData.pin_code]
                  .filter(Boolean)
                  .join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom spacing for button */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Fixed Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookAppointment}
          activeOpacity={0.8}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
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
    backgroundColor: '#f5f7fa',
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
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error || '#FF3B30',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'System',
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
    fontFamily: 'System',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
    fontFamily: 'System',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120,
  },
  profileHeaderCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 32,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    backgroundColor: '#f8f9fa',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  } as ImageStyle,
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
    fontFamily: 'System',
  },
  profession: {
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 20,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: 'System',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
    fontFamily: 'System',
  },
  sectionCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 0,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 0,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
    letterSpacing: 0.3,
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
    paddingBottom: 12,
    fontFamily: 'System',
    position: 'relative',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 28,
    color: '#475569',
    letterSpacing: 0.2,
    fontFamily: 'System',
    textAlign: 'justify',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactText: {
    marginLeft: 14,
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    fontFamily: 'System',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
    zIndex: 1,
    elevation: 1,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    marginHorizontal: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
    fontFamily: 'System',
    textTransform: 'uppercase',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfessionalProfileScreen;