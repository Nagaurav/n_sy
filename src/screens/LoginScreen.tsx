import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  Image,
  ImageStyle,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { authService } from '../services'; // Ensure authService is correctly imported
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

type LoginScreenProps = StackScreenProps<any, 'Login'>;

const { width } = Dimensions.get('window');

interface LoginCredentials {
  identifier: string;
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [errors, setErrors] = useState<{identifier?: string; password?: string}>({});

  const { signIn } = useAuth();
  const { theme } = useTheme();

  const validateInputs = () => {
    const newErrors: {identifier?: string; password?: string} = {};
    
    // Validate identifier (email or phone)
    if (!identifier.trim()) {
      newErrors.identifier = 'Please enter your email or phone number';
    } else if (!isValidEmail(identifier) && !isValidPhone(identifier)) {
      newErrors.identifier = 'Please enter a valid email or phone number';
    }
    
    // Validate password
    if (!password.trim()) {
      newErrors.password = 'Please enter your password';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };
  const [isPasswordLogin, setIsPasswordLogin] = useState<boolean>(true);
  const handlePasswordLogin = useCallback(async () => {
    setIsButtonPressed(true);
    
    if (!validateInputs()) {
      return;
    }

    // Basic validation
    setIsButtonPressed(true);

    try {
      const credentials = {
        identifier: identifier.trim(),
        password: password.trim(),
      };

      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Use the Redux-based signIn method from AuthContext
        await signIn({ user, token });

        // Navigate to main app - the AuthContext will handle the navigation
        navigation.replace('Home');
      } else {
        Alert.alert(
          'Login Failed',
          'The email or password you entered is incorrect. Please try again.'
        );
      }
    setIsLoading(true);
    setIsButtonPressed(false);
    } catch (error) {
      setIsButtonPressed(false);
      Alert.alert(
        'Login Error',
        'Unable to connect. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
      setIsButtonPressed(false);
    }
  }, [identifier, password, signIn, navigation]);

  const handleOTPToggle = useCallback(() => {
    // Navigate to phone number input for OTP login
    navigation.navigate('PhoneNumber');
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* 🟢 MODIFIED HEADER: Full Cover Image */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Image 
          source={require('../assets/logo.jpg')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
        {/* Optional: Dark overlay to make text readable if you add any text on top */}
        <View style={styles.headerOverlay} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.content}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to your account</Text>

            <View style={styles.form}>
              {/* Email/Phone Input */}
              <View style={styles.inputContainer}>
                <FloatingLabelInput
                  label="Email or Phone Number"
                  value={identifier}
                  onChangeText={(text) => {
                    setIdentifier(text);
                    if (errors.identifier) {
                      setErrors(prev => ({ ...prev, identifier: undefined }));
                    }
                  }}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="phone"
                  error={errors.identifier}
                />
              </View>

              {isPasswordLogin && (
                <View style={styles.inputContainer}>
                  <FloatingLabelInput
                    label="Password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) {
                        setErrors(prev => ({ ...prev, password: undefined }));
                      }
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    icon="lock"
                    isPassword={true}
                    error={errors.password}
                  />
                </View>
              )}

              {/* Login Button */}
              {isPasswordLogin && (
                <Pressable
                  style={[
                    styles.button, 
                    isLoading && styles.buttonDisabled,
                    isButtonPressed && styles.buttonPressed
                  ]}
                  onPress={handlePasswordLogin}
                  disabled={isLoading}
                  onPressIn={() => setIsButtonPressed(true)}
                  onPressOut={() => setIsButtonPressed(false)}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Logging in...' : 'Log In'}
                  </Text>
                </Pressable>
              )}

              {/* Toggle Button */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={handleOTPToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isPasswordLogin ? 'Log in using OTP' : 'Use Email/Password'}
                </Text>
              </TouchableOpacity>

              {/* Forgot Password Link */}
              {isPasswordLogin && (
                <TouchableOpacity style={styles.forgotPasswordButton}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerOverlay: ViewStyle;
  logoImage: ImageStyle;
  content: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  form: ViewStyle;
  inputContainer: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  buttonDisabled: ViewStyle;
  buttonPressed: ViewStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
  forgotPasswordButton: ViewStyle;
  forgotPasswordText: TextStyle;
};
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  // 🟢 NEW HEADER STYLES
  header: {
    height: 160, // Reduced from 240 to make logo less oversized
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Ensures image gets clipped to rounded corners
    position: 'relative',
    marginTop: 40, // Move header down more
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed from cover to contain to prevent overflow
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Slight overlay for depth (optional)
  },
  // -------------------
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
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
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#008272', // Using primary color directly for now
    borderRadius: 16, // More rounded corners (from 12 to 16)
    paddingVertical: 20, // Increased height (from 16 to 20)
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    backgroundColor: '#006B5C', // Darker green for pressed state
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16, // Reduced spacing from Forgot Password
  },
  toggleButtonText: {
    color: '#008272', // Using primary color directly for now
    fontSize: 14,
    fontWeight: '700', // Made bolder (from 500 to 700)
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 8, // Minimal spacing from toggle button
  },
  forgotPasswordText: {
    color: '#9CA3AF', // Made lighter and less prominent (from #6B7280)
    fontSize: 12, // Made smaller (from 14 to 12)
    fontWeight: '400', // Made lighter (from default to 400)
  },
});

export default LoginScreen;
