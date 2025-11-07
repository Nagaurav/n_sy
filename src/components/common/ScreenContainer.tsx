// src/components/common/ScreenContainer.tsx
import React from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  style?: ViewStyle;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  backgroundColor = colors.background,
  statusBarStyle = 'dark-content',
  style,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
