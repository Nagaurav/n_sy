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
  TextInput,
  SafeAreaView,
  ViewStyle,
  TextStyle,
  ImageStyle,
  Image,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { authService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

type LoginScreenProps = StackScreenProps<any, 'Login'>;

interface LoginCredentials {
  identifier: string;
  password: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isPasswordLogin, setIsPasswordLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { signIn } = useAuth();
  const { theme } = useTheme();

  const handlePasswordLogin = useCallback(async () => {
    // Basic validation
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);

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
        Alert.alert('Login Failed', response.error || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Error',
        'An error occurred during login. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [identifier, password, signIn, navigation]);

  const handleOTPToggle = useCallback(() => {
    // Navigate to phone number input for OTP login
    navigation.navigate('PhoneNumber');
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.jpg')} 
            style={styles.logoImage} 
            resizeMode="contain" 
          />
          <Text style={styles.appName}>SAMYAYOG</Text>
        </View>
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
                  onChangeText={setIdentifier}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              {isPasswordLogin && (
                <View style={styles.inputContainer}>
                  <FloatingLabelInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Login Button */}
              {isPasswordLogin && (
                <TouchableOpacity
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                  onPress={handlePasswordLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Toggle Button */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={handleOTPToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleButtonText}>
                  {isPasswordLogin ? 'Login with OTP Instead' : 'Use Email/Password'}
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
    </SafeAreaView>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logoContainer: ViewStyle;
  logoImage: ImageStyle;
  appName: TextStyle;
  content: ViewStyle;
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
};
const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 40,
    paddingBottom: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleButtonText: {
    color: '#008272', // Using primary color directly for now
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#6B7280',
    fontSize: 14,
  },
});

export default LoginScreen;
