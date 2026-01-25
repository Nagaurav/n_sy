import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
  Animated,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../hooks/useAuth';
import { dietService } from '../services/dietService';
import type { HomeStackParamList } from '../types/navigation';
import type { DietPlan, MealItem } from '../types/diet';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

type DietPlanRouteProp = RouteProp<
  HomeStackParamList,
  'DietPlan'
>;

type DietPlanNavigationProp = StackNavigationProp<
  HomeStackParamList,
  'DietPlan'
>;

const DietPlanScreen: React.FC = () => {
  const route = useRoute<DietPlanRouteProp>();
  const navigation = useNavigation<DietPlanNavigationProp>();
  const { bookingId, title } = route.params;
  const { isAuthReady } = useAuth();
  const { theme: appTheme } = useTheme();

  console.log(' 🥗 [DietPlan] Screen rendering with bookingId:', bookingId);

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
    if (!bookingId) {
      setError('No booking ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      console.log(' 🥗 [DietPlan] Starting fetch for bookingId:', bookingId);
      setIsLoading(true);

      const response = await dietService.getDietPlanByBooking(bookingId);
      console.log(' 🥗 [DietPlan] Full API Response:', JSON.stringify(response, null, 2));

      let dietPlanData = null;

      if (response?.success) {
        dietPlanData = response.data?.data || response.data || null;
      } else if (response?.data) {
        dietPlanData = response.data.data || response.data;
      }

      if (dietPlanData && typeof dietPlanData === 'object' && 'data' in dietPlanData) {
        setDietPlan(dietPlanData.data as DietPlan);
        console.log(' 🥗 [DietPlan] Diet plan loaded successfully');
      } else if (dietPlanData) {
        setDietPlan(dietPlanData as DietPlan);
        console.log(' 🥗 [DietPlan] Diet plan loaded successfully');
      } else {
        setError('No diet plan found for this booking. The nutritionist may not have assigned a diet plan yet.');
      }
    } catch (err: any) {
      console.error(' 🥗 [DietPlan] Error fetching diet plan:', err);
      
      if (err.response?.status === 404) {
        setError('No diet plan found for this booking. The nutritionist may not have assigned a diet plan yet.');
      } else {
        setError(err.message || 'Failed to load diet plan. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [bookingId]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDietPlan();
  }, [fetchDietPlan]);

  // Initialize animations and fetch data
  useEffect(() => {
    if (isAuthReady) {
      fetchDietPlan();
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAuthReady, fetchDietPlan, fadeAnim, slideAnim]);

  // Set up header
  useEffect(() => {
    navigation.setOptions({
      title: title || 'Diet Plan',
      headerStyle: {
        backgroundColor: appTheme.colors.primary,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#FFFFFF',
      headerTitleStyle: {
        fontWeight: '600',
        fontSize: 18,
      },
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, title, appTheme]);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={[styles.loadingText, { color: appTheme.colors.text.secondary }]}>
            Loading diet plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background.primary }]}>
        <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
        <View style={styles.errorContainer}>
          <Ionicons name="document-text-outline" size={64} color={appTheme.colors.text.secondary} />
          <Text style={[styles.errorTitle, { color: appTheme.colors.text.primary }]}>
            Diet Plan Not Available
          </Text>
          <Text style={[styles.errorMessage, { color: appTheme.colors.text.secondary }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: appTheme.colors.primary }]}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Render meal item
  const renderMealItem = (meal: MealItem, index: number) => (
    <Animated.View
      key={meal.id}
      style={[
        styles.mealItem,
        { 
          backgroundColor: appTheme.colors.background.surface,
          borderColor: appTheme.colors.colors?.border || '#E5E7EB',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.mealHeader}>
        <View style={styles.mealInfo}>
          <Text style={[styles.mealName, { color: appTheme.colors.text.primary }]}>
            {meal.name}
          </Text>
          <Text style={[styles.mealTime, { color: appTheme.colors.text.secondary }]}>
            <Ionicons name="time-outline" size={14} /> {meal.time}
          </Text>
        </View>
        {meal.calories && (
          <View style={[styles.calorieBadge, { backgroundColor: appTheme.colors.primary + '20' }]}>
            <Text style={[styles.calorieText, { color: appTheme.colors.primary }]}>
              {meal.calories} cal
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.mealDescription, { color: appTheme.colors.text.secondary }]}>
        {meal.description}
      </Text>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.colors.background.primary }]}>
      <StatusBar barStyle="light-content" backgroundColor={appTheme.colors.primary} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[appTheme.colors.primary]}
            tintColor={appTheme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <LinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          style={styles.headerSection}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={styles.headerTitle}>{dietPlan?.plan_name || 'Diet Plan'}</Text>
            <Text style={styles.headerSubtitle}>
              {dietPlan?.professional?.first_name} {dietPlan?.professional?.last_name}
            </Text>
            {dietPlan?.professional?.speciality_new?.name && (
              <Text style={styles.headerSpeciality}>
                {dietPlan.professional.speciality_new.name}
              </Text>
            )}
          </Animated.View>
        </LinearGradient>

        {/* Plan Details */}
        <Animated.View 
          style={[
            styles.section,
            { 
              backgroundColor: appTheme.colors.background.surface,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text.primary }]}>
            Plan Details
          </Text>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: appTheme.colors.text.secondary }]}>
              Duration:
            </Text>
            <Text style={[styles.detailValue, { color: appTheme.colors.text.primary }]}>
              {dietPlan?.start_date} to {dietPlan?.end_date}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: appTheme.colors.text.secondary }]}>
              Status:
            </Text>
            <View style={[
              styles.statusBadge,
              { 
                backgroundColor: dietPlan?.is_active 
                  ? appTheme.colors.feedback.success 
                  : appTheme.colors.text.secondary 
              }
            ]}>
              <Text style={[
                styles.statusText,
                { 
                  color: '#FFFFFF'
                }
              ]}>
                {dietPlan?.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Instructions */}
        {dietPlan?.instructions && (
          <Animated.View 
            style={[
              styles.section,
              { 
                backgroundColor: appTheme.colors.background.surface,
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={[styles.sectionTitle, { color: appTheme.colors.text.primary }]}>
              Instructions
            </Text>
            <Text style={[styles.instructionsText, { color: appTheme.colors.text.secondary }]}>
              {dietPlan.instructions}
            </Text>
          </Animated.View>
        )}

        {/* Meals */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={[styles.sectionTitle, { color: appTheme.colors.text.primary, marginLeft: 16 }]}>
            Daily Meals
          </Text>
          {dietPlan?.meals && dietPlan.meals.length > 0 ? (
            dietPlan.meals.map((meal, index) => renderMealItem(meal, index))
          ) : (
            <View style={[styles.section, { backgroundColor: appTheme.colors.background.surface }]}>
              <Text style={[styles.noMealsText, { color: appTheme.colors.text.secondary }]}>
                No meals specified for this diet plan
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
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
    fontFamily: 'Inter-SemiBold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerSection: {
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
  },
  headerSpeciality: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'Inter-SemiBold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  mealItem: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  mealTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  calorieBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  mealDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
  },
  noMealsText: {
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
  bottomPadding: {
    height: 20,
  },
});

export default DietPlanScreen;