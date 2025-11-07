// ProfileScreen.tsx
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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { getAuthToken } from '../config/api';

// Types for user data and payment methods
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'netbanking';
  displayName: string;
  last4?: string;    // For cards
  upiId?: string;    // For UPI
  active: boolean;
}

const paymentIconsMap: Record<string, string> = {
  card: 'credit-card',
  upi: 'qrcode',
  wallet: 'wallet',
  netbanking: 'bank',
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();

  // User profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Editing profile state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  // Help & support info - simplified here
  const [supportEmail, setSupportEmail] = useState('support@samyayog.com');
  const [supportPhone, setSupportPhone] = useState('+91 98765 43210');

  // Real profile service using API
  const profileService = {
    getProfile: async () => {
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch('http://88.222.241.179:7000/api/v1/user/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        return { 
          success: true,
          data: result.data || result // Handle both response formats
        };
      } catch (error: any) {
        console.error('Error fetching profile:', error);
        // Return a default profile if the API fails
        return {
          success: false,
          data: {
            name: 'User',
            email: 'user@example.com',
            phone: '+91 98765 43210',
            avatarUrl: undefined,
          }
        };
      }
    },
    
    updateProfile: async (profileData: { name: string; email: string; phone: string }) => {
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          throw new Error('No authentication token found');
        }
        
        const response = await fetch('http://88.222.241.179:7000/api/v1/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(profileData),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to update profile');
        }
        
        const result = await response.json();
        return { 
          success: true,
          data: result.data || result
        };
      } catch (error: any) {
        console.error('Error updating profile:', error);
        throw new Error(error.message || 'Failed to update profile');
      }
    }
  };

  // Real payment service using API
  const paymentService = {
    getPaymentMethods: async () => {
      try {
        // Use real API call to get payment methods
        const response = await fetch('http://88.222.241.179:7000/api/v1/user/payment-methods', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch payment methods');
        }
        
        const data = await response.json();
        return { data: data.data || [] };
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        // Return empty array if API fails
        return { data: [] };
      }
    },
    removePaymentMethod: async (id: string) => {
      try {
        // Use real API call to remove payment method
        const response = await fetch(`http://88.222.241.179:7000/api/v1/user/payment-methods/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await getAuthToken()}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove payment method');
        }
        
        const result = await response.json();
        return { success: result.success || true };
      } catch (error) {
        console.error('Error removing payment method:', error);
        return { success: false };
      }
    }
  };

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const res = await profileService.getProfile();
      setProfile(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setPhone(res.data.phone);
    } catch (e) {
      Alert.alert('Error', 'Failed to load profile.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  // Fetch payment methods from API
  const fetchPaymentMethods = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const res = await paymentService.getPaymentMethods();
      setPaymentMethods(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load payment methods.');
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchPaymentMethods();
  }, [fetchProfile, fetchPaymentMethods]);

  // Toggle edit mode
  const toggleEdit = () => {
    if (editing) {
      // Cancel edits, reset fields
      if (profile) {
        setName(profile.name);
        setEmail(profile.email);
        setPhone(profile.phone);
      }
    }
    setEditing(!editing);
  };

  // Save updated profile
  const saveProfile = async () => {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      return Alert.alert('Validation', 'Please fill in all fields.');
    }
    setSaving(true);
    try {
      await profileService.updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      Alert.alert('Success', 'Profile updated successfully.');
      setProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      setEditing(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Handle removing a payment method
  const removePaymentMethod = async (id: string) => {
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await paymentService.removePaymentMethod(id);
              fetchPaymentMethods();
            } catch (e) {
              Alert.alert('Error', 'Failed to remove payment method.');
            }
          },
        },
      ]
    );
  };

  // Add Payment method navigates to your AddPaymentMethod screen
  const addPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'This feature will be implemented soon.');
  };

  // Help contact handlers
  const sendSupportEmail = () => {
    Linking.openURL(`mailto:${supportEmail}`);
  };
  const callSupport = () => {
    Linking.openURL(`tel:${supportPhone}`);
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={styles.centered}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.primaryGreen} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={editing ? saveProfile : toggleEdit} disabled={saving}>
            <Text style={[styles.editButton, saving && { opacity: 0.5 }]}>
              {editing ? (saving ? 'Saving...' : 'Save') : 'Edit'}
            </Text>
          </TouchableOpacity>
          {editing && !saving && (
            <TouchableOpacity onPress={toggleEdit} style={{ marginLeft: 12 }}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.profileSection}>
          <Text style={styles.label}>Name</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Full Name"
              autoCapitalize="words"
            />
          ) : (
            <Text style={styles.value}>{profile?.name || '-'}</Text>
          )}

          <Text style={styles.label}>Email</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email Address"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          ) : (
            <Text style={styles.value}>{profile?.email || '-'}</Text>
          )}

          <Text style={styles.label}>Phone</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              keyboardType="phone-pad"
            />
          ) : (
            <Text style={styles.value}>{profile?.phone || '-'}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment Methods</Text>
            <TouchableOpacity onPress={addPaymentMethod}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.primaryGreen} />
            </TouchableOpacity>
          </View>

          {loadingPayments ? (
            <ActivityIndicator size="small" color={colors.primaryGreen} />
          ) : paymentMethods.length === 0 ? (
            <Text style={styles.emptyText}>No payment methods added yet.</Text>
          ) : (
            paymentMethods.map(method => (
              <View key={method.id} style={styles.paymentCard}>
                <MaterialCommunityIcons
                  name={paymentIconsMap[method.type] || 'credit-card'}
                  size={24}
                  color={colors.primaryGreen}
                />
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentName}>{method.displayName}</Text>
                  {method.type === 'card' && method.last4 && (
                    <Text style={styles.paymentDetails}>•••• {method.last4}</Text>
                  )}
                  {method.type === 'upi' && method.upiId && (
                    <Text style={styles.paymentDetails}>{method.upiId}</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => removePaymentMethod(method.id)}>
                  <MaterialCommunityIcons name="delete" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Help & Support</Text>

          <TouchableOpacity style={styles.supportCard} onPress={sendSupportEmail}>
            <MaterialCommunityIcons name="email" size={22} color={colors.primaryGreen} />
            <Text style={styles.supportText}>Email Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primaryGreen} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportCard} onPress={callSupport}>
            <MaterialCommunityIcons name="phone" size={22} color={colors.primaryGreen} />
            <Text style={styles.supportText}>Call Support</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primaryGreen} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportCard}
            onPress={() => Alert.alert('FAQ', 'FAQ section will be implemented soon.')}
          >
            <MaterialCommunityIcons name="help-circle" size={22} color={colors.primaryGreen} />
            <Text style={styles.supportText}>FAQ</Text>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primaryGreen} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primaryGreen,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  editButton: {
    color: colors.primaryGreen,
    fontWeight: '700',
    fontSize: 16,
  },
  cancelButton: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  profileSection: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    marginHorizontal: 16,
  },
  label: {
    color: colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    marginTop: 6,
  },
  input: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primaryText,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
    marginTop: 6,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentCard: {
    flexDirection: 'row',
    backgroundColor: colors.lightSage,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  paymentInfo: {
    flex: 1,
    marginLeft: 14,
  },
  paymentName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.primaryText,
  },
  paymentDetails: {
    fontSize: 13,
    color: colors.secondaryText,
    marginTop: 2,
  },
  emptyText: {
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    padding: 16,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  supportText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryGreen,
    marginHorizontal: 12,
  },
});

export default ProfileScreen; 