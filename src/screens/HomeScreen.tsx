import React, { useEffect, useState, useCallback } from 'react';
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
  Linking
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

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

interface ActionCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
  color: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#1E88E5',
    paddingTop: StatusBar.currentHeight || 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  menuButton: {
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
    color: '#4B5563',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    color: '#111827',
  },
  professionalName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  speciality: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appointmentDateTime: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: '#1E88E5',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noDataContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  actionCardDescription: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionCardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  actionCardButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
    fontSize: 16,
  },
  appTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
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
});

// Action Card Component
const ActionCard: React.FC<ActionCardProps> = ({ title, description, icon, onPress, color }) => (
  <TouchableOpacity 
    style={[styles.actionCard, { borderTopWidth: 4, borderTopColor: color }]}
    onPress={onPress}
  >
    <View style={[styles.actionCardIcon, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={24} color={color} />
    </View>
    <Text style={styles.actionCardTitle}>{title}</Text>
    <Text style={styles.actionCardDescription}>{description}</Text>
    <View style={[styles.actionCardButton, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.actionCardButtonText, { color }]}>Get Started</Text>
    </View>
  </TouchableOpacity>
);

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);

  // Fetch next appointment data
  const fetchNextAppointment = async () => {
    if (!user?._id) {
      console.log('❌ No user ID found, skipping appointment fetch');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Fetching next appointment for user:', user._id);
      const response = await apiService.getNextAppointment(user._id);
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
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⚠️ HomeScreen loading timeout, forcing completion');
      setIsLoading(false);
      setError('Loading took too long. Please try refreshing.');
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [user?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNextAppointment();
  }, []);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToAppointments = () => {
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

  const handleFindClass = () => {
    navigation.navigate('ClassesList');
  };

  const handleBookConsultation = () => {
    navigation.navigate('ProfessionalsList', { 
      categoryName: 'Consultations',
      searchQuery: 'consultation'
    });
  };

  const handleJoinSession = () => {
    if (nextAppointment?.session_link) {
      // Open the session link in a webview or browser
      Linking.openURL(nextAppointment.session_link);
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
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.appTitle}>SAMYAYOG</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.container}
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
            <Text style={styles.welcomeMessage}>What would you like to do today?</Text>
          </View>
          
          {/* Next Appointment Section */}
          <Text style={styles.sectionTitle}>Your Next Session</Text>
          
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : nextAppointment ? (
            <View style={styles.appointmentCard}>
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
                  style={[styles.actionButton, { backgroundColor: '#10B981' }]}
                  onPress={handleJoinSession}
                >
                  <Text style={styles.actionButtonText}>Join Session</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
              <Text style={styles.noDataText}>No upcoming sessions</Text>
              <TouchableOpacity 
                style={[styles.actionButton, { marginTop: 16 }]}
                onPress={handleBookConsultation}
              >
                <Text style={styles.actionButtonText}>Book a Session</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Action Cards */}
          <Text style={styles.sectionTitle}>Get Started</Text>
          <View style={styles.actionCardsContainer}>
            <ActionCard
              title="Find a Class"
              description="Explore group sessions & programs"
              icon="people-outline"
              onPress={handleFindClass}
              color="#8B5CF6" // Purple
            />
            <ActionCard
              title="Book a Consultation"
              description="Schedule a one-on-one session"
              icon="person-outline"
              onPress={handleBookConsultation}
              color="#10B981" // Green
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
