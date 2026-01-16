import React, { useState, useRef, useEffect } from 'react';
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
  StatusBar,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { authService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  content: ViewStyle;
  card: ViewStyle;
  decorativeCircle: ViewStyle;
  subtitle: TextStyle;
  phoneNumberText: TextStyle;
  otpContainer: ViewStyle;
  otpInputContainer: ViewStyle;
  otpInputFocused: ViewStyle;
  otpInput: TextStyle;
  button: ViewStyle;
  buttonDisabled: ViewStyle;
  buttonText: TextStyle;
  errorText: TextStyle;
  resendContainer: ViewStyle;
  resendText: TextStyle;
  resendButton: TextStyle;
  countdownText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
  },
  header: {
    height: 120,
    width: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    marginTop: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 80,
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  card: {
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 30,
    padding: 40,
    backgroundColor: '#FFFFFF',
  },
  decorativeCircle: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width / 2,
    backgroundColor: 'rgba(0, 130, 114, 0.05)',
    top: -width / 2,
    left: 0,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '500',
  },
  phoneNumberText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    fontWeight: '700',
    fontFamily: RNPlatform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  otpInputContainer: {
    width: 45,
    height: 65,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputFocused: {
    borderColor: '#008272',
    backgroundColor: '#F0FDFA',
    shadowColor: '#008272',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  otpInput: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1A202C',
    textAlign: 'center',
    width: '100%',
    height: '100%',
    letterSpacing: 2,
  },
  button: {
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#008272',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  resendText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '500',
  },
  resendButton: {
    color: '#008272',
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: '#64748B',
    fontSize: 15,
    marginTop: 4,
    fontWeight: '500',
  },
});

const OTPScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const { phoneNumber } = route.params || {};
  const { signIn } = useAuth();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const isOtpComplete = otp.every(digit => digit !== '');

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

  // Mask phone number for privacy
  const maskPhoneNumber = (phone: string) => {
    if (phone.length >= 10) {
      const firstFive = phone.slice(0, 5);
      const lastFive = phone.slice(5);
      return `+91 ${firstFive} ${lastFive}`;
    }
    return `+91 ${phone}`;
  };

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(phoneNumber, otpString);

      if (response.success && response.data) {
        if (response.data.isRegistered === false || !response.data.user) {
          // New user - navigate to signup
          navigation.navigate('Signup', { phoneNumber });
        } else {
          // Existing user - store token and let auth state handle navigation
          if (response.data.token && response.data.user) {
            try {
              console.log('🔐 OTP Verified - User object from API:', response.data.user);
              console.log('🔐 User has _id?', '_id' in response.data.user);
              console.log('🔐 User has id?', 'id' in response.data.user);
              
              await signIn({
                user: response.data.user,
                token: response.data.token
              });
              // Navigation will happen automatically due to auth state change
              // No manual navigation needed
            } catch (authError) {
              console.error('Authentication error:', authError);
              setError('Failed to authenticate. Please try again.');
            }
          } else {
            setError('Authentication data missing. Please try again.');
          }
        }
      } else {
        setError(response.error || 'Invalid OTP. Please try again.');
        // Clear OTP fields on error
        setOtp(['', '', '', '', '', '']);
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setCanResend(false);
    setTimeLeft(30);
    setError('');

    try {
      const response = await authService.sendOTP(phoneNumber);

      if (response.success) {
        setOtp(['', '', '', '', '', '']); // Clear OTP inputs
        // Focus first input
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }

        // Restart countdown
        setTimeLeft(30);
        const timer = setInterval(() => {
          setTimeLeft((prev: number) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(response.error || 'Failed to resend OTP. Please try again.');
        setCanResend(true);
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
      setCanResend(true);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Logo */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>Verify OTP</Text>
        </Animated.View>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 10 }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            <View style={[styles.card, { backgroundColor: theme.colors.background.surface, ...theme.shadows.float }]}>
              <View style={styles.decorativeCircle} />
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Enter the 6-digit code sent to</Text>
              <Text style={[styles.phoneNumberText, { color: theme.colors.text.primary }]}>{maskPhoneNumber(phoneNumber)}</Text>

              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.otpInputContainer,
                      { backgroundColor: theme.colors.background.surface },
                      focusedIndex === index && styles.otpInputFocused,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        inputRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      value={digit}
                      onChangeText={(value) => handleOtpChange(value, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      editable={!isLoading}
                      caretHidden={true}
                    />
                  </View>
                ))}
              </View>

              {error ? <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text> : null}

              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                  (!isOtpComplete || isLoading) && styles.buttonDisabled
                ]}
                onPress={handleVerifyOTP}
                disabled={!isOtpComplete || isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Proceed</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendContainer}>
                {canResend ? (
                  <TouchableOpacity onPress={handleResendOTP} disabled={isLoading}>
                    <Text style={styles.resendButton}>Resend OTP</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.countdownText}>
                    Resend OTP in {timeLeft} seconds
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default OTPScreen;
