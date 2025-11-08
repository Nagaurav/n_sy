import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  SafeAreaView,
  StatusBar,
  Image,
  ImageSourcePropType,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AuthService, type User } from '../services/auth/AuthService';
import { useAuth } from '../utils/AuthContext';

const authService = AuthService.getInstance();

// Extend the base User type with additional profile properties
type ExtendedUser = User & {
  user_health?: {
    blood_group?: string;
    height?: number;
    weight?: number;
    allergies?: string[];
    medical_conditions?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      start_date: string;
      end_date?: string;
    }>;
    emergency_contact?: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
    last_checkup_date?: string;
    blood_pressure?: string;
    blood_sugar_level?: string;
    cholesterol_level?: string;
    bmi?: number;
  };
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string | {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
};

type RootStackParamList = {
  Profile: undefined;  
  // Add other screen params as needed
};

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

// Extend the User type with health information
interface UserProfile {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at?: string;
  updated_at?: string;
  
  // Health Information
  user_health?: {
    blood_group?: string;
    height?: number;
    weight?: number;
    allergies?: string[];
    medical_conditions?: string[];
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      start_date: string;
      end_date?: string;
    }>;
    emergency_contact?: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    };
    last_checkup_date?: string;
    blood_pressure?: string;
    blood_sugar_level?: string;
    cholesterol_level?: string;
    bmi?: number;
  };
  
  // Backward compatibility
  blood_group?: string;
  height?: number;
  weight?: number;
  allergies?: string[];
  medical_conditions?: string[];
  last_checkup_date?: string;
  blood_pressure?: string;
  blood_sugar_level?: string;
  cholesterol_level?: string;
  bmi?: number;
  
  // Address details (if not nested under user_health)
  address_details?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  displayName: string;
  last4?: string;
  upiId?: string;
  active: boolean;
}

