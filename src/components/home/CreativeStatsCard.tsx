import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface CreativeStatsCardProps {
  value: number;
  label: string;
  icon: string;
  primaryColor?: string;
  secondaryColor?: string;
  style?: ViewStyle;
}

const CreativeStatsCard: React.FC<CreativeStatsCardProps> = ({
  value,
  label,
  icon,
  primaryColor = '#008272',
  secondaryColor = '#4C7360',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Background Circle */}
      <View style={[styles.backgroundCircle, { backgroundColor: `${primaryColor}15` }]} />
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Top Icon */}
        <View style={styles.topSection}>
          <LinearGradient
            colors={[primaryColor, secondaryColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}
          >
            <Ionicons name={icon as any} size={22} color="#FFFFFF" />
          </LinearGradient>
        </View>
        
        {/* Center Number Display */}
        <View style={styles.centerSection}>
          <Text style={styles.bigNumber}>{value}</Text>
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, { backgroundColor: primaryColor }]} />
            <View style={[styles.dot, { backgroundColor: primaryColor }]} />
            <View style={[styles.dot, { backgroundColor: primaryColor }]} />
          </View>
        </View>
        
        {/* Bottom Label */}
        <View style={styles.bottomSection}>
          <Text style={styles.label}>{label}</Text>
        </View>
      </View>
      
      {/* Floating Decorations */}
      <View style={[styles.floatingDot1, { backgroundColor: primaryColor }]} />
      <View style={[styles.floatingDot2, { backgroundColor: secondaryColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: (width - theme.spacing.l * 2 - theme.spacing.m * 2) / 3 - 8,
    height: 120,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  backgroundCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    top: -50,
    right: -50,
  },
  content: {
    flex: 1,
    padding: theme.spacing.m,
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
  },
  topSection: {
    marginBottom: theme.spacing.s,
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  centerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: '900',
    color: '#008272',
    marginBottom: 8,
    letterSpacing: -2,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.m,
    width: '100%',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#008272',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  floatingDot1: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: 15,
    left: 15,
    opacity: 0.6,
  },
  floatingDot2: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    bottom: 20,
    right: 20,
    opacity: 0.4,
  },
});

export default CreativeStatsCard;
