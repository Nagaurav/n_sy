// src/components/yoga/YogaCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../../theme/colors';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;

interface YogaCardProps {
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image?: string;
  icon?: string;
  badge?: {
    type: 'popular' | 'recommended' | 'new';
    text: string;
  };
  stats?: Array<{
    icon: string;
    value: string;
    label: string;
  }>;
  features?: string[];
  onPress: () => void;
  variant?: 'package' | 'instructor';
}

const YogaCard: React.FC<YogaCardProps> = ({
  title,
  description,
  price,
  originalPrice,
  icon = 'yoga',
  badge,
  stats,
  features,
  onPress,
  variant = 'package',
}) => {
  const renderBadge = () => {
    if (!badge) return null;
    
    const badgeColors = {
      popular: colors.accentOrange,
      recommended: colors.primaryGreen,
      new: colors.accentBlue,
    };
    
    return (
      <View style={[styles.badge, { backgroundColor: badgeColors[badge.type] }]}>
        <Text style={styles.badgeText}>{badge.text}</Text>
      </View>
    );
  };

  const renderStats = () => {
    if (!stats) return null;
    
    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <MaterialCommunityIcons name={stat.icon as any} size={16} color={colors.secondaryText} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderFeatures = () => {
    if (!features) return null;
    
    return (
      <View style={styles.featuresContainer}>
        {features.slice(0, 3).map((feature, idx) => (
          <View key={idx} style={styles.featureTag}>
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        {features.length > 3 && (
          <Text style={styles.moreFeatures}>+{features.length - 3} more</Text>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* Image/Icon Container */}
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <MaterialCommunityIcons name={icon as any} size={48} color={colors.primaryGreen} />
        </View>
        {renderBadge()}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        
        {description && (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        )}

        {renderStats()}

        {renderFeatures()}

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{price}</Text>
          {originalPrice && (
            <Text style={styles.originalPrice}>₹{originalPrice}</Text>
          )}
          <Text style={styles.priceLabel}>
            {variant === 'package' ? 'per package' : 'per hour'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.offWhite,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: colors.offWhite,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 12,
    color: colors.primaryText,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 12,
    color: colors.secondaryText,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  featureTag: {
    backgroundColor: colors.lightSage,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featureText: {
    fontSize: 10,
    color: colors.primaryGreen,
    fontWeight: '500',
  },
  moreFeatures: {
    fontSize: 10,
    color: colors.secondaryText,
    fontStyle: 'italic',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryGreen,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.secondaryText,
    textDecorationLine: 'line-through',
  },
  priceLabel: {
    fontSize: 12,
    color: colors.secondaryText,
  },
});

export default YogaCard;
