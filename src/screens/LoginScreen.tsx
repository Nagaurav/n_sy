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
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { AuthService } from '../services/auth/AuthService';
import { useAuth } from '../utils/AuthContext';

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

  const { setIsLoggedIn, setUser, setAuthStep } = useAuth();
  const authService = AuthService.getInstance();

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
      const credentials: LoginCredentials = {
        identifier: identifier.trim(),
        password: password.trim(),
      };

      const response = await authService.login(credentials);

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Update auth context
        setUser(user);
        setIsLoggedIn(true);
        setAuthStep('main');

        // Navigate to main app
        navigation.replace('Main');
      } else {
        Alert.alert('Login Failed', response.message || 'Invalid credentials. Please try again.');
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
  }, [identifier, password, authService, setIsLoggedIn, setUser, setAuthStep, navigation]);

  const handleOTPToggle = useCallback(() => {
    // Navigate to phone number input for OTP login
    navigation.navigate('PhoneNumber');
  }, [navigation]);

  const renderFloatingInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    secureTextEntry?: boolean,
    keyboardType: any = 'default'
  ) => {
    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.textInputWrapper}>
          <Text
            style={[
              styles.floatingLabel,
              value ? styles.floatingLabelActive : styles.floatingLabelInactive,
            ]}
          >
            {placeholder}
          </Text>
          <TextInput
            style={[
              styles.textInput,
              secureTextEntry ? { fontFamily: 'monospace' } : {},
            ]}
            secureTextEntry={secureTextEntry}
            onChangeText={onChangeText}
            value={value}
            keyboardType={keyboardType}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder=""
          />
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login to SAMYAYOG</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Identifier Input (Email/Phone) */}
            {renderFloatingInput(
              'Email or Phone Number',
              identifier,
              setIdentifier,
              'Email or Phone Number',
              false,
              'default'
            )}

            {/* Password Input */}
            {isPasswordLogin &&
              renderFloatingInput(
                'Password',
                password,
                setPassword,
                'Password',
                true,
                'default'
              )}

            {/* Login Button */}
            {isPasswordLogin && (
              <TouchableOpacity
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handlePasswordLogin}
                disabled={isLoading}
              >
                <Text style={[styles.loginButtonText, isLoading && styles.loginButtonTextDisabled]}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Toggle Button */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={handleOTPToggle}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
    marginBottom: 8,
  },
  textInputWrapper: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    minHeight: 56,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    fontSize: 16,
    color: '#a0aec0',
    pointerEvents: 'none',
  },
  floatingLabelActive: {
    top: 4,
    fontSize: 12,
    color: '#4a5568',
  },
  floatingLabelInactive: {
    top: 18,
    fontSize: 16,
  },
  textInput: {
    fontSize: 16,
    color: '#2d3748',
    paddingTop: 8,
    minHeight: 24,
  },
  loginButton: {
    backgroundColor: '#5b21b6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#5b21b6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButtonDisabled: {
    backgroundColor: '#a78bfa',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButtonTextDisabled: {
    color: '#e9d5ff',
  },
  toggleButton: {
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 12,
  },
  toggleButtonText: {
    color: '#5b21b6',
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#718096',
    fontSize: 14,
  },
});

export default LoginScreen;
