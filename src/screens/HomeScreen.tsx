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
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { Alert } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import Card from '../components/Card';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services/apiService';

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
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  appointmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  professionalName: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  speciality: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  appointmentDateTime: {
    fontSize: 15,
    color: theme.colors.accent,
    fontWeight: '500',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: theme.colors.background.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
  },
  noDataText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: theme.colors.text.secondary,
    fontSize: 16,
  },
  appTitle: {
    color: theme.colors.background.surface,
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
    opacity: 0, // Keep for layout consistency
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    textAlign: 'center',
  },
  bookingOptions: {
    marginTop: 24,
  },
  bookingOptionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  bookingOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookingOptionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bookingOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  bookingOptionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Quick Actions Styles
  quickActionsContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  quickActionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickActionTextContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
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

  // Fetch next appointment data
  const fetchNextAppointment = async () => {
    // Check for user_id (primary) or _id (fallback)
    const userId = user?.id || (user as any)?.user_id || (user as any)?._id;
    if (!userId) {
      console.log('❌ No user ID found, skipping appointment fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching next appointment for user:', userId);
      const response = await apiService.getNextAppointment(userId);
      console.log('📊 Next appointment response:', response);

      if (response.success && response.data?.appointment) {
        console.log('✅ Next appointment found');
        setNextAppointment(response.data.appointment);
      } else {
        console.log('ℹ️ No upcoming appointments');
        setNextAppointment(null);
      }
    } catch (err) {
      console.error('❌ Error fetching next appointment:', err);
      setError('Failed to load appointment details. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNextAppointment();
    // Removed fallback timeout to avoid forcing loading false prematurely
    return undefined;
  }, [user?.id, (user as any)?.user_id, (user as any)?._id]);

  const onRefresh = useCallback(() => {
    console.log('🔄 [HomeScreen] User triggered refresh');
    setRefreshing(true);
    fetchNextAppointment();
  }, []);

  const openDrawer = () => {
    console.log('📂 [HomeScreen] Opening drawer menu');
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToChat = () => {
    console.log('💬 [HomeScreen] Navigating to Chat screen');
    navigation.navigate('ChatScreen', {
      chatId: 'general-chat',
      appointmentId: 'general',
      title: 'Support Chat',
      receiverId: 'support'
    });
  };

  const navigateToAppointments = () => {
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
            
            <TouchableOpacity onPress={navigateToChat} style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
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
              {user?.first_name || 'Welcome back'}
            </Text>
            <Text style={styles.welcomeMessage}>What would you like to do today?</Text>
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
              <View style={styles.quickActionContent}>
                <Ionicons name="medical" size={32} color="#FFFFFF" />
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>Book Consultation</Text>
                  <Text style={styles.quickActionSubtitle}>1:1 session with an expert</Text>
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
              <View style={styles.quickActionContent}>
                <Ionicons name="people" size={32} color="#FFFFFF" />
                <View style={styles.quickActionTextContainer}>
                  <Text style={styles.quickActionTitle}>Join a Class</Text>
                  <Text style={styles.quickActionSubtitle}>Group yoga and wellness sessions</Text>
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
