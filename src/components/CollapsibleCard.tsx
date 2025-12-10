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
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ title, content, containerStyle }) => {
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
    <View style={[styles.card, containerStyle]}>
      <TouchableOpacity
        style={[styles.header, isOpen && styles.headerActive]}
        activeOpacity={0.7}
        onPress={toggleOpen}
      >
        <Text style={styles.title}>{title}</Text>
        <Animated.View style={rotateStyle}>
          <Ionicons
            name="chevron-down-outline"
            size={20}
            color={theme.colors.primary}
          />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.contentContainer}>
          {typeof content === 'string' ? (
            <Text style={styles.contentText}>{content}</Text>
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
    backgroundColor: theme.colors.background.surface,
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
  headerActive: {
    backgroundColor: 'rgba(0, 130, 114, 0.06)',
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: '600',
    lineHeight: theme.typography.h3.lineHeight,
    color: theme.colors.text.primary,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.m,
    paddingBottom: theme.spacing.m,
  },
  contentText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '400',
    lineHeight: theme.typography.body.lineHeight,
    color: theme.colors.text.secondary,
  },
});

export default CollapsibleCard;
