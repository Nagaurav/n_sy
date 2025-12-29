import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import apiService from '../services/apiService';
import type { UserProfileData } from '../types/userProfile';
import { useAuth } from '../contexts/AuthContext';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

type EditProfileRouteProp = RouteProp<HomeStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = StackNavigationProp<HomeStackParamList, 'EditProfile'>;

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const route = useRoute<EditProfileRouteProp>();
  const { currentUser } = route.params;
  const { user, updateUser } = useAuth();

  const [firstName, setFirstName] = useState(currentUser.first_name || '');
  const [lastName, setLastName] = useState(currentUser.last_name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [pinCode, setPinCode] = useState(currentUser.pin_code || '');
  const [gender, setGender] = useState(currentUser.gender || '');
  const [dob, setDob] = useState(currentUser.dob || '');

  const [bloodGroup, setBloodGroup] = useState(
    currentUser.user_health?.blood_group || '',
  );
  const [maritalStatus, setMaritalStatus] = useState(
    currentUser.user_health?.marital_status || '',
  );
  const [height, setHeight] = useState(
    (currentUser.user_health?.height as any as string) || '',
  );
  const [weight, setWeight] = useState(
    (currentUser.user_health?.weight as any as string) || '',
  );
  const [emergencyContactName, setEmergencyContactName] = useState(
    currentUser.user_health?.emergency_contact_name || '',
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    currentUser.user_health?.emergency_contact_phone || '',
  );
  const [isSaving, setIsSaving] = useState(false);

  const [showGenderOptions, setShowGenderOptions] = useState(false);
  const [showBloodGroupOptions, setShowBloodGroupOptions] = useState(false);
  const [showMaritalStatusOptions, setShowMaritalStatusOptions] = useState(false);

  const genderOptions = ['male', 'female', 'other'];
  const bloodGroupOptions = [
    'O_POSITIVE',
    'O_NEGATIVE',
    'A_POSITIVE',
    'A_NEGATIVE',
    'B_POSITIVE',
    'B_NEGATIVE',
    'AB_POSITIVE',
    'AB_NEGATIVE',
  ];
  const maritalStatusOptions = ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'];

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First Name and Last Name are required.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required.');
      return;
    }

    // Validate numeric fields if provided
    const heightTrimmed = height.trim();
    const weightTrimmed = weight.trim();

    const heightValue = heightTrimmed ? parseFloat(heightTrimmed) : undefined;
    const weightValue = weightTrimmed ? parseFloat(weightTrimmed) : undefined;

    if (heightTrimmed && (heightValue === undefined || Number.isNaN(heightValue) || heightValue <= 0)) {
      Alert.alert('Validation Error', 'Height must be a positive number.');
      return;
    }

    if (weightTrimmed && (weightValue === undefined || Number.isNaN(weightValue) || weightValue <= 0)) {
      Alert.alert('Validation Error', 'Weight must be a positive number.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        // Personal
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        pin_code: pinCode.trim() || undefined,
        gender: gender.trim() || undefined,
        dob: dob.trim() || undefined,
        // Health (flat)
        blood_group: bloodGroup.trim() || undefined,
        marital_status: maritalStatus.trim() || undefined,
        height: heightValue,
        weight: weightValue,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        // Preserve flags from current profile
        is_active:
          currentUser.user_health?.is_active ?? true,
        notifications_enabled:
          currentUser.user_health?.notifications_enabled ?? true,
        newsletter_enabled:
          currentUser.user_health?.newsletter_enabled ?? false,
      };

      const userId = user?.user_id || currentUser.user_id;
      await apiService.updateUserProfile(userId, payload);

      // Update local auth state for immediate UI reflection
      await updateUser({
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        city: payload.city,
        gender: payload.gender,
        dob: payload.dob,
      });

      Alert.alert('Success', 'Profile updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.background.surface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          {/* Personal Details */}
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Gender</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowGenderOptions((prev) => !prev)}
           >
              <Text style={styles.dropdownText}>
                {gender ? gender : 'Select gender'}
              </Text>
            </TouchableOpacity>
            {showGenderOptions && (
              <View style={styles.dropdownOptionsContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setGender(option);
                      setShowGenderOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Date of Birth (YYYY-MM-DD)"
              value={dob}
              onChangeText={setDob}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="City"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              inputStyle={styles.multilineInput}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Pincode"
              value={pinCode}
              onChangeText={setPinCode}
              keyboardType="number-pad"
            />
          </View>

          {/* Health Profile */}
          <Text style={styles.sectionTitle}>Health Profile</Text>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Blood Group</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBloodGroupOptions((prev) => !prev)}
            >
              <Text style={styles.dropdownText}>
                {bloodGroup ? bloodGroup : 'Select blood group'}
              </Text>
            </TouchableOpacity>
            {showBloodGroupOptions && (
              <View style={styles.dropdownOptionsContainer}>
                {bloodGroupOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setBloodGroup(option);
                      setShowBloodGroupOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Marital Status</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowMaritalStatusOptions((prev) => !prev)}
            >
              <Text style={styles.dropdownText}>
                {maritalStatus ? maritalStatus : 'Select marital status'}
              </Text>
            </TouchableOpacity>
            {showMaritalStatusOptions && (
              <View style={styles.dropdownOptionsContainer}>
                {maritalStatusOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownOption}
                    onPress={() => {
                      setMaritalStatus(option);
                      setShowMaritalStatusOptions(false);
                    }}
                  >
                    <Text style={styles.dropdownOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Height (cm)"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Weight (kg)"
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Emergency Contact */}
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Emergency Contact Name"
              value={emergencyContactName}
              onChangeText={setEmergencyContactName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <FloatingLabelInput
              label="Emergency Contact Phone"
              value={emergencyContactPhone}
              onChangeText={setEmergencyContactPhone}
              keyboardType="phone-pad"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  flex: {
    flex: 1,
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
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background.surface,
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  dropdownOptionsContainer: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: theme.colors.background.surface,
  },
  dropdownOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
