import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Linking,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import Card from '../components/Card';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services';

const { width } = Dimensions.get('window');

interface NextAppointment {
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
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  greetingSection: {
    marginBottom: 32,
  },
  greetingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 38,
  },
  welcomeMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  professionalName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  speciality: {
    fontSize: 15,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  appointmentDateTime: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '700',
  },
  noDataContainer: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  noDataText: {
    fontSize: 18,
    color: theme.colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    color: theme.colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  appTitle: {
    color: theme.colors.background.surface,
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    letterSpacing: 1,
  },
  placeholder: {
    width: 44,
    opacity: 0,
  },
  notificationButton: {
    padding: 10,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Enhanced Quick Actions Styles
  quickActionsContainer: {
    marginTop: 24,
    marginBottom: 32,
    gap: 16,
  },
  quickActionCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  quickActionGradient: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.1,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 1,
  },
  quickActionTextContainer: {
    flex: 1,
    marginLeft: 20,
    marginRight: 16,
  },
  quickActionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  // Stats Cards
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Wellness Tip Card
  wellnessTipCard: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  wellnessTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  wellnessTipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wellnessTipTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  wellnessTipContent: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 22,
    fontWeight: '500',
  },
});


type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const HomeScreen = () => {
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
  ];
  
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Debug: Component mount
  useEffect(() => {
    console.log('🏠 [HomeScreen] Component mounted');
    console.log('👤 [HomeScreen] User:', {
      userId: user?.id || (user as any)?.user_id || (user as any)?._id,
      userName: user?.first_name,
      hasUser: !!user,
    });
    return () => {
      console.log('🏠 [HomeScreen] Component unmounting');
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

  // Animate wellness tips
  const animateTipChange = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentTipIndex((prev) => (prev + 1) % wellnessTips.length);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim, wellnessTips.length]);

  // Rotate wellness tips every 10 seconds
  useEffect(() => {
    const interval = setInterval(animateTipChange, 10000);
    return () => clearInterval(interval);
  }, [animateTipChange]);

  useEffect(() => {
    fetchUserData();
    return undefined;
  }, [user?.id, (user as any)?.user_id, (user as any)?._id]);

  const onRefresh = useCallback(() => {
    console.log('🔄 [HomeScreen] User triggered refresh');
    setRefreshing(true);
    fetchUserData();
  }, []);

  const openDrawer = () => {
    console.log(' [HomeScreen] Opening drawer menu');
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToAppointments = () => {
    console.log(' [HomeScreen] Navigating to Appointments screen');
    console.log('📅 [HomeScreen] Navigating to Appointments screen');
    navigation.getParent()?.navigate('Appointments');
  };

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


  const handleJoinSession = () => {
    if (nextAppointment?.session_link) {
      console.log('🎥 [HomeScreen] Joining session:', {
        appointmentId: nextAppointment.id,
        sessionLink: nextAppointment.session_link,
        professionalName: nextAppointment.professional_name,
      });
      Linking.openURL(nextAppointment.session_link);
    } else {
      console.warn('⚠️ [HomeScreen] No session link available for appointment:', nextAppointment?.id);
    }
  };

  // Get time-based greeting
  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your wellness dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background.primary }]}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerIconsContainer}>
            <TouchableOpacity onPress={openDrawer} style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="menu-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Text style={styles.appTitle}>SAMYAYOG</Text>
            
            <View style={styles.iconButton} />
          </View>
        </View>
      </View>
      
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
      >
        <View style={styles.content}>
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <Text style={styles.greetingText}>Good {getGreetingTime()}</Text>
            <Text style={styles.userNameText}>
              {user?.first_name || user?.firstName || 'Welcome back'}
            </Text>
            <Text style={styles.welcomeMessage}>Ready to continue your wellness journey?</Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
              </View>
              <Text style={styles.statValue}>{userStats.totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.feedback.success} />
              </View>
              <Text style={styles.statValue}>{userStats.completedSessions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Ionicons name="time-outline" size={24} color={theme.colors.accent} />
              </View>
              <Text style={styles.statValue}>{userStats.upcomingSessions}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>

          {/* Wellness Tip Card */}
          <View style={[styles.wellnessTipCard, { backgroundColor: theme.colors.secondary }]}>
            <View style={styles.wellnessTipHeader}>
              <View style={styles.wellnessTipIcon}>
                <Ionicons name="bulb-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.wellnessTipTitle}>Daily Wellness Tip</Text>
            </View>
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.wellnessTipContent}>
                {wellnessTips[currentTipIndex]}
              </Text>
            </Animated.View>
          </View>
          
          {/* Next Appointment Section */}
          <Text style={styles.sectionTitle}>Your Next Session</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : nextAppointment ? (
            <Card style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentTitle}>Upcoming Session</Text>
                <Ionicons name="time-outline" size={20} color="#6B7280" />
              </View>
              <Text style={styles.professionalName}>
                {nextAppointment.professional_name}
              </Text>
              <Text style={styles.speciality}>
                {nextAppointment.speciality}
              </Text>
              <Text style={styles.appointmentDateTime}>
                {formatAppointmentDateTime(nextAppointment.date, nextAppointment.time)}
              </Text>
              {nextAppointment.session_link && (
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={handleJoinSession}
                  activeOpacity={0.7}
                >
                  <Text style={styles.actionButtonText}>Join Session</Text>
                </TouchableOpacity>
              )}
            </Card>
          ) : (
            <Card style={styles.noDataContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noDataText}>No upcoming sessions</Text>
              <TouchableOpacity 
                style={[styles.actionButton, { marginTop: 16, backgroundColor: theme.colors.primary }]}
                onPress={() => {
                  console.log('📖 [HomeScreen] Navigating to ProfessionalsList to book session');
                  navigation.navigate('ProfessionalsList', {});
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.actionButtonText}>Book a Session</Text>
              </TouchableOpacity>
            </Card>
          )}
          
          {/* Quick Actions Section */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsContainer}>
            {/* Book Consultation Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: theme.colors.primary }]}
              onPress={() => {
                console.log('👨‍⚕️ [HomeScreen] Navigating to Book Consultation');
                navigation.navigate('ProfessionalsList', { bookingType: 'consultation' });
              }}
              activeOpacity={0.9}
            >
              <View style={styles.quickActionGradient} />
              <View style={styles.quickActionContent}>
                <Ionicons name="medical" size={36} color="#FFFFFF" />
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>Book Consultation</Text>
                  <Text style={styles.quickActionSubtitle}>Personal 1:1 session with wellness experts</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Join Class Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: theme.colors.secondary }]}
              onPress={() => {
                console.log('🧘 [HomeScreen] Navigating to Join Class');
                navigation.navigate('ClassesList', { bookingType: 'class' });
              }}
              activeOpacity={0.9}
            >
              <View style={styles.quickActionGradient} />
              <View style={styles.quickActionContent}>
                <Ionicons name="people" size={36} color="#FFFFFF" />
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>Join a Class</Text>
                  <Text style={styles.quickActionSubtitle}>Group yoga and wellness sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* View Appointments Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: theme.colors.accent }]}
              onPress={navigateToAppointments}
              activeOpacity={0.9}
            >
              <View style={styles.quickActionGradient} />
              <View style={styles.quickActionContent}>
                <Ionicons name="calendar" size={36} color="#FFFFFF" />
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>My Appointments</Text>
                  <Text style={styles.quickActionSubtitle}>View and manage your sessions</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
