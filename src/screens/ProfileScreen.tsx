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
  LayoutAnimation,
  UIManager,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { AuthService, type User } from '../services/auth/AuthService';
import { useAuth } from '../utils/AuthContext';

// Enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const authService = AuthService.getInstance();

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
  };
};

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
  const navigation = useTypedNavigation();
  const { user } = useAuth();
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
  const [expandedSections, setExpandedSections] = useState({
    health: true,
    address: false,
    payment: false,
  });

  const supportEmail = 'support@samyayog.com';
  const supportPhone = '+91 98765 43210';

  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (!user?.id) throw new Error('User not authenticated');

      const response = await authService.getUserProfile(user.id.toString());
      if (response.success && response.data) {
        const data = response.data as any;
        const userData: ExtendedUser = {
          ...response.data,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          user_health: data.user_health || {},
        };
        setProfile(userData);
        setFormData({
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
      } else {
        setError(response.message || 'Failed to load profile data');
      }
    } catch (err) {
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const toggleSection = (section: 'health' | 'address' | 'payment') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdateProfile = async () => {
    if (!profile?.id) return Alert.alert('Error', 'User ID not found');
    try {
      setSaving(true);
      const response = await authService.updateProfile(profile.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      });
      if (response.success) {
        setIsEditing(false);
        await fetchUserProfile();
        Alert.alert('Success', 'Profile updated successfully');
      } else throw new Error(response.message);
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSupportEmail = () => Linking.openURL(`mailto:${supportEmail}`);
  const handleSupportCall = () => Linking.openURL(`tel:${supportPhone}`);

  const bmi =
    profile?.user_health?.height && profile?.user_health?.weight
      ? (profile.user_health.weight / ((profile.user_health.height / 100) ** 2)).toFixed(1)
      : null;

  const getBmiCategory = (bmiValue: string | null): string => {
    if (!bmiValue) return '';
    const n = parseFloat(bmiValue);
    if (n < 18.5) return ' (Underweight)';
    if (n < 25) return ' (Normal)';
    if (n < 30) return ' (Overweight)';
    return ' (Obese)';
  };

  const renderSectionHeader = (title: string, section: keyof typeof expandedSections) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection(section)}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <MaterialCommunityIcons
        name={expandedSections[section] ? 'chevron-up' : 'chevron-down'}
        size={24}
        color={colors.primaryGreen}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { marginTop: 16 }]}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={fetchUserProfile}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={
              profile?.profilePicture
                ? { uri: profile.profilePicture }
                : require('../../assets/images/default-avatar.png')
            }
            style={styles.avatar}
          />
          <View>
            <Text style={styles.userName}>
              {formData.firstName} {formData.lastName}
            </Text>
            <Text style={styles.userEmail}>{formData.email}</Text>
            <Text style={styles.userPhone}>{formData.phone}</Text>
          </View>
        </View>

        {/* Collapsible Sections */}
        <View style={styles.section}>
          {renderSectionHeader('Health Information', 'health')}
          {expandedSections.health && (
            <View style={styles.healthGrid}>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Blood Group</Text>
                <Text style={styles.healthValue}>{profile?.user_health?.blood_group || 'N/A'}</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Height</Text>
                <Text style={styles.healthValue}>{profile?.user_health?.height || 'N/A'} cm</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Weight</Text>
                <Text style={styles.healthValue}>{profile?.user_health?.weight || 'N/A'} kg</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>BMI</Text>
                <Text style={styles.healthValue}>
                  {bmi ? `${bmi}${getBmiCategory(bmi)}` : 'N/A'}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          {renderSectionHeader('Address', 'address')}
          {expandedSections.address && (
            <Text style={styles.addressText}>
              {typeof profile?.address === 'string'
                ? profile.address
                : [
                    profile?.address?.street,
                    profile?.address?.city,
                    profile?.address?.state,
                    profile?.address?.country,
                    profile?.address?.pincode,
                  ]
                    .filter(Boolean)
                    .join(', ')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          {renderSectionHeader('Payment Methods', 'payment')}
          {expandedSections.payment && (
            <View>
              {paymentMethods.length === 0 ? (
                <Text style={styles.noPaymentMethods}>No payment methods added</Text>
              ) : (
                paymentMethods.map(pm => (
                  <View key={pm.id} style={styles.paymentRow}>
                    <MaterialCommunityIcons
                      name={paymentIconsMap[pm.type]}
                      size={22}
                      color={colors.primaryGreen}
                    />
                    <Text style={styles.paymentText}>{pm.displayName}</Text>
                  </View>
                ))
              )}
            </View>
          )}
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.supportButtons}>
            <TouchableOpacity style={styles.supportButton} onPress={handleSupportEmail}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.primaryGreen} />
              <Text style={styles.supportButtonText}>Email Us</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportButton} onPress={handleSupportCall}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={colors.primaryGreen} />
              <Text style={styles.supportButtonText}>Call Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      {isEditing && (
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h5, color: colors.text },
  editButtonText: { color: colors.primaryGreen, ...typography.button },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 16 },
  userName: { ...typography.h6, color: colors.text },
  userEmail: { ...typography.body2, color: colors.textSecondary },
  userPhone: { ...typography.body2, color: colors.textSecondary },
  section: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionTitle: { ...typography.subtitle1, color: colors.text },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  healthItem: { width: '50%', marginBottom: 10 },
  healthLabel: { ...typography.caption, color: colors.textSecondary },
  healthValue: { ...typography.body1, color: colors.text },
  addressText: { ...typography.body1, color: colors.text, marginTop: 8 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  paymentText: { ...typography.body1, color: colors.text, marginLeft: 10 },
  noPaymentMethods: {
    ...typography.body2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8,
  },
  supportButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
  },
  supportButtonText: { color: colors.primaryGreen, marginLeft: 6 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  button: {
    backgroundColor: colors.primaryGreen,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { ...typography.button, color: colors.white },
  errorText: { color: colors.error, ...typography.body1 },
});

export default ProfileScreen;
