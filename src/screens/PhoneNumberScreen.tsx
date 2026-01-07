import React, { useState, useCallback } from 'react';
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
  Image,
  ImageStyle,
  StatusBar,
  Dimensions,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { authService } from '../services';
import { FloatingLabelInput } from '../components/FloatingLabelInput';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerOverlay: ViewStyle;
  logoImage: ImageStyle;
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
  },
  header: {
    height: 160, // Reduced from 240 to match LoginScreen
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden', // Ensures image gets clipped to rounded corners
    position: 'relative',
    marginTop: 40, // Same as LoginScreen
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Same as LoginScreen
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)', // Same as LoginScreen
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800', // Made bolder (from bold to 800)
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
    alignItems: 'flex-start', // Align to top for better baseline
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flex: 1,
    marginLeft: 0,
    justifyContent: 'center', // Center content vertically
    marginTop: 2, // Align with icon
  },
  phoneInput: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
    marginRight: 8,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  button: {
    backgroundColor: '#008272',
    borderRadius: 16, // More rounded corners (from 12 to 16)
    paddingVertical: 20, // Increased height (from 16 to 20)
    alignItems: 'center',
    marginBottom: 16, // Reduced from 24
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
    borderRadius: 16, // More rounded corners
    paddingVertical: 20, // Increased height
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 16, // Reduced spacing
  },
  loginWithEmailText: {
    color: '#008272', // Using primary color directly
    fontSize: 14,
    fontWeight: '700', // Made bolder (from 500 to 700)
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
  const [isButtonPressed, setIsButtonPressed] = useState(false);

  // Validate phone number (exactly 10 digits)
  const isValidPhoneNumber = (number: string) => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(number);
  };

  const handleSendOTP = async () => {
    setIsButtonPressed(true);
    
    if (!isValidPhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      setIsButtonPressed(false);
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
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
      setIsButtonPressed(false);
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
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* 🟢 MODIFIED HEADER: Full Cover Image (matching LoginScreen) */}
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

        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Samyayog</Text>
          <Text style={styles.subtitle}>Enter your mobile number{'\n'}We'll send you a one-time password</Text>

          <View style={styles.phoneInputContainer}>
            <View style={styles.countryCode}>
              <Image 
                source={require('../assets/icons/phone-call.png')} 
                style={{width: 20, height: 20, tintColor: '#1F2937'}} 
                resizeMode="contain"
              />
            </View>
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

          <Pressable
            style={[
              phoneNumber.length === 10 ? styles.button : styles.buttonDisabled,
              isButtonPressed && { backgroundColor: '#006B5C' } // Pressed state
            ]}
            onPress={handleSendOTP}
            disabled={phoneNumber.length !== 10 || isLoading}
            onPressIn={() => setIsButtonPressed(true)}
            onPressOut={() => setIsButtonPressed(false)}
          >
            {isLoading ? (
              <ActivityIndicator color={theme.colors.background.white} size="small" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </Pressable>

          {/* Login with Email option */}
          <TouchableOpacity
            style={styles.loginWithEmailButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginWithEmailText}>Log in using Email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default PhoneNumberScreen;
