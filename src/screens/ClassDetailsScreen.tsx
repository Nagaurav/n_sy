import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Dimensions,
  Alert,
  Share,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { YogaClass } from '../types/yogaClasses';
import { formatDisplayDate, formatDisplayTime, formatSlotTimeRange } from '../utils/dateUtils';
import { professionalService } from '../services/professionalService';

type ClassDetailsRouteProp = RouteProp<{ params: { classData: YogaClass } }, 'params'>;

const { width, height } = Dimensions.get('window');

const ClassDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { classData } = route.params;
  const { theme: appTheme } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [professionalName, setProfessionalName] = useState<string>('Yoga Instructor');
  const [loadingProfessional, setLoadingProfessional] = useState(false);

  // Start animations when component mounts
  useEffect(() => {
    // Start with a subtle entrance animation
    const animateContent = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    };

    // Shimmer effect for hero image (delayed start)
    setTimeout(() => {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
    }, 1000);

    // Pulse animation for CTA (only when no mode selected)
    if (!selectedMode) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
    }
  }, [selectedMode]);

  // Helper function to get mode icons
  const getModeIcon = (mode: string) => {
    const iconMap: Record<string, string> = {
      'group_online': 'people-outline',
      'group_offline': 'people',
      'one_to_one_online': 'videocam-outline',
      'one_to_one_offline': 'person-outline',
      'home_visit': 'home-outline',
    };
    return iconMap[mode] || 'fitness-outline';
  };

  // Get available delivery modes
  const getAvailableModes = useCallback(() => {
    const modes = [];
    if (classData.group_online && classData.price_group_online) {
      modes.push({ key: 'group_online', label: 'Group Online', price: classData.price_group_online });
    }
    if (classData.group_offline && classData.price_group_offline) {
      modes.push({ key: 'group_offline', label: 'Group In-Person', price: classData.price_group_offline });
    }
    if (classData.one_to_one_online && classData.price_one_to_one_online) {
      modes.push({ key: 'one_to_one_online', label: '1:1 Online', price: classData.price_one_to_one_online });
    }
    if (classData.one_to_one_offline && classData.price_one_to_one_offline) {
      modes.push({ key: 'one_to_one_offline', label: '1:1 In-Person', price: classData.price_one_to_one_offline });
    }
    if (classData.home_visit && classData.price_home_visit) {
      modes.push({ key: 'home_visit', label: 'Home Visit', price: classData.price_home_visit });
    }
    return modes;
  }, [classData]);

  // Get dynamic features based on class data
  const getClassFeatures = useCallback(() => {
    const features = [];
    
    // Group sessions feature
    if (classData.group_online || classData.group_offline) {
      features.push({
        icon: 'people',
        title: 'Group Sessions',
        description: 'Learn with others in a supportive environment',
        available: true
      });
    }
    
    // Personal attention feature
    if (classData.one_to_one_online || classData.one_to_one_offline) {
      features.push({
        icon: 'person',
        title: 'Personal Attention',
        description: 'Get individualized guidance from experts',
        available: true
      });
    }
    
    // Home visit feature
    if (classData.home_visit) {
      features.push({
        icon: 'home',
        title: 'Home Visits',
        description: 'Expert guidance at your convenience',
        available: true
      });
    }
    
    // Disease-specific feature
    if (classData.is_disease_specific && classData.disease) {
      features.push({
        icon: 'heart',
        title: 'Specialized Care',
        description: `Focused on ${classData.disease} management`,
        available: true
      });
    }
    
    // Flexible timing feature
    if (classData.allow_mid_month_entry) {
      features.push({
        icon: 'calendar',
        title: 'Flexible Entry',
        description: 'Join anytime during the month',
        available: true
      });
    }
    
    // Location-based feature
    if (classData.location || classData.city) {
      features.push({
        icon: 'location',
        title: 'Center-based',
        description: classData.city || 'Physical location available',
        available: true
      });
    }
    
    // Progress tracking (always available)
    if (features.length < 3) {
      features.push({
        icon: 'trophy',
        title: 'Progress Tracking',
        description: 'Monitor your improvement over time',
        available: true
      });
    }
    
    return features.slice(0, 3); // Limit to 3 features
  }, [classData]);

  // Get effective price
  const getEffectivePrice = useCallback(() => {
    if (classData.effective_price) return classData.effective_price;
    
    const prices = [
      classData.price_group_online,
      classData.price_group_offline,
      classData.price_one_to_one_online,
      classData.price_one_to_one_offline,
      classData.price_home_visit,
    ].filter(p => p !== null && p > 0) as number[];
    
    return prices.length > 0 ? Math.min(...prices) : 0;
  }, [classData]);

  // Get price for selected mode
  const getSelectedModePrice = useCallback(() => {
    if (!selectedMode) return getEffectivePrice();
    
    const modePrices = {
      'group_online': classData.price_group_online,
      'group_offline': classData.price_group_offline,
      'one_to_one_online': classData.price_one_to_one_online,
      'one_to_one_offline': classData.price_one_to_one_offline,
      'home_visit': classData.price_home_visit,
    };
    
    return modePrices[selectedMode as keyof typeof modePrices] || getEffectivePrice();
  }, [selectedMode, classData, getEffectivePrice]);

  // Add debugging after function declarations
  useEffect(() => {
    console.log('📋 ClassDetailsScreen received classData:', classData);
    console.log('📊 Available modes:', getAvailableModes());
    console.log('💰 Effective price:', getEffectivePrice());
  }, [classData]);

  // Fetch professional name
  useEffect(() => {
    const fetchProfessionalName = async () => {
      if (!classData.professional_id) return;
      
      setLoadingProfessional(true);
      try {
        const result = await professionalService.getProfile(classData.professional_id);
        if (result.success && result.data) {
          setProfessionalName(`${result.data.first_name} ${result.data.last_name}`);
        }
      } catch (error) {
        console.error('Failed to fetch professional name:', error);
      } finally {
        setLoadingProfessional(false);
      }
    };

    fetchProfessionalName();
  }, [classData.professional_id]);

  // Format time
  const formatTime = useCallback((timeString: string) => {
    try {
      // Handle ISO string format
      const date = new Date(timeString);
      if (isNaN(date.getTime())) {
        // If it's not a valid date, return the original string
        return timeString;
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timeString;
    }
  }, []);

  // Handle share
  const handleShare = useCallback(async () => {
    try {
      const shareMessage = `🧘‍♀️ ${classData.title}\n\n💰 Starting from ₹${getEffectivePrice()}/month\n📅 ${classData.days}\n⏰ ${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}\n\n${classData.description}\n\nBooked via Samyayog App!`;
      
      await Share.share({
        message: shareMessage,
        title: 'Yoga Class Details'
      });
    } catch (error) {
      console.error('Error sharing class:', error);
    }
  }, [classData, getEffectivePrice, formatTime]);

  // Handle enrollment
  const handleBookPress = useCallback(() => {
    if (!selectedMode) {
      Alert.alert(
        'Select Mode',
        'Please select a delivery mode before proceeding to enrollment.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsEnrolling(true);
    
    // Navigate to booking with class data and selected mode
    navigation.navigate('BookingConfirmationScreen', {
      bookingData: {
        // 🟢 Critical Flags
        serviceType: 'yoga_class',
        yogaPlanId: classData.id, 
        
        // Display Data
        professionalId: classData.professional_id,
        professionalName: professionalName, // Now fetched from API
        serviceName: classData.title, // e.g. "Morning Hatha Yoga"
        price: getSelectedModePrice(),     // Calculated based on mode selection
        date: new Date().toISOString(), // Starts "Now" or logic based on start_date
        time: `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`,
        
        // Logic Data - Convert to uppercase to match backend enum
        deliveryMode: selectedMode?.toUpperCase() // e.g. 'GROUP_ONLINE', 'HOME_VISIT'
      }
    });
    
    setTimeout(() => setIsEnrolling(false), 1000);
  }, [classData, selectedMode, getSelectedModePrice, formatTime, navigation]);

  const imageUrl = classData.location 
    ? 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800' 
    : 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header - Matching ProfessionalHomeHeader */}
      <LinearGradient 
        colors={['#008272', '#4C7360', '#2F5233']}
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
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              Class Details
            </Text>
            <Text style={styles.headerSubtitle}>
              Yoga program information
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* Hero Image Card with Premium Effects */}
        <View style={[
          styles.card,
          styles.heroCard
        ]}>
          <View style={styles.heroContainer}>
            <ImageBackground source={{ uri: imageUrl }} style={styles.heroImage} imageStyle={styles.heroImageBorder}>
              <View style={styles.heroOverlay}>
                {classData.is_disease_specific && classData.disease && (
                  <View style={styles.categoryBadge}>
                    <Ionicons name="heart-outline" size={14} color="#FFFFFF" style={styles.badgeIcon} />
                    <Text style={styles.categoryBadgeText}>{classData.disease}</Text>
                  </View>
                )}
              </View>
            </ImageBackground>
          </View>
        </View>

        {/* Premium Class Info Card */}
        <View style={[
          styles.card,
          styles.premiumCard
        ]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#008272', '#4C7360']}
                style={styles.iconGradient}
              >
                <Ionicons name="fitness" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardHeaderTitle}>{classData.title || 'Yoga Class'}</Text>
              <Text style={styles.cardHeaderSubtitle}>Transformative Yoga Program</Text>
            </View>
          </View>
          
          <View style={styles.classDetailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time-outline" size={14} color="#008272" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{classData.duration ? classData.duration.replace('_', ' ') : '60 minutes'}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar-outline" size={14} color="#008272" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Class Type</Text>
                  <Text style={styles.detailValue}>{classData.is_disease_specific ? 'Specialized' : 'General'}</Text>
                </View>
              </View>
            </View>
            
            {classData.city && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="location-outline" size={14} color="#008272" />
                  </View>
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{classData.city || 'Online'}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Enhanced Schedule Card */}
        <View style={[
          styles.card,
          styles.scheduleCard
        ]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#4C7360', '#2F5233']}
                style={styles.iconGradient}
              >
                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardHeaderTitle}>Schedule Information</Text>
              <Text style={styles.cardHeaderSubtitle}>Class timing & availability</Text>
            </View>
          </View>
          
          <View style={styles.classDetailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="calendar-outline" size={14} color="#4C7360" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Days</Text>
                  <Text style={styles.detailValue}>{classData.days || 'Mon, Wed, Fri'}</Text>
                </View>
              </View>
              
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="time-outline" size={14} color="#4C7360" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {formatSlotTimeRange(classData.start_time, classData.end_time)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Description Card */}
        <View style={[
          styles.card,
          styles.descriptionCard
        ]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#4C7360', '#2F5233']}
                style={styles.iconGradient}
              >
                <Ionicons name="information-circle-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardHeaderTitle}>About This Class</Text>
              <Text style={styles.cardHeaderSubtitle}>Discover the journey</Text>
            </View>
          </View>
          
          <Text style={styles.descriptionText}>{classData.description}</Text>
          
          {/* Enhanced Features Grid */}
          <View style={styles.featuresGrid}>
            {getClassFeatures().map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon} size={14} color="#008272" />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
          
          <View style={styles.languagesContainer}>
            <View style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name="language-outline" size={14} color="#008272" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.featureTitle}>Languages</Text>
                <Text style={styles.featureDescription}>{classData.languages || 'English'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Premium Mode Selection Card */}
        <View style={[
          styles.card,
          styles.modesCard
        ]}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={['#008272', '#4C7360']}
                style={styles.iconGradient}
              >
                <Ionicons name="fitness" size={20} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.cardHeaderTitle}>Choose Your Mode</Text>
              <Text style={styles.cardHeaderSubtitle}>Select your preferred learning style</Text>
            </View>
          </View>
          
          {getAvailableModes().length > 0 ? (
            <View style={styles.modesGrid}>
              {getAvailableModes().map((mode, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.modeCard,
                    selectedMode === mode.key && styles.modeCardSelected,
                    {
                      transform: [
                        {
                          scale: selectedMode === mode.key 
                            ? scaleAnim.interpolate({
                                inputRange: [0.95, 1],
                                outputRange: [1.02, 1],
                              })
                            : 1
                        }
                      ]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.modeCardInner}
                    onPress={() => setSelectedMode(mode.key)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.modeIcon}>
                      <Ionicons 
                        name={getModeIcon(mode.key)} 
                        size={14} 
                        color={selectedMode === mode.key ? '#008272' : '#6B7280'} 
                      />
                    </View>
                    <Text style={[
                      styles.modeCardTitle,
                      selectedMode === mode.key && { color: '#008272' }
                    ]}>{mode.label}</Text>
                    <View style={styles.priceContainer}>
                      <Text style={[
                        styles.modeCardPrice,
                        selectedMode === mode.key && { color: '#008272' }
                      ]}>₹{mode.price}</Text>
                      <Text style={styles.pricePeriod}>/month</Text>
                    </View>
                    {selectedMode === mode.key && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={16} color="#008272" />
                      </View>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.noModesContainer}>
              <Ionicons name="alert-circle-outline" size={40} color="#6B7280" />
              <Text style={styles.noModesText}>No modes available</Text>
              <Text style={styles.noModesSubtext}>Please check back later</Text>
            </View>
          )}
        </View>
      </ScrollView>
      {/* Footer - Premium Design with Pulse Animation */}
      <Animated.View style={[
        styles.footer,
        {
          transform: [{ scale: !selectedMode ? pulseAnim : 1 }]
        }
      ]}>
        <TouchableOpacity
          style={[
            styles.enrollButton,
            !selectedMode && styles.enrollButtonDisabled
          ]}
          onPress={handleBookPress}
          disabled={!selectedMode || isEnrolling}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={!selectedMode ? ['#6B7280', '#9CA3AF'] : ['#008272', '#4C7360']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              {isEnrolling ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
              )}
              <Text style={styles.enrollButtonText}>
                {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED'
  },
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 120,
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Premium Card Styles
  card: { 
    width: '100%',
    backgroundColor: theme.colors.background.surface,
    borderRadius: 16,
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
  },
  heroCard: {
    marginBottom: theme.spacing.l,
    shadowColor: '#008272',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  premiumCard: {
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  scheduleCard: {
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
    marginBottom: theme.spacing.xl,
  },
  descriptionCard: {
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },
  modesCard: {
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    ...theme.shadows.card,
  },

  // Hero Image Styles
  heroContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroImageBorder: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-15deg' }],
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    padding: 16,
  },
  heroTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  heroBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 130, 114, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeIcon: {
    marginRight: 6,
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  difficultyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  difficultyText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Card Header Styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.l,
    paddingLeft: theme.spacing.s,
    paddingTop: theme.spacing.s,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
    marginLeft: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  serviceTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  serviceTypeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: '#FFFFFF',
  },

  // Enhanced Details Styles
  classDetailsContainer: {
    paddingTop: theme.spacing.l,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.s,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.m,
    gap: theme.spacing.m,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFB',
    padding: theme.spacing.m,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    minHeight: 60,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A202C',
  },

  // Enhanced Schedule Styles
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.s,
  },
  scheduleInfoCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    padding: theme.spacing.s,
    marginHorizontal: 0,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    backgroundColor: '#F8FAFB',
  },
  scheduleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  scheduleLabel: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontWeight: '500',
    textAlign: 'center',
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Enhanced Features Grid Styles
  featuresGrid: {
    flexDirection: 'column',
    gap: theme.spacing.s,
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFB',
    padding: theme.spacing.s,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
  },
  featureIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.s,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    flex: 1,
  },
  featureDescription: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 14,
  },

  // Enhanced Description Styles
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },
  languagesContainer: {
    flexDirection: 'column',
    gap: theme.spacing.s,
    marginTop: theme.spacing.s,
    marginBottom: theme.spacing.m,
    paddingHorizontal: theme.spacing.s,
  },

  // Premium Mode Selection Styles
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.l,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingHorizontal: theme.spacing.s,
  },
  modeCard: {
    width: '48%',
    backgroundColor: '#F8FAFB',
    padding: theme.spacing.s,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
    marginBottom: 8,
    minHeight: 100,
  },
  modeCardSelected: {
    borderColor: '#008272',
    backgroundColor: '#F0FDF4',
  },
  modeCardInner: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  modeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
  },
  modeCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  modeCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#008272',
  },
  pricePeriod: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 1,
  },
  noModesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noModesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginTop: theme.spacing.s,
    fontWeight: '600',
  },
  noModesSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // Footer Styles
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  enrollButton: { 
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#008272',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    alignSelf: 'stretch',
  },
  enrollButtonDisabled: {
    elevation: 0,
    shadowOpacity: 0,
    shadowColor: 'transparent',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: 16,
    minHeight: 56,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  enrollButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default ClassDetailsScreen;
