import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface ModernFilterChipsProps {
  filters: {
    isOnline?: boolean;
    hasActiveFilters: boolean;
    sortBy?: string;
  };
  onFilterPress: (filterType: 'all' | 'online' | 'inPerson' | 'more') => void;
  onMoreFiltersPress: () => void;
  activeCount?: number;
}

const ModernFilterChips: React.FC<ModernFilterChipsProps> = ({
  filters,
  onFilterPress,
  onMoreFiltersPress,
  activeCount = 0,
}) => {
  const getFilterStyle = (filterType: 'all' | 'online' | 'inPerson') => {
    switch (filterType) {
      case 'all':
        return !filters.isOnline ? styles.chipActive : styles.chipInactive;
      case 'online':
        return filters.isOnline === true ? styles.chipActive : styles.chipInactive;
      case 'inPerson':
        return filters.isOnline === false ? styles.chipActive : styles.chipInactive;
      default:
        return styles.chipInactive;
    }
  };

  const getFilterTextStyle = (filterType: 'all' | 'online' | 'inPerson') => {
    switch (filterType) {
      case 'all':
        return !filters.isOnline ? styles.chipTextActive : styles.chipTextInactive;
      case 'online':
        return filters.isOnline === true ? styles.chipTextActive : styles.chipTextInactive;
      case 'inPerson':
        return filters.isOnline === false ? styles.chipTextActive : styles.chipTextInactive;
      default:
        return styles.chipTextInactive;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, getFilterStyle('all')]}
          onPress={() => onFilterPress('all')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="grid-outline" 
            size={16} 
            color={getFilterTextStyle('all').color as any} 
          />
          <Text style={getFilterTextStyle('all')}>All Classes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, getFilterStyle('online')]}
          onPress={() => onFilterPress('online')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="videocam-outline" 
            size={16} 
            color={getFilterTextStyle('online').color as any} 
          />
          <Text style={getFilterTextStyle('online')}>Online</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, getFilterStyle('inPerson')]}
          onPress={() => onFilterPress('inPerson')}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="people-outline" 
            size={16} 
            color={getFilterTextStyle('inPerson').color as any} 
          />
          <Text style={getFilterTextStyle('inPerson')}>In-Person</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chip, styles.moreFiltersChip, filters.hasActiveFilters && styles.moreFiltersChipActive]}
          onPress={onMoreFiltersPress}
          activeOpacity={0.8}
        >
          <Ionicons 
            name="options-outline" 
            size={16} 
            color={filters.hasActiveFilters ? theme.colors.background.surface : theme.colors.text.secondary} 
          />
          <Text style={[styles.moreFiltersText, filters.hasActiveFilters && styles.moreFiltersTextActive]}>
            More Filters
          </Text>
          {activeCount > 0 && (
            <View style={styles.activeCountBadge}>
              <Text style={styles.activeCountText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
  },
  scrollContent: {
    paddingRight: theme.spacing.l,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderRadius: theme.borderRadius.xl,
    marginRight: theme.spacing.s,
    gap: theme.spacing.xs,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipInactive: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
  },
  chipTextActive: {
    color: theme.colors.background.surface,
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextInactive: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 14,
  },
  moreFiltersChip: {
    backgroundColor: theme.colors.background.surface,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
  },
  moreFiltersChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  moreFiltersText: {
    color: theme.colors.text.secondary,
    fontWeight: '500',
    fontSize: 14,
  },
  moreFiltersTextActive: {
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  activeCountBadge: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.circle,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeCountText: {
    color: theme.colors.background.surface,
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ModernFilterChips;
