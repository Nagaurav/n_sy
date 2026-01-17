import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

interface WellnessTipCardProps {
  tips: string[];
  interval?: number;
}

const WellnessTipCard: React.FC<WellnessTipCardProps> = ({
  tips,
  interval = 10000,
}) => {
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTipChange = React.useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, tips.length]);

  useEffect(() => {
    if (tips.length <= 1) return;
    
    const intervalId = setInterval(animateTipChange, interval);
    return () => clearInterval(intervalId);
  }, [animateTipChange, interval, tips.length]);

  if (tips.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.feedback.success }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Daily Wellness Tip</Text>
      </View>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Text style={styles.content}>{tips[currentTipIndex]}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  content: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    fontWeight: '500',
  },
});

export default WellnessTipCard;
