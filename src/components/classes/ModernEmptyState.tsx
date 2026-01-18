import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface ModernEmptyStateProps {
  searchQuery?: string;
  onRefresh: () => void;
  onClearSearch?: () => void;
  title?: string;
  subtitle?: string;
  showClearButton?: boolean;
}

const ModernEmptyState: React.FC<ModernEmptyStateProps> = ({
  searchQuery,
  onRefresh,
  onClearSearch,
  title,
  subtitle,
  showClearButton = false,
}) => {
  const isSearchResult = searchQuery && searchQuery.trim().length > 0;

  const getDefaultTitle = () => {
    if (isSearchResult) {
      return `No results for "${searchQuery}"`;
    }
    return title || 'No Classes Found';
  };

  const getDefaultSubtitle = () => {
    if (isSearchResult) {
      return 'Try adjusting your search terms or browse all classes';
    }
    return subtitle || 'Start by exploring available yoga classes in your area';
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={isSearchResult ? 'search-outline' : 'fitness-outline'} 
          size={64} 
          color={theme.colors.text.secondary} 
        />
      </View>
      
      <Text style={styles.title}>
        {getDefaultTitle()}
      </Text>
      
      <Text style={styles.subtitle}>
        {getDefaultSubtitle()}
      </Text>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={20} color={theme.colors.background.surface} />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>

        {isSearchResult && showClearButton && onClearSearch && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={onClearSearch}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={20} color={theme.colors.primary} />
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isSearchResult && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Tips for finding classes:</Text>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.feedback.success} />
            <Text style={styles.tipText}>Try different search keywords</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.feedback.success} />
            <Text style={styles.tipText}>Use filters to narrow down results</Text>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.feedback.success} />
            <Text style={styles.tipText}>Check your location settings</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.text.secondary + '20',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.s,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  refreshButtonText: {
    color: theme.colors.background.surface,
    fontWeight: '600',
    fontSize: 16,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    gap: theme.spacing.s,
  },
  clearButtonText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  tipsContainer: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    width: '100%',
    ...theme.shadows.card,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    gap: theme.spacing.s,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
});

export default ModernEmptyState;
