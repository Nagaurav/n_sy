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
import { YogaClassesFilters } from '../../types/yogaClasses';

interface ClassesFilterModalProps {
  visible: boolean;
  filters: YogaClassesFilters;
  onClose: () => void;
  onApply: (filters: Partial<YogaClassesFilters>) => void;
  onReset: () => void;
}

const { width, height } = Dimensions.get('window');

const ClassesFilterModal: React.FC<ClassesFilterModalProps> = ({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}) => {
  const [localFilters, setLocalFilters] = React.useState<YogaClassesFilters>({
    page: 1,
    limit: 10,
    sort_by: 'effective_price',
  });

  const [localSearchQuery, setLocalSearchQuery] = React.useState('');

  React.useEffect(() => {
    if (filters) {
      setLocalFilters(prev => ({
        ...prev,
        ...filters,
      }));
    }
  }, [filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: YogaClassesFilters = {
      page: 1,
      limit: 10,
      sort_by: 'effective_price',
    };
    setLocalFilters(resetFilters);
    onReset();
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
                <Text style={styles.title}>Filter Classes</Text>
                <Text style={styles.subtitle}>Customize your search</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Search */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Search</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search classes..."
                  value={localSearchQuery}
                  onChangeText={setLocalSearchQuery}
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location" size={20} color={theme.colors.text.secondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  value={localFilters.city || ''}
                  onChangeText={(text) => setLocalFilters(prev => ({ ...prev, city: text }))}
                  placeholderTextColor={theme.colors.text.secondary}
                />
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <View style={styles.priceRow}>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Min Price"
                    keyboardType="numeric"
                    value={localFilters.min_price?.toString() || ''}
                    onChangeText={(text) => setLocalFilters(prev => ({ ...prev, min_price: Number(text) }))}
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
                <Text style={styles.priceSeparator}>-</Text>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Max Price"
                    keyboardType="numeric"
                    value={localFilters.max_price?.toString() || ''}
                    onChangeText={(text) => setLocalFilters(prev => ({ ...prev, max_price: Number(text) }))}
                    placeholderTextColor={theme.colors.text.secondary}
                  />
                </View>
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.optionsGrid}>
                {[
                  { value: 'effective_price', label: 'Price: Low to High', icon: 'trending-up' },
                  { value: 'created_at', label: 'Newest First', icon: 'time' },
                  { value: 'title', label: 'Alphabetical', icon: 'text' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localFilters.sort_by === option.value && styles.optionButtonActive
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sort_by: option.value as any }))}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={16} 
                      color={localFilters.sort_by === option.value ? '#FFFFFF' : theme.colors.text.secondary} 
                    />
                    <Text style={[
                      styles.optionText,
                      localFilters.sort_by === option.value && styles.optionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
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
    maxHeight: height * 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.text.secondary + '20',
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
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    padding: theme.spacing.s,
  },
  content: {
    flex: 1,
    padding: theme.spacing.l,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
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
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.m,
  },
  priceInputContainer: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
  },
  priceInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  priceSeparator: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.s,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.m,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '20',
    minWidth: (width - theme.spacing.l * 2 - theme.spacing.s * 2) / 2,
  },
  optionButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionText: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.l,
    gap: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: theme.colors.text.secondary + '20',
  },
  resetButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  applyButton: {
    flex: 1,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ClassesFilterModal;
