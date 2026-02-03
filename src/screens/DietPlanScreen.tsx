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
  PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
const RNHTMLtoPDF = require('react-native-html-to-pdf');
import { useAuth } from '../hooks/useAuth';
import { dietService } from '../services/dietService';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { commonStyles } from '../theme';
import { downloadPDFEnhanced, showEnhancedPDFResult } from '../utils/enhancedPDFDownload';

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

interface DietPlanScreenProps {
  // Add any props if needed in the future
}

const DietPlanScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { bookingId } = route.params;
  const { isAuthReady } = useAuth();
  const { theme: appTheme } = useTheme();
  const theme = appTheme || require('../theme').theme;
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
  const [showAllMeals, setShowAllMeals] = useState(false);

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

  // Handle PDF Download - Enhanced with better permission handling and download location
  const handleDownloadPDF = async () => {
    console.log('PDF download button pressed!');
    if (!dietPlan) {
      console.log('No diet plan data available');
      Alert.alert('Error', 'No diet plan data available to generate PDF.');
      return;
    }
    
    try {
      // Show loading indicator
      Alert.alert('Generating PDF', 'Please wait while we generate and download your diet plan PDF...');

      // Generate HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Diet Plan - ${dietPlan.plan_name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
              line-height: 1.6;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #008272;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              color: #008272;
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              color: #666;
              font-size: 16px;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 30px;
              padding: 20px;
              border: 1px solid #e0e0e0;
              border-radius: 8px;
              background-color: #f9f9f9;
            }
            .section-title {
              color: #008272;
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              border-bottom: 2px solid #008272;
              padding-bottom: 5px;
            }
            .info-row {
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .meal-item {
              margin-bottom: 20px;
              padding: 15px;
              border-left: 4px solid #008272;
              background-color: white;
              border-radius: 4px;
            }
            .meal-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            .meal-name {
              font-weight: bold;
              color: #008272;
              font-size: 16px;
            }
            .meal-time {
              color: #666;
              font-size: 14px;
            }
            .meal-details {
              margin-top: 10px;
            }
            .calories {
              background-color: #ff7043;
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .notes {
              margin-top: 10px;
              padding: 10px;
              background-color: #fff3cd;
              border-left: 3px solid #ffc107;
              font-style: italic;
              color: #856404;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #666;
              font-size: 12px;
              border-top: 1px solid #e0e0e0;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">DIET PLAN</div>
            <div class="subtitle">${dietPlan.plan_name}</div>
            <div class="subtitle">Dr. ${dietPlan.professional?.first_name || ''} ${dietPlan.professional?.last_name || ''}</div>
            ${dietPlan.professional?.speciality_new?.name ? `<div class="subtitle">${dietPlan.professional.speciality_new.name}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-title">Plan Details</div>
            <div class="info-row">
              <span class="info-label">Duration:</span>
              <span>${new Date(dietPlan.start_date).toLocaleDateString()} - ${new Date(dietPlan.end_date).toLocaleDateString()}</span>
            </div>
            ${dietPlan.daily_calorie_target ? `
            <div class="info-row">
              <span class="info-label">Daily Target:</span>
              <span>${dietPlan.daily_calorie_target} Calories</span>
            </div>
            ` : ''}
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span>${dietPlan.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          ${dietPlan.instructions ? `
          <div class="section">
            <div class="section-title">Instructions</div>
            <div>${dietPlan.instructions}</div>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Meal Schedule</div>
            ${dietPlan.meals.map(meal => `
              <div class="meal-item">
                <div class="meal-header">
                  <div>
                    <div class="meal-name">${meal.meal_type || meal.name || 'Meal'}</div>
                    <div class="meal-time">${meal.day || ''} • ${meal.time}</div>
                  </div>
                  ${meal.calories ? `<span class="calories">${meal.calories} cal</span>` : ''}
                </div>
                <div class="meal-details">
                  <div><strong>Food Items:</strong> ${meal.food_items || meal.description || 'N/A'}</div>
                  ${meal.notes ? `<div class="notes"><strong>Note:</strong> ${meal.notes}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            Generated on ${new Date().toLocaleDateString()} by SamyaYog App
          </div>
        </body>
        </html>
      `;

      // Generate PDF using the enhanced utility with reliable Downloads folder saving
      const fileName = `DietPlan_${dietPlan.plan_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      const result = await downloadPDFEnhanced(
        { html: htmlContent, fileName },
        RNHTMLtoPDF
      );

      // Show enhanced user feedback with detailed location information
      showEnhancedPDFResult(result, fileName);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      showEnhancedPDFResult({ success: false, error: error.message || 'Failed to generate PDF' }, '');
    }
  };

  // Initialize animations and fetch data
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

  if (error && !dietPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="nutrition-outline" size={48} color={appTheme.colors.primary} />
            <Text style={styles.errorTitle}>No Diet Plan Found</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => { setIsRefreshing(true); fetchDietPlan(); }}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: '#F1F5F9' }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.retryButtonText, { color: '#475569' }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
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
            <Text style={styles.headerTitle}>Diet Plan</Text>
            <Text style={styles.headerSubtitle}>Your personalized nutrition plan</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleDownloadPDF}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={theme.colors.background.surface} />
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 32
          }}
          showsVerticalScrollIndicator={false}
          indicatorStyle="default"
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={() => { setIsRefreshing(true); fetchDietPlan(); }}
              colors={[appTheme.colors.primary]}
              tintColor={appTheme.colors.primary}
            />
          }
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={false}
        >
          {/* Main Info Card - Standardized */}
          <Animated.View style={[
            styles.card,
            { 
              opacity: fadeAnim, 
              transform: [{ translateY: slideAnim }], 
              borderLeftColor: '#4CAF50', 
              borderLeftWidth: 5 
            }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>
                  {dietPlan?.plan_name || 'Diet Plan'}
                </Text>
                <Text style={styles.sub}>
                  {dietPlan?.professional?.first_name && dietPlan?.professional?.last_name
                    ? `Dr. ${dietPlan?.professional.first_name} ${dietPlan?.professional.last_name}`
                    : 'Nutritionist'
                  }
                </Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="nutrition" size={14} color="#4CAF50" />
                <Text style={[styles.typeText, { color: '#4CAF50' }]}>DIET</Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { 
                color: dietPlan?.is_active ? '#2E7D32' : '#EF6C00'
              }]}>
                {dietPlan?.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
              <TouchableOpacity onPress={handleDownloadPDF}>
                <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Plan Details Card - Standardized */}
          <Animated.View style={[
            styles.card,
            { borderLeftColor: '#2196F3', borderLeftWidth: 5, opacity: fadeAnim, transform: [{ translateY: Animated.multiply(fadeAnim, 20) }] }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Plan Details</Text>
                <Text style={styles.sub}>Duration & Nutrition Goals</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#2196F3' + '20' }]}>
                <Ionicons name="information-circle-outline" size={14} color="#2196F3" />
                <Text style={[styles.typeText, { color: '#2196F3' }]}>INFO</Text>
              </View>
            </View>
            
            <View style={styles.cardContent}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar" size={16} color="#6B7280" />
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Duration: </Text>
                  {dietPlan?.start_date && dietPlan?.end_date 
                    ? `${new Date(dietPlan?.start_date || '').toLocaleDateString()} - ${new Date(dietPlan?.end_date || '').toLocaleDateString()}`
                    : 'Not specified'
                  }
                </Text>
              </View>

              {dietPlan?.daily_calorie_target && (
                <View style={styles.detailRow}>
                  <Ionicons name="flame" size={16} color="#F59E0B" />
                  <Text style={styles.detailText}>
                    <Text style={styles.detailLabel}>Daily Target: </Text>
                    {dietPlan?.daily_calorie_target} Calories
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#2196F3' }]}>
                {dietPlan?.daily_calorie_target ? `${dietPlan?.daily_calorie_target} cal/day` : 'No target set'}
              </Text>
            </View>
          </Animated.View>

          {/* Instructions Card - Standardized */}
          {dietPlan?.instructions && (
            <Animated.View style={[
              styles.card,
              { borderLeftColor: '#FF7043', borderLeftWidth: 5, opacity: fadeAnim, transform: [{ translateY: Animated.multiply(fadeAnim, 30) }] }
            ]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Instructions</Text>
                  <Text style={styles.sub}>Diet Guidelines & Tips</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#FF7043' + '20' }]}>
                  <Ionicons name="clipboard-outline" size={14} color="#FF7043" />
                  <Text style={[styles.typeText, { color: '#FF7043' }]}>GUIDE</Text>
                </View>
              </View>
              <Text style={styles.instructionsText}>
                {dietPlan?.instructions}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.statusText, { color: '#FF7043' }]}>
                  Important guidelines
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Meals Section Card - Standardized */}
          <Animated.View style={[
            styles.card,
            { borderLeftColor: '#4CAF50', borderLeftWidth: 5, opacity: fadeAnim, transform: [{ translateY: Animated.multiply(fadeAnim, 40) }] }
          ]}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Daily Meals</Text>
                <Text style={styles.sub}>Your Meal Schedule</Text>
              </View>
              <View style={[styles.typeBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                <Ionicons name="restaurant-outline" size={14} color="#4CAF50" />
                <Text style={[styles.typeText, { color: '#4CAF50' }]}>{dietPlan?.meals?.length || 0}</Text>
              </View>
            </View>
            
            {/* Meal Summary Stats */}
            <View style={styles.mealStatsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color="#FF7043" />
                <Text style={styles.statLabel}>Daily Calories</Text>
                <Text style={styles.statValue}>{dietPlan?.daily_calorie_target || 'N/A'}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color="#2196F3" />
                <Text style={styles.statLabel}>Meal Times</Text>
                <Text style={styles.statValue}>{dietPlan?.meals?.length || 0} per day</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={16} color="#4CAF50" />
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{dietPlan?.meals?.length ? `${Math.ceil((new Date(dietPlan?.end_date || '').getTime() - new Date(dietPlan?.start_date || '').getTime()) / (1000 * 60 * 60 * 24))} days` : 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                {(dietPlan?.meals?.length ?? 0) > 0 ? `${dietPlan?.meals?.length} meals scheduled` : 'No meals found'}
              </Text>
              {(dietPlan?.meals?.length ?? 0) > 0 && (
                <TouchableOpacity onPress={() => setShowAllMeals(!showAllMeals)}>
                  <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                    {showAllMeals ? 'Show Less' : 'View All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Meal Items - Show when View All is clicked */}
          {showAllMeals && (dietPlan?.meals?.length ?? 0) > 0 && (
            <Animated.View style={[
              styles.card,
              { 
                borderLeftColor: '#4CAF50', 
                borderLeftWidth: 5, 
                opacity: fadeAnim, 
                transform: [{ translateY: Animated.multiply(fadeAnim, 50) }] 
              }
            ]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Meal Details</Text>
                  <Text style={styles.sub}>Complete meal schedule</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                  <Ionicons name="restaurant-outline" size={14} color="#4CAF50" />
                  <Text style={[styles.typeText, { color: '#4CAF50' }]}>ALL</Text>
                </View>
              </View>
              
              <View style={styles.cardContent}>
                {dietPlan?.meals?.map((meal: DietMeal, index: number) => (
                  <View key={meal.id} style={styles.mealDetailCard}>
                    <View style={styles.mealDetailHeader}>
                      <View style={styles.mealDetailIcon}>
                        <Ionicons name="restaurant-outline" size={16} color="#4CAF50" />
                      </View>
                      <View style={styles.mealDetailInfo}>
                        <Text style={styles.mealDetailName}>
                          {meal.meal_type || meal.name || 'Meal'}
                        </Text>
                        <Text style={styles.mealDetailTime}>
                          {meal.day && `${meal.day} • `}{meal.time}
                        </Text>
                      </View>
                      {meal.calories && (
                        <View style={styles.mealDetailCalorieBadge}>
                          <Text style={styles.mealDetailCalorieText}>{meal.calories} cal</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.mealDetailContent}>
                      <Text style={styles.mealDetailLabel}>Food Items:</Text>
                      <Text style={styles.mealDetailDescription}>
                        {meal.food_items || meal.description || 'N/A'}
                      </Text>
                      
                      {meal.notes && (
                        <View style={styles.mealDetailNotes}>
                          <Text style={styles.mealDetailNotesLabel}>Notes:</Text>
                          <Text style={styles.mealDetailNotesText}>{meal.notes}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
              
              <View style={styles.cardFooter}>
                <Text style={[styles.statusText, { color: '#4CAF50' }]}>
                  {dietPlan?.meals?.length} meals total
                </Text>
                <TouchableOpacity onPress={() => setShowAllMeals(false)}>
                  <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Show Less</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background.primary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
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
  errorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#008272',
    marginBottom: 12,
    minWidth: 120,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Header Styles
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
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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

  // Card Styles
  card: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  docName: { fontSize: 16, fontWeight: '700', color: theme.colors.text.primary },
  docSpec: { fontSize: 14, color: theme.colors.text.secondary, marginTop: 2 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6
  },

  // Appointment Card Pattern Styles
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  sub: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  cardContent: {
    marginBottom: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  mealStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  mealsContainer: {
    marginTop: 8,
    paddingBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  
  // Meal Detail Styles
  mealDetailCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  mealDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  mealDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  mealDetailInfo: {
    flex: 1,
  },
  mealDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  mealDetailTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  mealDetailContent: {
    marginTop: 8,
  },
  mealDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  mealDetailDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 8,
  },
  mealDetailNotes: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  mealDetailNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
  },
  mealDetailNotesText: {
    fontSize: 13,
    color: '#5D4037',
    fontStyle: 'italic',
  },
  mealDetailCalorieBadge: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealDetailCalorieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E65100',
  },
  
  // Detail Rows - Professional Design (Legacy)
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
  
  // Meal Item Styles - Using consistent card styling
  mealItem: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  
  // Empty State - Using consistent styling
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: theme.colors.text.secondary,
    lineHeight: 24,
  },

  // New Modern Meal Card Styles
  mealItemNew: {
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  mealHeaderGradient: {
    padding: 12,
    paddingTop: 16,
  },
  dayBadgeNew: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dayTextNew: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mealHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mealTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  mealIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTitleInfo: {
    flex: 1,
  },
  mealNameNew: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    lineHeight: 24,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealTimeNew: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calorieBadgeNew: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 4,
  },
  calorieTextNew: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealContent: {
    padding: 12,
  },
  foodSection: {
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  foodSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008272',
  },
  foodItemsContainer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#008272',
  },
  mealDescriptionNew: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.primary,
  },
  notesSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F59E0B',
  },
  notesContent: {
    paddingLeft: 20,
  },
  noteTextNew: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    color: '#92400E',
  },
});

export default DietPlanScreen;