import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface ModernSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
}

const ModernSearchBar: React.FC<ModernSearchBarProps> = ({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search classes...',
  showClearButton = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(value);
    }
  };

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.searchContainer,
        isFocused && styles.searchContainerFocused,
      ]}>
        <Ionicons 
          name="search-outline" 
          size={20} 
          color={isFocused ? theme.colors.primary : theme.colors.text.secondary} 
        />
        
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text.secondary}
          returnKeyType="search"
          clearButtonMode="never"
        />
        
        {showClearButton && value.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="close-circle" 
              size={18} 
              color={theme.colors.text.secondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.s,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.text.secondary + '30',
    ...theme.shadows.card,
  },
  searchContainerFocused: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.s,
    paddingVertical: 0,
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
});

export default ModernSearchBar;
