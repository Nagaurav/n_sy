import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../theme';
import { YogaClass } from '../types/yogaClasses';

type ClassDetailsRouteProp = RouteProp<{ params: { classData: YogaClass } }, 'params'>;

const { width, height } = Dimensions.get('window');

const ClassDetailsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ClassDetailsRouteProp>();
  const { classData } = route.params;

  const [isEnrolling, setIsEnrolling] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

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
        professionalId: classData.professional_id.toString(),
        professionalName: 'Yoga Instructor', // TODO: Fetch actual professional name using professional_id
        serviceType: 'yoga_class',
        yogaPlanId: classData.id,
        serviceName: classData.title,
        price: getSelectedModePrice(),
        date: new Date().toISOString(),
        time: `${formatTime(classData.start_time)} - ${formatTime(classData.end_time)}`,
        days: classData.days,
        duration: classData.duration,
        location: classData.location,
        city: classData.city,
        deliveryMode: selectedMode,
        slot_id: "CLASS_ENROLLMENT",
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
        colors={[theme.colors.primary, theme.colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerContainer}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>CLASS DETAILS</Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.topCircle} />
        <View style={styles.bottomWave} />
      </LinearGradient>

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
        <View style={styles.infoCard}>
          <Text style={styles.classTitle}>{classData.title}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{classData.duration.replace('_', ' ')}</Text>
            </View>
            
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{classData.days}</Text>
            </View>
            
            {classData.city && (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{classData.city}</Text>
              </View>
            )}
            
            {classData.location && (
              <View style={styles.metaItem}>
                <Ionicons name="map-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{classData.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* Schedule Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            <View style={styles.scheduleRow}>
              <View style={styles.scheduleItem}>
                <Ionicons name="calendar-outline" size={20} color="#4CAF50" />
                <Text style={styles.scheduleLabel}>Days</Text>
                <Text style={styles.scheduleValue}>{classData.days}</Text>
              </View>
              
              <View style={styles.scheduleItem}>
                <Ionicons name="time-outline" size={20} color="#4CAF50" />
                <Text style={styles.scheduleLabel}>Time</Text>
                <Text style={styles.scheduleValue}>
                  {formatTime(classData.start_time)} - {formatTime(classData.end_time)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Available Modes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Modes</Text>
            <View style={styles.modesContainer}>
              {getAvailableModes().length > 0 ? (
                getAvailableModes().map((mode, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modeCard,
                      selectedMode === mode.key && styles.modeCardSelected
                    ]}
                    onPress={() => setSelectedMode(mode.key)}
                  >
                    <Ionicons 
                      name={
                        mode.key === 'group_online' ? 'people' :
                        mode.key === 'group_offline' ? 'location' :
                        mode.key === 'one_to_one_online' ? 'videocam' :
                        mode.key === 'one_to_one_offline' ? 'person' :
                        'home'
                      } 
                      size={20} 
                      color={selectedMode === mode.key ? '#4CAF50' : '#999'} 
                      style={styles.modeIcon}
                    />
                    <Text style={[
                      styles.modeTitle,
                      selectedMode === mode.key && styles.modeTitleSelected
                    ]}>{mode.label}</Text>
                    <Text style={[
                      styles.modePrice,
                      selectedMode === mode.key && styles.modePriceSelected
                    ]}>₹{mode.price}/month</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noModesContainer}>
                  <Ionicons name="information-circle-outline" size={24} color="#999" />
                  <Text style={styles.noModesText}>No delivery modes available</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionDivider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Class</Text>
            <Text style={styles.description}>{classData.description}</Text>
            
            {classData.languages && (
              <View style={styles.languagesContainer}>
                <Ionicons name="language-outline" size={16} color="#666" />
                <Text style={styles.languagesText}>Languages: {classData.languages}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Fixed Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.enrollButton, isEnrolling && styles.enrollButtonDisabled]} 
          onPress={handleBookPress}
          disabled={isEnrolling}
        >
          {isEnrolling ? (
            <Text style={styles.enrollButtonText}>Processing...</Text>
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.enrollButtonText}>Enroll Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerContainer: {
    paddingTop: 40,
    paddingBottom: 24,
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
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    letterSpacing: -0.5,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -30,
    right: -30,
  },
  decorativeCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -20,
    left: 20,
  },
  topCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    top: -40,
    left: -40,
  },
  bottomWave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
  },
  heroImageBorder: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  priceBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  priceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  categoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    margin: -20,
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  classTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    lineHeight: 32,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  metaText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  scheduleRow: {
    gap: 16,
  },
  scheduleItem: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleLabel: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    flex: 1,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  modesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  modeCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    minWidth: 140,
    maxWidth: '48%',
    alignItems: 'center',
    flex: 1,
  },
  modeCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  modeIcon: {
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
    marginBottom: 6,
    textAlign: 'center',
  },
  modeTitleSelected: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  modePrice: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'center',
  },
  modePriceSelected: {
    color: '#2e7d32',
    fontWeight: '800',
  },
  noModesContainer: {
    alignItems: 'center',
    padding: 32,
  },
  noModesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666',
    marginBottom: 12,
  },
  languagesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  languagesText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  enrollButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  enrollButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enrollButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default ClassDetailsScreen;
