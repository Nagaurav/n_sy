// SplashScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../utils/AuthContext';

interface SplashScreenProps {
  onNavigateToAuth: () => void;
  onNavigateToHome: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onNavigateToAuth, onNavigateToHome }) => {
  const { setIsLoggedIn, setIsAuthenticated, setAuthStep } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const fadeAnim = useSharedValue(0);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Start fade-in animation
        fadeAnim.value = withTiming(1, { duration: 500 });

        // Check for existing user session
        const token = await AsyncStorage.getItem('token');
        
        // Wait for minimum splash duration (2.5 seconds total)
        await new Promise(resolve => setTimeout(resolve, 2500));
        
        if (token) {
          // User is authenticated, navigate to home
          setIsLoggedIn(true);
          setIsAuthenticated(true);
          setAuthStep('main');
          onNavigateToHome();
        } else {
          // No valid session, navigate to auth
          setIsLoggedIn(false);
          setIsAuthenticated(false);
          setAuthStep('login');
          onNavigateToAuth();
        }
      } catch (error) {
        console.error('Splash screen initialization error:', error);
        // On error, navigate to auth screen
        onNavigateToAuth();
      } finally {
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, [fadeAnim, onNavigateToAuth, onNavigateToHome, setIsLoggedIn, setIsAuthenticated, setAuthStep]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        {/* Logo Circle with SY initials */}
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SY</Text>
        </View>
        
        {/* App Name */}
        <Text style={styles.appName}>SAMYAYOG</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E88E5', // Primary blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF', // Pure white
    textAlign: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF', // Pure white
    letterSpacing: 2, // Refined spacing
    textAlign: 'center',
  },
});

export default SplashScreen; 