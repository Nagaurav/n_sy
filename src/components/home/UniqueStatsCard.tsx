import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface UniqueStatsCardProps {
  value: number;
  label: string;
  icon: string;
  accentColor?: string;
  style?: ViewStyle;
}

const UniqueStatsCard: React.FC<UniqueStatsCardProps> = ({
  value,
  label,
  icon,
  accentColor = '#008272',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Background Pattern */}
      <View style={[styles.patternBackground, { backgroundColor: `${accentColor}10` }]} />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Icon and Number Row */}
        <View style={styles.mainRow}>
          {/* Icon */}
          <View style={[styles.iconWrapper, { borderColor: accentColor }]}>
            <Ionicons name={icon as any} size={18} color={accentColor} />
          </View>
          
          {/* Number */}
          <View style={styles.numberContainer}>
            <Text style={[styles.bigNumber, { color: accentColor }]}>{value}</Text>
            <View style={[styles.underline, { backgroundColor: accentColor }]} />
          </View>
        </View>
        
        {/* Label */}
        <Text style={styles.label}>{label}</Text>
      </View>
      
      {/* Side Accent Line */}
      <View style={[styles.sideAccent, { backgroundColor: accentColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - theme.spacing.l * 2 - theme.spacing.m * 2) / 3 - 8,
    height: 110,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  patternBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    padding: theme.spacing.m,
    position: 'relative',
    zIndex: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  numberContainer: {
    flex: 1,
    alignItems: 'center',
  },
  bigNumber: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -1,
  },
  underline: {
    height: 3,
    width: 40,
    borderRadius: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  sideAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 4,
    bottom: 0,
  },
});

export default UniqueStatsCard;
