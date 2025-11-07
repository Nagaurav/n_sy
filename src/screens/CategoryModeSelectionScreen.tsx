// CategoryModeSelectionScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Geolocation from '@react-native-community/geolocation';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';

interface Location {
  city: string;
  latitude: number;
  longitude: number;
}

const CategoryModeSelectionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { category, categoryName, categoryIcon, categoryColor } = route.params as {
    category: string;
    categoryName: string;
    categoryIcon: string;
    categoryColor: string;
  };

  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);

  // Request location permission for Android
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to find nearby services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Get current location
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // For now, we'll use a default city. In a real app, you'd reverse geocode the coordinates
          const location: Location = {
            city: 'Mumbai', // This should be reverse geocoded
            latitude,
            longitude,
          };
          resolve(location);
        },
        (error) => {
          console.error('Error getting location:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  // Handle offline mode selection
  const handleOfflineMode = async () => {
    setLoading(true);
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Permission Required',
          'Please enable location permission to find nearby services.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => {/* Navigate to settings */} },
          ]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await getCurrentLocation();
      setLocation(currentLocation);
      
      // Navigate based on category
      navigateToCategoryListing('offline', currentLocation);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please try again or select online mode.',
        [
          { text: 'Try Again', onPress: () => handleOfflineMode() },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle online mode selection
  const handleOnlineMode = () => {
    navigateToCategoryListing('online');
  };

  // Navigate to appropriate category listing
  const navigateToCategoryListing = (mode: 'online' | 'offline', location?: Location) => {
    if (category.endsWith('_classes')) {
      // For yoga classes, navigate to unified yoga selection
      if (category === 'yoga_classes') {
        navigation.navigate(ROUTES.YOGA_SELECTION as never, {
          mode,
          location,
        } as never);
      } else {
        // For other categories with classes, use generic professional listing
        navigation.navigate(ROUTES.PROFESSIONAL_LISTING as never, {
          category: category.replace('_classes', ''),
          mode,
          location,
          serviceType: 'classes',
        } as never);
      }
    } else if (category.endsWith('_consultation')) {
      // For consultations, navigate to consultation booking
      if (category === 'yoga_consultation') {
        navigation.navigate(ROUTES.CONSULTATION_BOOKING as never, {
          professional: null, // Will be selected in consultation booking screen
        } as never);
      } else {
        // For other categories with consultation, use generic professional listing
        navigation.navigate(ROUTES.PROFESSIONAL_LISTING as never, {
          category: category.replace('_consultation', ''),
          mode,
          location,
          serviceType: 'consultation',
        } as never);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Mode</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Info */}
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={32} color={colors.offWhite} />
          </View>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>
            Select your preferred mode to continue
          </Text>
        </View>

        {/* Mode Selection */}
        <View style={styles.modeContainer}>
          {/* Online Mode */}
          <TouchableOpacity
            style={[styles.modeCard, styles.onlineCard]}
            onPress={handleOnlineMode}
            disabled={loading}
          >
            <View style={styles.modeIconContainer}>
              <MaterialCommunityIcons name="video" size={32} color={colors.primaryGreen} />
            </View>
            <Text style={styles.modeTitle}>Online</Text>
            <Text style={styles.modeDescription}>
              Connect with professionals from anywhere via video call, audio call, or chat
            </Text>
            <View style={styles.modeFeatures}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryGreen} />
                <Text style={styles.featureText}>Video/Audio calls</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryGreen} />
                <Text style={styles.featureText}>Chat support</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.primaryGreen} />
                <Text style={styles.featureText}>No travel required</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Offline Mode */}
          <TouchableOpacity
            style={[styles.modeCard, styles.offlineCard]}
            onPress={handleOfflineMode}
            disabled={loading}
          >
            <View style={styles.modeIconContainer}>
              <MaterialCommunityIcons name="map-marker" size={32} color={colors.accentOrange} />
            </View>
            <Text style={styles.modeTitle}>Offline</Text>
            <Text style={styles.modeDescription}>
              Find nearby professionals for in-person sessions at their location or yours
            </Text>
            <View style={styles.modeFeatures}>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentOrange} />
                <Text style={styles.featureText}>In-person sessions</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentOrange} />
                <Text style={styles.featureText}>Home visits</Text>
              </View>
              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color={colors.accentOrange} />
                <Text style={styles.featureText}>Studio sessions</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <MaterialCommunityIcons name="map-marker" size={32} color={colors.primaryGreen} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoryInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginBottom: 8,
  },
  categorySubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
  },
  modeContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  modeCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  onlineCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primaryGreen,
  },
  offlineCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accentOrange,
  },
  modeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.lightSage,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: colors.secondaryText,
    lineHeight: 20,
    marginBottom: 16,
  },
  modeFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    color: colors.primaryText,
    fontWeight: '500' as const,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primaryText,
    fontWeight: '600' as const,
  },
});

export default CategoryModeSelectionScreen;
