import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services';
import { UserProfileData, UserHealthProfile } from '../types/userProfile';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

// Simple inline SVG avatar fallback to avoid missing local asset
const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDHoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';

// Helper function to calculate BMI
const calculateBMI = (height: number | null, weight: number | null): string => {
  if (!height || !weight) return 'Not specified';
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return bmi.toFixed(1);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  if (!dateString) return 'Not specified';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Helper function to format blood group
const formatBloodGroup = (bloodGroup: string) => {
  if (!bloodGroup) return 'Not specified';
  return bloodGroup
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to format marital status
const formatMaritalStatus = (status: string) => {
  if (!status) return 'Not specified';
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const ProfileScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const fetchProfile = useCallback(async () => {
    console.log('🔍 [ProfileScreen] Fetching profile data...');
    console.log('🔍 [ProfileScreen] User object:', user);
    
    try {
      const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
      console.log('🔍 [ProfileScreen] Extracted userId:', userId);
      
      if (!userId) {
        console.error('❌ [ProfileScreen] User ID not found in user object:', Object.keys(user || {}));
        throw new Error('User ID not found');
      }
      
      console.log('📡 [ProfileScreen] Making API call to get profile for userId:', userId);
      const response = await authService.getCurrentUser(String(userId));
      console.log('📡 [ProfileScreen] API response received:', {
        success: response.success,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        fullResponse: response
      });
      
      // Extract user data from nested response structure
      const userData = response.data?.user || response.data;
      console.log('📊 [ProfileScreen] Extracted userData:', userData);
      console.log('📊 [ProfileScreen] Profile data details:', {
        first_name: userData?.first_name,
        last_name: userData?.last_name,
        email: userData?.email,
        phone: userData?.phone,
        user_health: userData?.user_health
      });
      
      setProfileData(userData);
      setError(null);
      console.log('✅ [ProfileScreen] Profile data loaded successfully');
    } catch (err: any) {
      console.error('❌ [ProfileScreen] Error fetching profile:', {
        error: err,
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    console.log('🔄 [ProfileScreen] useEffect triggered, user changed:', !!user);
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);
  
  // Start entrance animation when data loads
  useEffect(() => {
    if (!isLoading && profileData) {
      console.log('🎬 [ProfileScreen] Starting entrance animation');
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
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, profileData, fadeAnim, slideAnim, scaleAnim]);

  const onRefresh = useCallback(() => {
    console.log('🔄 [ProfileScreen] User triggered refresh');
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={48} color={theme.colors.feedback.error} />
          </View>
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={20} color={theme.colors.background.surface} />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.headerTitle}>My Profile</Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
      </LinearGradient>

      {/* Content */}
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
          }
        >
          {/* Profile Info Card */}
          <View style={styles.profileCard}>
            {/* Header with Avatar and Basic Info */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={profileData?.photo_url
                    ? { uri: profileData.photo_url }
                    : { uri: DEFAULT_AVATAR }
                  }
                  style={styles.profileAvatar}
                  resizeMode="cover"
                />
                <TouchableOpacity style={styles.cameraButton} onPress={() => {
                  console.log('📷 [ProfileScreen] Camera button pressed - TODO: Implement image upload');
                  Alert.alert('Coming Soon', 'Profile photo upload will be available soon!');
                }}>
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </View>
              </View>
              
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {profileData?.first_name || 'John'} {profileData?.last_name || 'Doe'}
                </Text>
                <Text style={styles.profileEmail}>{profileData?.email || 'john.doe@example.com'}</Text>
                <Text style={styles.profilePhone}>{profileData?.phone || '+1234567890'}</Text>
                
                {/* Verification Badge */}
                <View style={styles.verificationBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={theme.colors.feedback.success} />
                  <Text style={styles.verificationText}>Verified Account</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Personal Details Card */}
          <View style={styles.personalDetailsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: '#008272' + '20' }]}>
                <Ionicons name="person-outline" size={20} color="#008272" />
              </View>
              <Text style={styles.cardTitle}>Personal Details</Text>
            </View>
            
            <InfoRow label="Date of Birth" value={profileData?.dob ? formatDate(profileData.dob) : 'Not specified'} />
            <InfoRow label="Gender" value={profileData?.gender ? profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1).toLowerCase() : 'Not specified'} />
            <InfoRow label="City" value={profileData?.city || 'Not specified'} />
            {profileData?.address && (
              <InfoRow label="Address" value={profileData?.address} />
            )}
            {profileData?.pin_code && (
              <InfoRow label="PIN Code" value={profileData?.pin_code} />
            )}
          </View>

          {/* Health Details Card */}
          <View style={styles.healthDetailsCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: '#FF6B6B20' }]}>
                <Ionicons name="heart-outline" size={20} color="#FF6B6B" />
              </View>
              <Text style={styles.cardTitle}>Health Details</Text>
            </View>
            
            <InfoRow 
              label="Blood Group" 
              value={formatBloodGroup(profileData?.user_health?.blood_group || '')} 
            />
            <InfoRow 
              label="Marital Status" 
              value={formatMaritalStatus(profileData?.user_health?.marital_status || '')} 
            />
            <InfoRow 
              label="Height" 
              value={profileData?.user_health?.height ? `${profileData.user_health.height} cm` : 'Not specified'} 
            />
            <InfoRow 
              label="Weight" 
              value={profileData?.user_health?.weight ? `${profileData.user_health.weight} kg` : 'Not specified'} 
            />
            {profileData?.user_health?.height && profileData?.user_health?.weight && (
              <InfoRow 
                label="BMI" 
                value={calculateBMI(profileData.user_health.height, profileData.user_health.weight)} 
              />
            )}
          </View>

          {/* Emergency Contact Card */}
          {profileData?.user_health?.emergency_contact_name && (
            <View style={styles.emergencyContactCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#EF444420' }]}>
                  <Ionicons name="call-outline" size={20} color="#EF4444" />
                </View>
                <Text style={styles.cardTitle}>Emergency Contact</Text>
              </View>
              
              <InfoRow 
                label="Name" 
                value={profileData.user_health.emergency_contact_name} 
              />
              <InfoRow 
                label="Phone" 
                value={profileData.user_health.emergency_contact_phone || 'Not specified'} 
              />
              
              {/* Quick Call Button */}
              {profileData.user_health.emergency_contact_phone && (
                <TouchableOpacity 
                  style={styles.quickCallButton}
                  onPress={() => Linking.openURL(`tel:${profileData.user_health.emergency_contact_phone}`)}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.quickCallText}>Call Emergency Contact</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Account Preferences Card */}
          {profileData?.user_health && (
            <View style={styles.accountPreferencesCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: '#4ECDC420' }]}>
                  <Ionicons name="settings-outline" size={20} color="#4ECDC4" />
                </View>
                <Text style={styles.cardTitle}>Account Preferences</Text>
              </View>
              
              <InfoRow 
                label="Account Status" 
                value={
                  <View style={{ 
                    backgroundColor: profileData.user_health.is_active ? '#DCFCE7' : '#FEE2E2',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4
                  }}>
                    <Text style={{ 
                      color: profileData.user_health.is_active ? '#166534' : '#991B1B',
                      fontSize: 12,
                      fontWeight: '600'
                    }}>
                      {profileData.user_health.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </Text>
                  </View>
                } 
              />
              <InfoRow 
                label="Notifications" 
                value={profileData.user_health.notifications_enabled ? 'Enabled' : 'Disabled'} 
              />
              <InfoRow 
                label="Newsletter" 
                value={profileData.user_health.newsletter_enabled ? 'Subscribed' : 'Unsubscribed'} 
              />
            </View>
          )}

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </Animated.View>

      {/* Footer Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            console.log('✏️ [ProfileScreen] Edit Profile button pressed');
            if (profileData) {
              (navigation as any).navigate('HomeStack', {
                screen: 'EditProfile',
                params: { currentUser: profileData },
              });
            }
          }}
        >
          <LinearGradient
            colors={['#008272', '#4C7360', '#2F5233']}
            style={styles.editButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="create-outline" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// InfoRow component for consistent info display
const InfoRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    {typeof value === 'string' ? (
      <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
        {value || 'Not specified'}
      </Text>
    ) : (
      <View style={styles.valueContainer}>{value}</View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F2ED' },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F2ED',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#F5F2ED',
  },
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.background.surface,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  // Modern Header Styles - Green Theme (matching ProfessionalProfileScreen)
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
  placeholderButton: {
    width: 44,
    height: 44,
  },
  
  // Content Styles
  scrollView: { flex: 1 },
  scrollViewContent: { flexGrow: 1, padding: 16 },
  
  // Profile Card (matching ProfessionalProfileScreen)
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
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.surface,
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
  profileInfo: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.feedback.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: 12,
    color: theme.colors.feedback.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  // Modern Card Styles (matching ProfessionalProfileScreen)
  personalDetailsCard: {
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
  healthDetailsCard: {
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
  emergencyContactCard: {
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
  accountPreferencesCard: {
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
  
  // Card Header Styles
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
  
  // Info Row Styles
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  label: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    fontWeight: '500',
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: theme.colors.text.primary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  
  // Quick Call Button
  quickCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  quickCallText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Footer Action Buttons (matching ProfessionalProfileScreen)
  footer: {
    padding: 16,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  editButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Bottom spacing
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;
