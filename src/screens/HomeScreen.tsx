import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ViewStyle, TextStyle, ActivityIndicator, RefreshControl } from 'react-native';
import { theme, commonStyles } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

type Styles = {
  container: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  card: ViewStyle;
  cardTitle: TextStyle;
  cardText: TextStyle;
};

const styles = StyleSheet.create<Styles>({
  container: {
    ...commonStyles.container,
    padding: theme.spacing.medium,
  },
  section: {
    marginBottom: theme.spacing.large,
  },
  sectionTitle: {
    ...commonStyles.heading,
    color: theme.colors.primary,
    marginBottom: theme.spacing.medium,
  },
  card: {
    backgroundColor: theme.colors.background.white,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing.medium,
    marginBottom: theme.spacing.medium,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.small,
  },
  cardText: {
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
});

type Appointment = {
  _id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  // Add other appointment fields as needed
};

const HomeScreen = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    if (!user?._id) return;
    
    try {
      const response = await apiService.getUserAppointments(user._id);
      if (response.success && response.data?.appointments) {
        setAppointments(response.data.appointments);
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.primary]}
        />
      }>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Welcome back, {user?.firstName || 'User'}!
        </Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Upcoming Appointments</Text>
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <View key={appointment._id} style={{ marginBottom: theme.spacing.medium }}>
                <Text style={{ fontWeight: 'bold' }}>
                  {formatDate(`${appointment.date}T${appointment.time}`)}
                </Text>
                <Text>Status: {appointment.status}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>You don't have any upcoming appointments.</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={{ marginTop: theme.spacing.small }}>
            <Text style={styles.cardText}>
              • Book a new appointment
            </Text>
            <Text style={styles.cardText}>
              • View appointment history
            </Text>
            <Text style={styles.cardText}>
              • Update profile information
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;
