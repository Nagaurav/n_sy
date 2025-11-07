// BookConsultationScreen.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ROUTES } from '../navigation/constants';
import { professionalSlotService } from '../services/professionalSlotService';

const CONSULTATION_MODES = [
  { key: 'chat', label: 'Chat', icon: 'chat', description: 'Text-based consultation' },
  { key: 'audio', label: 'Audio Call', icon: 'phone', description: 'Voice consultation' },
  { key: 'video', label: 'Video Call', icon: 'video', description: 'Face-to-face consultation' },
];

const BookConsultationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { professional, selectedTime, slot } = route.params as { 
    professional: any; 
    selectedTime?: string; 
    slot?: any;
  };

  const [selectedMode, setSelectedMode] = useState<'chat' | 'audio' | 'video'>('chat');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    setLoading(true);
    try {
      const consultationTime = selectedTime || slot?.time || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      // Calculate price first
      const priceResponse = await professionalSlotService.calculatePrice({
        professionalId: professional.id,
        serviceId: 'default_service',
        duration: 60, // Default 60 minutes
      });

      // Create booking
      const bookingResponse = await professionalSlotService.createBooking({
        professionalId: professional.id,
        serviceId: 'default_service',
        userId: 'user_123', // Replace with actual user ID from context
        date: new Date(consultationTime).toISOString().split('T')[0],
        time: new Date(consultationTime).toTimeString().slice(0, 5),
        duration: 60,
        amount: priceResponse.totalPrice,
      });
      
      // Navigate to payment screen
      (navigation as any).navigate(ROUTES.PAYMENT, { 
        amount: priceResponse.totalPrice,
        bookingDetails: {
          professional,
          selectedTime: consultationTime,
          consultationMode: selectedMode,
          bookingId: bookingResponse.bookingId,
        },
        professional 
      });
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Could not book consultation.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Consultation</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Professional Info */}
      {professional && (
        <View style={styles.professionalInfo}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons 
              name="account-circle" 
              size={60} 
              color={colors.primaryGreen} 
            />
          </View>
          <Text style={styles.professionalName}>{professional.name}</Text>
          <Text style={styles.professionalSpecialty}>{professional.expertise || professional.specialty}</Text>
          {selectedTime && (
            <Text style={styles.timeInfo}>Time: {selectedTime}</Text>
          )}
        </View>
      )}

      <Text style={styles.heading}>Select Consultation Mode</Text>
      
      <View style={styles.modesContainer}>
        {CONSULTATION_MODES.map(({ key, label, icon, description }) => {
          const active = selectedMode === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.modeButton, active && styles.modeButtonActive]}
              onPress={() => setSelectedMode(key as any)}
              disabled={loading}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={icon as any}
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

      <TouchableOpacity
        style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
        disabled={loading}
        onPress={onConfirm}
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
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
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
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  professionalInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  professionalName: {
    color: colors.primaryGreen,
    marginBottom: 4,
    fontSize: 18,
    fontWeight: '600' as const,
  },
  professionalSpecialty: {
    color: colors.secondaryText,
    marginBottom: 8,
    fontSize: 16,
    fontWeight: '400' as const,
  },
  timeInfo: {
    color: colors.primaryGreen,
    fontWeight: '600' as const,
    fontSize: 16,
  },
  heading: {
    marginTop: 24,
    marginBottom: 24,
    color: colors.primaryGreen,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700' as const,
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
  modeLabel: {
    marginTop: 12,
    color: colors.primaryGreen,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  modeLabelActive: {
    color: colors.offWhite,
  },
  modeDescription: {
    fontSize: 11,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 14,
  },
  modeDescriptionActive: {
    color: colors.offWhite,
    opacity: 0.9,
  },
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
  confirmButtonDisabled: {
    backgroundColor: colors.secondaryText,
  },
  confirmButtonText: {
    color: colors.offWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});

export default BookConsultationScreen;
