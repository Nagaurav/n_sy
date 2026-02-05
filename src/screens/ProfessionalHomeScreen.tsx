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
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services';
import {
  ProfessionalHomeHeader,
  ProfessionalGreetingSection,
  ProfessionalStatsContainer,
  ProfessionalQuickActions,
} from '../components/home';
import { ModernAppointmentCard } from '../components';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F2ED',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
  },
  appointmentSection: {
    marginBottom: theme.spacing.l,
  },
  noAppointmentContainer: {
    marginHorizontal: theme.spacing.l,
    padding: theme.spacing.l,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.m,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  noAppointmentText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.m,
  },
  bookButton: {
    backgroundColor: '#008272',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
    borderRadius: theme.borderRadius.m,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const ProfessionalHomeScreen = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [userStats, setUserStats] = useState({
    upcomingSessions: 0,
    completedThisMonth: 0,
    totalSessions: 0,
  });

  // Fetch user data
  const fetchUserData = async () => {
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
      let appointmentsResponse;
      try {
        appointmentsResponse = await apiService.getUserAppointments(userId);
      } catch (consultationError) {
        console.warn('⚠️ Failed to fetch consultation appointments:', consultationError);
        appointmentsResponse = { success: false, data: null };
      }
      
      // Fetch yoga bookings with error handling
      let yogaBookingsResponse;
      try {
        yogaBookingsResponse = await apiService.getYogaBookings(userId);
      } catch (yogaError) {
        console.warn('⚠️ Failed to fetch yoga bookings:', yogaError);
        yogaBookingsResponse = { success: false, data: null };
      }
      
      let consultationStats = {
        total: 0,
        completed: 0,
        upcoming: 0,
        completedThisMonth: 0,
      };
      
      let yogaStats = {
        total: 0,
        completed: 0,
        upcoming: 0,
        completedThisMonth: 0,
      };
      
      // Process consultation appointments
      if (appointmentsResponse.success && appointmentsResponse.data?.data) {
        const appointments = appointmentsResponse.data.data;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        consultationStats = {
          total: appointments.length,
          completed: appointments.filter((apt: any) => apt.booking_status === 'COMPLETED').length,
          upcoming: appointments.filter((apt: any) => apt.booking_status === 'CONFIRMED').length,
          completedThisMonth: appointments.filter((apt: any) => {
            if (apt.booking_status !== 'COMPLETED') return false;
            const aptDate = new Date(apt.date);
            return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
          }).length,
        };
        console.log('📊 Consultation stats calculated:', consultationStats);
      }
      
      // Process yoga class bookings
      if (yogaBookingsResponse.success && yogaBookingsResponse.data?.data) {
        const yogaBookings = yogaBookingsResponse.data.data;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        yogaStats = {
          total: yogaBookings.length,
          completed: yogaBookings.filter((booking: any) => 
            booking.status === 'COMPLETED' || booking.booking_status === 'COMPLETED'
          ).length,
          upcoming: yogaBookings.filter((booking: any) => 
            booking.status === 'CONFIRMED' || booking.booking_status === 'CONFIRMED'
          ).length,
          completedThisMonth: yogaBookings.filter((booking: any) => {
            const status = booking.status || booking.booking_status;
            if (status !== 'COMPLETED') return false;
            const bookingDate = new Date(booking.date || booking.created_at);
            return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
          }).length,
        };
        console.log('🧘 Yoga stats calculated:', yogaStats);
      }
      
      // Combine all stats
      const combinedStats = {
        upcomingSessions: consultationStats.upcoming + yogaStats.upcoming,
        completedThisMonth: consultationStats.completedThisMonth + yogaStats.completedThisMonth,
        totalSessions: consultationStats.total + yogaStats.total,
      };
      
      setUserStats(combinedStats);
      console.log('📈 Combined user stats calculated:', combinedStats);
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
    console.log('🔄 [ProfessionalHomeScreen] User triggered refresh');
    setRefreshing(true);
    fetchUserData();
  }, []);

  const handleJoinSession = () => {
    if (nextAppointment?.session_link) {
      console.log('🎥 [ProfessionalHomeScreen] Joining session:', {
        appointmentId: nextAppointment.id,
        sessionLink: nextAppointment.session_link,
        professionalName: nextAppointment.professional_name,
      });
      Linking.openURL(nextAppointment.session_link);
    } else {
      console.warn('⚠️ [ProfessionalHomeScreen] No session link available for appointment:', nextAppointment?.id);
    }
  };

  const handleBookSession = () => {
    console.log('📖 [ProfessionalHomeScreen] Navigating to ProfessionalsList to book session');
    navigation.navigate('ProfessionalsList', {});
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.background.surface} barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your wellness dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background.surface} barStyle="dark-content" />
      <ProfessionalHomeHeader />
      
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
        <ProfessionalGreetingSection />

        <ProfessionalStatsContainer
          upcomingSessions={userStats.upcomingSessions}
          completedThisMonth={userStats.completedThisMonth}
          totalSessions={userStats.totalSessions}
        />

        {/* Next Appointment Section */}
        <View style={styles.appointmentSection}>
          <Text style={styles.sectionTitle}>Next Session</Text>
          {nextAppointment ? (
            <ModernAppointmentCard
              appointment={nextAppointment}
              error={error}
              loading={isLoading}
              onJoinSession={handleJoinSession}
              onBookSession={handleBookSession}
            />
          ) : (
            <View style={styles.noAppointmentContainer}>
              <Text style={styles.noAppointmentText}>
                No upcoming sessions scheduled
              </Text>
              <TouchableOpacity 
                style={styles.bookButton} 
                onPress={handleBookSession}
                activeOpacity={0.8}
              >
                <Text style={styles.bookButtonText}>Book Your First Session</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
          
        <ProfessionalQuickActions
          onBookConsultation={() => {
            console.log('👨‍⚕️ [ProfessionalHomeScreen] Navigating to Book Consultation');
            navigation.navigate('ProfessionalsList', { bookingType: 'consultation' });
          }}
          onJoinClass={() => {
            console.log('🧘 [ProfessionalHomeScreen] Navigating to Join Class');
            navigation.navigate('ClassesList', { bookingType: 'class' });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfessionalHomeScreen;
