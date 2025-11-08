import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { useRoute } from '@react-navigation/native';
import { consultationBookingService } from '../services/consultationBookingService';
import { useAuth } from '../utils/AuthContext';
import { ROUTES } from '../navigation/constants';
import { colors } from '../theme/colors';

const CONSULTATION_MODES = [
  { key: 'chat', label: 'Chat', icon: 'chat', description: 'Text-based consultation' },
  { key: 'audio', label: 'Audio Call', icon: 'phone', description: 'Voice consultation' },
  { key: 'video', label: 'Video Call', icon: 'video', description: 'Face-to-face consultation' },
] as const;

interface RouteParams {
  professional: {
    id: string;
    userId?: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    specializations?: string[];
    rating?: number;
    totalRatings?: number;
  };
  selectedTime?: string;
  slot?: {
    id: string;
    time: string;
    date: string;
    professionalId: string;
  };
  mode?: 'online' | 'offline' | 'home_visit';
  location?: {
    city?: string;
    latitude?: number;
    longitude?: number;
  };
}

const BookConsultationScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { professional, selectedTime, slot, mode = 'online', location } = route.params as RouteParams;

  const [selectedMode, setSelectedMode] = useState<'chat' | 'audio' | 'video'>('chat');
  const [loading, setLoading] = useState(false);

  /** ✅ Safe data pre-processing */
  const getConsultationTiming = useCallback(() => {
    if (slot?.date && slot?.time) {
      return new Date(`${slot.date}T${slot.time}`);
    }
    if (selectedTime) {
      return new Date(selectedTime);
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }, [slot, selectedTime]);

  /** ✅ Create consultation booking */
  const handleConfirmBooking = useCallback(async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to book a consultation.');
      return;
    }

    setLoading(true);
    try {
      const consultationTime = getConsultationTiming();
      const consultationDate = consultationTime.toISOString().split('T')[0];
      const consultationTimeStr = consultationTime.toTimeString().slice(0, 5);

      const bookingData = {
        user_id: user.id || user.userId,
        professional_id: professional.id,
        slot_id: slot?.id || undefined,
        consultation_type: mode,
        consultation_date: consultationDate,
        consultation_time: consultationTimeStr,
        duration: 60,
        total_amount: '0',
        payment_method: 'online' as const,
        special_instructions: `Consultation via ${selectedMode}`,
        is_urgent: false,
        location: location?.city || 'Online',
        latitude: location?.latitude,
        longitude: location?.longitude,
      };

      const response = await consultationBookingService.createConsultationBooking(bookingData);

      if (!response?.success || !response.data) {
        throw new Error(response?.message || 'Failed to book consultation.');
      }

      const bookingId = response.data.booking_id || response.data.id;
      const professionalName = `${professional.firstName || ''} ${professional.lastName || ''}`.trim();

      navigation.navigate(ROUTES.BOOKING_CONFIRMATION, {
        bookingId,
        professional: {
          id: professional.id,
          name: professionalName || 'Professional',
          title: professional.specializations?.[0] || 'Consultant',
          avatar: professional.profilePicture,
        },
        mode: selectedMode,
        date: consultationDate,
        time: consultationTimeStr,
        duration: 60,
      });
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert('Error', err.message || 'Could not complete consultation booking.');
    } finally {
      setLoading(false);
    }
  }, [user, professional, slot, selectedMode, mode, location, getConsultationTiming, navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Consultation</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Professional Info */}
      {professional && (
        <View style={styles.professionalInfo}>
          <MaterialCommunityIcons name="account-circle" size={70} color={colors.primaryGreen} />
          <Text style={styles.professionalName}>
            {`${professional.firstName || ''} ${professional.lastName || ''}`.trim() || 'Professional'}
          </Text>
          {professional.specializations?.[0] && (
            <Text style={styles.professionalSpecialty}>
              {professional.specializations[0]}
            </Text>
          )}
          {selectedTime && <Text style={styles.timeInfo}>Time: {selectedTime}</Text>}
        </View>
      )}

      {/* Consultation Modes */}
      <Text style={styles.heading}>Select Consultation Mode</Text>

      <View style={styles.modesContainer}>
        {CONSULTATION_MODES.map(({ key, label, icon, description }) => {
          const active = selectedMode === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.modeButton, active && styles.modeButtonActive]}
              onPress={() => setSelectedMode(key)}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={icon}
                size={40}
                color={active ? colors.offWhite : colors.primaryGreen}
              />
              <Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text>
              <Text style={[styles.modeDescription, active && styles.modeDescriptionActive]}>
                {description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        onPress={handleConfirmBooking}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={colors.offWhite} />
        ) : (
          <Text style={styles.confirmButtonText}>Confirm Consultation</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
  },
  professionalInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  professionalName: {
    color: colors.primaryGreen,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  professionalSpecialty: {
    color: colors.secondaryText,
    fontSize: 16,
    marginBottom: 8,
  },
  timeInfo: {
    color: colors.primaryGreen,
    fontWeight: '600',
    fontSize: 16,
  },
  heading: {
    marginTop: 24,
    marginBottom: 24,
    color: colors.primaryGreen,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  modeButton: {
    alignItems: 'center',
    backgroundColor: colors.lightSage,
    borderRadius: 15,
    padding: 20,
    width: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modeButtonActive: {
    backgroundColor: colors.primaryGreen,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modeLabel: { marginTop: 12, color: colors.primaryGreen, fontWeight: '700', fontSize: 15 },
  modeLabelActive: { color: colors.offWhite },
  modeDescription: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 14,
  },
  modeDescriptionActive: { color: colors.offWhite, opacity: 0.9 },
  confirmButton: {
    backgroundColor: colors.primaryGreen,
    paddingVertical: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginHorizontal: 20,
    elevation: 3,
    shadowColor: colors.primaryGreen,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  confirmButtonDisabled: { backgroundColor: colors.secondaryText },
  confirmButtonText: { color: colors.offWhite, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});

export default BookConsultationScreen;
