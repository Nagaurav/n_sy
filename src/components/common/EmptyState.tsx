// src/components/common/EmptyState.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  iconSize?: number;
  iconColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  iconSize = 64,
  iconColor = colors.secondaryText,
}) => {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon as any} size={iconSize} color={iconColor} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
});
