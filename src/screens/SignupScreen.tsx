import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../theme';
import { apiService } from '../services/apiService';
import { RootStackParamList } from '../../App';
import { useAuth } from '../contexts/AuthContext';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

type Gender = 'male' | 'female' | 'other' | '';

type LocationError = {
  code: number;
  message: string;
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  backButton: ViewStyle;
  backButtonText: TextStyle;
  headerTitle: TextStyle;
  scrollViewContent: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  phoneContainer: ViewStyle;
  phoneLabel: TextStyle;
  phoneNumber: TextStyle;
  formContainer: ViewStyle;
  input: TextStyle;
  inputError: ViewStyle;
  dateInput: ViewStyle;
  locationContainer: ViewStyle;
  locationButton: ViewStyle;
  locationButtonText: TextStyle;
  label: TextStyle;
  errorText: TextStyle;
  genderContainer: ViewStyle;
  genderButton: ViewStyle;
  genderButtonActive: ViewStyle;
  genderText: TextStyle;
  genderTextActive: TextStyle;
  submitButton: ViewStyle;
  submitButtonDisabled: ViewStyle;
  submitButtonText: TextStyle;
  loginContainer: ViewStyle;
  loginText: TextStyle;
  loginButton: TextStyle;
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: theme.colors.background.surface,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.background.surface,
    textAlign: 'center',
    flex: 1,
    marginRight: 24,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  phoneContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  phoneLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 8,
  },
  dateInput: {
    justifyContent: 'center',
    height: 56,
  } as ViewStyle,
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 8,
  } as ViewStyle,
  locationButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  } as ViewStyle,
  locationButtonText: {
    color: '#1E88E5',
    fontWeight: '600',
    fontSize: 14,
  } as TextStyle,
  inputError: {
    borderColor: '#EF4444',
  },
  label: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginTop: -4,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  genderButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: '#1E88E5',
  },
  genderText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  submitButton: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  loginText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loginButton: {
    color: '#1E88E5',
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#1E88E5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginVertical: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

// Navigation props
type SignupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Signup'>;
type SignupScreenRouteProp = RouteProp<RootStackParamList, 'Signup'>;

interface SignupScreenProps {
  navigation: SignupScreenNavigationProp;
  route: SignupScreenRouteProp;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { phoneNumber } = route.params;
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: phoneNumber.replace(/\D/g, ''),
    dob: '',
    gender: '' as Gender,
    city: '',
    password: '',
    confirmPassword: '',
    latitude: 0,
    longitude: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenderSelect = (gender: Gender) => {
    setFormData(prev => ({ ...prev, gender }));
    if (errors.gender) {
      setErrors(prev => ({ ...prev, gender: '' }));
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    const currentDate = date || selectedDate;
    setShowDatePicker(RNPlatform.OS === 'ios');
    setSelectedDate(currentDate);
    setFormData(prev => ({
      ...prev,
      dob: format(currentDate, 'yyyy-MM-dd')
    }));
    if (errors.dob) {
      setErrors(prev => ({ ...prev, dob: '' }));
    }
  };

  const requestLocationPermission = async () => {
    if (RNPlatform.OS === 'ios') {
      const hasPermission = await Geolocation.requestAuthorization('whenInUse');
      return hasPermission === 'granted' || hasPermission === 'restricted';
    } else {
      const hasPermission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      return hasPermission === PermissionsAndroid.RESULTS.GRANTED;
    }
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Please enable location services to use this feature.',
      );
      return;
    }

    setIsLocationLoading(true);
    
    Geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setIsLocationLoading(false);
        Alert.alert('Success', 'Location updated successfully!');
      },
      (error: LocationError) => {
        console.error('Error getting location:', error);
        setIsLocationLoading(false);
        Alert.alert('Error', 'Failed to get your location. Please try again.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120); // 120 years max age
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 13); // 13 years minimum age
    
    // Validate first name
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = 'First name must be at least 2 characters';
    }
    
    // Validate last name
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = 'Last name must be at least 2 characters';
    }
    
    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Validate date of birth
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const dobDate = new Date(formData.dob);
      if (isNaN(dobDate.getTime())) {
        newErrors.dob = 'Invalid date of birth';
      } else if (dobDate > maxDate) {
        newErrors.dob = 'You must be at least 13 years old to register';
      } else if (dobDate < minDate) {
        newErrors.dob = 'Please enter a valid date of birth';
      }
    }
    
    // Validate gender
    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }
    
    // Validate city
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    // Validate password
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/(?=.*[A-Z])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
    }
    
    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const payload = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone,
        email: formData.email.trim().toLowerCase(),
        dob: formData.dob,
        gender: formData.gender,
        city: formData.city.trim(),
        password: formData.password,
        latitude: formData.latitude,
        longitude: formData.longitude
      };
      const result = await apiService.signup(payload);

      if (!result.success || !result.data?.token || !result.data?.user) {
        const errorMessage = result.error || 'Failed to sign up. Please try again.';
        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK' }],
          { cancelable: false }
        );
        return;
      }

      console.log('🔐 Signup Success - User object from API:', result.data.user);
      console.log('🔐 User has _id?', '_id' in result.data.user);
      console.log('🔐 User has id?', 'id' in result.data.user);
      
      // Sign in the user and store the session
      await signIn({
        user: result.data.user,
        token: result.data.token,
      });

      // Token is automatically stored in Redux by signIn, and the interceptor will use it
      // No need to manually update apiService

      // Navigate to home screen on success
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      Alert.alert(
        'Error',
        errorMessage,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E88E5" />
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <Text style={styles.title}>Create Your Account</Text>
            <Text style={styles.subtitle}>
              Please fill in your details to create an account
            </Text>

            <View style={styles.phoneContainer}>
              <Text style={styles.phoneLabel}>Phone Number</Text>
              <Text style={styles.phoneNumber}>+{formData.phone}</Text>
            </View>

            <View style={styles.formContainer}>
              <FloatingLabelInput
                label="First Name"
                value={formData.first_name}
                onChangeText={(value) => handleInputChange('first_name', value)}
                error={errors.first_name}
                autoCapitalize="words"
              />

              <FloatingLabelInput
                label="Last Name"
                value={formData.last_name}
                onChangeText={(value) => handleInputChange('last_name', value)}
                error={errors.last_name}
                autoCapitalize="words"
              />

              <FloatingLabelInput
                label="Email Address"
                value={formData.email}
                onChangeText={(value) => handleInputChange('email', value)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.dateInput,
                  errors.dob ? styles.inputError : null
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={formData.dob ? {} : { color: '#9CA3AF' }}>
                  {formData.dob || 'Select your date of birth'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={RNPlatform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {errors.dob ? <Text style={styles.errorText}>{errors.dob}</Text> : null}

              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      formData.gender === gender && styles.genderButtonActive
                    ]}
                    onPress={() => handleGenderSelect(gender)}
                  >
                    <Text
                      style={[
                        styles.genderText,
                        formData.gender === gender && styles.genderTextActive
                      ]}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

              <Text style={styles.label}>City</Text>
              <View style={styles.locationContainer}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={[
                      styles.input,
                      errors.city ? styles.inputError : null
                    ]}
                    placeholder="Enter your city"
                    value={formData.city}
                    onChangeText={(value) => handleInputChange('city', value)}
                  />
                </View>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={getCurrentLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? (
                    <ActivityIndicator color="#1E88E5" size="small" />
                  ) : (
                    <Text style={styles.locationButtonText}>Use My Location</Text>
                  )}
                </TouchableOpacity>
              </View>
              {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

              <FloatingLabelInput
                label="Password"
                value={formData.password}
                onChangeText={(value) => handleInputChange('password', value)}
                error={errors.password}
                secureTextEntry
              />

              <FloatingLabelInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                error={errors.confirmPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isLoading ? styles.submitButtonDisabled : null
                ]}
                onPress={handleSignup}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Complete Signup</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('PhoneNumber')}>
                  <Text style={styles.loginButton}>Log In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
