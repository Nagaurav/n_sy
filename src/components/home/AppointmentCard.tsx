import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../../theme';
import Card from '../Card';

export interface NextAppointment {
  id: string;
  professional_name: string;
  speciality: string;
  date: string;
  time: string;
  mode: 'online' | 'offline';
  session_link?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
}

interface AppointmentCardProps {
  appointment: NextAppointment | null;
  onJoinSession?: () => void;
  onBookSession?: () => void;
  loading?: boolean;
  error?: string | null;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onJoinSession,
  onBookSession,
  loading = false,
  error = null,
}) => {
  const formatAppointmentDateTime = (date: string, time: string) => {
    const appointmentDate = new Date(`${date}T${time}`);
    return appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (error) {
    return (
      <Card style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading appointment...</Text>
      </Card>
    );
  }

  if (appointment) {
    return (
      <Card style={styles.appointmentCard}>
        <View style={styles.appointmentHeader}>
          <Text style={styles.appointmentTitle}>Upcoming Session</Text>
          <Ionicons name="time-outline" size={20} color="#6B7280" />
        </View>
        <Text style={styles.professionalName}>
          {appointment.professional_name}
        </Text>
        <Text style={styles.speciality}>
          {appointment.speciality}
        </Text>
        <Text style={styles.appointmentDateTime}>
          {formatAppointmentDateTime(appointment.date, appointment.time)}
        </Text>
        {appointment.session_link && onJoinSession && (
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
            onPress={onJoinSession}
            activeOpacity={0.7}
          >
            <Text style={styles.actionButtonText}>Join Session</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.noDataContainer}>
      <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
      <Text style={styles.noDataText}>No upcoming sessions</Text>
      {onBookSession && (
        <TouchableOpacity 
          style={[styles.actionButton, { marginTop: 16, backgroundColor: theme.colors.primary }]}
          onPress={onBookSession}
          activeOpacity={0.7}
        >
          <Text style={styles.actionButtonText}>Book a Session</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  appointmentCard: {
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.l,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    ...theme.shadows.card,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  appointmentTitle: {
    ...theme.typography.h3,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  professionalName: {
    ...theme.typography.h2,
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  speciality: {
    ...theme.typography.body,
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  appointmentDateTime: {
    ...theme.typography.body,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.l,
  },
  actionButton: {
    padding: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    marginTop: theme.spacing.s,
    ...theme.shadows.card,
  },
  actionButtonText: {
    color: theme.colors.background.surface,
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '700',
  },
  noDataContainer: {
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.s,
    ...theme.shadows.card,
  },
  noDataText: {
    ...theme.typography.h3,
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.m,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.s,
    ...theme.shadows.card,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    ...theme.typography.body,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default AppointmentCard;
