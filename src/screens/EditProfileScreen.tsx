import React, { useState, useCallback, useRef } from 'react';
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
  Animated,
  Dimensions,
  Modal,
  Image,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { apiService, authService } from '../services';
import { imageService } from '../services/imageService';
import type { UserProfileData } from '../types/userProfile';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

type EditProfileRouteProp = RouteProp<HomeStackParamList, 'EditProfile'>;
type EditProfileNavigationProp = StackNavigationProp<HomeStackParamList, 'EditProfile'>;

const { width, height } = Dimensions.get('window');

const EditProfileScreen = () => {
  const navigation = useNavigation<EditProfileNavigationProp>();
  const route = useRoute<EditProfileRouteProp>();
  const { currentUser } = route.params;
  const { user, updateUser } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Form state
  const [profileImage, setProfileImage] = useState(currentUser.photo_url || null);
  const [firstName, setFirstName] = useState(currentUser.first_name || '');
  const [lastName, setLastName] = useState(currentUser.last_name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [city, setCity] = useState(currentUser.city || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [pinCode, setPinCode] = useState(currentUser.pin_code || '');
  const [gender, setGender] = useState(currentUser.gender || '');
  const [dob, setDob] = useState(currentUser.dob || '');
  const [bloodGroup, setBloodGroup] = useState(currentUser.user_health?.blood_group || '');
  const [maritalStatus, setMaritalStatus] = useState(currentUser.user_health?.marital_status || '');
  const [height, setHeight] = useState(currentUser.user_health?.height?.toString() || '');
  const [weight, setWeight] = useState(currentUser.user_health?.weight?.toString() || '');
  const [emergencyContactName, setEmergencyContactName] = useState(currentUser.user_health?.emergency_contact_name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(currentUser.user_health?.emergency_contact_phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Reset form with current user data
    setProfileImage(currentUser.photo_url || null);
    setFirstName(currentUser.first_name || '');
    setLastName(currentUser.last_name || '');
    setPhone(currentUser.phone || '');
    setCity(currentUser.city || '');
    setAddress(currentUser.address || '');
    setPinCode(currentUser.pin_code || '');
    setGender(currentUser.gender || '');
    setDob(currentUser.dob || '');
    setBloodGroup(currentUser.user_health?.blood_group || '');
    setMaritalStatus(currentUser.user_health?.marital_status || '');
    setHeight(currentUser.user_health?.height?.toString() || '');
    setWeight(currentUser.user_health?.weight?.toString() || '');
    setEmergencyContactName(currentUser.user_health?.emergency_contact_name || '');
    setEmergencyContactPhone(currentUser.user_health?.emergency_contact_phone || '');
    setTimeout(() => setRefreshing(false), 1000);
  }, [currentUser]);

  // Image selection handlers
  const handleSelectImage = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: () => openCamera() },
        { text: 'Select from Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const openCamera = async () => {
    console.log('📷 [EditProfileScreen] Opening camera...');
    try {
      const image = await imageService.openCamera();
      console.log('📷 [EditProfileScreen] Camera result:', image);
      if (image) {
        setProfileImage(image.uri);
        console.log('✅ [EditProfileScreen] Profile image updated from camera:', image.uri);
      } else {
        console.log('⚠️ [EditProfileScreen] No image selected from camera');
      }
    } catch (error: any) {
      console.error('❌ [EditProfileScreen] Error opening camera:', error);
      Alert.alert('Error', `Failed to open camera: ${error?.message || 'Unknown error'}`);
    }
  };

  const openGallery = async () => {
    console.log('🖼️ [EditProfileScreen] Opening gallery...');
    try {
      const image = await imageService.openGallery();
      console.log('🖼️ [EditProfileScreen] Gallery result:', image);
      if (image) {
        setProfileImage(image.uri);
        console.log('✅ [EditProfileScreen] Profile image updated from gallery:', image.uri);
      } else {
        console.log('⚠️ [EditProfileScreen] No image selected from gallery');
      }
    } catch (error: any) {
      console.error('❌ [EditProfileScreen] Error opening gallery:', error);
      Alert.alert('Error', `Failed to open gallery: ${error?.message || 'Unknown error'}`);
    }
  };

  // Modal states
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showBloodGroupModal, setShowBloodGroupModal] = useState(false);
  const [showMaritalStatusModal, setShowMaritalStatusModal] = useState(false);

  // Options
  const genderOptions = ['Male', 'Female', 'Other'];
  const bloodGroupOptions = [
    'O_POSITIVE', 'O_NEGATIVE', 'A_POSITIVE', 'A_NEGATIVE',
    'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE',
  ];
  const maritalStatusOptions = ['Single', 'Married', 'Divorced', 'Widowed'];

  // Start entrance animation
  React.useEffect(() => {
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
    ]).start();
  }, []);

  const handleSave = useCallback(async () => {
    console.log('💾 [EditProfileScreen] Save button pressed');
    
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Validation Error', 'First Name and Last Name are required.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Phone number is required.');
      return;
    }

    // Validate numeric fields
    const heightValue = height.trim() ? parseFloat(height.trim()) : undefined;
    const weightValue = weight.trim() ? parseFloat(weight.trim()) : undefined;

    if (height.trim() && (heightValue === undefined || Number.isNaN(heightValue) || heightValue <= 0)) {
      Alert.alert('Validation Error', 'Height must be a positive number.');
      return;
    }

    if (weight.trim() && (weightValue === undefined || Number.isNaN(weightValue) || weightValue <= 0)) {
      Alert.alert('Validation Error', 'Weight must be a positive number.');
      return;
    }

    setIsSaving(true);
    try {
      // Upload profile image if it has changed
      let photoUrl = currentUser.photo_url;
      if (profileImage && profileImage !== currentUser.photo_url) {
        try {
          // Create image data for upload
          const imageData = {
            uri: profileImage,
            name: 'profile_photo.jpg',
            type: 'image/jpeg',
          };
          
          const formData = imageService.createFormData(imageData);
          const uploadResponse = await apiService.uploadProfilePicture(formData);
          
          if (uploadResponse.success && uploadResponse.data?.photo_url) {
            photoUrl = uploadResponse.data.photo_url;
            console.log('✅ [EditProfileScreen] Profile picture uploaded successfully');
          }
        } catch (uploadError) {
          console.error('❌ [EditProfileScreen] Error uploading profile picture:', uploadError);
          // Don't fail the entire save process if image upload fails
          Alert.alert('Warning', 'Profile picture upload failed, but other information will be saved.');
        }
      }

      const payload: any = {
        // Personal
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        pin_code: pinCode.trim() || undefined,
        gender: gender.toLowerCase() || undefined,
        dob: dob.trim() || undefined,
        photo_url: photoUrl, // Include the updated photo URL
        // Health (flat)
        blood_group: bloodGroup.trim() || undefined,
        marital_status: maritalStatus.toUpperCase() || undefined,
        height: heightValue,
        weight: weightValue,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        // Preserve flags from current profile
        is_active: currentUser.user_health?.is_active ?? true,
        notifications_enabled: currentUser.user_health?.notifications_enabled ?? true,
        newsletter_enabled: currentUser.user_health?.newsletter_enabled ?? false,
      };

      console.log('📡 [EditProfileScreen] Updating profile with payload:', payload);
      
      const userId = user?.user_id || currentUser.user_id;
      await authService.updateProfile(String(userId), payload);

      // Update local auth state for immediate UI reflection
      await updateUser({
        first_name: payload.first_name,
        last_name: payload.last_name,
        phone: payload.phone,
        city: payload.city,
        gender: payload.gender,
        dob: payload.dob,
        photo_url: photoUrl || undefined,
      });

      Alert.alert('Success', 'Profile updated successfully.', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('❌ [EditProfileScreen] Error updating profile:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to update profile. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  }, [firstName, lastName, phone, city, address, pinCode, gender, dob, bloodGroup, maritalStatus, height, weight, emergencyContactName, emergencyContactPhone, currentUser, user, navigation, updateUser, profileImage]);

  const renderOptionModal = (title: string, options: string[], selectedValue: string, onSelect: (value: string) => void, isVisible: boolean, setIsVisible: (visible: boolean) => void) => (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setIsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setIsVisible(false)}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalOption,
                  selectedValue === option && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onSelect(option);
                  setIsVisible(false);
                }}
              >
                <Text style={[
                  styles.modalOptionText,
                  selectedValue === option && styles.modalOptionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header matching ProfessionalHomeScreen */}
      <LinearGradient
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.headerButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        <Animated.ScrollView 
          style={[styles.scrollView, { opacity: fadeAnim }]}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Picture Section */}
          <Animated.View 
            style={[
              styles.profileSection, 
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <TouchableOpacity 
              onPress={handleSelectImage}
              style={styles.profileImageContainer}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={40} color={theme.colors.text.secondary} />
                  <Text style={styles.profileImagePlaceholderText}>Add Photo</Text>
                </View>
              )}
              <View style={styles.profileImageEditButton}>
                <Ionicons name="camera" size={16} color={theme.colors.background.surface} />
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageText}>Tap to change profile picture</Text>
          </Animated.View>

          {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Personal Details</Text>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  placeholder="Enter first name"
                />
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  placeholder="Enter last name"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Gender</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowGenderModal(true)}
                >
                  <Text style={styles.selectInputText}>
                    {gender || 'Select gender'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Date of Birth</Text>
                <TextInput
                  style={styles.input}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter phone number"
                />
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Enter city"
                />
              </View>
            </View>

            <View style={styles.formFull}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter address"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>PIN Code</Text>
                <TextInput
                  style={styles.input}
                  value={pinCode}
                  onChangeText={setPinCode}
                  keyboardType="number-pad"
                  placeholder="Enter PIN code"
                />
              </View>
              
              <View style={styles.formHalf} />
            </View>
          </View>

          {/* Health Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Health Details</Text>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Blood Group</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowBloodGroupModal(true)}
                >
                  <Text style={styles.selectInputText}>
                    {bloodGroup || 'Select blood group'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Marital Status</Text>
                <TouchableOpacity
                  style={styles.selectInput}
                  onPress={() => setShowMaritalStatusModal(true)}
                >
                  <Text style={styles.selectInputText}>
                    {maritalStatus || 'Select marital status'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  placeholder="Enter height"
                />
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                  placeholder="Enter weight"
                />
              </View>
            </View>
          </View>

          {/* Emergency Contact Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.cardTitle}>Emergency Contact</Text>
            </View>
            
            <View style={styles.formRow}>
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Contact Name</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyContactName}
                  onChangeText={setEmergencyContactName}
                  placeholder="Enter emergency contact name"
                />
              </View>
              
              <View style={styles.formHalf}>
                <Text style={styles.inputLabel}>Contact Phone</Text>
                <TextInput
                  style={styles.input}
                  value={emergencyContactPhone}
                  onChangeText={setEmergencyContactPhone}
                  keyboardType="phone-pad"
                  placeholder="Enter emergency contact phone"
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <Ionicons name="save-outline" size={20} color={theme.colors.background.surface} />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderOptionModal('Select Gender', genderOptions, gender, setGender, showGenderModal, setShowGenderModal)}
      {renderOptionModal('Select Blood Group', bloodGroupOptions, bloodGroup, setBloodGroup, showBloodGroupModal, setShowBloodGroupModal)}
      {renderOptionModal('Select Marital Status', maritalStatusOptions, maritalStatus, setMaritalStatus, showMaritalStatusModal, setShowMaritalStatusModal)}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  flex: {
    flex: 1,
  },
  
  // Header Styles matching ProfessionalHomeScreen
  headerContainer: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },
  
  // Profile Picture Styles
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.background.surface,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  profileImagePlaceholderText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  profileImageEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.surface,
  },
  profileImageText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  
  // Form Styles matching ProfessionalHomeScreen
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  // Card Styles matching ProfessionalHomeScreen
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  formHalf: {
    width: '48%',
  },
  formFull: {
    width: '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    flex: 1,
    color: theme.colors.text.primary,
  },
  saveButton: {
    backgroundColor: '#008272',
    borderRadius: theme.borderRadius.m,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modalOptions: {
    maxHeight: height * 0.4,
  },
  modalOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
  },
  modalOptionText: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  modalOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default EditProfileScreen;
