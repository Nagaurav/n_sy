// LocationSelector.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';

interface LocationSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: { city: string; latitude?: number; longitude?: number }) => void;
  currentLocation?: { city: string; latitude?: number; longitude?: number };
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  visible,
  onClose,
  onLocationSelect,
  currentLocation,
}) => {
  const [manualCity, setManualCity] = useState(currentLocation?.city || '');
  const [isLoadingGPS, setIsLoadingGPS] = useState(false);

  const handleManualSubmit = () => {
    if (!manualCity.trim()) {
      Alert.alert('City Required', 'Please enter a city name');
      return;
    }
    
    onLocationSelect({
      city: manualCity.trim(),
      latitude: undefined,
      longitude: undefined,
    });
    onClose();
  };

  const handleGPSLocation = async () => {
    setIsLoadingGPS(true);
    
    try {
      // Check if location permission is granted
      const { PermissionsAndroid } = require('react-native');
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location to find nearby yoga classes.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Get current position
        const Geolocation = require('@react-native-community/geolocation');
        
        Geolocation.getCurrentPosition(
          (position: any) => {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode to get city name
            fetchCityFromCoordinates(latitude, longitude);
          },
          (error: any) => {
            console.error('GPS Error:', error);
            Alert.alert(
              'Location Error',
              'Unable to get your current location. Please enter your city manually.',
              [{ text: 'OK' }]
            );
            setIsLoadingGPS(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        Alert.alert(
          'Location Permission Denied',
          'Location permission is required to use GPS. Please enter your city manually.',
          [{ text: 'OK' }]
        );
        setIsLoadingGPS(false);
      }
    } catch (error) {
      console.error('Location permission error:', error);
      Alert.alert(
        'Location Error',
        'Unable to access location. Please enter your city manually.',
        [{ text: 'OK' }]
      );
      setIsLoadingGPS(false);
    }
  };

  const fetchCityFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      // Using a free reverse geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
      );
      
      const data = await response.json();
      
      if (data.address && data.address.city) {
        onLocationSelect({
          city: data.address.city,
          latitude,
          longitude,
        });
        onClose();
      } else if (data.address && data.address.town) {
        onLocationSelect({
          city: data.address.town,
          latitude,
          longitude,
        });
        onClose();
      } else {
        Alert.alert(
          'City Not Found',
          'Unable to determine your city from GPS coordinates. Please enter it manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      Alert.alert(
        'City Lookup Error',
        'Unable to find your city. Please enter it manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingGPS(false);
    }
  };

  const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
    'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'
  ];

  const handlePopularCitySelect = (city: string) => {
    onLocationSelect({
      city,
      latitude: undefined,
      longitude: undefined,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Your Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Manual City Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enter City Manually</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="map-marker" size={20} color={colors.secondaryText} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your city name"
                value={manualCity}
                onChangeText={setManualCity}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleManualSubmit}
              disabled={!manualCity.trim()}
            >
              <Text style={styles.submitButtonText}>Use This City</Text>
            </TouchableOpacity>
          </View>

          {/* GPS Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Use GPS Location</Text>
            <TouchableOpacity
              style={[styles.gpsButton, isLoadingGPS && styles.gpsButtonDisabled]}
              onPress={handleGPSLocation}
              disabled={isLoadingGPS}
            >
              <MaterialCommunityIcons
                name={isLoadingGPS ? 'loading' : 'crosshairs-gps'}
                size={20}
                color={colors.white}
              />
              <Text style={styles.gpsButtonText}>
                {isLoadingGPS ? 'Getting Location...' : 'Get My Current Location'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Popular Cities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Cities</Text>
            <View style={styles.popularCitiesGrid}>
              {popularCities.map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.cityButton}
                  onPress={() => handlePopularCitySelect(city)}
                >
                  <Text style={styles.cityButtonText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Current Location Display */}
          {currentLocation?.city && (
            <View style={styles.currentLocationSection}>
              <Text style={styles.currentLocationTitle}>Current Location:</Text>
              <Text style={styles.currentLocationText}>{currentLocation.city}</Text>
              {currentLocation.latitude && currentLocation.longitude && (
                <Text style={styles.coordinatesText}>
                  📍 {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
                </Text>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primaryText,
  },
  closeButton: {
    padding: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.primaryText,
  },
  submitButton: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  gpsButton: {
    backgroundColor: colors.accentBlue,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  gpsButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  popularCitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cityButton: {
    backgroundColor: colors.offWhite,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  cityButtonText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '500',
  },
  currentLocationSection: {
    backgroundColor: colors.lightSage,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  currentLocationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryText,
    marginBottom: 4,
  },
  currentLocationText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryGreen,
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 12,
    color: colors.secondaryText,
  },
});

export default LocationSelector;
