import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { authService } from '../services';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logoContainer: ViewStyle;
  logoCircle: ViewStyle;
  logoText: TextStyle;
  appName: TextStyle;
  content: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  inputContainer: ViewStyle;
  input: TextStyle;
  countryCode: TextStyle;
  phoneInputContainer: ViewStyle;
  phoneInputWrapper: ViewStyle;
  phoneInput: TextStyle;
  button: ViewStyle;
  buttonText: TextStyle;
  buttonDisabled: ViewStyle;
  errorText: TextStyle;
  loginWithEmailButton: ViewStyle;
  loginWithEmailText: TextStyle;
  footer: ViewStyle;
  footerText: TextStyle;
  linkText: TextStyle;
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
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    paddingTop: 40,
    marginTop: -30,
    backgroundColor: '#F3F4F6',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flex: 1,
    marginLeft: 0,
  },
  phoneInput: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginRight: 8,
  },
  button: {
    backgroundColor: '#008272',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  loginWithEmailButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loginWithEmailText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#1E88E5',
    textDecorationLine: 'underline',
  },
});

const PhoneNumberScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Validate phone number (exactly 10 digits)
  const isValidPhoneNumber = (number: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(number);
  };

  const handleSendOTP = async () => {
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.sendOTP(phoneNumber);

      if (response.success) {
        navigation.navigate('OTP', { phoneNumber });
      } else {
        setError(response.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP send error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneNumberChange = (text: string) => {
    // Only allow numeric input and limit to 10 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(numericText);
    setError('');
  };

  const openTermsOfService = () => {
    // Replace with actual terms of service URL
    Linking.openURL('https://samyayog.com/terms');
  };

  const openPrivacyPolicy = () => {
    // Replace with actual privacy policy URL
    Linking.openURL('https://samyayog.com/privacy');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>SY</Text>
          </View>
          <Text style={styles.appName}>SAMYAYOG</Text>
        </View>
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >

        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Samyayog</Text>
          <Text style={styles.subtitle}>Enter your mobile number to begin.</Text>

          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>🇮🇳 +91</Text>
            <FloatingLabelInput
              label="Phone Number"
              value={phoneNumber}
              onChangeText={handlePhoneNumberChange}
              error={error}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
              containerStyle={styles.phoneInputWrapper}
              inputStyle={styles.phoneInput}
            />
          </View>

          <TouchableOpacity
            style={[
              phoneNumber.length === 10 ? styles.button : styles.buttonDisabled
            ]}
            onPress={handleSendOTP}
            disabled={phoneNumber.length !== 10 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.background.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          {/* Login with Email option */}
          <TouchableOpacity
            style={styles.loginWithEmailButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginWithEmailText}>Login with Email Instead</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default PhoneNumberScreen;
