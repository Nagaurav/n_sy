import React, { useState, useCallback, useRef } from 'react';
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
  TextInput,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { authService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { theme, commonStyles } from '../theme';
import { FloatingLabelInput } from '../components/FloatingLabelInput';

type PhoneNumberScreenProps = StackScreenProps<any, 'PhoneNumber'>;

const { width } = Dimensions.get('window');

const PhoneNumberScreen: React.FC<PhoneNumberScreenProps> = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [errors, setErrors] = useState<{phoneNumber?: string; otp?: string}>({});
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const { theme } = useTheme();
  const { signIn } = useAuth();
  
  // Create refs for each OTP input
  const otpInputRefs = useRef<(TextInput | null)[]>([]);

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
    const newErrors: {phoneNumber?: string} = {};
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Please enter your phone number';
    } else if (!isValidPhone(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const handleSendOTP = useCallback(async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setIsButtonPressed(true);

    try {
      const response = await authService.sendOTP(phoneNumber.trim());

      if (response.success) {
        setOtpSent(true);
        setOtp(['', '', '', '', '', '']);
        setErrors(prev => ({ ...prev, otp: undefined }));
      } else {
        Alert.alert(
          'Failed to Send OTP',
          response.error || 'Unable to send OTP. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Network Error',
        'Unable to connect. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
      setIsButtonPressed(false);
    }
  }, [phoneNumber]);

  const handleVerifyOTP = useCallback(async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setErrors(prev => ({ ...prev, otp: 'Please enter all 6 digits' }));
      return;
    }

    try {
      setIsVerifying(true);
      const response = await authService.verifyOTP(phoneNumber.trim(), otpString);

      if (response.success) {
        // Check if user is registered based on API response
        if (response.data?.user && response.data?.token) {
          // Registered User - log them in immediately
          const { user, token } = response.data;
          
          // Use the signIn method from AuthContext
          await signIn({ user, token });

          navigation.reset({
            index: 0,
            routes: [{ name: 'MainDrawer' }],
          });
        } else if (response.data?.isRegistered === false) {
          // New User - redirect to signup
          navigation.replace('Signup', { phoneNumber: phoneNumber.trim() });
        } else {
          // Fallback - if no clear indication, assume new user
          navigation.replace('Signup', { phoneNumber: phoneNumber.trim() });
        }
      } else {
        Alert.alert(
          'Verification Failed',
          response.error || 'Invalid OTP. Please try again.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Verification Error',
        'Unable to verify OTP. Please try again.'
      );
    } finally {
      setIsVerifying(false);
    }
  }, [phoneNumber, otp, navigation, signIn]);

  const handleOtpChange = (value: string, index: number) => {
    // Only allow single digit
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: undefined }));
    }
    
    // Auto-focus next input when a digit is entered
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    // Handle backspace to go to previous input
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOTP = useCallback(async () => {
    await handleSendOTP();
  }, [handleSendOTP]);

  const handleEmailLogin = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handlePhoneNumberChange = (text: string) => {
    // Only allow numeric input and limit to 10 digits
    const numericText = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhoneNumber(numericText);
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F5F2ED' }]}>
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
        style={styles.contentContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={{ 
            flexGrow: 1,
            paddingTop: 20,
            paddingBottom: 40
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={[styles.card, commonStyles.primaryCard, { borderColor: '#008272' }]}>
              <Text style={[styles.title, { color: '#008272' }]}>
                {otpSent ? 'Enter OTP' : 'Welcome to Samyayog'}
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                {otpSent 
                  ? `We've sent a 6-digit code to ${phoneNumber}`
                  : 'Enter your mobile number to continue'
                }
              </Text>

              <View style={styles.form}>
                {/* Phone Input - Hidden after OTP sent */}
                {!otpSent && (
                  <View style={styles.inputContainer}>
                    <FloatingLabelInput
                      label="Phone Number"
                      value={phoneNumber}
                      onChangeText={handlePhoneNumberChange}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="9876543210"
                      icon="phone"
                      error={errors.phoneNumber}
                    />
                  </View>
                )}

                {/* OTP Input Boxes - Shown after OTP sent */}
                {otpSent && (
                  <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Enter 6-digit OTP</Text>
                    <View style={styles.otpBoxesContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={(ref) => {
                            otpInputRefs.current[index] = ref;
                          }}
                          style={[
                            styles.otpBox,
                            errors.otp && styles.otpBoxError
                          ]}
                          value={digit}
                          onChangeText={(value) => handleOtpChange(value, index)}
                          onKeyPress={({ nativeEvent: { key } }) => handleOtpKeyPress(key, index)}
                          keyboardType="numeric"
                          maxLength={1}
                          textAlign="center"
                          secureTextEntry={false}
                          selectionColor={theme.colors.primary}
                        />
                      ))}
                    </View>
                    {errors.otp && (
                      <Text style={styles.otpErrorText}>{errors.otp}</Text>
                    )}
                  </View>
                )}

                {/* Send OTP / Verify OTP Button */}
                <Pressable
                  style={[
                    styles.button, 
                    { backgroundColor: '#008272' },
                    ((!otpSent && (!phoneNumber || phoneNumber.length < 10)) || 
                     (otpSent && otp.join('').length !== 6) || 
                     isLoading || isVerifying) && styles.buttonDisabled,
                    isButtonPressed && { backgroundColor: theme.colors.secondary }
                  ]}
                  onPress={otpSent ? handleVerifyOTP : handleSendOTP}
                  disabled={
                    (!otpSent && (!phoneNumber || phoneNumber.length < 10)) || 
                    (otpSent && otp.join('').length !== 6) || 
                    isLoading || isVerifying
                  }
                  onPressIn={() => setIsButtonPressed(true)}
                  onPressOut={() => setIsButtonPressed(false)}
                >
                  <Text style={styles.buttonText}>
                    {isVerifying ? 'Verifying...' : 
                     isLoading ? 'Sending...' : 
                     otpSent ? 'Verify OTP' : 'Send OTP'}
                  </Text>
                </Pressable>

                {/* Resend OTP - Shown after OTP sent */}
                {otpSent && (
                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={handleResendOTP}
                    activeOpacity={0.7}
                    disabled={isLoading}
                  >
                    <Text style={[styles.resendButtonText, { color: '#008272' }]}>
                      Resend OTP
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Change Number - Shown after OTP sent */}
                {otpSent && (
                  <TouchableOpacity
                    style={styles.changeNumberButton}
                    onPress={() => {
                      setOtpSent(false);
                      setOtp(['', '', '', '', '', '']);
                      setErrors({});
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.changeNumberButtonText, { color: theme.colors.text.secondary }]}>
                      Change phone number
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Toggle Button - Hidden after OTP sent */}
                {!otpSent && (
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={handleEmailLogin}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.toggleButtonText, { color: '#008272' }]}>
                      Log in using Email
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sign Up Link - Hidden after OTP sent */}
                {!otpSent && (
                  <View style={styles.signUpContainer}>
                    <Text style={[styles.signUpText, { color: theme.colors.text.secondary }]}>
                      New to Samyayog? 
                    </Text>
                    <Pressable 
                      onPress={() => navigation.navigate('Signup')}
                      onPressIn={() => setIsButtonPressed(true)}
                      onPressOut={() => setIsButtonPressed(false)}
                    >
                      <Text style={[styles.signUpLink, { color: '#008272' }]}>Create Account</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  logoImage: ImageStyle;
  contentContainer: ViewStyle;
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
  signUpContainer: ViewStyle;
  signUpText: TextStyle;
  signUpLink: TextStyle;
  otpContainer: ViewStyle;
  otpLabel: TextStyle;
  otpBoxesContainer: ViewStyle;
  otpBox: ViewStyle;
  otpBoxError: ViewStyle;
  otpErrorText: TextStyle;
  resendButton: ViewStyle;
  resendButtonText: TextStyle;
  changeNumberButton: ViewStyle;
  changeNumberButtonText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
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
  contentContainer: {
    flex: 1,
    paddingTop: 20,
  },
  card: {
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 16,
    padding: 24,
    minHeight: 420,
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
    minHeight: 200,
  },
  inputContainer: {
    marginBottom: 20,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
    ...theme.shadows.card,
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
  otpContainer: {
    marginBottom: 20,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  otpBox: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '600' as const,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background.surface,
    textAlign: 'center' as const,
  } as ViewStyle & TextStyle,
  otpBoxError: {
    borderColor: theme.colors.error,
  },
  otpErrorText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  changeNumberButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  changeNumberButtonText: {
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});

export default PhoneNumberScreen;
