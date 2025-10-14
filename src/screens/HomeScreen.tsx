import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator, 
  RefreshControl,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  StatusBar,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme, commonStyles } from '../theme';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { ConsultationBooking } from '../types/booking';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface NextAppointment {
  professional_name: string;
  speciality: string;
  date: string;
  time: string;
  session_link?: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  greetingSection: {
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcomeMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#1E88E5',
    fontWeight: '500',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentInfo: {
    flex: 1,
  },
  professionalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  speciality: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  appointmentDateTime: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  noAppointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noAppointmentText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  bookFirstButton: {
    backgroundColor: '#1E88E5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bookFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    width: (width - 48) / 2,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const HomeScreen = () => {
  const { user } = useAuth();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // State variables
  const [nextAppointment, setNextAppointment] = useState<NextAppointment | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notificationCount] = useState(3); // Mock notification count

  // Fetch all data
  const fetchHomeData = async () => {
    if (!user?._id) {
      console.log('❌ No user ID found, skipping data fetch');
      setIsLoading(false);
      return;
    }

    console.log('🔄 Fetching home data for user:', user._id);

    try {
      setError('');
      
      console.log('📡 Making API calls...');
      
      // Fetch next appointment and categories in parallel
      const [nextAppResponse, categoriesResponse] = await Promise.all([
        apiService.getNextAppointment(user._id),
        apiService.getWellnessCategories(),
      ]);

      console.log('📊 API Responses:', {
        nextAppointment: nextAppResponse.success,
        categories: categoriesResponse.success
      });

      if (nextAppResponse.success && nextAppResponse.data?.appointment) {
        console.log('✅ Next appointment found');
        setNextAppointment(nextAppResponse.data.appointment);
      } else {
        console.log('ℹ️ No next appointment or API failed');
      }

      if (categoriesResponse.success && categoriesResponse.data?.categories) {
        console.log('✅ Categories loaded:', categoriesResponse.data.categories.length);
        setCategories(categoriesResponse.data.categories);
      } else {
        console.log('⚠️ Categories failed to load');
      }
    } catch (err) {
      console.error('❌ Error fetching home data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      console.log('✅ Home data fetch completed');
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⚠️ HomeScreen loading timeout, forcing completion');
      setIsLoading(false);
      setError('Loading took too long. Please try refreshing.');
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timeout);
  }, [user?._id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHomeData();
  }, []);

  const handleSearch = useCallback((query: string) => {
    if (query.trim()) {
      // Navigate to professionals list with search query
      navigation.navigate('ProfessionalsList', { searchQuery: query.trim() });
    }
  }, [navigation]);

  const handleCategoryPress = useCallback((categoryId: string) => {
    navigation.navigate('ProfessionalsList', { categoryId });
  }, [navigation]);

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const navigateToAppointments = () => {
    // Navigate to the drawer's Appointments screen
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

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(item.id)}
    >
      <View style={styles.categoryIcon}>
        <Ionicons 
          name={item.icon as any} 
          size={32} 
          color="#1E88E5" 
        />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E88E5" />
          <Text style={styles.loadingText}>Loading your wellness dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#1E88E5" barStyle="light-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.menuButton} onPress={openDrawer}>
            <Ionicons name="menu" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.appTitle}>SAMYAYOG</Text>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for professionals or services..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
          />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E88E5']}
          />
        }
      >
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>Hello,</Text>
          <Text style={styles.userNameText}>{user?.firstName || 'User'}!</Text>
          <Text style={styles.welcomeMessage}>Ready to find your inner peace?</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Next Appointment Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Next Appointment</Text>
          <TouchableOpacity style={styles.viewAllButton} onPress={navigateToAppointments}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {nextAppointment ? (
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentInfo}>
              <Text style={styles.professionalName}>{nextAppointment.professional_name}</Text>
              <Text style={styles.speciality}>{nextAppointment.speciality}</Text>
              <Text style={styles.appointmentDateTime}>
                {formatAppointmentDateTime(nextAppointment.date, nextAppointment.time)}
              </Text>
            </View>
            {nextAppointment.session_link && (
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonText}>Join Session</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noAppointmentCard}>
            <Text style={styles.noAppointmentText}>No upcoming appointments.</Text>
            <TouchableOpacity style={styles.bookFirstButton}>
              <Text style={styles.bookFirstButtonText}>Book your first session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Wellness Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Wellness Categories</Text>
        </View>

        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.id)}
            >
              <View style={styles.categoryIcon}>
                <Ionicons 
                  name={category.icon as any} 
                  size={32} 
                  color="#1E88E5" 
                />
              </View>
              <Text style={styles.categoryName}>{category.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
