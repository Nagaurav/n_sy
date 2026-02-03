import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

interface GreetingSectionProps {
  style?: any;
}

const GreetingSection: React.FC<GreetingSectionProps> = ({ style }) => {
  const { user } = useAuth();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const userName = user?.first_name || user?.firstName || 'Welcome back';

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.greetingText}>Good {getGreetingTime()}</Text>
      <Text style={styles.userNameText}>{userName}</Text>
      <Text style={styles.welcomeMessage}>Ready to continue your wellness journey?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.xl,
  },
  greetingText: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  userNameText: {
    ...theme.typography.h1,
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 38,
  },
  welcomeMessage: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 24,
  },
});

export default GreetingSection;
