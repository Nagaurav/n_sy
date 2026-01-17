import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Linking,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services';
import {
  ProfessionalStatsCard,
  ModernQuickActionCard,
  ModernWellnessTipCard,
  ModernAppointmentCard,
  ModernHomeHeader,
  ModernGreetingSection,
  NextAppointment,
} from '../components';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
  },
  content: {
    width: width,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.l,
  },
  sectionTitle: {
    ...theme.typography.h2,
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    letterSpacing: -0.5,
    alignSelf: 'flex-start',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.l,
    gap: theme.spacing.m,
  },
  quickActionsContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.l,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.m,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    color: theme.colors.text.secondary,
    ...theme.typography.body,
    fontSize: 16,
    fontWeight: '500',
  },
});

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const ModernHomeScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [userStats, setUserStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
  });

  // Wellness tips that rotate
  const wellnessTips = [
    "Start your day with 5 minutes of deep breathing to center your mind and body.",
    "Take regular stretch breaks during work to maintain flexibility and reduce stress.",
    "Practice gratitude daily - write down three things you're thankful for.",
    "Stay hydrated! Aim for 8 glasses of water throughout the day.",
    "Get 7-8 hours of quality sleep for optimal physical and mental health.",
    "Practice mindful eating - savor each bite and listen to your body's hunger cues.",
    "Connect with nature - even a 10-minute walk outdoors can boost your mood.",
  ];

  // Debug: Component mount
  useEffect(() => {
    console.log('🏠 [ModernHomeScreen] Component mounted');
    console.log('👤 [ModernHomeScreen] User:', {
      userId: user?.id || (user as any)?.user_id || (user as any)?._id,
      userName: user?.first_name,
      hasUser: !!user,
    });
    return () => {
      console.log('🏠 [ModernHomeScreen] Component unmounting');
    };
  }, []);

  // Fetch user stats along with next appointment
  const fetchUserData = async () => {
    // Check for user_id (primary) or _id (fallback)
    const userId = user?.id || (user as any)?.user_id || (user as any)?._id;
    if (!userId) {
      console.log('❌ No user ID found, skipping data fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching user data for:', userId);
      
      // Fetch next appointment
      const appointmentResponse = await apiService.getNextAppointment(userId);
      console.log('📊 Next appointment response:', appointmentResponse);

      if (appointmentResponse.success && appointmentResponse.data?.appointment) {
        console.log('✅ Next appointment found');
        setNextAppointment(appointmentResponse.data.appointment);
      } else {
        console.log('ℹ️ No upcoming appointments');
        setNextAppointment(null);
      }

      // Fetch user appointments for stats
      const appointmentsResponse = await apiService.getUserAppointments(userId);
      if (appointmentsResponse.success && appointmentsResponse.data?.data) {
        const appointments = appointmentsResponse.data.data;
        const stats = {
          totalSessions: appointments.length,
          completedSessions: appointments.filter((apt: any) => apt.booking_status === 'COMPLETED').length,
          upcomingSessions: appointments.filter((apt: any) => apt.booking_status === 'CONFIRMED').length,
        };
        setUserStats(stats);
        console.log('📈 User stats calculated:', stats);
      }
    } catch (err) {
      console.error('❌ Error fetching user data:', err);
      setError('Failed to load your wellness data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    return undefined;
  }, [user?.id, (user as any)?.user_id, (user as any)?._id]);

  const onRefresh = useCallback(() => {
    console.log('🔄 [ModernHomeScreen] User triggered refresh');
    setRefreshing(true);
    fetchUserData();
  }, []);

  const navigateToAppointments = () => {
    console.log('📅 [ModernHomeScreen] Navigating to Appointments screen');
    navigation.getParent()?.navigate('Appointments');
  };

  const handleJoinSession = () => {
    if (nextAppointment?.session_link) {
      console.log('🎥 [ModernHomeScreen] Joining session:', {
        appointmentId: nextAppointment.id,
        sessionLink: nextAppointment.session_link,
        professionalName: nextAppointment.professional_name,
      });
      Linking.openURL(nextAppointment.session_link);
    } else {
      console.warn('⚠️ [ModernHomeScreen] No session link available for appointment:', nextAppointment?.id);
    }
  };

  const handleBookSession = () => {
    console.log('📖 [ModernHomeScreen] Navigating to ProfessionalsList to book session');
    navigation.navigate('ProfessionalsList', {});
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your wellness dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <ModernHomeHeader />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <ModernGreetingSection />

          {/* Professional Stats Cards */}
          <View style={styles.statsContainer}>
            <ProfessionalStatsCard
              value={userStats.totalSessions}
              label="Total Sessions"
              icon="calendar-outline"
              color={theme.colors.primary}
            />
            <ProfessionalStatsCard
              value={userStats.completedSessions}
              label="Completed Sessions"
              icon="checkmark-circle-outline"
              color={theme.colors.feedback.success}
            />
            <ProfessionalStatsCard
              value={userStats.upcomingSessions}
              label="Upcoming Sessions"
              icon="time-outline"
              color={theme.colors.accent}
            />
          </View>

          {/* Next Appointment Section */}
          <Text style={styles.sectionTitle}>Your Next Session</Text>
          <ModernAppointmentCard
            appointment={nextAppointment}
            error={error}
            loading={isLoading}
            onJoinSession={handleJoinSession}
            onBookSession={handleBookSession}
          />
          
          <View style={{ height: theme.spacing.xl }} />
          
          {/* Quick Actions Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            <ModernQuickActionCard
              title="Book Consultation"
              subtitle="Personal 1:1 session with wellness experts"
              icon="medical"
              gradientColors={['#008272', '#4C7360']}
              onPress={() => {
                console.log('👨‍⚕️ [ModernHomeScreen] Navigating to Book Consultation');
                navigation.navigate('ProfessionalsList', { bookingType: 'consultation' });
              }}
            />

            <ModernQuickActionCard
              title="Join a Class"
              subtitle="Group yoga and wellness sessions"
              icon="people"
              gradientColors={['#4C7360', '#2F5233']}
              onPress={() => {
                console.log('🧘 [ModernHomeScreen] Navigating to Join Class');
                navigation.navigate('ClassesList', { bookingType: 'class' });
              }}
            />
          </View>

          {/* Modern Wellness Tip Card */}
          <ModernWellnessTipCard tips={wellnessTips} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ModernHomeScreen;
