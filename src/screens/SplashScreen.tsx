import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ViewStyle, TextStyle, Animated } from 'react-native';
import { theme, commonStyles } from '../theme';

type Styles = {
  container: ViewStyle;
  logoContainer: ViewStyle;
  logoCircle: ViewStyle;
  logoText: TextStyle;
  appName: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...commonStyles.container,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.background.surface,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.background.surface,
    letterSpacing: 2,
    marginTop: theme.spacing.l,
  },
});

const SplashScreen = () => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  const animatedLogoStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>SY</Text>
        </View>
        <Text style={styles.appName}>SAMYAYOG</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;
