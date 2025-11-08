import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../utils/AuthContext';
import { AuthService } from '../services/auth/AuthService';
import { getAuthToken } from '../config/api';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { ROUTES } from '../navigation/constants';

const SplashScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const { setIsLoggedIn, setIsAuthenticated, setAuthStep, setUser } = useAuth();
  const fadeAnim = useSharedValue(0);
  const authService = AuthService.getInstance();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        fadeAnim.value = withTiming(1, { duration: 600 });
        const token = await getAuthToken();

        // Ensure splash shows for at least 1.2s
        await new Promise(resolve => setTimeout(resolve, 1200));

        if (token) {
          try {
            const profileResponse = await authService.getCurrentUser();

            if (profileResponse.success && profileResponse.data) {
              setUser(profileResponse.data);
              setIsLoggedIn(true);
              setIsAuthenticated(true);
              setAuthStep('main');
              navigation.reset({
                index: 0,
                routes: [{ name: ROUTES.HOME }],
              });
              return;
            } else {
              throw new Error('Invalid session token');
            }
          } catch {
            // Token invalid — log out
            await authService.logout();
          }
        }

        // Fallback to Auth flow
        setIsLoggedIn(false);
        setIsAuthenticated(false);
        setAuthStep('login');
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.AUTH }],
        });
      } catch (error) {
        console.error('Splash initialization failed:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: ROUTES.AUTH }],
        });
      }
    };

    initializeApp();
  }, [fadeAnim, navigation, authService, setIsLoggedIn, setIsAuthenticated, setAuthStep, setUser]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: withTiming(fadeAnim.value === 1 ? 1 : 0.95, { duration: 800 }) }],
  }));

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SY</Text>
        </View>
        <Text style={styles.appName}>SAMYAYOG</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});

export default SplashScreen;
