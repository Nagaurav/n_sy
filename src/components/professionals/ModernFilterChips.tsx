import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

export interface FilterState {
  isOnline?: boolean;
  hasActiveFilters?: boolean;
}

interface ModernFilterChipsProps {
  filters: FilterState;
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
  const isOnlineActive = filters.isOnline === true;
  const isInPersonActive = filters.isOnline === false;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* All Filter */}
        <TouchableOpacity
          style={[
            styles.chip,
            !isOnlineActive && !isInPersonActive && styles.chipActive,
          ]}
          onPress={() => onFilterPress('all')}
        >
          <Ionicons
            name="grid-outline"
            size={16}
            color={!isOnlineActive && !isInPersonActive ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[
              styles.chipText,
              !isOnlineActive && !isInPersonActive && styles.chipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>

        {/* Online Filter */}
        <TouchableOpacity
          style={[styles.chip, isOnlineActive && styles.chipActive]}
          onPress={() => onFilterPress('online')}
        >
          <Ionicons
            name="videocam-outline"
            size={16}
            color={isOnlineActive ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[styles.chipText, isOnlineActive && styles.chipTextActive]}
          >
            Online
          </Text>
        </TouchableOpacity>

        {/* In-Person Filter */}
        <TouchableOpacity
          style={[styles.chip, isInPersonActive && styles.chipActive]}
          onPress={() => onFilterPress('inPerson')}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={isInPersonActive ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[styles.chipText, isInPersonActive && styles.chipTextActive]}
          >
            In-Person
          </Text>
        </TouchableOpacity>

        {/* More Filters */}
        <TouchableOpacity
          style={[styles.chip, styles.moreFiltersChip]}
          onPress={onMoreFiltersPress}
        >
          <Ionicons name="options-outline" size={16} color="#6B7280" />
          <Text style={styles.chipText}>Filters</Text>
          {activeCount > 0 && (
            <View style={styles.activeFilterBadge}>
              <Text style={styles.activeFilterText}>{activeCount}</Text>
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
    paddingBottom: theme.spacing.m,
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
    backgroundColor: theme.colors.background.surface,
    marginRight: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  chipActive: {
    backgroundColor: '#008272',
    borderColor: '#008272',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  moreFiltersChip: {
    position: 'relative',
  },
  activeFilterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ModernFilterChips;
