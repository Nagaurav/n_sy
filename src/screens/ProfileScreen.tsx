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
  const { user, signOut } = useAuth();
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
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>My Profile</Text>
            </View>
            
            <View style={styles.placeholderButton} />
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView 
        style={[styles.scrollView, { opacity: fadeAnim }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View style={[
          styles.card,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={profileData?.photo_url
                  ? { uri: profileData.photo_url }
                  : { uri: DEFAULT_AVATAR }
                }
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraButton} onPress={() => {
                console.log('📷 [ProfileScreen] Camera button pressed - TODO: Implement image upload');
                Alert.alert('Coming Soon', 'Profile photo upload will be available soon!');
              }}>
                <Ionicons name="camera" size={16} color={theme.colors.background.surface} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {profileData?.first_name || 'John'} {profileData?.last_name || 'Doe'}
              </Text>
              <Text style={styles.userEmail}>{profileData?.email || 'john.doe@example.com'}</Text>
              <Text style={styles.userPhone}>{profileData?.phone || '+1234567890'}</Text>
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={14} color={theme.colors.feedback.success} />
                <Text style={styles.verificationText}>Verified</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
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
        {profileData?.user_health && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Health Details</Text>
            </View>
            <InfoRow 
              label="Blood Group" 
              value={formatBloodGroup(profileData.user_health.blood_group)} 
            />
            <InfoRow 
              label="Marital Status" 
              value={formatMaritalStatus(profileData.user_health.marital_status)} 
            />
            <InfoRow 
              label="Height" 
              value={profileData.user_health.height ? `${profileData.user_health.height} cm` : 'Not specified'} 
            />
            <InfoRow 
              label="Weight" 
              value={profileData.user_health.weight ? `${profileData.user_health.weight} kg` : 'Not specified'} 
            />
            {profileData.user_health.height && profileData.user_health.weight && (
              <InfoRow 
                label="BMI" 
                value={calculateBMI(profileData.user_health.height, profileData.user_health.weight)} 
              />
            )}
          </View>
        )}

        {/* Emergency Contact Card */}
        {profileData?.user_health?.emergency_contact_name && (
          <View style={[styles.card, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="call-outline" size={20} color="#EF4444" />
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
          </View>
        )}

        {/* Account Preferences Card */}
        {profileData?.user_health && (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="settings-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Account Preferences</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.label}>Account Status</Text>
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
            </View>

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

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
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
            <Ionicons name="create-outline" size={20} color={theme.colors.background.surface} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.editButton, styles.signOutButton]}
            onPress={() => {
              console.log('🚪 [ProfileScreen] Sign Out button pressed');
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Sign Out', 
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await signOut();
                        console.log('✅ [ProfileScreen] User signed out successfully');
                      } catch (error) {
                        console.error('❌ [ProfileScreen] Error signing out:', error);
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.colors.background.surface} />
            <Text style={styles.editButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

// InfoRow component for consistent info display
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value} numberOfLines={2} ellipsizeMode="tail">
      {value || 'Not specified'}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
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
    backgroundColor: '#f8fafc',
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
  
  // Modern Header Styles
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    letterSpacing: -0.5,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
  topCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: -40,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  
  // Content Styles
  scrollView: {
    flex: 1,
    padding: 20,
  },
  
  // Card Styles
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  
  // Profile Header Styles
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.background.surface,
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
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: theme.colors.text.secondary,
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
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  signOutButton: {
    backgroundColor: theme.colors.feedback.error,
  },
  editButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
