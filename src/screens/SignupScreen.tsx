import React, { useState, useEffect } from 'react';
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
  Animated,
  Pressable,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import Geolocation from '@react-native-community/geolocation';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme, commonStyles } from '../theme';
import { authService } from '../services';
import { RootStackParamList } from '../../App';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import Geocoder from 'react-native-geocoding';

type Gender = 'male' | 'female' | 'other' | '';

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  backButton: ViewStyle;
  titleContainer: ViewStyle;
  appTitle: TextStyle;
  contentContainer: ViewStyle;
  card: ViewStyle;
  cardHeader: ViewStyle;
  cardTitle: TextStyle;
  cardSubtitle: TextStyle;
  formContainer: ViewStyle;
  errorText: TextStyle;
  locationContainer: ViewStyle;
  locationButton: ViewStyle;
  locationButtonText: TextStyle;
  submitButton: ViewStyle;
  submitButtonDisabled: ViewStyle;
  submitButtonText: TextStyle;
  signInContainer: ViewStyle;
  signInText: TextStyle;
  signInLinkText: TextStyle;
  citySuggestionsContainer: ViewStyle;
  citySuggestionItem: ViewStyle;
  citySuggestionText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 0,
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
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: theme.spacing.l,
  },
  card: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 24,
  },
  cardHeader: {
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#008272',
  },
  cardSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.text.secondary,
  },
  formContainer: {
    width: '100%',
   },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    color: '#E53E3E',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  locationButton: {
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
    width: 56,
    borderWidth: 2,
    borderColor: theme.colors.feedback.success,
  },
  locationButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#008272',
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#008272',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '400',
    color: theme.colors.text.secondary,
  },
  signInLinkText: {
    fontSize: 14,
    color: '#008272',
    fontWeight: '600',
  },
  citySuggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
    maxHeight: 200,
    marginTop: 4,
  },
  citySuggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  citySuggestionText: {
    fontSize: 16,
    color: '#1A202C',
    flex: 1,
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
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLocationLoading, setIsLocationLoading] = useState(false);

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

  // City autocomplete states
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [isCityLoading, setIsCityLoading] = useState(false);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Initialize Geocoder (you'll need to get an API key from Google Maps)
    Geocoder.init('AIzaSyBrdCK1vB9x2vT2W7v8xY3z9w8x7y6z5a4'); // Replace with your actual API key
  }, [fadeAnim, slideAnim]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Handle city autocomplete
    if (field === 'city') {
      console.log('City input changed:', value); // Debug log
      if (value.length > 1) {
        searchCities(value);
      } else {
        setCitySuggestions([]);
        setShowCitySuggestions(false);
      }
    }
  };

  const searchCities = async (query: string) => {
    console.log('Searching cities for:', query); // Debug log
    setIsCityLoading(true);
    try {
      // Use Google Geocoding API to get city suggestions
      const results = await Geocoder.from(query);
      
      // Filter results to get cities only
      const cities = results.results
        .filter(result => {
          return result.types.includes('locality') || 
                 result.types.includes('administrative_area_level_1') ||
                 result.types.includes('administrative_area_level_2');
        })
        .map(result => result.formatted_address)
        .slice(0, 5); // Limit to 5 suggestions

      console.log('Geocoded cities:', cities); // Debug log
      setCitySuggestions(cities);
      setShowCitySuggestions(cities.length > 0);
    } catch (error) {
      console.error('Error searching cities:', error);
      // Fallback to some common cities if geocoding fails
      const fallbackCities = [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
      ].filter(city => city.toLowerCase().includes(query.toLowerCase()))
       .slice(0, 5);
      
      setCitySuggestions(fallbackCities);
      setShowCitySuggestions(fallbackCities.length > 0);
    } finally {
      setIsCityLoading(false);
    }
  };

  const selectCity = (city: string) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySuggestions([]);
    setShowCitySuggestions(false);
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: '' }));
    }
  };

  const hideCitySuggestions = () => {
    setShowCitySuggestions(false);
    setCitySuggestions([]);
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
    console.log('Getting current location...'); // Debug log
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
        async (position) => {
          console.log('Location captured:', position.coords); // Debug log
          
          // Update coordinates
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));

          // Get city name from coordinates using reverse geocoding
          try {
            const reverseGeocoded = await Geocoder.from(
              position.coords.latitude, 
              position.coords.longitude
            );
            
            // Extract city name from the results
            const cityComponent = reverseGeocoded.results[0]?.address_components.find(
              component => component.types.includes('locality') ||
                          component.types.includes('administrative_area_level_1') ||
                          component.types.includes('administrative_area_level_2')
            );
            
            if (cityComponent) {
              const cityName = cityComponent.long_name || cityComponent.short_name;
              console.log('Detected city:', cityName);
              
              // Auto-fill city field
              setFormData(prev => ({
                ...prev,
                city: cityName,
              }));
              
              Alert.alert('Success', `Location captured! City detected: ${cityName}`);
            } else {
              Alert.alert('Success', 'Location captured successfully! (City not detected)');
            }
          } catch (geocodeError) {
            console.error('Reverse geocoding error:', geocodeError);
            Alert.alert('Success', 'Location captured successfully! (Could not detect city)');
          }
          
          setIsLocationLoading(false);
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
        phone: formData.phone, // Required field from verification
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Professional Header - Same as ProfessionalHomeScreen */}
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
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.appTitle}>Create Account</Text>
          </View>
          
          <View style={{ width: 44 }} />
        </View>
      </LinearGradient>
          
      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentContainer}
        keyboardVerticalOffset={RNPlatform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingBottom: 40
          }}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={{ flex: 1 }} onPress={hideCitySuggestions}>
          <View style={[styles.card, commonStyles.primaryCard, { borderColor: theme.colors.feedback.success }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>Start your wellness journey with Samyayog</Text>
              </View>

              <View style={styles.formContainer}>
                <FloatingLabelInput
                  label="Phone Number"
                  value={`+${formData.phone}`}
                  onChangeText={() => {}} // No change allowed - locked
                  editable={false}
                  icon="phone"
                />

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
                  onChangeText={() => {}} // Prevent manual input
                  error={errors.dob}
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

                <View style={{ flexDirection: 'row', gap: theme.spacing.s, marginBottom: theme.spacing.l }}>
                  {(['male', 'female', 'other'] as const).map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        paddingHorizontal: 10,
                        borderRadius: 12,
                        backgroundColor: formData.gender === gender ? '#EBF8F6' : '#F9FAFB',
                        borderWidth: 1,
                        borderColor: formData.gender === gender ? theme.colors.feedback.success : theme.colors.feedback.success,
                        alignItems: 'center',
                        minHeight: 56,
                        justifyContent: 'center',
                      }}
                      onPress={() => handleGenderSelect(gender)}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 2 }}>
                        <Ionicons
                          name={gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'person'}
                          size={20}
                          color={formData.gender === gender ? '#008272' : '#718096'}
                        />
                      </View>
                      <Text
                        style={{
                          fontWeight: '600',
                          fontSize: 14,
                          textAlign: 'center',
                          color: formData.gender === gender ? '#008272' : '#718096',
                        }}
                      >
                        {gender.charAt(0).toUpperCase() + gender.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

                <View style={styles.locationContainer}>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={getCurrentLocation}
                    disabled={isLocationLoading}
                    activeOpacity={0.8}
                  >
                    {isLocationLoading ? (
                      <ActivityIndicator color="#008272" size="small" />
                    ) : (
                      <Ionicons name="location" size={20} color="#008272" />
                    )}
                  </TouchableOpacity>
                  
                  <View style={{ flex: 1, position: 'relative', zIndex: showCitySuggestions ? 1000 : 1, marginTop: theme.spacing.m }}>
                    <FloatingLabelInput
                      label="City"
                      value={formData.city}
                      onChangeText={(value) => handleInputChange('city', value)}
                      error={errors.city}
                    />
                    
                    {/* City Suggestions Dropdown */}
                    {showCitySuggestions && (
                      <View style={styles.citySuggestionsContainer}>
                        {isCityLoading ? (
                          <View style={styles.citySuggestionItem}>
                            <ActivityIndicator color="#008272" size="small" />
                            <Text style={styles.citySuggestionText}>Searching...</Text>
                          </View>
                        ) : citySuggestions.length > 0 ? (
                          citySuggestions.map((city, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.citySuggestionItem}
                              onPress={() => selectCity(city)}
                              activeOpacity={0.7}
                            >
                              <Text style={styles.citySuggestionText}>{city}</Text>
                            </TouchableOpacity>
                          ))
                        ) : (
                          <View style={styles.citySuggestionItem}>
                            <Text style={styles.citySuggestionText}>No cities found</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
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
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  onPress={handleSignup}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signInContainer}>
                  <Text style={styles.signInText}>Already have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('PhoneNumber')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.signInLinkText}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignupScreen;
