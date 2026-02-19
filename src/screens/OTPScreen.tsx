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
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { authService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

type Styles = {
  container: ViewStyle;
  header: ViewStyle;
  headerContent: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  titleContainer: ViewStyle;
  notificationButton: ViewStyle;
  placeholder: ViewStyle;
  content: ViewStyle;
  card: ViewStyle;
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
  phoneDisplay: ViewStyle;
  phoneLabel: TextStyle;
  phoneNumber: TextStyle;
  otpCard: ViewStyle;
  otpSubtitle: TextStyle;
  otpInputs: ViewStyle;
  errorContainer: ViewStyle;
  actionsContainer: ViewStyle;
  verifyButton: ViewStyle;
};

  const styles = StyleSheet.create<Styles>({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.l,
    paddingTop: theme.spacing.xl,
  },
  card: {
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 30,
    padding: 40,
    backgroundColor: '#FFFFFF',
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
    height: 60,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: theme.borderRadius.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpInputFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F0FDFA',
  },
  otpInput: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.5,
    backgroundColor: '#4C7360',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  resendContainer: {
    alignItems: 'center',
  },
  resendText: {
    color: '#6B7280',
    fontSize: 14,
  },
  resendButton: {
    color: '#008272',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  countdownText: {
    color: '#6B7280',
    fontSize: 14,
  },
  phoneDisplay: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...theme.shadows.card,
  },
  phoneLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.s,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  otpCard: {
    backgroundColor: theme.colors.background.surface,
    padding: theme.spacing.l,
    borderRadius: theme.borderRadius.l,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...theme.shadows.card,
  },
  otpSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  errorContainer: {
    backgroundColor: theme.colors.feedback.error + '10',
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    marginBottom: theme.spacing.l,
    borderWidth: 1,
    borderColor: theme.colors.feedback.error + '30',
  },
  actionsContainer: {
    gap: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  verifyButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    ...theme.shadows.card,
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

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleOtpChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
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
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.verifyOTP(phoneNumber, otpString);
      
      if (response.success && response.data) {
        if (response.data.isRegistered === false || !response.data.user) {
          navigation.navigate('Signup', { phoneNumber });
        } else {
          await signIn({
            user: response.data.user,
            token: response.data.token
          });
        }
      } else {
        setError(response.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Network error. Please try again.');
      setOtp(['', '', '', '', '', '']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');

    try {
      const response = await authService.sendOTP(phoneNumber);
      
      if (response.success) {
        setTimeLeft(30);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setError('');
      } else {
        setError(response.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      console.error('Resend OTP error:', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length >= 10) {
      const firstFive = phone.slice(0, 5);
      const lastFive = phone.slice(5);
      return `+91 ${firstFive} ${lastFive}`;
    }
    return `+91 ${phone}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <StatusBar backgroundColor="#008272" barStyle="light-content" />
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Verify OTP</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
          showsVerticalScrollIndicator={false}
        >
          {/* Phone Number Display */}
          <View style={styles.phoneDisplay}>
            <Text style={styles.phoneLabel}>Code sent to:</Text>
            <Text style={styles.phoneNumber}>{maskPhoneNumber(phoneNumber)}</Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpCard}>
            <Text style={styles.otpSubtitle}>Enter 6-digit code</Text>
            
            <View style={styles.otpInputs}>
              {otp.slice(0, 6).map((digit, index) => (
                <View
                  key={index}
                  style={[
                    styles.otpInputContainer,
                    focusedIndex === index && styles.otpInputFocused
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
                    caretHidden
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.verifyButton, (!otp.slice(0, 6).join('') || isLoading) && styles.buttonDisabled]}
              onPress={handleVerifyOTP}
              disabled={!otp.slice(0, 6).join('') || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.colors.background.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendOTP}
              disabled={isLoading || !canResend}
              activeOpacity={0.8}
            >
              <Text style={styles.resendText}>
                {canResend ? `Resend in ${timeLeft}s` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};


export default OTPScreen;
