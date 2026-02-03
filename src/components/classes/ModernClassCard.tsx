import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import { YogaClass } from '../../types/yogaClasses';

const { width } = Dimensions.get('window');

interface ModernClassCardProps {
  classItem: YogaClass;
  onPress: (classItem: YogaClass) => void;
  index?: number;
}

const ModernClassCard: React.FC<ModernClassCardProps> = ({
  classItem,
  onPress,
  index = 0,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const stagger = 100; // milliseconds
    const delay = index * stagger;
    
    const timer = setTimeout(() => {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [animatedValue, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    onPress(classItem);
  };
  const formatPrice = (price: number | null) => {
    if (price === null) return 'Price not available';
    return `₹${price.toLocaleString()}`;
  };

  const getDeliveryModeInfo = (classItem: YogaClass) => {
    const modes = [];
    
    if (classItem.group_online) modes.push({ icon: 'people-outline', label: 'Group Online' });
    if (classItem.group_offline) modes.push({ icon: 'people-outline', label: 'Group In-Person' });
    if (classItem.one_to_one_online) modes.push({ icon: 'videocam-outline', label: '1:1 Online' });
    if (classItem.one_to_one_offline) modes.push({ icon: 'person-outline', label: '1:1 In-Person' });
    if (classItem.home_visit) modes.push({ icon: 'home-outline', label: 'Home Visit' });
    
    return {
      icon: modes.length > 0 ? modes[0].icon : 'help-outline',
      label: modes.length > 0 ? modes.map(m => m.label).join(', ') : 'No modes available',
      modes: modes
    };
  };

  const cardStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0],
        }),
      },
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.9, 1],
        }),
      },
    ],
    opacity: animatedValue,
  };

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={handlePress}
      >
        {/* Card Content */}
        <View style={styles.content}>
        {/* Header with Title and Price */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {classItem.title}
          </Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(classItem.effective_price)}</Text>
          </View>
        </View>
        
        {/* Key Info Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.infoText}>{classItem.duration.replace('_', ' ')}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.infoText}>{classItem.days}</Text>
          </View>
        </View>
        
        {/* Delivery Mode and Location */}
        <View style={styles.bottomRow}>
          <View style={styles.deliveryMode}>
            <Ionicons name="people-outline" size={12} color={theme.colors.primary} />
            <Text style={styles.deliveryModeText}>
              {classItem.group_online ? 'Group Online' : ''}
              {classItem.group_offline ? 'Group In-Person' : ''}
              {classItem.one_to_one_online ? '1:1 Online' : ''}
              {classItem.one_to_one_offline ? '1:1 In-Person' : ''}
              {classItem.home_visit ? 'Home Visit' : ''}
            </Text>
          </View>
          
          {classItem.city && (
            <View style={styles.location}>
              <Ionicons name="location-outline" size={12} color="#6B7280" />
              <Text style={styles.locationText}>{classItem.city}</Text>
            </View>
          )}
        </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.l * 2,
    marginBottom: theme.spacing.m,
  },
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.m,
    ...theme.shadows.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.s,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.s,
    lineHeight: 20,
  },
  priceBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.m,
    minWidth: 60,
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
    gap: theme.spacing.m,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deliveryMode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.s,
  },
  deliveryModeText: {
    fontSize: 11,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default ModernClassCard;
