import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { FilterModalState } from '../../types/booking';

interface ProfessionalsFilterModalProps {
  visible: boolean;
  filters: FilterModalState;
  onClose: () => void;
  onApply: (filters: Partial<FilterModalState>) => void;
  onReset: () => void;
}

const { width, height } = Dimensions.get('window');

const ProfessionalsFilterModal: React.FC<ProfessionalsFilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterModalState>(filters || {});

  React.useEffect(() => {
    if (filters) {
      setLocalFilters(filters);
    }
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: FilterModalState = {
      category_id: undefined,
      is_online: undefined,
      min_price: 0,
      max_price: 1000,
      gender: undefined,
      sort_by: 'rating',
      city: undefined,
      role: undefined,
    };
    setLocalFilters(resetFilters);
    onReset();
  };

  const SortOption = ({ value, label, icon }: { value: string; label: string; icon: string }) => {
    const isActive = localFilters.sort_by === value;
    return (
      <TouchableOpacity
        style={[styles.sortOption, isActive && styles.sortOptionActive]}
        onPress={() => 
          setLocalFilters(prev => ({ 
            ...prev, 
            sort_by: value as any 
          }))
        }
        activeOpacity={0.8}
      >
        <View style={styles.sortOptionContent}>
          <Ionicons 
            name={icon as any} 
            size={16} 
            color={isActive ? theme.colors.background.surface : theme.colors.text.secondary} 
          />
          <Text style={[styles.sortOptionText, isActive && styles.sortOptionTextActive]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const GenderOption = ({ gender, label, icon }: { gender: string; label: string; icon: string }) => {
    const isActive = localFilters.gender === gender;
    return (
      <TouchableOpacity
        style={[styles.genderOption, isActive && styles.genderOptionActive]}
        onPress={() => 
          setLocalFilters(prev => ({ 
            ...prev, 
            gender: prev.gender === gender ? undefined : gender as any 
          }))
        }
        activeOpacity={0.8}
      >
        <View style={styles.genderOptionContent}>
          <Ionicons 
            name={icon as any} 
            size={18} 
            color={isActive ? theme.colors.background.surface : theme.colors.primary} 
          />
          <Text style={[styles.genderOptionText, isActive && styles.genderOptionTextActive]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const OnlineModeOption = ({ isOnline, label, icon }: { isOnline: boolean | undefined; label: string; icon: string }) => {
    const isActive = localFilters.is_online === isOnline;
    return (
      <TouchableOpacity
        style={[styles.onlineOption, isActive && styles.onlineOptionActive]}
        onPress={() => 
          setLocalFilters(prev => ({ 
            ...prev, 
            is_online: prev.is_online === isOnline ? undefined : isOnline 
          }))
        }
        activeOpacity={0.8}
      >
        <View style={styles.onlineOptionContent}>
          <Ionicons 
            name={icon as any} 
            size={18} 
            color={isActive ? theme.colors.background.surface : theme.colors.primary} 
          />
          <Text style={[styles.onlineOptionText, isActive && styles.onlineOptionTextActive]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="options-outline" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.title}>Filter Professionals</Text>
                <Text style={styles.subtitle}>
                  {getActiveFilterCount(localFilters)} active filter{getActiveFilterCount(localFilters) !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Location Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Location</Text>
              </View>
              <View style={styles.inputGroup}>
                <Ionicons 
                  name="map-outline" 
                  size={20} 
                  color={theme.colors.text.secondary} 
                  style={styles.inputIcon} 
                />
                <TextInput
                  style={styles.input}
                  placeholder="City name"
                  value={localFilters.city || ''}
                  onChangeText={(text) => 
                    setLocalFilters(prev => ({ ...prev, city: text || undefined }))
                  }
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            </View>

            {/* Price Range Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetag-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Price Range</Text>
              </View>
              <View style={styles.priceContainer}>
                <View style={styles.priceInputContainer}>
                  <Ionicons 
                    name="cash-outline" 
                    size={18} 
                    color={theme.colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    placeholder="Min"
                    keyboardType="numeric"
                    value={localFilters.min_price?.toString() || ''}
                    onChangeText={(text) => 
                      setLocalFilters(prev => ({ 
                        ...prev, 
                        min_price: text ? Number(text) : 0 
                      }))
                    }
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
                <View style={styles.priceSeparator}>
                  <Text style={styles.priceSeparatorText}>to</Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <Ionicons 
                    name="wallet-outline" 
                    size={18} 
                    color={theme.colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    placeholder="Max"
                    keyboardType="numeric"
                    value={localFilters.max_price?.toString() || ''}
                    onChangeText={(text) => 
                      setLocalFilters(prev => ({ 
                        ...prev, 
                        max_price: text ? Number(text) : 1000 
                      }))
                    }
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
              </View>
            </View>

            {/* Sort By Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="swap-vertical-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Sort By</Text>
              </View>
              <View style={styles.optionsGrid}>
                <SortOption value="rating" label="Top Rated" icon="star-outline" />
                <SortOption value="price_asc" label="Price: Low to High" icon="trending-up-outline" />
                <SortOption value="price_desc" label="Price: High to Low" icon="trending-down-outline" />
                <SortOption value="reviews" label="Most Reviews" icon="chatbubble-outline" />
              </View>
            </View>

            {/* Online Mode Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="wifi-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Session Mode</Text>
              </View>
              <View style={styles.optionsGrid}>
                <OnlineModeOption isOnline={true} label="Online" icon="videocam-outline" />
                <OnlineModeOption isOnline={false} label="In-Person" icon="location-outline" />
              </View>
            </View>

            {/* Gender Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Gender Preference</Text>
              </View>
              <View style={styles.optionsGrid}>
                <GenderOption gender="male" label="Male" icon="male-outline" />
                <GenderOption gender="female" label="Female" icon="female-outline" />
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={styles.resetButtonText}>Reset All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.8}>
              <Ionicons name="checkmark-outline" size={18} color={theme.colors.background.surface} />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getActiveFilterCount = (filters: FilterModalState): number => {
  let count = 0;
  if (filters.city) count++;
  if (filters.role) count++;
  if (filters.min_price > 0) count++;
  if (filters.max_price < 1000) count++;
  if (filters.gender) count++;
  if (filters.is_online !== undefined) count++;
  return count;
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background.surface,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: height * 0.85,
    ...theme.shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text.secondary + '15',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.m,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
  },
  closeButton: {
    padding: theme.spacing.s,
    borderRadius: theme.borderRadius.circle,
    backgroundColor: theme.colors.background.secondary,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.s,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: 0.1,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.l,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
  },
  inputIcon: {
    marginRight: theme.spacing.s,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  priceContainer: {
    gap: theme.spacing.m,
  },
  priceInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.l,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    paddingVertical: 0,
  },
  priceSeparator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.m,
  },
  priceSeparatorText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  sortOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
    minWidth: (width - theme.spacing.l * 2 - theme.spacing.s * 3) / 2,
  },
  sortOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  sortOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  sortOptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  onlineOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
    minWidth: (width - theme.spacing.l * 2 - theme.spacing.s * 3) / 2,
  },
  onlineOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  onlineOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  onlineOptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  onlineOptionTextActive: {
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  genderOption: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
    minWidth: (width - theme.spacing.l * 2 - theme.spacing.s * 3) / 2,
  },
  genderOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  genderOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s,
  },
  genderOptionText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  genderOptionTextActive: {
    color: theme.colors.background.surface,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.l,
    gap: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text.secondary + '15',
    backgroundColor: theme.colors.background.surface,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
    backgroundColor: 'transparent',
    gap: theme.spacing.s,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    backgroundColor: theme.colors.primary,
    gap: theme.spacing.s,
    ...theme.shadows.card,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
});

export default ProfessionalsFilterModal;
