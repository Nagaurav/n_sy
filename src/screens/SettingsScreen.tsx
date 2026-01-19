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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
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
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Settings</Text>
              <Text style={styles.headerSubtitle}>Manage your preferences</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
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
                onValueChange={setDarkModeEnabled}
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
                onValueChange={setBiometricEnabled}
                trackColor={{ false: appTheme.colors.background.secondary, true: appTheme.colors.feedback.success }}
                thumbColor={appTheme.colors.background.surface}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingRow}>
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

            <TouchableOpacity style={styles.settingRow}>
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

            <TouchableOpacity style={styles.settingRow}>
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

            <TouchableOpacity style={styles.settingRow}>
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

            <TouchableOpacity style={styles.settingRow}>
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
            <TouchableOpacity style={styles.settingRow}>
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
    backgroundColor: theme.colors.background.primary,
  },
  
  // Header Styles
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 1,
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
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
