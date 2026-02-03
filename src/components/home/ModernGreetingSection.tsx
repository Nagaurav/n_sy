import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface ModernGreetingSectionProps {
  style?: any;
}

const ModernGreetingSection: React.FC<ModernGreetingSectionProps> = ({ style }) => {
  const { user } = useAuth();

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  const userName = user?.first_name || user?.firstName || 'Welcome back';

  return (
    <LinearGradient
      colors={['#F8FAFC', '#F1F5F9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, style]}
    >
      <View style={styles.content}>
        <View style={styles.greetingRow}>
          <Text style={styles.emoji}>{getGreetingEmoji()}</Text>
          <Text style={styles.greetingText}>Good {getGreetingTime()}</Text>
        </View>
        
        <Text style={styles.userNameText}>{userName}</Text>
        
        <Text style={styles.welcomeMessage}>Ready to continue your wellness journey?</Text>
      </View>
      
      {/* Decorative elements */}
      <View style={styles.decorativeCircle} />
      <View style={styles.decorativeCircle2} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.l * 2,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  content: {
    zIndex: 2,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  emoji: {
    fontSize: 24,
    marginRight: theme.spacing.s,
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  userNameText: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  wellnessScore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.m,
  },
  scoreContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.s,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  streakContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.s,
    alignItems: 'center',
  },
  streakLabel: {
    fontSize: 11,
    color: '#FF6B6B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  streakValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  welcomeMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Decorative elements
  decorativeCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 130, 114, 0.05)',
    top: -40,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 107, 107, 0.03)',
    bottom: -20,
    left: -20,
  },
});

export default ModernGreetingSection;
