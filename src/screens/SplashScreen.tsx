import React from 'react';
import { View, Text, StyleSheet, StatusBar, ViewStyle, TextStyle } from 'react-native';
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
    marginBottom: theme.spacing.large,
    overflow: 'hidden',
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.background.white,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.background.white,
    letterSpacing: 2,
    marginTop: theme.spacing.large,
  },
});

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          {/* Logo image will be placed here */}
          <Text style={styles.logoText}>SY</Text>
        </View>
        <Text style={styles.appName}>SAMYAYOG</Text>
      </View>
    </View>
  );
};

export default SplashScreen;
