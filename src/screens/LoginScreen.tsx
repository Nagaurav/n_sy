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
  Animated,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { authService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme, commonStyles } from '../theme';
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
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  const { signIn } = useAuth();
  const { theme } = useTheme();

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
          'Invalid credentials. Please try again or use phone verification.'
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
    <View style={[styles.container, { backgroundColor: '#F5F2ED' }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Logo */}
      <View style={[styles.header, { backgroundColor: '#008272' }]}>
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <Image 
            source={require('../assets/logo.jpg')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
        </Animated.View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={[styles.card, commonStyles.primaryCard, { borderColor: theme.colors.feedback.success }]}>
              <Text style={[styles.title, { color: '#008272' }]}>Welcome Back</Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Continue your wellness journey</Text>

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
                      { backgroundColor: '#008272' },
                      isLoading && styles.buttonDisabled,
                      isButtonPressed && { backgroundColor: theme.colors.secondary }
                    ]}
                    onPress={handlePasswordLogin}
                    disabled={isLoading}
                    onPressIn={() => setIsButtonPressed(true)}
                    onPressOut={() => setIsButtonPressed(false)}
                  >
                    <Text style={styles.buttonText}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Text>
                  </Pressable>
                )}

                {/* Toggle Button */}
                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={handleOTPToggle}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.toggleButtonText, { color: '#008272' }]}>
                    {isPasswordLogin ? 'Use OTP instead' : 'Use email/password'}
                  </Text>
                </TouchableOpacity>

                {/* Forgot Password Link */}
                {isPasswordLogin && (
                  <TouchableOpacity 
                    style={styles.forgotPasswordButton}
                    onPress={() => navigation.navigate('PhoneNumber')}
                  >
                    <Text style={[styles.forgotPasswordText, { color: theme.colors.text.secondary }]}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sign Up Link */}
                <View style={styles.signUpContainer}>
                  <Text style={[styles.signUpText, { color: theme.colors.text.secondary }]}>
                    New to Samyayog? 
                  </Text>
                  <Pressable 
                    style={[styles.signUpLink, { color: '#008272' }]}
                    onPress={() => navigation.navigate('Signup')}
                    onPressIn={() => setIsButtonPressed(true)}
                    onPressOut={() => setIsButtonPressed(false)}
                  >
                    <Text style={[styles.signUpLink, { color: '#008272' }]}>Create Account</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

// ...

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logoImage: ImageStyle;
  card: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  form: ViewStyle;
  inputContainer: ViewStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  buttonDisabled: ViewStyle;
  toggleButton: ViewStyle;
  toggleButtonText: TextStyle;
  forgotPasswordButton: ViewStyle;
  forgotPasswordText: TextStyle;
  signUpContainer: ViewStyle;
  signUpText: TextStyle;
  signUpLink: TextStyle;
};
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    height: 160,
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  card: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
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
  forgotPasswordButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '400',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: '400',
    marginRight: 4,
  },
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
