import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, ViewStyle, TextStyle, Animated, Image, ImageStyle } from 'react-native';
import { theme, commonStyles } from '../theme';

type Styles = {
  container: ViewStyle;
  logoContainer: ViewStyle;
  logoImage: ImageStyle;
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
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: theme.spacing.l,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Add background for debugging
    borderRadius: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
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
        duration: 1200, // Slower animation
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1200, // Slower animation
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
        <Image 
          source={require('../assets/logo.jpg')} 
          style={styles.logoImage} 
          resizeMode="contain" 
          onError={() => console.log('❌ Logo image failed to load')}
          onLoad={() => console.log('✅ Logo image loaded successfully')}
        />
        <Text style={styles.appName}>SAMYAYOG</Text>
      </Animated.View>
    </View>
  );
};

export default SplashScreen;
