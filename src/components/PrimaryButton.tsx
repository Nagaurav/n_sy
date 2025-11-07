import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, style, textStyle, disabled }) => (
  <TouchableOpacity
    style={[styles.button, style, disabled && { backgroundColor: colors.secondaryText }]}
    onPress={onPress}
    disabled={disabled}
    activeOpacity={0.85}
  >
    <Text style={[styles.text, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  text: {
    ...typography.button,
    fontWeight: 'bold',
    color: colors.offWhite,
    fontSize: 16,
    letterSpacing: 0.5,
  },
});

export default PrimaryButton;
