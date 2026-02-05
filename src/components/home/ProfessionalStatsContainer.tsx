import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { theme, commonStyles } from '../../theme';

const { width } = Dimensions.get('window');

interface ProfessionalStatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
}

const ProfessionalStatsCard: React.FC<ProfessionalStatsCardProps> = ({ 
  title, 
  value, 
  subtitle,
  color = theme.colors.primary 
}) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

interface ProfessionalStatsContainerProps {
  upcomingSessions: number;
  completedThisMonth: number;
  totalSessions: number;
}

const ProfessionalStatsContainer: React.FC<ProfessionalStatsContainerProps> = ({
  upcomingSessions,
  completedThisMonth,
  totalSessions,
}) => {
  return (
    <View style={styles.statsContainer}>
      <ProfessionalStatsCard
        title="Upcoming"
        value={upcomingSessions}
        subtitle="sessions"
        color={theme.colors.primary}
      />
      <ProfessionalStatsCard
        title="Completed"
        value={completedThisMonth}
        subtitle="this month"
        color={theme.colors.primary}
      />
      <ProfessionalStatsCard
        title="Total"
        value={totalSessions}
        subtitle="sessions"
        color={theme.colors.primary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    marginBottom: theme.spacing.l,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
});

export { ProfessionalStatsContainer, ProfessionalStatsCard };
