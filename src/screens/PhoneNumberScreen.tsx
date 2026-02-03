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
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons'; // Ensure you have this or MaterialIcons
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services';

const PhoneNumberScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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
      
      {/* Header with Logo (matching LoginScreen) */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Image 
          source={require('../assets/logo.jpg')} 
          style={styles.logoImage} 
          resizeMode="contain" 
        />
      </View>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={[styles.card, { backgroundColor: theme.colors.background.surface, ...theme.shadows.float }]}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Welcome to Samyayog</Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Enter your mobile number</Text>

              {/* PHONE INPUT */}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text.secondary }]}>Enter your phone</Text>
                <View style={[styles.phoneInputContainer, { borderBottomColor: theme.colors.text.secondary }]}>
                  <Text style={[styles.countryCode, { color: theme.colors.text.primary }]}>+91</Text>
                  <TextInput
                    style={[styles.phoneInput, { color: theme.colors.text.primary }]}
                    value={phoneNumber}
                    onChangeText={handlePhoneNumberChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="9876543210"
                    placeholderTextColor={theme.colors.text.secondary}
                    autoFocus
                  />
                </View>
                {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}
              </View>

              {/* ACTION BUTTON */}
              <TouchableOpacity 
                style={[
                  styles.button, 
                  phoneNumber.length === 10 && !isLoading ? { backgroundColor: theme.colors.primary } : { backgroundColor: theme.colors.text.secondary },
                  phoneNumber.length === 10 && !isLoading && { ...theme.shadows.card }
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

              <Text style={[styles.otpText, { color: theme.colors.text.secondary }]}>We'll send you a one-time password</Text>

              {/* Login with Email option */}
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={[styles.toggleButtonText, { color: theme.colors.primary }]}>Log in using Email</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
    height: 160, // Same as LoginScreen
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 40, // Same as LoginScreen
    alignItems: 'center', // Center the logo
    justifyContent: 'center', // Center the logo
  },
  logoImage: {
    width: 120, // Same as LoginScreen
    height: 120, // Same as LoginScreen
    resizeMode: 'contain', // Same as LoginScreen
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  card: {
    marginHorizontal: 0,
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
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  phoneInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '400',
  },
  otpText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
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

export default PhoneNumberScreen;
