import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

interface ModernWellnessTipCardProps {
  tips: string[];
  interval?: number;
}

const ModernWellnessTipCard: React.FC<ModernWellnessTipCardProps> = ({
  tips,
  interval = 8000,
}) => {
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTipChange = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -20,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentTipIndex((prev) => (prev + 1) % tips.length);
      slideAnim.setValue(20);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, tips.length]);

  useEffect(() => {
    if (tips.length <= 1) return;
    
    const intervalId = setInterval(animateTipChange, interval);
    return () => clearInterval(intervalId);
  }, [animateTipChange, interval, tips.length]);

  if (tips.length === 0) return null;

  return (
    <LinearGradient
      colors={['#10B981', '#059669']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="bulb" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Daily Wellness Tip</Text>
          <Text style={styles.subtitle}>Mind & Body Balance</Text>
        </View>
        <View style={styles.progressIndicator}>
          {tips.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentTipIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.tipContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.tipText}>{tips[currentTipIndex]}</Text>
        </Animated.View>
      </View>

      {/* Decorative elements */}
      <View style={styles.topCircle} />
      <View style={styles.bottomCircle} />
      <View style={styles.linePattern} />
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={animateTipChange}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh" size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.l * 2,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.float,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  progressIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  tipContainer: {
    minHeight: 60,
    justifyContent: 'center',
  },
  tipText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  nextButton: {
    position: 'absolute',
    bottom: theme.spacing.m,
    right: theme.spacing.m,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -50,
    right: -30,
  },
  bottomCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    bottom: -30,
    left: -20,
  },
  linePattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default ModernWellnessTipCard;
