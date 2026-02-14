import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../types/navigation';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { apiService } from '../services';
import { dietService } from '../services/dietService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { downloadPDFEnhanced, showEnhancedPDFResult } from '../utils/enhancedPDFDownload';
const RNHTMLtoPDF = require('react-native-html-to-pdf');

const { width: screenWidth } = Dimensions.get('window');

// Import the proper DietPlan and MealItem types
import type { DietPlan, MealItem } from '../types/diet';

type DietPlanRouteProp = RouteProp<HomeStackParamList, 'DietPlan'>;
type NavigationProp = StackNavigationProp<HomeStackParamList, 'DietPlan'>;

const DietPlanScreen: React.FC = () => {
  const route = useRoute<DietPlanRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { user, isAuthReady } = useAuth();
  const { bookingId } = route.params;
  
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAllMeals, setShowAllMeals] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const fetchDietPlan = useCallback(async () => {
    if (!bookingId) {
      setError('No booking ID provided');
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setError(null);
      console.log('[DietPlan] Fetching diet plan for bookingId:', bookingId);
      
      // Use dietService to get diet plan by booking ID
      const response = await dietService.getDietPlanByBooking(bookingId);
      
      console.log('[DietPlan] API response:', response);
      
      if (response?.success && response?.data?.data) {
        setDietPlan(response.data.data);
        console.log('[DietPlan] Diet plan loaded successfully');
      } else {
        setError('No diet plan found for this booking. Please contact your nutritionist to get a personalized diet plan.');
        setDietPlan(null);
      }
    } catch (err: any) {
      console.error('[DietPlan] Error fetching diet plan:', err);
      setError(err.message || 'Failed to load diet plan');
      setDietPlan(null);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [bookingId]);

  const handleDownloadPDF = async () => {
    if (!dietPlan) {
      setError('No diet plan available to download');
      return;
    }

    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Diet Plan</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #008272, #4C7360, #2F5233);
              color: white;
              border-radius: 10px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .subtitle {
              font-size: 18px;
              margin-bottom: 5px;
            }
            .section {
              margin-bottom: 25px;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 8px;
              border-left: 4px solid #008272;
            }
            .section-title {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #008272;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              padding: 5px 0;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .meal-item {
              margin-bottom: 20px;
              padding: 15px;
              background-color: white;
              border-radius: 8px;
              border: 1px solid #ddd;
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
            ${dietPlan.meals?.map(meal => `
              <div class="meal-item">
                <div class="meal-header">
                  <div>
                    <div class="meal-name">${meal.name || 'Meal'}</div>
                    <div class="meal-time">${meal.time}</div>
                  </div>
                  ${meal.calories ? `<span class="calories">${meal.calories} cal</span>` : ''}
                </div>
                <div class="meal-details">
                  <div><strong>Food Items:</strong> ${meal.description || 'N/A'}</div>
                                  </div>
              </div>
            `).join('') || '<p>No meals scheduled</p>'}
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008272" />
          <Text style={styles.loadingText}>Loading diet plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !dietPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorCard}>
            <Ionicons name="nutrition-outline" size={48} color="#008272" />
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
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      <LinearGradient 
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>DIET</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleDownloadPDF}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Ionicons name="download-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
              colors={['#008272']}
              tintColor="#008272"
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

                          </View>
            
            <View style={styles.cardFooter}>
              <Text style={[styles.statusText, { color: '#2196F3' }]}>
                {'No target set'}
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
                <Text style={[styles.typeText, { color: '#4CAF50' }]}>MEALS</Text>
              </View>
            </View>
            
            {/* Meal Summary Stats */}
            <View style={styles.mealStatsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color="#FF7043" />
                <Text style={styles.statLabel}>Daily Calories</Text>
                <Text style={styles.statValue}>{'N/A'}</Text>
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
                {dietPlan?.meals?.map((meal: MealItem, index: number) => (
                  <View key={meal.id} style={styles.mealDetailCard}>
                    <View style={styles.mealDetailHeader}>
                      <View style={styles.mealDetailIcon}>
                        <Ionicons name="restaurant-outline" size={16} color="#4CAF50" />
                      </View>
                      <View style={styles.mealDetailInfo}>
                        <Text style={styles.mealDetailName}>
                          {meal.name || 'Meal'}
                        </Text>
                        <Text style={styles.mealDetailTime}>
                          {meal.time}
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
                        {meal.description || 'N/A'}
                      </Text>
                      
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
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED' 
  },
  
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
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: '700',
    letterSpacing: 1,
  },
  
  // Card Styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.m,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12 
  },
  cardFooter: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#eee' 
  },
  statusText: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
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
  instructionsText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  mealStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  },
  mealDetailInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealDetailName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  mealDetailTime: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  mealDetailCalorieBadge: {
    backgroundColor: '#FF7043',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealDetailCalorieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mealDetailContent: {
    marginTop: 8,
  },
  mealDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  mealDetailDescription: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  mealDetailNotes: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  mealDetailNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  mealDetailNotesText: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic',
  },
});

export default DietPlanScreen;
