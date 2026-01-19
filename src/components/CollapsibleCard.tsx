import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
  ViewStyle,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface CollapsibleCardProps {
  title: string;
  content: React.ReactNode;
  containerStyle?: ViewStyle;
  themeColors?: any; // Allow dynamic theme colors
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, content, containerStyle, themeColors }) => {
  const currentTheme = themeColors || theme;
  const [isOpen, setIsOpen] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleOpen = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    setIsOpen((prev) => {
      const next = !prev;
      Animated.timing(rotation, {
        toValue: next ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
      return next;
    });
  }, [rotation]);

  const rotateStyle = {
    transform: [
      {
        rotate: rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  return (
    <View style={[styles.card, containerStyle, { backgroundColor: currentTheme.colors.background.surface }]}>
      <TouchableOpacity
        style={[styles.header, isOpen && { backgroundColor: currentTheme.colors.primary + '0F' }]}
        activeOpacity={0.7}
        onPress={toggleOpen}
      >
        <Text style={[styles.title, { color: currentTheme.colors.text.primary }]}>{title}</Text>
        <Animated.View style={rotateStyle}>
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color={currentTheme.colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.contentContainer}>
          {typeof content === 'string' ? (
            <Text style={[styles.contentText, { color: currentTheme.colors.text.secondary }]}>{content}</Text>
          ) : (
            content
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.m,
    marginTop: theme.spacing.s,
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  title: {
    ...theme.typography.h3,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: theme.typography.h3.lineHeight,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  contentText: {
    ...theme.typography.small,
    fontSize: 13,
    fontWeight: '400',
    lineHeight: theme.typography.small.lineHeight,
  },
});

export default CollapsibleCard;
