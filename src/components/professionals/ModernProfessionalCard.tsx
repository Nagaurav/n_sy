import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import type { Professional } from '../../types/professional';

const { width } = Dimensions.get('window');

interface ModernProfessionalCardProps {
  professional: Professional;
  onPress: (professional: Professional) => void;
  onBookPress: (professional: Professional) => void;
  onProfilePress: (professional: Professional) => void;
}

const ModernProfessionalCard: React.FC<ModernProfessionalCardProps> = ({
  professional,
  onPress,
  onBookPress,
  onProfilePress,
}) => {
  const fullName = `${professional.first_name} ${professional.last_name}`.trim() || 'Unknown Professional';
  const speciality = professional.specialization || professional.speciality || 'General Practitioner';
  const location = [professional.city, professional.state].filter(Boolean).join(', ') || 'Location not specified';
  const rating = professional.rating || 0;
  const experience = professional.experience_years;
  const isVerified = professional.is_verified;
  const isAvailable = professional.is_available;
  const avatar = professional.profile_picture || professional.photo_url;
  const reviewCount = professional.review_count;
  const hasValidAvatar = avatar && avatar.trim() !== '';

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.8}
      onPress={() => onPress(professional)}
    >
      {/* Gradient Background */}
      <View style={styles.gradientBackground} />
      
      {/* Content */}
      <View style={styles.content}>
        {/* Left Section - Avatar */}
        <View style={styles.avatarSection}>
          {hasValidAvatar ? (
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
          )}
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark" size={10} color="#FFFFFF" />
            </View>
          )}
          {isAvailable && (
            <View style={styles.availableIndicator} />
          )}
        </View>

        {/* Middle Section - Info */}
        <View style={styles.infoSection}>
          {/* Name and Experience */}
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            {experience && (
              <View style={styles.experienceBadge}>
                <Text style={styles.experienceText}>{experience}y</Text>
              </View>
            )}
          </View>

          {/* Specialization */}
          <Text style={styles.specialization} numberOfLines={1}>
            {speciality}
          </Text>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.location} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {/* Rating */}
          {rating > 0 ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.rating}>{rating.toFixed(1)}</Text>
              {reviewCount && (
                <Text style={styles.reviewCount}>({reviewCount})</Text>
              )}
            </View>
          ) : (
            <Text style={styles.newProfessional}>New Professional</Text>
          )}
        </View>

        {/* Right Section - Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => onProfilePress(professional)}
          >
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => onBookPress(professional)}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.l * 2,
    height: 100,
    marginBottom: theme.spacing.m,
    borderRadius: theme.borderRadius.l,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: theme.spacing.m,
  },
  avatarSection: {
    position: 'relative',
    marginRight: theme.spacing.m,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  defaultAvatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.feedback.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.surface,
  },
  availableIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.feedback.success,
    borderWidth: 2,
    borderColor: theme.colors.background.surface,
  },
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.s,
  },
  experienceBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.spacing.xs,
  },
  experienceText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.background.white,
  },
  specialization: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  location: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginLeft: 4,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginLeft: 2,
  },
  newProfessional: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  actionsSection: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${theme.colors.primary}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ModernProfessionalCard;
