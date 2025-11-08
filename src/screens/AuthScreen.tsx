// AuthScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../utils/AuthContext';
import { makeApiRequest, API_CONFIG, setAuthToken } from '../config/api';

const AuthScreen: React.FC = () => {
  const { setIsLoggedIn, setAuthStep, setPhoneNumber, setIsAuthenticated, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [otpSent, setOTPSent] = useState(false);

  // Input fields
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [error, setError] = useState('');

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Animate in the form
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // --- Handlers ---

  const onSendOTP = async () => {
    if (!phone.trim() || !/^\d{10}$/.test(phone.trim())) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, 
        'POST', 
        { phone: phone.trim() }
      );

      if (response.success) {
        setOTPSent(true);
      } else {
        // The API doc doesn't show userExists, so we just show the message
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await makeApiRequest(
        API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, 
        'POST', 
        { 
          phone: phone.trim(), 
          code: otp.trim() // Your API doc specified 'code', not 'otp'
        }
      );

      console.log('AuthScreen - OTP verification response:', response);

      // Check for the token in the response (it might be in response.data.token or response.token)
      const token = response.data?.token || response.token;
      const user = response.data?.user || response.user; // Get the user object

      if (response.success && token && user) {
        // 1. Save the token to AsyncStorage
        await setAuthToken(token); 

        // 2. Save the user object to your global context
        setUser(user); 

        // 3. Set all the other auth flags
        setPhoneNumber(phone);
        setIsLoggedIn(true);
        setIsAuthenticated(true);
        setAuthStep('main');

        console.log('AuthScreen - Authentication successful, redirecting to home...');
      } else {
        setError(response.message || 'OTP verification failed. Please check the code and try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during verification.');
    } finally {
      setLoading(false);
    }
  };

  // --- UI Blocks ---

  const OTPBlock = (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {/* Phone Input with Icon */}
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons 
          name="phone" 
          size={20} 
          color={colors.secondaryText} 
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter your mobile number"
          placeholderTextColor={colors.secondaryText}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          maxLength={10}
          editable={!loading}
        />
      </View>

      {/* Send OTP Button */}
      <TouchableOpacity 
        style={[
          styles.authButton, 
          (!phone.trim() || loading) && styles.authButtonDisabled
        ]} 
        onPress={onSendOTP} 
        disabled={loading || !phone.trim()}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.offWhite} size="small" />
        ) : (
          <>
            <MaterialCommunityIcons name="send" size={20} color={colors.offWhite} />
            <Text style={styles.authButtonText}>Send OTP</Text>
          </>
        )}
      </TouchableOpacity>

      {/* OTP Input Section */}
      {otpSent && (
        <Animated.View 
          style={[
            styles.otpSection,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons 
              name="lock" 
              size={20} 
              color={colors.secondaryText} 
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor={colors.secondaryText}
              keyboardType="numeric"
              value={otp}
              onChangeText={setOTP}
              maxLength={6}
              editable={!loading}
            />
          </View>

          <TouchableOpacity 
            style={[
              styles.authButton, 
              styles.verifyButton,
              (otp.length < 6 || loading) && styles.authButtonDisabled
            ]} 
            onPress={onVerifyOTP} 
            disabled={loading || otp.length < 6}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={colors.offWhite} size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.offWhite} />
                <Text style={styles.authButtonText}>Verify OTP</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );

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
        {/* Logo and Brand Section */}
        <View style={styles.brandSection}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons 
              name="yoga" 
              size={64} 
              color={colors.primaryGreen} 
            />
          </View>
          <Text style={styles.brandTitle}>Samyā Yog</Text>
          <Text style={styles.brandSubtitle}>Your wellness journey starts here</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          <Text style={styles.header}>Welcome Back</Text>
          <Text style={styles.subheader}>
            Sign in with your mobile number to continue
          </Text>

          {/* OTP Form */}
          <View style={styles.formContainer}>
            {OTPBlock}
          </View>
          
          {/* Error Message */}
          {error ? (
            <Animated.View style={[styles.errorContainer, { opacity: fadeAnim }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.error}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Footer Text */}
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
        {/* Test Button for Debugging */}
        {__DEV__ && (
          <TouchableOpacity 
            style={[styles.authButton, { marginTop: 20, backgroundColor: colors.accentOrange }]} 
            onPress={() => {
              console.log('Test button pressed - simulating successful login');
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
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
  brandTitle: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: colors.primaryGreen,
    marginBottom: 8,
    letterSpacing: -1,
  },
  brandSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
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
  header: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  subheader: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.primaryText,
    paddingVertical: 16,
    fontWeight: '500' as const,
  },
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
  verifyButton: {
    backgroundColor: colors.accentTeal,
    shadowColor: colors.accentTeal,
  },
  authButtonDisabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  authButtonText: {
    color: colors.offWhite,
    fontWeight: '600' as const,
    fontSize: 16,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  otpSection: {
    marginTop: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  error: {
    color: colors.error,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  footerText: {
    fontSize: 12,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '400' as const,
  },
});

export default AuthScreen; 