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
  const speciality = professional.speciality_new?.name || professional.speciality || professional.speciality || 
    (professional.role === 'yoga_teacher' ? 'Yoga Teacher' : 
     professional.role === 'yoga_instructor' ? 'Yoga Instructor' : 
     professional.role === 'yoga_therapist' ? 'Yoga Therapist' : 
     professional.role === 'center_owner' ? 'Center Owner' : 
     professional.role === 'nutritionist' ? 'Nutritionist' : 
     professional.role === 'personal_trainer' ? 'Personal Trainer' : 
     professional.role === 'therapist' ? 'Therapist' : '');
  const location = [professional.city, professional.state].filter(Boolean).join(', ') || 'Location not specified';
  const rating = professional.rating || 0;
  const experience = professional.experience_years;
  const isVerified = professional.is_verified;
  const isAvailable = professional.is_available;
  const avatar = professional.profile_picture || professional.photo_url;
  const reviewCount = professional.review_count;
  const hasValidAvatar = avatar && avatar.trim() !== '';

  const cardColor = professional.role === 'nutritionist' ? '#4CAF50' : '#2196F3';
  const roleIcon = professional.role === 'nutritionist' ? 'nutrition' : 
                 professional.role === 'yoga_teacher' || professional.role === 'yoga_instructor' ? 'fitness' : 
                 professional.role === 'therapist' ? 'medkit' : 'person';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cardColor, borderLeftWidth: 5 }]}
      activeOpacity={0.8}
      onPress={() => onPress(professional)}
    >
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{fullName}</Text>
          <Text style={styles.sub}>{speciality}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: cardColor + '20' }]}>
          <Ionicons name={roleIcon} size={14} color={cardColor} />
          <Text style={[styles.typeText, { color: cardColor }]}>
            {professional.role === 'nutritionist' ? 'Nutrition' : 
             professional.role === 'yoga_teacher' || professional.role === 'yoga_instructor' ? 'Yoga' : 
             professional.role === 'therapist' ? 'Therapy' : 'Professional'}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        {/* Avatar and Basic Info */}
        <View style={styles.avatarRow}>
          {hasValidAvatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.avatarInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.infoText}>{location}</Text>
            </View>
            {experience && (
              <View style={styles.infoRow}>
                <Ionicons name="briefcase-outline" size={14} color="#6B7280" />
                <Text style={styles.infoText}>{experience} years experience</Text>
              </View>
            )}
            {rating > 0 && (
              <View style={styles.infoRow}>
                <Ionicons name="star" size={14} color="#F59E0B" />
                <Text style={styles.infoText}>{rating.toFixed(1)} {reviewCount && `(${reviewCount})`}</Text>
              </View>
            )}
          </View>
          <View style={styles.avatarBadges}>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            )}
            {isAvailable && (
              <View style={styles.availableBadge}>
                <Ionicons name="checkmark-circle" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.statusInfo}>
          {isAvailable ? (
            <Text style={[styles.statusText, { color: '#10B981' }]}>Available</Text>
          ) : (
            <Text style={[styles.statusText, { color: '#6B7280' }]}>Busy</Text>
          )}
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#f8f9fa', borderColor: '#e9ecef' }]}
            onPress={() => onProfilePress(professional)}
          >
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={[styles.actionButtonText, { color: '#6B7280' }]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: cardColor + '20', borderColor: cardColor }]}
            onPress={() => onBookPress(professional)}
          >
            <Ionicons name="calendar-outline" size={16} color={cardColor} />
            <Text style={[styles.actionButtonText, { color: cardColor }]}>Book</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Main Card - Matching Appointment Cards
  card: {
    backgroundColor: theme.colors.background.surface,
    marginBottom: 16,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  sub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  
  // Card Content
  cardContent: {
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  defaultAvatar: {
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInfo: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginLeft: 6,
    flex: 1,
  },
  avatarBadges: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.feedback.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default ModernProfessionalCard;
