import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services';
import { FAQ } from '../types/support';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import CollapsibleCard from '../components/CollapsibleCard';

const FaqScreen = () => {
  const navigation = useNavigation();
  const { theme: themeHook } = useTheme();
  const appTheme = themeHook || theme;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const [faqData, setFaqData] = useState<Record<string, FAQ[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Start entrance animation
  useEffect(() => {
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
  }, []);

  // Fetch FAQs from API
  const fetchFaqs = async () => {
    try {
      setError(null);
      const response = await apiService.getFaqs();
      
      if (response.success && response.data?.data) {
        // Group FAQs by category
        const grouped = response.data.data.reduce((acc: Record<string, FAQ[]>, faq: FAQ) => {
          const category = faq.category || 'General';
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(faq);
          return acc;
        }, {});
        
        setFaqData(grouped);
      } else {
        throw new Error('Failed to fetch FAQs');
      }
    } catch (err: any) {
      console.error('Error fetching FAQs:', err);
      setError(err.message || 'Failed to load FAQs. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load FAQs on component mount
  useEffect(() => {
    fetchFaqs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFaqs();
  };

  // Helper function to get category icons
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'general':
        return 'help-outline';
      case 'service':
      case 'services':
        return 'fitness-outline';
      case 'booking':
        return 'calendar-outline';
      case 'payment':
      case 'payments':
        return 'card-outline';
      case 'billing':
        return 'receipt-outline';
      case 'account':
      case 'account management':
        return 'person-outline';
      case 'support':
        return 'headset-outline';
      case 'technical':
        return 'settings-outline';
      case 'health':
        return 'heart-outline';
      default:
        return 'help-outline';
    }
  };

  const openDrawer = () => {
    console.log('🔵 Opening drawer from FAQ...');
    navigation.dispatch(DrawerActions.openDrawer());
  };

  // Reusable FAQ Item Component
  const renderFaqItem = (faq: FAQ) => (
    <Animated.View
      key={faq.id}
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <CollapsibleCard
        title={faq.question}
        content={<Text style={styles.faqAnswer}>{faq.answer}</Text>}
        containerStyle={styles.faqCard}
        themeColors={appTheme}
      />
    </Animated.View>
  );

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
        
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
            colors={[appTheme.colors.primary, appTheme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
            
            <View style={styles.headerContent}>
              <TouchableOpacity 
                onPress={openDrawer}
                style={styles.menuButton}
                activeOpacity={0.7}
              >
                <Ionicons name="menu" size={24} color={appTheme.colors.background.surface} />
              </TouchableOpacity>
              
              <View style={styles.titleContainer}>
                <Text style={styles.headerTitle}>FAQ</Text>
                <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
              </View>
              
              <View style={styles.placeholder} />
            </View>
            
            {/* Decorative elements */}
            <View style={styles.topCircle} />
            <View style={styles.bottomWave} />
          </LinearGradient>
        </Animated.View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appTheme.colors.primary} />
          <Text style={styles.loadingText}>Loading FAQs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
      
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
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <StatusBar backgroundColor={appTheme.colors.primary} barStyle="light-content" />
          
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={openDrawer}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color={appTheme.colors.background.surface} />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>FAQ</Text>
              <Text style={styles.headerSubtitle}>Find answers to common questions</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
          
          {/* Decorative elements */}
          <View style={styles.topCircle} />
          <View style={styles.bottomWave} />
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[appTheme.colors.primary]}
            tintColor={appTheme.colors.primary}
          />
        }
      >
        {error ? (
          <Animated.View 
            style={[
              styles.errorContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={48} color={appTheme.colors.feedback.error} />
            </View>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: appTheme.colors.primary }]} 
              onPress={fetchFaqs}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={18} color={appTheme.colors.background.surface} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : Object.keys(faqData).length === 0 ? (
          <Animated.View 
            style={[
              styles.emptyContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.emptyIconContainer}>
              <Ionicons name="help-circle-outline" size={64} color={appTheme.colors.text.secondary} />
            </View>
            <Text style={styles.emptyTitle}>No FAQs Available</Text>
            <Text style={styles.emptySubtitle}>Check back later for updates</Text>
          </Animated.View>
        ) : (
          Object.entries(faqData).map(([category, faqs], categoryIndex) => (
            <Animated.View 
              key={category}
              style={[
                styles.categorySection,
                {
                  opacity: fadeAnim,
                  transform: [{ 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 0],
                    })
                  }],
                },
              ]}
            >
              <View style={styles.categoryHeader}>
                <View style={[styles.categoryIconContainer, { backgroundColor: appTheme.colors.primary + '20' }]}>
                  <Ionicons 
                    name={getCategoryIcon(category)} 
                    size={20} 
                    color={appTheme.colors.primary} 
                  />
                </View>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{faqs.length}</Text>
                </View>
              </View>
              {faqs.map(renderFaqItem)}
            </Animated.View>
          ))
        )}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  
  // Header Styles
  headerWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  header: {
    paddingTop: 40,
    paddingBottom: theme.spacing.l,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    width: 44,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 1,
  },
  // Decorative elements
  topCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -60,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: -30,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  
  // Content Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.m,
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: theme.spacing.m,
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  
  // Error State
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    marginBottom: theme.spacing.m,
  },
  errorText: {
    ...theme.typography.body,
    fontSize: 14,
    color: theme.colors.feedback.error,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.m,
    gap: theme.spacing.xs,
    ...theme.shadows.card,
  },
  retryButtonText: {
    ...theme.typography.body,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.background.surface,
  },
  
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    marginBottom: theme.spacing.m,
  },
  emptyTitle: {
    ...theme.typography.h3,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.s,
  },
  emptySubtitle: {
    ...theme.typography.small,
    fontSize: 13,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  
  // Category Section
  categorySection: {
    marginBottom: theme.spacing.xl,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  categoryTitle: {
    flex: 1,
    ...theme.typography.h2,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    letterSpacing: -0.5,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.xl,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  
  // FAQ Card
  faqCard: {
    marginBottom: theme.spacing.m,
    marginHorizontal: theme.spacing.s,
  },
  faqAnswer: {
    ...theme.typography.small,
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  
  // Bottom spacer
  bottomSpacer: {
    height: theme.spacing.xxl,
  },
});

export default FaqScreen;
