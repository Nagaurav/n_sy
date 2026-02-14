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
  const speciality = professional.speciality_new?.name || professional.speciality || professional.specialization || 
    (professional.role === 'yoga_teacher' ? 'Yoga Teacher' : 
     professional.role === 'yoga_instructor' ? 'Yoga Instructor' : 
     professional.role === 'yoga_therapist' ? 'Yoga Therapist' : 
     professional.role === 'center_owner' ? 'Center Owner' : 
     professional.role === 'nutritionist' ? 'Nutritionist' : 
     professional.role === 'personal_trainer' ? 'Personal Trainer' : 
     professional.role === 'therapist' ? 'Therapist' : '');
  const location = [professional.city, professional.state].filter(Boolean).join(', ') || 'Location not specified';
  const isVerified = professional.is_verified;
  const isAvailable = professional.is_available;
  const avatar = professional.profile_picture || professional.photo_url;
  const hasValidAvatar = avatar && avatar.trim() !== '';
  
  // Available fields from API
  const languages = professional.language || 'Languages not specified';
  const about = professional.about;

  const cardColor = professional.role === 'nutritionist' ? '#4CAF50' : '#2196F3';
  const roleIcon = professional.role === 'nutritionist' ? 'nutrition' : 
                 professional.role === 'yoga_teacher' || professional.role === 'yoga_instructor' ? 'fitness' : 
                 professional.role === 'therapist' ? 'medkit' : 'person';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => onPress(professional)}
    >
      {/* Header with Avatar and Basic Info */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarSection}>
          {hasValidAvatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <Ionicons name="person" size={28} color="#FFFFFF" />
            </View>
          )}
          <View style={styles.verificationBadges}>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.professionalName}>{fullName}</Text>
          <View style={styles.professionalMeta}>
            <Text style={styles.specialty}>{speciality}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color="#6B7280" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.roleBadge}>
          <View style={[styles.roleIconContainer, { backgroundColor: cardColor + '20' }]}>
            <Ionicons name={roleIcon} size={16} color={cardColor} />
          </View>
          <Text style={[styles.roleText, { color: cardColor }]}>
            {professional.role === 'nutritionist' ? 'Nutrition' : 
             professional.role === 'yoga_teacher' || professional.role === 'yoga_instructor' ? 'Yoga' : 
             professional.role === 'therapist' ? 'Therapy' : 'Professional'}
          </Text>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.cardContent}>
        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <View style={[styles.infoIcon, { backgroundColor: '#008272' + '20' }]}>
              <Ionicons name="language-outline" size={16} color="#008272" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{languages}</Text>
            </View>
          </View>
          
          {about && (
            <View style={styles.infoItem}>
              <View style={[styles.infoIcon, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="information-circle-outline" size={16} color="#4CAF50" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>About</Text>
                <Text style={styles.infoValue} numberOfLines={2}>{about}</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer with Status and Actions */}
      <View style={styles.cardFooter}>
        <View style={styles.statusSection}>
          <View style={[styles.statusIndicator, { backgroundColor: isAvailable ? '#10B981' : '#6B7280' }]}>
            <Ionicons 
              name={isAvailable ? "checkmark-circle" : "time-outline"} 
              size={12} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={[styles.statusText, { color: isAvailable ? '#10B981' : '#6B7280' }]}>
            {isAvailable ? 'Available Now' : 'Currently Busy'}
          </Text>
        </View>
        
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, styles.profileButton]}
            onPress={() => onProfilePress(professional)}
          >
            <Ionicons name="person-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.bookButton, { backgroundColor: cardColor }]}
            onPress={() => onBookPress(professional)}
          >
            <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Main Card - Modern Design
  card: {
    backgroundColor: theme.colors.background.surface,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  
  // Header Section
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarSection: {
    marginRight: 16,
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F5F5F5',
  },
  defaultAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBadges: {
    position: 'absolute',
    top: -4,
    right: -4,
    flexDirection: 'row',
    gap: 4,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  professionalMeta: {
    alignItems: 'flex-start',
  },
  specialty: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  roleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  // Content Section
  cardContent: {
    marginBottom: 16,
  },
  infoSection: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  
  // Footer Section
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionSection: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 2,
  },
  profileButton: {
    backgroundColor: '#6B7280',
  },
  bookButton: {
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    color: '#FFFFFF',
  },
});

export default ModernProfessionalCard;
