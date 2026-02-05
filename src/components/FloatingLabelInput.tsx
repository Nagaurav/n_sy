import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface FloatingLabelInputProps extends TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  icon?: 'mail' | 'lock' | 'phone' | null;
  isPassword?: boolean;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  value,
  onChangeText,
  error,
  containerStyle,
  inputStyle,
  icon,
  isPassword = false,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    if (text && !value) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (!text && value) {
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    
    const iconColor = isFocused ? theme.colors.primary : theme.colors.text.secondary;
    const iconSize = 20;
    
    switch (icon) {
      case 'mail':
        return <Ionicons name="mail-outline" size={iconSize} color={iconColor} />;
      case 'phone':
        return <Ionicons name="call-outline" size={iconSize} color={iconColor} />;
      case 'lock':
        return <Ionicons name="lock-closed-outline" size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  const labelStyle = {
    position: 'absolute' as const,
    left: icon ? 48 : 16, // Adjust left position when icon is present
    top: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [12, -12], // Move text up further for better alignment
    }),
    fontSize: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: error
      ? theme.colors.error
      : isFocused
      ? theme.colors.primary
      : theme.colors.text.secondary,
    backgroundColor: theme.colors.background.surface,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  const inputContainerStyle = {
    ...styles.inputContainer,
    borderColor: error
      ? theme.colors.error
      : isFocused
      ? theme.colors.primary
      : '#E5E7EB', // Lighter border when not focused
    borderWidth: isFocused ? 2 : 1, // Thicker border when focused
    shadowColor: isFocused ? theme.colors.primary : '#000',
    shadowOffset: {
      width: 0,
      height: isFocused ? 2 : 1,
    },
    shadowOpacity: isFocused ? 0.15 : 0.05,
    shadowRadius: isFocused ? 4 : 2,
    elevation: isFocused ? 4 : 2,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={inputContainerStyle}>
        {icon && (
          <View style={styles.icon}>
            {renderIcon()}
          </View>
        )}
        <Animated.Text style={labelStyle}>{label}</Animated.Text>
        <TextInput
          style={[
            styles.input, 
            { 
              paddingLeft: icon ? 48 : 16,
              paddingRight: isPassword ? 52 : 16 // Add right padding for password toggle
            }, 
            inputStyle
          ]}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=""
          placeholderTextColor={theme.colors.text.secondary}
          selectionColor={theme.colors.primary}
          secureTextEntry={isPassword && !showPassword}
          {...textInputProps}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <Image 
                source={require('../assets/icons/hide.png')} 
                style={[styles.passwordIcon, { tintColor: isFocused ? theme.colors.primary : theme.colors.text.secondary }]} 
                resizeMode="contain"
              />
            ) : (
              <Image 
                source={require('../assets/icons/show.png')} 
                style={[styles.passwordIcon, { tintColor: isFocused ? theme.colors.primary : theme.colors.text.secondary }]} 
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  inputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    height: 24,
  },
  customIcon: {
    width: 20,
    height: 20,
  },
  passwordIcon: {
    width: 18,
    height: 18,
  },
  input: {
    fontSize: 16,
    color: '#1A202C',
    paddingVertical: 0,
    flex: 1,
  },
  passwordToggle: {
    position: 'absolute',
    right: 16,
    zIndex: 2,
    padding: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
});
