import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure you have this or MaterialIcons
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services';

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

  const handlePhoneNumberChange = (text: string) => {
    // Only allow numeric input and limit to 10 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(numericText);
    setError('');
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
      setError('Unable to connect. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
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
        <View style={styles.headerOverlay} />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome to Samyayog</Text>
          <Text style={styles.subtitle}>Enter your mobile number</Text>

          {/* PHONE INPUT */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Enter your phone</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="9876543210"
                placeholderTextColor="#CCC"
                autoFocus
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          {/* ACTION BUTTON */}
          <TouchableOpacity 
            style={[
              styles.button, 
              phoneNumber.length === 10 && !isLoading ? null : styles.buttonDisabled
            ]} 
            onPress={handleSendOTP}
            disabled={phoneNumber.length < 10 || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.otpText}>We'll send you a one-time password</Text>

          {/* Login with Email option */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleButtonText}>Log in using Email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // 🟢 NEW HEADER STYLES (matching LoginScreen)
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
  label: { color: '#888', fontSize: 12, marginBottom: 5 },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingVertical: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.5,
  },
  countryCode: { fontSize: 16, fontWeight: '600', color: '#000', marginRight: 10 },
  errorText: { color: '#EF4444', marginTop: 8, fontSize: 14 },
  otpText: { 
    color: '#6B7280', 
    fontSize: 14, 
    textAlign: 'center', 
    marginTop: 8, 
    marginBottom: 16 
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
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16, // Reduced spacing
  },
  toggleButtonText: {
    color: '#008272', // Using primary color directly
    fontSize: 14,
    fontWeight: '700', // Made bolder (from 500 to 700)
    textDecorationLine: 'underline',
  },
  });

export default PhoneNumberScreen;
