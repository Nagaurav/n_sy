import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../App';
import { apiService } from '../services/apiService';
import { 
  YogaPlan, 
  SessionMode, 
  getAvailableSessionModes, 
  parseDays, 
  formatTimeFromISO 
} from '../types/yogaPlan';
import { theme } from '../theme';
import Ionicons from 'react-native-vector-icons/Ionicons';

type YogaPlanBookingRouteProp = RouteProp<HomeStackParamList, 'DateTimeSelection'>;
type YogaPlanBookingNavigationProp = StackNavigationProp<HomeStackParamList, 'DateTimeSelection'>;

const YogaPlanBookingScreen = () => {
  const navigation = useNavigation<YogaPlanBookingNavigationProp>();
  const route = useRoute<YogaPlanBookingRouteProp>();
  const { professionalId, professionalName } = route.params;

  const [yogaPlan, setYogaPlan] = useState<YogaPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<SessionMode | null>(null);
  const [availableModes, setAvailableModes] = useState<SessionMode[]>([]);

  useEffect(() => {
    fetchYogaPlan();
  }, [professionalId]);

  const fetchYogaPlan = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Fetching yoga plan for professional:', professionalId);
      const response = await apiService.getProfessionalSlots(professionalId);

      console.log('📦 Yoga plan response:', response);

      if (response && response.data) {
        setYogaPlan(response.data);
        const modes = getAvailableSessionModes(response.data);
        setAvailableModes(modes);
        console.log('✅ Available session modes:', modes);
      } else {
        setError('No yoga plan available for this professional.');
      }
    } catch (err: any) {
      console.error('❌ Error fetching yoga plan:', err);
      setError(err.message || 'Failed to load yoga plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeSelect = (mode: SessionMode) => {
    setSelectedMode(mode);
  };

  const handleConfirmBooking = () => {
    if (!yogaPlan || !selectedMode) {
      Alert.alert('Selection Required', 'Please select a session mode to continue.');
      return;
    }

    const bookingData = {
      professionalId,
      professionalName,
      yogaPlanId: yogaPlan.id,
      planTitle: yogaPlan.title,
      sessionMode: selectedMode.type,
      sessionModeLabel: selectedMode.label,
      price: selectedMode.price || 0,
      duration: yogaPlan.duration,
      days: yogaPlan.days,
      startTime: formatTimeFromISO(yogaPlan.start_time),
      endTime: formatTimeFromISO(yogaPlan.end_time),
      location: yogaPlan.location,
      languages: yogaPlan.languages,
      maxParticipants: selectedMode.maxParticipants,
    };

    console.log('🚀 Proceeding to booking confirmation with:', bookingData);

    navigation.navigate('BookingConfirmation', {
      bookingData,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading yoga plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !yogaPlan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.feedback.error} />
          <Text style={styles.errorText}>{error || 'Failed to load yoga plan'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchYogaPlan}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const days = parseDays(yogaPlan.days);
  const startTime = formatTimeFromISO(yogaPlan.start_time);
  const endTime = formatTimeFromISO(yogaPlan.end_time);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Yoga Plan</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Plan Details */}
        <View style={styles.section}>
          <Text style={styles.planTitle}>{yogaPlan.title}</Text>
          <Text style={styles.professionalName}>{professionalName}</Text>
          <Text style={styles.planDescription}>{yogaPlan.description}</Text>

          {/* Schedule Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>Duration: {yogaPlan.duration.replace('_', ' ')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {startTime} - {endTime}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="repeat-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>Days: {days.join(', ')}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="language-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>Languages: {yogaPlan.languages}</Text>
            </View>

            {yogaPlan.location && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>{yogaPlan.location}</Text>
              </View>
            )}

            {yogaPlan.is_disease_specific && yogaPlan.disease && (
              <View style={styles.infoRow}>
                <Ionicons name="medical-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.infoText}>Specialized for: {yogaPlan.disease}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Session Mode Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Session Mode</Text>
          {availableModes.map((mode) => (
            <TouchableOpacity
              key={mode.type}
              style={[
                styles.modeCard,
                selectedMode?.type === mode.type && styles.modeCardSelected,
              ]}
              onPress={() => handleModeSelect(mode)}
            >
              <View style={styles.modeHeader}>
                <Text
                  style={[
                    styles.modeLabel,
                    selectedMode?.type === mode.type && styles.modeLabelSelected,
                  ]}
                >
                  {mode.label}
                </Text>
                {selectedMode?.type === mode.type && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </View>

              <Text style={styles.modePrice}>
                ₹{mode.price || 0}
                {mode.maxParticipants && ` (Max: ${mode.maxParticipants} participants)`}
              </Text>
            </TouchableOpacity>
          ))}

          {availableModes.length === 0 && (
            <Text style={styles.noModesText}>No session modes available</Text>
          )}
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedMode && styles.confirmButtonDisabled]}
          onPress={handleConfirmBooking}
          disabled={!selectedMode}
        >
          <Text style={styles.confirmButtonText}>
            {selectedMode ? `Book for ₹${selectedMode.price || 0}` : 'Select a Mode'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
  },
  section: {
    padding: 16,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  professionalName: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 12,
    fontWeight: '500',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  modeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modeLabelSelected: {
    color: theme.colors.primary,
  },
  modePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  noModesText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default YogaPlanBookingScreen;
