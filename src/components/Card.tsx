import React from 'react';
import { View, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { theme } from '../theme';

export interface CardProps extends ViewProps {
  style?: ViewStyle | ViewStyle[];
}

const Card: React.FC<CardProps> = ({ style, children, ...rest }) => {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
});

export default Card;
