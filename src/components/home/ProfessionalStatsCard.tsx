import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import { theme } from '../../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

interface ProfessionalStatsCardProps {
  value: number;
  label: string;
  icon: string;
  color?: string;
  style?: ViewStyle;
}

const ProfessionalStatsCard: React.FC<ProfessionalStatsCardProps> = ({
  value,
  label,
  icon,
  color = theme.colors.primary,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Icon at Top */}
      <View style={styles.iconSection}>
        <View style={[styles.iconContainer, { borderColor: color }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
      </View>
      
      {/* Label in Middle */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </View>
      
      {/* Number at Bottom */}
      <View style={styles.numberSection}>
        <Text style={[styles.number, { color }]}>{value}</Text>
      </View>
      
      {/* Footer with Progress Bar */}
      <View style={styles.footer}>
        <View style={[styles.progressBar, { backgroundColor: `${color}20` }]} />
        <View style={[styles.progressFill, { backgroundColor: color, width: `${Math.min(value * 10, 100)}%` }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - theme.spacing.l * 2 - theme.spacing.m * 2) / 3 - 8,
    height: 140,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    ...theme.shadows.card,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.surface,
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 14,
  },
  numberSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  number: {
    fontSize: 35,
    fontWeight: '300',
    lineHeight: 40,
    textAlign: 'center',
  },
  footer: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    minWidth: 4,
  },
});

export default ProfessionalStatsCard;
