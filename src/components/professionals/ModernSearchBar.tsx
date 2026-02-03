import React, { useState, forwardRef } from 'react';
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
  onSubmit: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const ModernSearchBar = forwardRef<any, ModernSearchBarProps>(({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Search by name, specialization...',
  onFocus,
  onBlur,
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [animatedWidth] = useState(new Animated.Value(0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedWidth, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.timing(animatedWidth, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    onBlur?.();
  };

  const handleSubmitEditing = ({ nativeEvent: { text } }: { nativeEvent: { text: string } }) => {
    onSubmit(text);
  };

  const handleClear = () => onChangeText('');

  return (
    <View style={styles.container}>
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        {/* Search Icon */}
        <Ionicons 
          name="search" 
          size={20} 
          color={isFocused ? theme.colors.primary : '#9CA3AF'} 
          style={styles.searchIcon} 
        />

        {/* Text Input */}
        <TextInput
          ref={ref}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmitEditing}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />

        {/* Clear Button */}
        {value.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}

        {/* Animated Focus Indicator */}
        <Animated.View
          style={[
            styles.focusIndicator,
            {
              transform: [
                {
                  scaleX: animatedWidth,
                },
              ],
            },
          ]}
        />
      </View>

      {/* Search Hint */}
      {value.length === 0 && !isFocused && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Try "Yoga", "Nutrition", "Therapy"</Text>
        </View>
      )}
    </View>
  );
});

ModernSearchBar.displayName = 'ModernSearchBar';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    borderWidth: 1,
    borderColor: 'transparent',
    ...theme.shadows.card,
    position: 'relative',
  },
  searchContainerFocused: {
    borderColor: theme.colors.primary,
    ...theme.shadows.large,
  },
  searchIcon: {
    marginRight: theme.spacing.m,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
    height: 20,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: theme.colors.primary,
    borderRadius: 1,
  },
  hintContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  hintText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default ModernSearchBar;
