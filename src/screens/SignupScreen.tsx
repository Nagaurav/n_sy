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
  ImageStyle,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
  PermissionsAndroid,
  Image,
  Pressable,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Geolocation from '@react-native-community/geolocation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../theme';
import { authService } from '../services';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Gender = 'male' | 'female' | 'other' | '';

type LocationError = {
  code: number;
  message: string;
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logoImage: ImageStyle;
  headerTitle: TextStyle;
  card: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  phoneContainer: ViewStyle;
  phoneLabel: TextStyle;
  phoneNumber: TextStyle;
  formContainer: ViewStyle;
  input: TextStyle;
  inputError: ViewStyle;
  cityInput: TextStyle;
  cityContainer: ViewStyle;
  dateInput: ViewStyle;
  locationContainer: ViewStyle;
  locationButton: ViewStyle;
  locationButtonText: TextStyle;
  label: TextStyle;
  errorText: TextStyle;
  genderContainer: ViewStyle;
  genderButton: ViewStyle;
  genderButtonActive: ViewStyle;
  genderIconContainer: ViewStyle;
  genderIcon: ImageStyle;
  genderText: TextStyle;
  genderTextActive: TextStyle;
  submitButton: ViewStyle;
  submitButtonDisabled: ViewStyle;
  submitButtonText: TextStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    height: 80,
    width: '100%',
    marginTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  card: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 24,
    padding: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
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
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 16,
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
    fontSize: 18,
    marginBottom: 8,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  cityInput: {
    flex: 1,
    marginRight: 12,
    fontSize: 18,
    height: 56, // Match main input height
  },
  cityContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  dateInput: {
    justifyContent: 'center',
    height: 56,
  } as ViewStyle,
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  } as ViewStyle,
  locationButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48, 
    width: 48, 
    marginBottom: 24, 
  } as ViewStyle,
  locationButtonText: {
    fontWeight: '600',
    fontSize: 14,
  } as TextStyle,
  label: {
    fontSize: 14,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
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
    height: 80,
  },
  genderButtonActive: {
    backgroundColor: '#1E88E5',
  },
  genderIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderIcon: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  genderText: {
    fontWeight: '500',
    fontSize: 12,
    textAlign: 'center',
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  const phoneNumber = route.params?.phoneNumber || '';
  const { signIn } = useAuth();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [scrollY] = useState(new Animated.Value(0));
  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight] = useState(new Animated.Value(160));

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  React.useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      const shouldShrink = value > 50;
      if (shouldShrink !== isScrolled) {
        setIsScrolled(shouldShrink);
        Animated.timing(headerHeight, {
          toValue: shouldShrink ? 80 : 160,
          duration: 200,
          useNativeDriver: false,
        }).start();
      }
    });

    return () => {
      scrollY.removeListener(listener);
    };
  }, [scrollY, isScrolled]);

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
      try {
        Geolocation.requestAuthorization();
        return true; // For iOS, we'll assume permission is granted after request
      } catch (error) {
        console.error('Location permission error:', error);
        return false;
      }
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
    
    try {
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
        (error) => {
          console.error('Error getting location:', error);
          setIsLocationLoading(false);
          Alert.alert('Error', 'Failed to get your location. Please try again.');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error: any) {
      console.error('Error getting location:', error);
      setIsLocationLoading(false);
      Alert.alert('Error', 'Failed to get your location. Please try again.');
    }
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
      const result = await authService.signup(payload);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          {/* Dynamic Header with Title */}
          <Animated.View style={[styles.header, { 
            backgroundColor: theme.colors.primary,
          }]}>
            <Animated.View style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}>
              <Text style={[styles.headerTitle, { color: '#FFFFFF', fontFamily: theme.typography.fontFamily }]}>SIGN UP</Text>
            </Animated.View>
          </Animated.View>
          
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={[styles.card, { backgroundColor: theme.colors.background.surface, ...theme.shadows.float }]}>
              <Text style={[styles.title, { color: theme.colors.text.primary, fontFamily: theme.typography.fontFamily }]}>Create Your Account</Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary, fontFamily: theme.typography.fontFamily }]}>
                Please fill in your details to create an account
              </Text>

              <View style={styles.phoneContainer}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>Phone Number</Text>
                <View style={[
                  styles.input,
                  { backgroundColor: theme.colors.background.surface }
                ]}>
                  <Text style={[styles.phoneNumber, { color: theme.colors.text.primary }]}>+{formData.phone}</Text>
                </View>
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

              <FloatingLabelInput
                label="Date of Birth"
                value={formData.dob}
                onChangeText={(value) => handleInputChange('dob', value)}
                error={errors.dob}
                editable={false}
                onPressIn={() => setShowDatePicker(true)}
              />
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={RNPlatform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}

              <Text style={[styles.label, { color: theme.colors.text.primary }]}>Gender</Text>
              <View style={styles.genderContainer}>
                {(['male', 'female', 'other'] as const).map((gender) => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      { backgroundColor: theme.colors.background.secondary },
                      formData.gender === gender && { backgroundColor: theme.colors.primary }
                    ]}
                    onPress={() => handleGenderSelect(gender)}
                  >
                    {formData.gender === gender ? (
                      <View style={styles.genderIconContainer}>
                        {gender === 'male' && (
                          <Image 
                            source={require('../assets/icons/male-gender.png')} 
                            style={styles.genderIcon} 
                            resizeMode="contain"
                          />
                        )}
                        {gender === 'female' && (
                          <Image 
                            source={require('../assets/icons/femenine.png')} 
                            style={styles.genderIcon} 
                            resizeMode="contain"
                          />
                        )}
                        {gender === 'other' && (
                          <Image 
                            source={require('../assets/icons/gender.png')} 
                            style={styles.genderIcon} 
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    ) : (
                      <View style={styles.genderIconContainer}>
                        {gender === 'male' && (
                          <Image 
                            source={require('../assets/icons/male-gender.png')} 
                            style={[styles.genderIcon, { tintColor: theme.colors.text.secondary }]} 
                            resizeMode="contain"
                          />
                        )}
                        {gender === 'female' && (
                          <Image 
                            source={require('../assets/icons/femenine.png')} 
                            style={[styles.genderIcon, { tintColor: theme.colors.text.secondary }]} 
                            resizeMode="contain"
                          />
                        )}
                        {gender === 'other' && (
                          <Image 
                            source={require('../assets/icons/gender.png')} 
                            style={[styles.genderIcon, { tintColor: theme.colors.text.secondary }]} 
                            resizeMode="contain"
                          />
                        )}
                        <Text style={[styles.genderText, { color: theme.colors.text.secondary }]}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
              {errors.gender ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{errors.gender}</Text> : null}

              <Text style={[styles.label, { color: theme.colors.text.primary }]}>City</Text>
              <View style={styles.cityContainer}>
                <FloatingLabelInput
                  label="City"
                  value={formData.city}
                  onChangeText={(value) => handleInputChange('city', value)}
                  error={errors.city}
                  containerStyle={{ flex: 1, marginRight: 12 }}
                />
                <TouchableOpacity
                  style={[styles.locationButton, { backgroundColor: theme.colors.background.secondary }]}
                  onPress={getCurrentLocation}
                  disabled={isLocationLoading}
                >
                  {isLocationLoading ? (
                    <ActivityIndicator color={theme.colors.primary} size="small" />
                  ) : (
                    <Ionicons name="location" size={18} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </View>

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
                  { backgroundColor: theme.colors.primary },
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

              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => navigation.navigate('PhoneNumber')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, { color: theme.colors.primary }]}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SignupScreen;
