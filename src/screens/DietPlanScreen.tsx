import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Animated,
  SafeAreaView,
  RefreshControl,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import { useAuth } from '../hooks/useAuth';
import { dietService } from '../services/dietService';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { commonStyles } from '../theme';

// 🟢 1. Define Correct Interfaces based on your Backend/Prisma Schema
interface DietMeal {
  id: number;
  diet_plan_id?: number;
  day?: string;         // Optional for backward compatibility
  meal_type?: string;   // Backend sends 'meal_type', fallback to name
  name?: string;        // Fallback for MealItem compatibility
  time: string;
  food_items?: string;  // Backend sends 'food_items', fallback to description
  description?: string; // Fallback for MealItem compatibility
  calories?: number;
  notes?: string;
  created_at?: string;
}

interface DietPlan {
  id: number;
  plan_name: string;
  start_date: string;
  end_date: string;
  instructions?: string;
  daily_calorie_target?: number; // Added 'daily_calorie_target'
  is_active: boolean;
  meals: DietMeal[];
  professional?: {
    first_name: string;
    last_name: string;
    speciality_new?: {
      name: string;
    };
  };
}

const DietPlanScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { bookingId } = route.params;
  const { isAuthReady } = useAuth();
  const { theme: appTheme } = useTheme();
  const { width } = Dimensions.get('window');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // State management
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch diet plan data
  const fetchDietPlan = useCallback(async () => {
    if (!bookingId) return;

    try {
      setError(null);
      setIsLoading(true);

      // Backend API call
      const response = await dietService.getDietPlanByBooking(bookingId);
      
      // Handle response structure
      let data = response.data?.data || response.data;
      
      if (data) {
        setDietPlan(data as DietPlan);
      } else {
        setError('No diet plan assigned yet.');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError('Failed to load diet plan.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [bookingId]);

  // Handle PDF Download - Temporary workaround using Share API
  const handleDownloadPDF = async () => {
    if (!dietPlan) return;
    try {
      // Create formatted text content as fallback
      const textContent = `
DIET PLAN
================
Plan: ${dietPlan.plan_name}
Professional: Dr. ${dietPlan.professional?.first_name} ${dietPlan.professional?.last_name}
Duration: ${new Date(dietPlan.start_date).toLocaleDateString()} - ${new Date(dietPlan.end_date).toLocaleDateString()}
Daily Target: ${dietPlan.daily_calorie_target || 'N/A'} kcal
Instructions: ${dietPlan.instructions || 'None'}

MEAL SCHEDULE
================
${dietPlan.meals.map(meal => `
${meal.day || ''} • ${meal.time}
${meal.meal_type || meal.name} (${meal.calories || 0} kcal)
${meal.food_items || meal.description}
${meal.notes ? `Note: ${meal.notes}` : ''}
`).join('\n')}
      `.trim();

      await Share.open({
        title: "Diet Plan",
        message: textContent,
        subject: `Diet Plan - ${dietPlan.plan_name}`,
        failOnCancel: false
      });

    } catch (e) {
      console.error("Share Error:", e);
    }
  };

  // Initialize
  useEffect(() => {
    if (isAuthReady) {
      fetchDietPlan();
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [isAuthReady, fetchDietPlan]);

  // Render Meal Item
  const renderMealItem = (meal: DietMeal, index: number) => {
    return (
      <Animated.View
        key={meal.id}
        style={[
          styles.mealItem,
          {
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(fadeAnim, -20 * (1 - index * 0.1)) }],
          },
        ]}
      >
        <View style={styles.mealHeader}>
          <View style={styles.mealInfo}>
            {/* Day Badge */}
            {meal.day && (
              <View style={styles.dayBadge}>
                <Text style={styles.dayText}>{meal.day}</Text>
              </View>
            )}
            
            {/* Meal Type with Icon */}
            <View style={styles.mealTitleRow}>
              <Ionicons 
                name="restaurant-outline" 
                size={20} 
                color="#008272" 
                style={styles.mealIcon}
              />
              <Text style={styles.mealName}>
                {meal.meal_type || meal.name}
              </Text>
            </View>
            
            <Text style={styles.mealTime}>
              <Ionicons name="time-outline" size={14} /> {meal.time}
            </Text>
          </View>
          
          {/* Calorie Badge */}
          {meal.calories && meal.calories > 0 && (
            <View style={styles.calorieBadge}>
              <Ionicons name="flame-outline" size={16} color="#FF7043" />
              <Text style={styles.calorieText}>
                {meal.calories} cal
              </Text>
            </View>
          )}
        </View>

        {/* Food Items */}
        <View style={styles.foodContainer}>
          <Text style={styles.foodLabel}>
            Food Items:
          </Text>
          <Text style={styles.mealDescription}>
            {meal.food_items || meal.description}
          </Text>
        </View>

        {/* Notes Section */}
        {meal.notes ? (
          <View style={styles.notesContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#92400E" />
            <Text style={styles.noteText}>
              {meal.notes}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008272" />
          <Text style={[styles.loadingText, { color: '#64748B' }]}>
            Loading your diet plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#F8FAFC' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#008272" />
      
      {/* Modern Header with Gradient */}
      <Animated.View
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#008272', '#00A896']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()} 
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>Diet Plan</Text>
              <Text style={styles.headerSubtitle}>Your Personalized Nutrition</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleDownloadPDF} 
              style={styles.shareButton}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Decorative elements */}
          <View style={[styles.topCircle, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
          <View style={[styles.bottomWave, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={() => { setIsRefreshing(true); fetchDietPlan(); }}
            colors={['#008272']}
            tintColor="#008272"
          />
        }
      >
        {/* Diet Plan Overview Card */}
        <Animated.View 
          style={[
            styles.overviewCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            }
          ]}
        >
          <View style={styles.planHeader}>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>
                {dietPlan?.plan_name || 'Diet Plan'}
              </Text>
              <Text style={styles.planSubtitle}>
                Dr. {dietPlan?.professional?.first_name} {dietPlan?.professional?.last_name}
              </Text>
              {dietPlan?.professional?.speciality_new?.name && (
                <Text style={styles.planSpeciality}>
                  {dietPlan.professional.speciality_new.name}
                </Text>
              )}
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: dietPlan?.is_active ? '#10B981' : '#64748B' }]} />
          </View>
        </Animated.View>

        {/* Plan Details Card */}
        <Animated.View 
          style={[
            styles.detailsCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(fadeAnim, 20) }],
            }
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#008272" />
            <Text style={styles.cardTitle}>Plan Details</Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="calendar" size={18} color="#008272" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>
                {dietPlan?.start_date ? new Date(dietPlan.start_date).toLocaleDateString() : ''} - {dietPlan?.end_date ? new Date(dietPlan.end_date).toLocaleDateString() : ''}
              </Text>
            </View>
          </View>

          {dietPlan?.daily_calorie_target ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <Ionicons name="flame" size={18} color="#008272" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Daily Target</Text>
                <Text style={styles.detailValue}>
                  {dietPlan.daily_calorie_target} Calories
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>

        {/* Instructions Card */}
        {dietPlan?.instructions && (
          <Animated.View 
            style={[
              styles.instructionsCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: Animated.multiply(fadeAnim, 30) }],
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="clipboard-outline" size={20} color="#008272" />
              <Text style={styles.cardTitle}>Instructions</Text>
            </View>
            <Text style={styles.instructionsText}>
              {dietPlan.instructions}
            </Text>
          </Animated.View>
        )}

        {/* Meals Section */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: Animated.multiply(fadeAnim, 40) }],
          }}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderContent}>
              <Ionicons name="restaurant-outline" size={24} color="#008272" />
              <Text style={styles.sectionTitle}>
                Daily Meal Schedule
              </Text>
            </View>
            <View style={styles.mealCountBadge}>
              <Text style={styles.mealCountText}>
                {dietPlan?.meals?.length || 0} meals
              </Text>
            </View>
          </View>
          
          {dietPlan?.meals && dietPlan.meals.length > 0 ? (
            dietPlan.meals.map((meal, index) => renderMealItem(meal, index))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={60} color="#64748B" />
              <Text style={styles.emptyStateText}>
                No meals found in this diet plan
              </Text>
            </View>
          )}
        </Animated.View>
        
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modern Header Styles
  headerWrapper: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Decorative elements
  topCircle: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  
  // Overview Card - Professional Design
  overviewCard: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  planInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A202C',
    lineHeight: 32,
  },
  planSubtitle: {
    fontSize: 16,
    marginBottom: 6,
    color: '#64748B',
    lineHeight: 24,
  },
  planSpeciality: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008272',
    backgroundColor: 'rgba(0, 130, 114, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  
  // Status Indicator (Professional Dot)
  statusIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  
  // Details Card - Professional Design
  detailsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  
  // Instructions Card - Professional Design
  instructionsCard: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  
  // Card Header - Professional Design
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 130, 114, 0.1)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 28,
  },
  
  // Detail Rows - Professional Design
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 20,
    gap: 16,
    width: '100%',
    paddingVertical: 4,
  },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  detailContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    lineHeight: 24,
  },
  
  // Instructions Text - Professional Design
  instructionsText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#475569',
    backgroundColor: 'rgba(0, 130, 114, 0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  
  // Section Header - Professional Design
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A202C',
    lineHeight: 30,
  },
  mealCountBadge: {
    backgroundColor: 'rgba(0, 130, 114, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.2)',
  },
  mealCountText: {
    width: '100%',
  },
  mealInfo: {
    flex: 1,
    alignItems: 'flex-start',
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#008272',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dayText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
    gap: 12,
    width: '100%',
  },
  mealIcon: {
    color: '#008272',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    color: '#1A202C',
    lineHeight: 24,
  },
  mealTime: {
    fontSize: 14,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-start',
    color: '#64748B',
  },
  
  // Calorie Badge - Professional Design
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 112, 67, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 112, 67, 0.2)',
    gap: 6,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF7043',
  },
  
  // Food Container - Professional Design
  foodContainer: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  foodLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#64748B',
  },
  mealDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    backgroundColor: 'rgba(0, 130, 114, 0.03)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  
  // Notes Container - Professional Design
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    color: '#92400E',
  },
  
  // Meal Item Styles - Professional Design
  mealItem: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignSelf: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 130, 114, 0.1)',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  
  // Empty State - Professional Design
  emptyState: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    padding: 48,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: 'rgba(0, 130, 114, 0.1)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 24,
  },
});

export default DietPlanScreen;