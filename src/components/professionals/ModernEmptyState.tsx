import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface ModernEmptyStateProps {
  searchQuery?: string;
  onRefresh: () => void;
  onClearSearch?: () => void;
}

const ModernEmptyState: React.FC<ModernEmptyStateProps> = ({
  searchQuery,
  onRefresh,
  onClearSearch,
}) => {
  const hasSearchQuery = searchQuery && searchQuery.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['rgba(0, 130, 114, 0.05)', 'rgba(0, 130, 114, 0.02)']}
        style={styles.backgroundGradient}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Icon Container */}
        <View style={styles.iconContainer}>
          <Ionicons
            name={hasSearchQuery ? 'search-outline' : 'people-outline'}
            size={64}
            color={hasSearchQuery ? '#D1D5DB' : theme.colors.primary}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {hasSearchQuery ? 'No professionals found' : 'No professionals available'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          {hasSearchQuery
            ? `No results for "${searchQuery}"`
            : 'Check back later for available professionals'}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {hasSearchQuery && onClearSearch && (
            <TouchableOpacity style={styles.secondaryButton} onPress={onClearSearch}>
              <Ionicons name="close-circle-outline" size={18} color="#6B7280" />
              <Text style={styles.secondaryButtonText}>Clear Search</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.card,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: theme.spacing.s,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.colors?.border || '#E5E7EB',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: theme.spacing.s,
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 130, 114, 0.03)',
    top: -20,
    left: -20,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 130, 114, 0.02)',
    bottom: 40,
    right: -10,
  },
  decorativeCircle3: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 130, 114, 0.04)',
    top: 60,
    right: 40,
  },
});

export default ModernEmptyState;
