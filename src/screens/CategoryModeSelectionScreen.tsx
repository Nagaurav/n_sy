import React, { useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import type { RootStackParamList } from '../navigation/constants';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// 🧠 Define types
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface RouteParams {
  category: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

interface Location {
  city: string;
  latitude: number;
  longitude: number;
}

const CategoryModeSelectionScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();
  const { category, categoryName, categoryIcon, categoryColor } = route.params as RouteParams;

  const [loading, setLoading] = useState(false);

  // ✅ Request location permission (Android)
  const requestLocationPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'We need access to your location to show nearby experts.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  // ✅ Get current location
  const getCurrentLocation = (): Promise<Location> =>
    new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          resolve({
            city: 'Unknown City',
            latitude,
            longitude,
          });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });

  // ✅ Unified navigation handler
  const handleModeSelect = async (mode: 'online' | 'offline') => {
    try {
      let userLocation: Location | undefined;
      if (mode === 'offline') {
        setLoading(true);
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          Alert.alert(
            'Location Permission Required',
            'Please enable location permission to use offline mode.'
          );
          setLoading(false);
          return;
        }
        userLocation = await getCurrentLocation();
      }

      navigateToNextScreen(mode, userLocation);
    } catch (err) {
      console.error('Location Error:', err);
      Alert.alert(
        'Location Error',
        'Unable to get your location. Please try again or use online mode.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Centralized category routing
  const navigateToNextScreen = (mode: 'online' | 'offline', location?: Location) => {
    const isClass = category.includes('classes');
    const isConsultation = category.includes('consultation');

    if (isClass) {
      navigation.navigate(ROUTES.PROFESSIONAL_LISTING, {
        category: category.replace('_classes', ''),
        categoryName,
        mode,
        location,
        serviceType: 'classes',
      });
    } else if (isConsultation) {
      navigation.navigate(ROUTES.PROFESSIONAL_LISTING, {
        category: category.replace('_consultation', ''),
        categoryName,
        mode,
        location,
        serviceType: 'consultation',
      });
    } else {
      navigation.navigate(ROUTES.PROFESSIONAL_LISTING, {
        category,
        categoryName,
        mode,
        location,
        serviceType: 'general',
      });
    }
  };

  // ✅ UI Rendering
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Mode</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scrollable content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.categoryInfo}>
          <View style={[styles.categoryIcon, { backgroundColor: categoryColor }]}>
            <MaterialCommunityIcons name={categoryIcon as any} size={32} color={colors.offWhite} />
          </View>
          <Text style={styles.categoryName}>{categoryName}</Text>
          <Text style={styles.categorySubtitle}>Select your preferred mode</Text>
        </View>

        {/* Modes */}
        <View style={styles.modes}>
          {/* Online */}
          <TouchableOpacity
            style={[styles.modeCard, styles.online]}
            onPress={() => handleModeSelect('online')}
            disabled={loading}
          >
            <MaterialCommunityIcons name="video" size={36} color={colors.primaryGreen} />
            <Text style={styles.modeTitle}>Online</Text>
            <Text style={styles.modeText}>Connect from anywhere via video, audio, or chat.</Text>
          </TouchableOpacity>

          {/* Offline */}
          <TouchableOpacity
            style={[styles.modeCard, styles.offline]}
            onPress={() => handleModeSelect('offline')}
            disabled={loading}
          >
            <MaterialCommunityIcons name="map-marker" size={36} color={colors.accentOrange} />
            <Text style={styles.modeTitle}>Offline</Text>
            <Text style={styles.modeText}>Find nearby professionals for in-person sessions.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.overlay}>
          <View style={styles.overlayBox}>
            <ActivityIndicator size="large" color={colors.primaryGreen} />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// 💅 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.primaryText },
  scrollContent: { paddingVertical: 24, paddingHorizontal: 20 },
  categoryInfo: { alignItems: 'center', marginBottom: 32 },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: { fontSize: 24, fontWeight: '700', color: colors.primaryText },
  categorySubtitle: { fontSize: 15, color: colors.secondaryText, marginTop: 4 },
  modes: { gap: 20 },
  modeCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  online: { borderLeftWidth: 4, borderLeftColor: colors.primaryGreen },
  offline: { borderLeftWidth: 4, borderLeftColor: colors.accentOrange },
  modeTitle: { fontSize: 20, fontWeight: '700', color: colors.primaryText, marginTop: 12 },
  modeText: { textAlign: 'center', color: colors.secondaryText, fontSize: 14, marginTop: 8 },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBox: {
    backgroundColor: colors.offWhite,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  loadingText: { color: colors.primaryText, marginTop: 10, fontWeight: '600' },
});

export default CategoryModeSelectionScreen;
