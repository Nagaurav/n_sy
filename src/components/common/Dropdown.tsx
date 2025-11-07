import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  placeholder: string;
  options: DropdownOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  style?: any;
  dropdownStyle?: any;
}

const Dropdown: React.FC<DropdownProps> = ({
  placeholder,
  options,
  selectedValue,
  onSelect,
  style,
  dropdownStyle,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsVisible(false);
  };

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        item.value === selectedValue && styles.selectedOption
      ]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[
        styles.optionText,
        item.value === selectedValue && styles.selectedOptionText
      ]}>
        {item.label}
      </Text>
      {item.value === selectedValue && (
        <MaterialCommunityIcons 
          name="check" 
          size={20} 
          color={colors.primaryGreen} 
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.dropdown, dropdownStyle]}
        onPress={() => setIsVisible(true)}
      >
        <Text style={[
          styles.dropdownText,
          !selectedOption && styles.placeholderText
        ]}>
          {displayText}
        </Text>
        <MaterialCommunityIcons 
          name={isVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.secondaryText} 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <TouchableOpacity
                  onPress={() => setIsVisible(false)}
                  style={styles.closeButton}
                >
                  <MaterialCommunityIcons 
                    name="close" 
                    size={24} 
                    color={colors.secondaryText} 
                  />
                </TouchableOpacity>
              </View>
              <FlatList
                data={options}
                renderItem={renderOption}
                keyExtractor={(item) => item.value}
                style={styles.optionsList}
                showsVerticalScrollIndicator={true}
                bounces={true}
                alwaysBounceVertical={false}
                contentContainerStyle={styles.optionsListContent}
                scrollEnabled={true}
                nestedScrollEnabled={true}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.lightGray,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    color: colors.primaryText,
    flex: 1,
  },
  placeholderText: {
    color: colors.secondaryText,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    maxHeight: '70%',
  },
  modalContent: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    maxHeight: 400,
    flexGrow: 0,
  },
  optionsListContent: {
    paddingBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  selectedOption: {
    backgroundColor: colors.primaryGreen + '15',
  },
  optionText: {
    fontSize: 16,
    color: colors.primaryText,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.primaryGreen,
    fontWeight: '500',
  },
});

export default Dropdown;
