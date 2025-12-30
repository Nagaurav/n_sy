import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import { UserProfileData, UserHealthProfile } from '../types/userProfile';
import { theme } from '../theme';

// Simple inline SVG avatar fallback to avoid missing local asset
const DEFAULT_AVATAR =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0yMCAyMWMtMi4yIDAtNC0xLjgtNC00dj0xYzAtLjYtLjQtMS0xLTFjLS42IDAtMSAuNC0xIDF2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDEuMS0uOSAyLTIgMnMtMi0uOS0yLTJ2LTFjMC0xLjYtMS4zLTMtMy0zYy0xLjYgMC0zIDEuMy0zIDN2MWMwIDIuMiAxLjggNCA0IDRoMTZ6Ii8+PHBhdGggZD0iTTEyIDExYzIuOCAwIDUtMi4yIDUtNXMtMi4yLTUtNS01cy01IDIuMi01IDUgMi4yIDUgNSA1eiIvPjwvc3ZnPg==';

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
  const navigation = useNavigation();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    try {
      const userId = (user as any)?.user_id || user?._id || (user as any)?.id;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const response = await apiService.getUserProfile(userId);
      setProfileData(response.user);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E88E5" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchProfile()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <Image
              source={profileData?.photo_url
                ? { uri: profileData.photo_url }
                : { uri: DEFAULT_AVATAR }
              }
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {profileData?.first_name} {profileData?.last_name}
              </Text>
              <Text style={styles.userEmail}>{profileData?.email}</Text>
              <Text style={styles.userPhone}>{profileData?.phone}</Text>
            </View>
          </View>
        </View>

        {/* Personal Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Personal Details</Text>
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
            <Text style={styles.cardTitle}>Health Details</Text>
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
          </View>
        )}

        {/* Emergency Contact Card */}
        {profileData?.user_health?.emergency_contact_name && (
          <View style={[styles.card, { borderLeftColor: '#EF4444', borderLeftWidth: 4 }]}>
            <Text style={styles.cardTitle}>Emergency Contact</Text>
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

        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => {
            if (profileData) {
              (navigation as any).navigate('HomeStack', {
                screen: 'EditProfile',
                params: { currentUser: profileData },
              });
            }
          }}
        >
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.background.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight || 40,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background.surface,
    flex: 1,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    backgroundColor: theme.colors.background.surface,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
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
  editButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  editButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
