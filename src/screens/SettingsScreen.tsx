import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Switch,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { theme: themeHook } = useTheme();
  const { signOut } = useAuth();
  const appTheme = themeHook || theme;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // State management
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoBookingEnabled, setAutoBookingEnabled] = useState(true);
  
  // Start entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: () => signOut(),
          style: 'destructive',
        },
      ]
    );
  };

  const handlePrivacySecurity = () => {
    Alert.alert('Privacy & Security', 'Privacy and security settings will be available soon.');
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Password change feature will be available soon.');
  };

  const handleTermsConditions = () => {
    Alert.alert('Terms & Conditions', 'Terms and conditions will be available soon.');
  };

  const handlePrivacyPolicy = () => {
    Alert.alert('Privacy Policy', 'Privacy policy will be available soon.');
  };

  const handleAbout = () => {
    Alert.alert('About', 'SamyaYog App\nVersion 1.0.0\nYour wellness companion');
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile' as any);
  };

  const handleBiometricToggle = (value: boolean) => {
    if (value) {
      Alert.alert('Biometric Authentication', 'Biometric authentication will be available in a future update.');
    }
    setBiometricEnabled(value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    Alert.alert('Dark Mode', 'Dark mode will be available in a future update.');
    setDarkModeEnabled(false); // Keep false until implemented
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header matching ProfessionalHomeScreen */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#008272', '#4C7360', '#2F5233']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>SETTINGS</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences Section */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="notifications-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive appointment reminders</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.primary }}
                thumbColor={appTheme.colors.background.surface}
              />
            </TouchableOpacity>

            {notificationsEnabled && (
              <>
                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '15' }]}>
                      <Ionicons name="mail-outline" size={18} color={appTheme.colors.primary} />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>Email Notifications</Text>
                      <Text style={styles.settingDescription}>Get updates via email</Text>
                    </View>
                  </View>
                  <Switch
                    value={emailNotifications}
                    onValueChange={setEmailNotifications}
                    trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.primary }}
                    thumbColor={appTheme.colors.background.surface}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '15' }]}>
                      <Ionicons name="chatbubble-outline" size={18} color={appTheme.colors.primary} />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>SMS Notifications</Text>
                      <Text style={styles.settingDescription}>Receive text messages</Text>
                    </View>
                  </View>
                  <Switch
                    value={smsNotifications}
                    onValueChange={setSmsNotifications}
                    trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.primary }}
                    thumbColor={appTheme.colors.background.surface}
                  />
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.accent + '20' }]}>
                  <Ionicons name="moon-outline" size={20} color={appTheme.colors.accent} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>Switch to dark theme</Text>
                </View>
              </View>
              <Switch
                value={darkModeEnabled}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.accent }}
                thumbColor={appTheme.colors.background.surface}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.feedback.success + '20' }]}>
                  <Ionicons name="finger-print-outline" size={20} color={appTheme.colors.feedback.success} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Biometric Authentication</Text>
                  <Text style={styles.settingDescription}>Use fingerprint or face ID</Text>
                </View>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={handleBiometricToggle}
                trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.feedback.success }}
                thumbColor={appTheme.colors.background.surface}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacySecurity}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Privacy & Security</Text>
                  <Text style={styles.settingDescription}>Manage your privacy settings</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handleChangePassword}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="key-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Change Password</Text>
                  <Text style={styles.settingDescription}>Update your password</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* App Settings Section */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.accent + '20' }]}>
                  <Ionicons name="calendar-outline" size={20} color={appTheme.colors.accent} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Auto-booking</Text>
                  <Text style={styles.settingDescription}>Automatically book available slots</Text>
                </View>
              </View>
              <Switch
                value={autoBookingEnabled}
                onValueChange={setAutoBookingEnabled}
                trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.accent }}
                thumbColor={appTheme.colors.background.surface}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handleTermsConditions}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="document-text-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Terms & Conditions</Text>
                  <Text style={styles.settingDescription}>Read our terms of service</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handlePrivacyPolicy}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Privacy Policy</Text>
                  <Text style={styles.settingDescription}>How we protect your data</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow} onPress={handleAbout}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons name="information-circle-outline" size={20} color={appTheme.colors.primary} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>About</Text>
                  <Text style={styles.settingDescription}>App version and info</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Account Actions Section */}
        <Animated.View 
          style={[
            styles.sectionWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Account Actions</Text>
          
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRow} onPress={handleEditProfile}>
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.feedback.warning + '20' }]}>
                  <Ionicons name="person-outline" size={20} color={appTheme.colors.feedback.warning} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingLabel}>Edit Profile</Text>
                  <Text style={styles.settingDescription}>Update your personal information</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingRow, styles.dangerSettingRow]}
              onPress={handleSignOut}
            >
              <View style={styles.settingInfo}>
                <View style={[styles.iconContainer, { backgroundColor: appTheme.colors.feedback.error + '20' }]}>
                  <Ionicons name="log-out-outline" size={20} color={appTheme.colors.feedback.error} />
                </View>
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, styles.dangerText]}>Sign Out</Text>
                  <Text style={styles.settingDescription}>Sign out of your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={appTheme.colors.feedback.error} />
            </TouchableOpacity>
          </View>
        </Animated.View>
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  
  // Header Styles - matching ProfessionalHomeHeader
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  placeholder: {
    width: 44,
  },
  
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  sectionWrapper: {
    marginBottom: theme.spacing.l,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  
  // Settings Card Styles
  settingsCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.s,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.background.secondary,
  },
  dangerSettingRow: {
    borderBottomWidth: 0,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
  },
  dangerText: {
    color: theme.colors.feedback.error,
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});

export default SettingsScreen;
