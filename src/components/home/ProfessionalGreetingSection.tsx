import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

interface ProfessionalGreetingSectionProps {
  style?: any;
}

const ProfessionalGreetingSection: React.FC<ProfessionalGreetingSectionProps> = ({ style }) => {
  const { user } = useAuth();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.first_name || user?.firstName || 'there';

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.greetingText}>{getGreetingTime()}, {userName}</Text>
      <Text style={styles.subtitle}>How can we support your wellness today?</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.l,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});

export default ProfessionalGreetingSection;
