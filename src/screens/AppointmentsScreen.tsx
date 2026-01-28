import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Animated,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { bookingService } from '../services';
import { UnifiedAppointment } from '../types/booking';
import { theme } from '../theme';

const AppointmentsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [appointments, setAppointments] = useState<UnifiedAppointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<UnifiedAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'consultation' | 'yoga_class'>('all');

  // � Filter function
  const applyFilter = useCallback((data: UnifiedAppointment[], filter: 'all' | 'consultation' | 'yoga_class') => {
    if (filter === 'all') {
      setFilteredAppointments(data);
    } else {
      setFilteredAppointments(data.filter(item => item.type === filter));
    }
  }, []);

  // �🟢 SINGLE SOURCE OF TRUTH
  const loadData = useCallback(async () => {
    const userId = (user as any)?.user_id || (user as any)?._id || (user as any)?.id;
    if (!userId) return; // Wait for user
    
    try {
      if (!isRefreshing) setIsLoading(true);
      setError(null);
      
      // Call the unified service
      const res = await bookingService.getAllUserBookings(userId);
      
      if (res.success && res.data) {
        setAppointments(res.data);
        // Apply current filter to new data
        applyFilter(res.data, selectedFilter);
      } else {
        setError('Failed to load appointments.');
      }
    } catch (err) {
      setError('Network error. Pull to refresh.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isRefreshing, selectedFilter, applyFilter]);

  // Handle filter change
  useEffect(() => {
    applyFilter(appointments, selectedFilter);
  }, [selectedFilter, appointments, applyFilter]);

  // Initial Load
  useEffect(() => {
    if (user && !authLoading) {
      loadData();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [user, authLoading, loadData]);

  // Refresh on Focus
  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user, loadData])
  );

  const renderItem = ({ item }: { item: UnifiedAppointment }) => {
    const isYoga = item.type === 'yoga_class';
    const color = isYoga ? '#4CAF50' : '#2196F3'; 

    return (
      <View style={[styles.card, { borderLeftColor: color, borderLeftWidth: 5 }]}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.sub}>{item.subtitle}</Text>
          </View>
          <View style={[styles.typeBadge, { backgroundColor: color + '20' }]}>
            <Ionicons name={isYoga ? 'fitness' : 'medkit'} size={14} color={color} />
            <Text style={[styles.typeText, { color }]}>{isYoga ? 'Yoga' : 'Consult'}</Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={[styles.statusText, { 
             color: item.status === 'CONFIRMED' ? 'green' : 
                    item.status === 'PENDING' ? 'orange' : 'red' 
          }]}>
            {item.status}
          </Text>
          
          <TouchableOpacity onPress={() => {
             // ✅ CORRECT: Navigate directly to the screen
             navigation.navigate('AppointmentDetail', { 
               appointmentId: item.reference_id,
               type: item.type
             });
          }}>
            <Text style={{ color: color, fontWeight: 'bold' }}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && !isRefreshing && appointments.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
      <LinearGradient 
        colors={[appTheme.colors.primary, appTheme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>My Bookings</Text>
            <Text style={styles.headerSubtitle}>Manage your appointments</Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'all' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
            All ({appointments.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'consultation' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('consultation')}
        >
          <Text style={[styles.filterText, selectedFilter === 'consultation' && styles.filterTextActive]}>
            Consultations ({appointments.filter(item => item.type === 'consultation').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, selectedFilter === 'yoga_class' && styles.filterChipActive]}
          onPress={() => setSelectedFilter('yoga_class')}
        >
          <Text style={[styles.filterText, selectedFilter === 'yoga_class' && styles.filterTextActive]}>
            Yoga Classes ({appointments.filter(item => item.type === 'yoga_class').length})
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={filteredAppointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); loadData(); }} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
               <Text style={{ color: '#999', marginTop: 50 }}>No appointments found.</Text>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: theme.colors.background.surface, 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    color: theme.colors.background.surface,
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 40,
  },
  topCircle: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomWave: {
    position: 'absolute',
    bottom: -20,
    left: -50,
    right: -50,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  card: { 
    backgroundColor: theme.colors.background.surface, 
    marginBottom: 16, 
    borderRadius: theme.borderRadius.l, 
    padding: 16, 
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text.primary },
  sub: { fontSize: 14, color: theme.colors.text.secondary },
  typeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700', marginLeft: 4, textTransform: 'uppercase' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  
  // Filter Styles
  filterContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 20, 
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    height: 36,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: { 
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterText: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: '#495057',
    textAlign: 'center',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  filterTextActive: { 
    color: '#fff',
    fontWeight: '700',
  }
});

export default AppointmentsScreen;
