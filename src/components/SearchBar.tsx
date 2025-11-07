import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface SearchBarProps {
  value: string;
  onChangeText?: (text: string) => void;
  onTextChange?: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChangeText, onTextChange, placeholder }) => (
  <View style={styles.container}>
    <Icon name="magnify" size={22} color={colors.secondaryText} style={{ marginRight: 8 }} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText || onTextChange}
      placeholder={placeholder || 'Search classes...'}
      placeholderTextColor={colors.secondaryText}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 18,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  input: {
    flex: 1,
    fontFamily: typography.body.fontFamily,
    fontSize: 16,
    fontWeight: '400',
    color: colors.primaryText,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
});

export default SearchBar;
