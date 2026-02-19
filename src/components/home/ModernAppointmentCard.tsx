import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';

const { width } = Dimensions.get('window');

export interface NextAppointment {
  id: string;
  professional_name: string;
  speciality?: string;
  speciality_new?: { name: string };
  date: string;
  time: string;
  mode: 'online' | 'offline';
  session_link?: string;
  booking_status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  professional_photo?: string;
}

interface ModernAppointmentCardProps {
  appointment: NextAppointment | null;
  onJoinSession?: () => void;
  onBookSession?: () => void;
  loading?: boolean;
  error?: string | null;
  buttonText?: string;
  showActualStatus?: boolean;
  serviceType?: 'consultation' | 'yoga_class'; // 🆕 Add service type prop
}

const ModernAppointmentCard: React.FC<ModernAppointmentCardProps> = ({
  appointment,
  onJoinSession,
  onBookSession,
  loading = false,
  error = null,
  buttonText,
  showActualStatus = false,
  serviceType, // 🆕 Add service type to props
}) => {
  const formatAppointmentDateTime = (date: string, time: string) => {
    try {
      // Handle date format - assume it's in YYYY-MM-DD or ISO format
      let dateObj: Date;

      // Check if date is already in ISO format or just date part
      if (date.includes('T')) {
        dateObj = new Date(date);
      } else {
        // Assume YYYY-MM-DD format, combine with time
        const startTime = time?.split(' - ')[0] || time || '00:00';
        const dateTimeString = `${date}T${startTime}:00`;
        dateObj = new Date(dateTimeString);
      }

      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        // Fallback: format date and time separately
        const formattedDate = new Date(date).toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        return `${formattedDate} at ${time}`;
      }

      // Format as weekday, month day, hour:minute
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      // Ultimate fallback
      return `${date} at ${time}`;
    }
  };

  const getStatusColor = (status?: string, booking_status?: string) => {
    // Handle both status and booking_status fields
    const currentStatus = status || booking_status;
    
    switch (currentStatus) {
      case 'completed':
      case 'COMPLETED': 
        return '#10B981';
      case 'cancelled':
      case 'CANCELLED': 
        return '#EF4444';
      case 'scheduled':
      case 'CONFIRMED': 
        return '#F59E0B';
      case 'PENDING': 
        return '#8B5CF6';
      default: 
        return '#6B7280';
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </View>
    );
  }

  if (appointment) {
    return (
      <View style={[
        styles.container,
        serviceType === 'yoga_class' ? styles.yogaCard : styles.consultationCard
      ]}>
        {/* Professional Info Section */}
        <View style={styles.professionalSection}>
          <View style={styles.avatar}>
            {appointment.professional_photo ? (
              <Image
                source={{ uri: appointment.professional_photo }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.avatarText}>
                {appointment.professional_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            )}
          </View>
          <View style={styles.professionalInfo}>
            <Text style={styles.professionalName}>{appointment.professional_name}</Text>
            <Text style={styles.speciality}>
              {appointment.speciality_new?.name || appointment.speciality || 'Wellness Professional'}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(appointment.status, appointment.booking_status) }
          ]}>
            <Text style={styles.statusText}>
              {showActualStatus 
                ? (appointment.booking_status || appointment.status || 'SCHEDULED')
                : 'UPCOMING'
              }
            </Text>
          </View>
        </View>

        {/* Date & Time Section */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.dateTimeText}>
              {new Date(appointment.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.dateTimeItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.dateTimeText}>{appointment.time}</Text>
          </View>
          <View style={styles.modeItem}>
            <Ionicons 
              name={appointment.mode === 'online' ? 'videocam' : 'location'} 
              size={16} 
              color={theme.colors.primary} 
            />
            <Text style={styles.modeText}>{appointment.mode}</Text>
          </View>
        </View>

        {/* Action Button */}
        {onJoinSession && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onJoinSession}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              <Text style={styles.buttonText}>{buttonText || 'View Details'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.noDataContainer}>
      <View style={styles.noDataContent}>
        <View style={styles.noDataIcon}>
          <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.noDataText}>No upcoming sessions</Text>
        <Text style={styles.noDataSubtext}>Book your first wellness session to get started</Text>
        {onBookSession && (
          <TouchableOpacity 
            style={styles.bookButton}
            onPress={onBookSession}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.buttonText}>Book a Session</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - theme.spacing.l * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success, // 🆕 Green border to match ProfessionalStatsContainer
    position: 'relative',
  },
  
  // 🆕 Card Type Styles - Different Border Colors (thinner borders)
  consultationCard: {
    borderColor: '#10B981', // Green for consultation
    borderLeftWidth: 2, // 🆕 Reduced from 4px to 2px
  },
  yogaCard: {
    borderColor: '#8B5CF6', // Purple for yoga
    borderLeftWidth: 2, // 🆕 Reduced from 4px to 2px
  },
  
  // Professional Section
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  speciality: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Date & Time Container
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    paddingVertical: theme.spacing.m, // 🆕 Increased vertical padding
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.m, // 🆕 Added right margin for spacing
  },
  modeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateTimeText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  modeText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  
  // Action Button
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.m,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  
  // No Data Container
  noDataContainer: {
    width: width - theme.spacing.l * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: theme.spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  noDataContent: {
    alignItems: 'center',
    flex: 1,
  },
  noDataIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  errorContainer: {
    width: width - theme.spacing.l * 2,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: theme.spacing.s,
    flex: 1,
  },
  loadingContainer: {
    width: width - theme.spacing.l * 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.l,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ModernAppointmentCard;
