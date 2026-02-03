import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { height } = Dimensions.get('window');

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.background.surface }]}>
          <ActivityIndicator 
            size="large" 
            color={theme.colors.primary} 
            style={styles.spinner}
          />
          <Text style={[styles.message, { color: theme.colors.text.primary }]}>
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 200,
    maxWidth: 300,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default LoadingOverlay;
