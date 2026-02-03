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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { theme } from '../theme';
import { YogaClass } from '../types/yogaClasses';
import { formatDisplayDate, formatDisplayTime, formatSlotTimeRange } from '../utils/dateUtils';

type ClassDetailsRouteProp = RouteProp<{ params: { classData: YogaClass } }, 'params'>;

const { width, height } = Dimensions.get('window');

const ClassDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { classData } = route.params;
  const { theme: appTheme } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  // Start animations when component mounts
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
    navigation.navigate('BookingConfirmation', {
      bookingData: {
        // 🟢 Critical Flags
        serviceType: 'yoga_class',
        yogaPlanId: classData.id, 
        
        // Display Data
        professionalId: classData.professional_id,
        professionalName: 'Yoga Instructor', // TODO: Fetch professional name using professional_id
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
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Modern Header */}
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
            <Ionicons name="arrow-back" size={24} color={appTheme.colors.background.surface} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>Class Details</Text>
            <Text style={styles.headerSubtitle}>Yoga Program Information</Text>
          </View>
          
          <TouchableOpacity 
            onPress={handleShare}
            style={styles.shareButton}
            activeOpacity={0.7}
          >
            <Ionicons name="share-outline" size={24} color={appTheme.colors.background.surface} />
          </TouchableOpacity>
        </View>
        
        {/* Decorative elements */}
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Hero Image */}
          <ImageBackground source={{ uri: imageUrl }} style={styles.heroImage} imageStyle={styles.heroImageBorder}>
            <View style={styles.heroOverlay}>
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>₹{getEffectivePrice()}/month</Text>
              </View>
              
              {classData.is_disease_specific && classData.disease && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{classData.disease}</Text>
                </View>
              )}
            </View>
          </ImageBackground>

          {/* Class Info Card */}
          <Animated.View style={[
            styles.infoCard,
            appTheme.shadows.card,
            { borderLeftColor: appTheme.colors.primary, borderLeftWidth: 5 }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.classTitle}>{classData.title}</Text>
              <View style={[styles.typeBadge, { backgroundColor: appTheme.colors.primary + '20' }]}>
                <Ionicons name="fitness" size={14} color={appTheme.colors.primary} />
                <Text style={[styles.typeText, { color: appTheme.colors.primary }]}>YOGA</Text>
              </View>
            </View>
            
            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={appTheme.colors.primary} />
                <Text style={styles.metaText}>{classData.duration.replace('_', ' ')}</Text>
              </View>
              
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={16} color={appTheme.colors.primary} />
                <Text style={styles.metaText}>{classData.days}</Text>
              </View>
              
              {classData.city && (
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={16} color={appTheme.colors.primary} />
                  <Text style={styles.metaText}>{classData.city}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Schedule Card */}
          <Animated.View style={[
            styles.infoCard,
            appTheme.shadows.card,
            { borderLeftColor: appTheme.colors.secondary, borderLeftWidth: 5 }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Schedule Information</Text>
              <View style={[styles.typeBadge, { backgroundColor: appTheme.colors.secondary + '20' }]}>
                <Ionicons name="calendar-outline" size={14} color={appTheme.colors.secondary} />
                <Text style={[styles.typeText, { color: appTheme.colors.secondary }]}>SCHEDULE</Text>
              </View>
            </View>
            
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Ionicons name="calendar-outline" size={20} color={appTheme.colors.secondary} />
                <Text style={styles.scheduleLabel}>Days</Text>
                <Text style={styles.scheduleValue}>{classData.days}</Text>
              </View>
              
              <View style={styles.scheduleItem}>
                <Ionicons name="time-outline" size={20} color={appTheme.colors.secondary} />
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {formatSlotTimeRange(classData.start_time, classData.end_time)}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Description Card */}
          <Animated.View style={[
            styles.descriptionCard,
            appTheme.shadows.card,
            { borderLeftColor: appTheme.colors.secondary, borderLeftWidth: 5 }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>About This Class</Text>
              <View style={[styles.typeBadge, { backgroundColor: appTheme.colors.secondary + '20' }]}>
                <Ionicons name="information-circle-outline" size={14} color={appTheme.colors.secondary} />
                <Text style={[styles.typeText, { color: appTheme.colors.secondary }]}>INFO</Text>
              </View>
            </View>
            
            <Text style={styles.descriptionText}>{classData.description}</Text>
            
            {classData.languages && (
              <View style={styles.languagesContainer}>
                <Ionicons name="language-outline" size={16} color={appTheme.colors.primary} />
                <Text style={styles.metaText}>Languages: {classData.languages}</Text>
              </View>
            )}
          </Animated.View>

          {/* Available Modes Card */}
          <Animated.View style={[
            styles.modesCard,
            appTheme.shadows.card,
            { borderLeftColor: appTheme.colors.primary, borderLeftWidth: 5 }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.modesTitle}>Available Modes</Text>
              <View style={[styles.typeBadge, { backgroundColor: appTheme.colors.primary + '20' }]}>
                <Ionicons name="fitness" size={14} color={appTheme.colors.primary} />
                <Text style={[styles.typeText, { color: appTheme.colors.primary }]}>MODES</Text>
              </View>
            </View>
            
            {getAvailableModes().length > 0 ? (
              <View style={styles.modesGrid}>
                {getAvailableModes().map((mode, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modeCard,
                      selectedMode === mode.key && styles.modeCardSelected
                    ]}
                    onPress={() => setSelectedMode(mode.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.modeCardTitle,
                      selectedMode === mode.key && { color: appTheme.colors.primary }
                    ]}>{mode.label}</Text>
                    <Text style={[
                      styles.modeCardPrice,
                      selectedMode === mode.key && { color: appTheme.colors.primary }
                    ]}>₹{mode.price}/month</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noModesContainer}>
                <Text style={styles.noModesText}>No modes available</Text>
              </View>
            )}
          </Animated.View>

          {/* Enroll Button */}
          <TouchableOpacity
            style={[
              styles.enrollButton,
              !selectedMode && styles.enrollButtonDisabled
            ]}
            onPress={handleBookPress}
            disabled={!selectedMode || isEnrolling}
            activeOpacity={0.8}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={20} 
              color="#fff" 
              style={styles.buttonIcon}
            />
            <Text style={styles.enrollButtonText}>
              {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background.primary 
  },
  header: { 
    paddingTop: 50,
    paddingBottom: 24,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroImageBorder: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  priceBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: '#FF6B6B',
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
  infoCard: {
    backgroundColor: theme.colors.background.surface,
    margin: 16,
    borderRadius: theme.borderRadius.l,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  classTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    flex: 1,
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  descriptionCard: {
    backgroundColor: theme.colors.background.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    borderLeftColor: theme.colors.secondary,
    borderLeftWidth: 5,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
  },
  modesCard: {
    backgroundColor: theme.colors.background.surface,
    margin: 16,
    marginTop: 0,
    borderRadius: theme.borderRadius.l,
    padding: 16,
    borderLeftColor: theme.colors.primary,
    borderLeftWidth: 5,
  },
  modesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  modeCard: {
    width: '48%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.m,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modeCardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  noModesContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noModesText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  enrollButton: {
    backgroundColor: theme.colors.primary,
    margin: 16,
    marginTop: 0,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.l,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  enrollButtonDisabled: {
    backgroundColor: theme.colors.text.secondary,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ClassDetailsScreen;
