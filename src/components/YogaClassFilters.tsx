// YogaClassFilters.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

// Filter interface based on the database schema
export interface YogaClassFilters {
  // Basic filters
  title?: string;
  city?: string;
  duration?: 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS';
  gender_focus?: 'all' | 'male' | 'female';
  
  // Service type filters
  group_online?: boolean;
  group_offline?: boolean;
  one_to_one_online?: boolean;
  one_to_one_offline?: boolean;
  home_visit?: boolean;
  
  // Disease specific
  is_disease_specific?: boolean;
  disease?: string;
  
  // Price range
  min_price?: number;
  max_price?: number;
  
  // Time filters
  start_time?: string;
  end_time?: string;
  days?: string;
  
  // Location filters
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  
  // Other filters
  languages?: string;
  allow_mid_month_entry?: boolean;
  
  // Sorting
  sort_by?: 'price_low_to_high' | 'price_high_to_low' | 'near_to_far' | 'rating' | 'popular';
}

interface YogaClassFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: YogaClassFilters) => void;
  onClear: () => void;
  initialFilters?: YogaClassFilters;
}

const YogaClassFilters: React.FC<YogaClassFiltersProps> = ({
  visible,
  onClose,
  onApply,
  onClear,
  initialFilters = {},
}) => {
  const [filters, setFilters] = useState<YogaClassFilters>(initialFilters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  useEffect(() => {
    const count = Object.keys(filters).filter(key => {
      const value = filters[key as keyof YogaClassFilters];
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') return value.length > 0;
      if (typeof value === 'number') return value > 0;
      return false;
    }).length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setFilters({});
    onClear();
    onClose();
  };

  const updateFilter = (key: keyof YogaClassFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleBooleanFilter = (key: keyof YogaClassFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderFilterSection = (title: string, children: React.ReactNode) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterSectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderFilterOption = (
    key: keyof YogaClassFilters,
    label: string,
    type: 'boolean' | 'string' | 'number' = 'boolean'
  ) => {
    if (type === 'boolean') {
      return (
        <TouchableOpacity
          key={key}
          style={[
            styles.filterOption,
            filters[key] && styles.filterOptionActive
          ]}
          onPress={() => toggleBooleanFilter(key)}
        >
          <Text style={[
            styles.filterOptionText,
            filters[key] && styles.filterOptionTextActive
          ]}>
            {label}
          </Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderDurationOptions = () => (
    <View style={styles.filterOptions}>
      {[
        { value: 'ONE_MONTH', label: '1 Month' },
        { value: 'THREE_MONTHS', label: '3 Months' },
        { value: 'SIX_MONTHS', label: '6 Months' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterOption,
            filters.duration === option.value && styles.filterOptionActive
          ]}
          onPress={() => updateFilter('duration', 
            filters.duration === option.value ? undefined : option.value
          )}
        >
          <Text style={[
            styles.filterOptionText,
            filters.duration === option.value && styles.filterOptionTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderGenderOptions = () => (
    <View style={styles.filterOptions}>
      {[
        { value: 'all', label: 'All' },
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
      ].map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterOption,
            filters.gender_focus === option.value && styles.filterOptionActive
          ]}
          onPress={() => updateFilter('gender_focus', 
            filters.gender_focus === option.value ? undefined : option.value
          )}
        >
          <Text style={[
            styles.filterOptionText,
            filters.gender_focus === option.value && styles.filterOptionTextActive
          ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderServiceTypeOptions = () => (
    <View style={styles.filterOptions}>
      {renderFilterOption('group_online', 'Group Online')}
      {renderFilterOption('group_offline', 'Group Offline')}
      {renderFilterOption('one_to_one_online', '1-on-1 Online')}
      {renderFilterOption('one_to_one_offline', '1-on-1 Offline')}
      {renderFilterOption('home_visit', 'Home Visit')}
    </View>
  );

  const renderPriceRange = () => (
    <View style={styles.priceRangeContainer}>
      <TextInput
        style={styles.priceInput}
        placeholder="Min Price"
        keyboardType="numeric"
        value={filters.min_price?.toString() || ''}
        onChangeText={(text) => updateFilter('min_price', text ? parseInt(text) : undefined)}
      />
      <Text style={styles.priceRangeSeparator}>to</Text>
      <TextInput
        style={styles.priceInput}
        placeholder="Max Price"
        keyboardType="numeric"
        value={filters.max_price?.toString() || ''}
        onChangeText={(text) => updateFilter('max_price', text ? parseInt(text) : undefined)}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={24} color={colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Search by Title */}
          {renderFilterSection('Search', (
            <TextInput
              style={styles.filterInput}
              placeholder="Search by class title..."
              value={filters.title || ''}
              onChangeText={(text) => updateFilter('title', text)}
            />
          ))}

          {/* Location */}
          {renderFilterSection('Location', (
            <TextInput
              style={styles.filterInput}
              placeholder="Enter city name..."
              value={filters.city || ''}
              onChangeText={(text) => updateFilter('city', text)}
            />
          ))}

          {/* Duration */}
          {renderFilterSection('Duration', renderDurationOptions())}

          {/* Service Type */}
          {renderFilterSection('Service Type', renderServiceTypeOptions())}

          {/* Gender Focus */}
          {renderFilterSection('Gender Focus', renderGenderOptions())}

          {/* Disease Specific */}
          {renderFilterSection('Disease Specific', (
            <View>
              {renderFilterOption('is_disease_specific', 'Disease Specific Classes')}
              {filters.is_disease_specific && (
                <TextInput
                  style={[styles.filterInput, { marginTop: 8 }]}
                  placeholder="Enter disease name..."
                  value={filters.disease || ''}
                  onChangeText={(text) => updateFilter('disease', text)}
                />
              )}
            </View>
          ))}

          {/* Price Range */}
          {renderFilterSection('Price Range (₹)', renderPriceRange())}

          {/* Languages */}
          {renderFilterSection('Languages', (
            <TextInput
              style={styles.filterInput}
              placeholder="Enter languages (comma separated)..."
              value={filters.languages || ''}
              onChangeText={(text) => updateFilter('languages', text)}
            />
          ))}

          {/* Other Options */}
          {renderFilterSection('Other Options', (
            <View style={styles.filterOptions}>
              {renderFilterOption('allow_mid_month_entry', 'Allow Mid-Month Entry')}
            </View>
          ))}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              Apply Filters ({activeFiltersCount})
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  clearFiltersText: {
    fontSize: 16,
    color: colors.primaryGreen,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 12,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.primaryText,
    backgroundColor: colors.offWhite,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.offWhite,
  },
  filterOptionActive: {
    backgroundColor: colors.primaryGreen,
    borderColor: colors.primaryGreen,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: colors.offWhite,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.primaryText,
    backgroundColor: colors.offWhite,
  },
  priceRangeSeparator: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default YogaClassFilters;