const paymentIconsMap: Record<string, string> = {
  card: 'credit-card',
  upi: 'qrcode',
  wallet: 'wallet',
  netbanking: 'bank',
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  
  // Support contact info
  const supportEmail = 'support@samyayog.com';
  const supportPhone = '+91 98765 43210';

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user from AuthContext
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Use the user ID from the context
      const userId = user.id || user.userId;
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const response = await authService.getUserProfile(userId.toString());
      
      if (response.success && response.data) {
        // The response.data already contains the user profile with health info
        const responseData = response.data as any; // Temporary type assertion
        const userData: ExtendedUser = {
          ...response.data,
          // Ensure we have the user ID
          id: response.data.id || userId,
          userId: response.data.userId || userId,
          // Map name fields with fallbacks
          firstName: response.data.firstName || responseData?.first_name || '',
          lastName: response.data.lastName || responseData?.last_name || '',
          // Map other fields as needed
        };
        
        setProfile(userData);
        
        // Set form data from the user data
        setFormData({
          firstName: userData.firstName || responseData?.first_name || '',
          lastName: userData.lastName || responseData?.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } else {
        setError(response.message || 'Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Handle removing a payment method
  const removePaymentMethod = async (id: string) => {
    try {
      setLoadingPayments(true);
      // TODO: Implement actual API call to remove payment method
      // await paymentService.removePaymentMethod(id);
      // Refresh payment methods
      // const response = await paymentService.getPaymentMethods();
      // setPaymentMethods(response.data || []);
      Alert.alert('Success', 'Payment method removed');
    } catch (error) {
      console.error('Error removing payment method:', error);
      Alert.alert('Error', 'Failed to remove payment method');
    } finally {
      setLoadingPayments(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!profile?.id) {
      Alert.alert('Error', 'User ID not found');
      return;
    }
    
    try {
      setSaving(true);
      
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        // Maintain backward compatibility
        firstName: formData.firstName,
        lastName: formData.lastName,
      };
      
      const response = await authService.updateProfile(profile.id, updateData);
      
      if (response.success) {
        setIsEditing(false);
        await fetchUserProfile();
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle support email
  const handleSupportEmail = () => {
    Linking.openURL(`mailto:${supportEmail}`);
  };

  // Handle support phone call
  const handleSupportCall = () => {
    Linking.openURL(`tel:${supportPhone}`);
  };

  // Calculate BMI if height and weight are available
  const calculateBMI = () => {
    // Get height and weight from user_health object
    const height = profile?.user_health?.height;
    const weight = profile?.user_health?.weight;
    
    if (!height || !weight) return null;
    
    const heightInMeters = height / 100;
    const bmiValue = (weight / (heightInMeters * heightInMeters)).toFixed(1);
    return bmiValue;
  };

  const bmi = calculateBMI();
  
  // Get BMI category
  const getBmiCategory = (bmiValue: string | null): string => {
    if (!bmiValue) return '';
    const bmiNum = parseFloat(bmiValue);
    if (isNaN(bmiNum)) return '';
    if (bmiNum < 18.5) return ' (Underweight)';
    if (bmiNum < 25) return ' (Normal weight)';
    if (bmiNum < 30) return ' (Overweight)';
    return ' (Obese)';
  };
  
  // Format date of birth for display
  const formatDateOfBirth = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  // Handle both snake_case and camelCase for user properties with type safety
  const userFirstName = profile?.firstName || (profile as any)?.first_name || '';
  const userLastName = profile?.lastName || (profile as any)?.last_name || '';
  const userDateOfBirth = profile?.dateOfBirth || (profile as any)?.date_of_birth;
  const userAvatar = (profile?.profilePicture || (profile as any)?.avatar) as string | undefined;

  // Render loading state
  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={[styles.centered, { padding: 20 }]}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { marginTop: 16, textAlign: 'center' }]}>
            {error}
          </Text>
          <TouchableOpacity 
            style={[styles.button, { marginTop: 20 }]} 
            onPress={fetchUserProfile}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render the main profile screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Text style={styles.editButtonText}>
              {isEditing ? 'Cancel' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {profile && (
          <>
            {/* Profile Section */}
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Image
                  source={profile?.profilePicture ? { uri: profile.profilePicture } : require('../../assets/images/default-avatar.png')}
                  style={styles.avatar}
                  defaultSource={require('../../assets/images/default-avatar.png') as ImageSourcePropType}
                />
                {isEditing && (
                  <TouchableOpacity style={styles.editAvatarButton}>
                    <MaterialCommunityIcons name="camera" size={20} color={colors.white} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.profileInfo}>
                {isEditing ? (
                  <>
                    <View style={styles.inputRow}>
                      <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>First Name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.firstName}
                          onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                          placeholder="First Name"
                        />
                      </View>
                      <View style={[styles.inputContainer, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Last Name</Text>
                        <TextInput
                          style={styles.input}
                          value={formData.lastName}
                          onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                          placeholder="Last Name"
                        />
                      </View>
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput
                        style={[styles.input, { color: colors.textSecondary }]}
                        value={formData.email}
                        editable={false}
                        placeholder="Email"
                      />
                    </View>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Phone</Text>
                      <TextInput
                        style={styles.input}
                        value={formData.phone}
                        onChangeText={(text) => setFormData({ ...formData, phone: text })}
                        placeholder="Phone"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.userName}>{`${userFirstName} ${userLastName}`}</Text>
                    <Text style={styles.userEmail}>{formData.email}</Text>
                    <Text style={styles.userPhone}>{formData.phone || 'No phone number'}</Text>
                    <Text style={styles.userDob}>
                      <Text style={styles.label}>DOB: </Text>
                      {formatDateOfBirth(userDateOfBirth)}
                    </Text>
                  </>
                )}
              </View>
            </View>

            {/* Health Information Section */}
            {profile.user_health && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Health Information</Text>
                </View>
                <View style={styles.healthGrid}>
                  <View style={styles.healthItem}>
                    <Text style={styles.healthLabel}>Blood Group</Text>
                    <Text style={styles.healthValue}>
                      {profile.user_health.blood_group || 'Not specified'}
                    </Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={styles.healthLabel}>Height</Text>
                    <Text style={styles.healthValue}>
                      {profile.user_health.height ? `${profile.user_health.height} cm` : 'Not specified'}
                    </Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={styles.healthLabel}>Weight</Text>
                    <Text style={styles.healthValue}>
                      {profile.user_health.weight ? `${profile.user_health.weight} kg` : 'Not specified'}
                    </Text>
                  </View>
                  <View style={styles.healthItem}>
                    <Text style={styles.healthLabel}>BMI</Text>
                    <Text style={styles.healthValue}>
                      {bmi ? `${bmi} (${getBmiCategory(parseFloat(bmi))})` : 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Address Section */}
            {profile.address && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Address</Text>
                  {isEditing && (
                    <TouchableOpacity>
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.addressText}>
                  {[
                    profile.address.street,
                    profile.address.city,
                    profile.address.state,
                    profile.address.country,
                    profile.address.pincode
                  ].filter(Boolean).join(', ')}
                </Text>
              </View>
            )}

            {/* Payment Methods Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Payment Methods</Text>
                <TouchableOpacity disabled={loadingPayments}>
                  <Text style={styles.addButtonText}>+ Add New</Text>
                </TouchableOpacity>
              </View>
              {loadingPayments ? (
                <ActivityIndicator size="small" color={colors.primaryGreen} />
              ) : paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <View key={method.id} style={styles.paymentMethod}>
                    <View style={styles.paymentMethodLeft}>
                      <View style={styles.paymentIcon}>
                        <MaterialCommunityIcons
                          name={paymentIconsMap[method.type] || 'credit-card'}
                          size={24}
                          color={colors.primaryGreen}
                        />
                      </View>
                      <View>
                        <Text style={styles.paymentMethodName}>{method.displayName}</Text>
                        {method.last4 && (
                          <Text style={styles.paymentMethodDetails}>•••• {method.last4}</Text>
                        )}
                        {method.upiId && (
                          <Text style={styles.paymentMethodDetails}>{method.upiId}</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removePaymentButton}
                      onPress={() => removePaymentMethod(method.id)}
                      disabled={loadingPayments}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={styles.noPaymentMethods}>No payment methods added</Text>
              )}
            </View>

            {/* Support Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Need Help?</Text>
              <Text style={styles.supportText}>
                Our support team is here to help you with any questions or issues.
              </Text>
              <View style={styles.supportButtons}>
                <TouchableOpacity
                  style={[styles.supportButton, { marginRight: 12 }]}
                  onPress={handleSupportEmail}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={colors.primaryGreen}
                    style={styles.supportIcon}
                  />
                  <Text style={styles.supportButtonText}>Email Us</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.supportButton}
                  onPress={handleSupportCall}
                >
                  <MaterialCommunityIcons
                    name="phone-outline"
                    size={20}
                    color={colors.primaryGreen}
                    style={styles.supportIcon}
                  />
                  <Text style={styles.supportButtonText}>Call Us</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* Save Changes Button (shown only in edit mode) */}
        {isEditing && profile && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// Format date consistently
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Not specified';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Helper function to get the full name with fallbacks
function getFullName(user: UserProfile | null): string {
  if (!user) return '';
  return user.first_name || user.name || '';
}

// Helper function to check if a value is a valid URL
function isValidUrl(url?: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  headerTitle: {
    ...typography.h5,
    flex: 1,
    color: colors.text,
  },
  editButton: {
    padding: 8,
  },
  editButtonText: {
    color: colors.primaryGreen,
    ...typography.button,
  },
  profileSection: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lightGray,
    resizeMode: 'cover',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primaryGreen,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    ...typography.h6,
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userPhone: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  userDob: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  label: {
    ...typography.subtitle2,
    color: colors.textSecondary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    ...typography.subtitle1,
    color: colors.text,
  },
  addButtonText: {
    color: colors.primaryGreen,
    ...typography.button,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  healthItem: {
    width: '50%',
    padding: 8,
    marginBottom: 8,
  },
  healthLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  healthValue: {
    ...typography.body1,
    color: colors.text,
  },
  addressText: {
    ...typography.body1,
    color: colors.text,
    lineHeight: 24,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentMethodName: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: 2,
  },
  paymentMethodDetails: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  removePaymentButton: {
    padding: 8,
  },
  noPaymentMethods: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    padding: 16,
  },
  supportText: {
    ...typography.body2,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  supportButtons: {
    flexDirection: 'row',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  supportIcon: {
    marginRight: 8,
  },
  supportButtonText: {
    ...typography.button,
    color: colors.primaryGreen,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  errorText: {
    ...typography.body1,
    color: colors.error,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    ...typography.subtitle2,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    ...typography.body1,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: colors.white,
  },
  inputRow: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
});

export default ProfileScreen;