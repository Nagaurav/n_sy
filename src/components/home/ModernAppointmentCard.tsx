import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
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
}

interface ModernAppointmentCardProps {
  appointment: NextAppointment | null;
  onJoinSession?: () => void;
  onBookSession?: () => void;
  loading?: boolean;
  error?: string | null;
}

const ModernAppointmentCard: React.FC<ModernAppointmentCardProps> = ({
  appointment,
  onJoinSession,
  onBookSession,
  loading = false,
  error = null,
}) => {
  const formatAppointmentDateTime = (date: string, time: string) => {
    // Extract the start time from the range (e.g., "09:00 - 09:15" -> "09:00")
    const startTime = time?.split(' - ')[0] || time;
    const appointmentDate = new Date(`${date}T${startTime}`);
    
    // Check if date is valid
    if (isNaN(appointmentDate.getTime())) {
      return `${date} at ${time}`;
    }
    
    return appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(appointment.status, appointment.booking_status) }]} />
            </View>
            <Text style={styles.statusText}>Upcoming Session</Text>
          </View>
          <View style={styles.modeBadge}>
            <Ionicons 
              name={appointment.mode === 'online' ? 'videocam' : 'location'} 
              size={14} 
              color={theme.colors.primary} 
            />
            <Text style={styles.modeText}>{appointment.mode}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.professionalSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {appointment.professional_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View style={styles.professionalInfo}>
              <Text style={styles.professionalName}>{appointment.professional_name}</Text>
              <Text style={styles.speciality}>
                {appointment.speciality_new?.name || appointment.speciality || 'Wellness Professional'}
              </Text>
            </View>
          </View>

          <View style={styles.dateTimeSection}>
            <View style={styles.dateTimeRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.dateTimeText}>
                {formatAppointmentDateTime(appointment.date, appointment.time)}
              </Text>
            </View>
          </View>

          {appointment.session_link && onJoinSession && (
            <TouchableOpacity 
              style={styles.joinButton}
              onPress={onJoinSession}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="videocam" size={18} color="#FFFFFF" />
                <Text style={styles.buttonText}>Join Session</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.decorativeElement} />
      </LinearGradient>
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
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: theme.spacing.s,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
  },
  professionalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  professionalInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  speciality: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  dateTimeSection: {
    marginBottom: theme.spacing.m,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 15,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  joinButton: {
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.s,
    paddingHorizontal: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  decorativeElement: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 130, 114, 0.05)',
    top: -40,
    right: -40,
  },
  noDataContainer: {
    width: width - theme.spacing.l * 2,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: theme.colors.background.surface,
    ...theme.shadows.card,
  },
  noDataContent: {
    alignItems: 'center',
    flex: 1,
  },
  noDataIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  noDataSubtext: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    lineHeight: 20,
  },
  bookButton: {
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  errorContainer: {
    width: width - theme.spacing.l * 2,
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.m,
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
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    alignItems: 'center',
    ...theme.shadows.card,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ModernAppointmentCard;
