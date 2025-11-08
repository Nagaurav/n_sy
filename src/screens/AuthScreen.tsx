import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { useAuth } from '../utils/AuthContext';
import { makeApiRequest, API_CONFIG, setAuthToken } from '../config/api';

const AuthScreen: React.FC = () => {
  const { setIsLoggedIn, setAuthStep, setPhoneNumber, setIsAuthenticated, setUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [otpSent, setOTPSent] = useState(false);
  const [error, setError] = useState('');
  const [sendingOTP, setSendingOTP] = useState(false);
  const [verifyingOTP, setVerifyingOTP] = useState(false);

  // Animations
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(40))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  /** ✅ Helper: Send OTP */
  const handleSendOTP = async () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setError('');
    setSendingOTP(true);

    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, 'POST', {
        phone: phone.trim(),
      });

      if (response.success) {
        setOTPSent(true);
      } else {
        setError(response.message || 'Failed to send OTP. Try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  /** ✅ Helper: Verify OTP */
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setError('');
    setVerifyingOTP(true);

    try {
      const response = await makeApiRequest(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, 'POST', {
        phone: phone.trim(),
        code: otp.trim(),
      });

      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user;

      if (response.success && token && user) {
        await setAuthToken(token);
        setUser(user);
        setPhoneNumber(phone);
        setIsLoggedIn(true);
        setIsAuthenticated(true);
        setAuthStep('main');
      } else {
        setError(response.message || 'Incorrect OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying OTP. Please retry.');
    } finally {
      setVerifyingOTP(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="yoga" size={64} color={colors.primaryGreen} />
          </View>
          <Text style={styles.brandTitle}>Samyā Yog</Text>
          <Text style={styles.brandSubtitle}>Your wellness journey starts here</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <Text style={styles.header}>Welcome Back</Text>
          <Text style={styles.subheader}>Sign in with your mobile number to continue</Text>

          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="phone" size={20} color={colors.secondaryText} />
              <TextInput
                style={styles.input}
                placeholder="Enter your mobile number"
                keyboardType="phone-pad"
                placeholderTextColor={colors.secondaryText}
                value={phone}
                onChangeText={setPhone}
                editable={!sendingOTP && !verifyingOTP}
                maxLength={10}
              />
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.authButton,
                (!phone || sendingOTP) && styles.authButtonDisabled,
              ]}
              onPress={handleSendOTP}
              disabled={!phone || sendingOTP}
              activeOpacity={0.8}
            >
              {sendingOTP ? (
                <ActivityIndicator color={colors.offWhite} />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={20} color={colors.offWhite} />
                  <Text style={styles.authButtonText}>Send OTP</Text>
                </>
              )}
            </TouchableOpacity>

            {/* OTP Input */}
            {otpSent && (
              <View style={styles.otpSection}>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="lock" size={20} color={colors.secondaryText} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit OTP"
                    keyboardType="numeric"
                    placeholderTextColor={colors.secondaryText}
                    value={otp}
                    onChangeText={setOTP}
                    editable={!verifyingOTP}
                    maxLength={6}
                  />
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[
                    styles.authButton,
                    styles.verifyButton,
                    (otp.length < 6 || verifyingOTP) && styles.authButtonDisabled,
                  ]}
                  onPress={handleVerifyOTP}
                  disabled={otp.length < 6 || verifyingOTP}
                  activeOpacity={0.8}
                >
                  {verifyingOTP ? (
                    <ActivityIndicator color={colors.offWhite} />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="check-circle" size={20} color={colors.offWhite} />
                      <Text style={styles.authButtonText}>Verify OTP</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Error Message */}
          {error ? (
            <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </Animated.View>
          ) : null}

          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Dev Test Button */}
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.authButton, { marginTop: 20, backgroundColor: colors.accentOrange }]}
            onPress={() => {
              setPhoneNumber('9876543210');
              setIsLoggedIn(true);
              setIsAuthenticated(true);
              setAuthStep('main');
            }}
          >
            <Text style={styles.authButtonText}>Test Login (Dev Only)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 40 },
  brandSection: { alignItems: 'center', marginBottom: 40 },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  brandTitle: { fontSize: 36, fontWeight: '800', color: colors.primaryGreen, marginBottom: 8, letterSpacing: -1 },
  brandSubtitle: { fontSize: 16, color: colors.secondaryText, textAlign: 'center', fontWeight: '500' },
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  header: { fontSize: 28, fontWeight: '700', color: colors.primaryText, textAlign: 'center', marginBottom: 8 },
  subheader: { fontSize: 16, color: colors.secondaryText, textAlign: 'center', marginBottom: 32 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, color: colors.primaryText, paddingVertical: 14 },
  authButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  verifyButton: { backgroundColor: colors.accentTeal, shadowColor: colors.accentTeal },
  authButtonDisabled: { backgroundColor: colors.border, shadowOpacity: 0, elevation: 0 },
  authButtonText: { color: colors.offWhite, fontWeight: '600', fontSize: 16, marginLeft: 8 },
  otpSection: { marginTop: 16 },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  error: { color: colors.error, marginLeft: 8, fontSize: 14, fontWeight: '500', flex: 1 },
  footerText: { fontSize: 12, color: colors.secondaryText, textAlign: 'center', lineHeight: 16 },
});

export default AuthScreen;
