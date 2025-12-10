import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import Card from './Card';

type ServiceEntryCardNavigationProp = StackNavigationProp<HomeStackParamList>;

interface ServiceEntryCardProps {
  containerStyle?: ViewStyle | ViewStyle[];
}

const ServiceEntryCard: React.FC<ServiceEntryCardProps> = ({ containerStyle }) => {
  const navigation = useNavigation<ServiceEntryCardNavigationProp>();
  const classScaleAnim = React.useRef(new Animated.Value(1)).current;
  const consultScaleAnim = React.useRef(new Animated.Value(1)).current;

  const handleFindClass = () => {
    Animated.sequence([
      Animated.timing(classScaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(classScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      navigation.navigate('ClassesList' as never);
    }, 150);
  };

  const handleBookConsultation = () => {
    Animated.sequence([
      Animated.timing(consultScaleAnim, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(consultScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(() => {
      navigation.navigate('ProfessionalsList' as never);
    }, 150);
  };

  return (
    <Card style={[styles.card, ...(containerStyle ? (Array.isArray(containerStyle) ? containerStyle : [containerStyle]) : [])]}>
      <View style={styles.innerContainer}>
        {/* Classes Section */}
        <Animated.View style={[styles.section, { transform: [{ scale: classScaleAnim }] }]}>
          <TouchableOpacity
            style={styles.sectionTouchable}
            onPress={handleFindClass}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, styles.classIconBg]}>
              <Ionicons
                name="fitness-outline"
                size={36}
                color={theme.colors.secondary}
              />
            </View>
            <Text style={styles.sectionTitle}>Find a Class</Text>
            <Text style={styles.sectionSubtitle}>Group sessions & programs</Text>
            <View style={[styles.ctaContainer, styles.classCtaBg]}>
              <Text style={[styles.ctaText, styles.classCtaText]}>Explore Classes</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.secondary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Enhanced Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <View style={styles.dividerDot}>
            <View style={styles.dividerDotInner} />
          </View>
          <View style={styles.dividerLine} />
        </View>

        {/* Consultation Section */}
        <Animated.View style={[styles.section, { transform: [{ scale: consultScaleAnim }] }]}>
          <TouchableOpacity
            style={styles.sectionTouchable}
            onPress={handleBookConsultation}
            activeOpacity={1}
          >
            <View style={[styles.iconContainer, styles.consultIconBg]}>
              <Ionicons
                name="chatbubbles-outline"
                size={36}
                color={theme.colors.primary}
              />
            </View>
            <Text style={styles.sectionTitle}>Book Consultation</Text>
            <Text style={styles.sectionSubtitle}>Personal 1-on-1 guidance</Text>
            <View style={[styles.ctaContainer, styles.consultCtaBg]}>
              <Text style={[styles.ctaText, styles.consultCtaText]}>Find Experts</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: theme.spacing.m,
    marginVertical: theme.spacing.m,
    overflow: 'hidden',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 140,
    position: 'relative',
  },
  section: {
    flex: 1,
    position: 'relative',
  },
  sectionTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.l,
    paddingHorizontal: theme.spacing.m,
    position: 'relative',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  classIconBg: {
    backgroundColor: `${theme.colors.secondary}10`,
    borderWidth: 2,
    borderColor: `${theme.colors.secondary}30`,
  },
  consultIconBg: {
    backgroundColor: `${theme.colors.primary}10`,
    borderWidth: 2,
    borderColor: `${theme.colors.primary}30`,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as any,
    color: theme.colors.text.primary,
    textAlign: 'center' as const,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500' as any,
    color: theme.colors.text.secondary,
    textAlign: 'center' as const,
    marginBottom: theme.spacing.m,
    lineHeight: 20,
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.l,
    gap: 6,
  },
  classCtaBg: {
    backgroundColor: `${theme.colors.secondary}15`,
    borderWidth: 1,
    borderColor: `${theme.colors.secondary}40`,
  },
  consultCtaBg: {
    backgroundColor: `${theme.colors.primary}15`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}40`,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '600' as any,
  },
  classCtaText: {
    color: theme.colors.secondary,
  },
  consultCtaText: {
    color: theme.colors.primary,
  },
  dividerContainer: {
    width: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.l,
  },
  dividerLine: {
    flex: 1,
    width: 1,
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.15,
  },
  dividerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  dividerDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.text.secondary,
    opacity: 0.3,
  },
});

export default ServiceEntryCard;
