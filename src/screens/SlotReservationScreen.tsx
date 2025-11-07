// SlotReservationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { ROUTES } from '../navigation/constants';
import { professionalSlotService } from '../services/professionalSlotService';

interface RouteParams {
  professional: any;
  selectedDate: string;
  selectedTime: string;
  selectedSlot: any;
}

const SlotReservationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { professional, selectedDate, selectedTime, selectedSlot } = route.params as RouteParams;

  const [reserving, setReserving] = useState(false);
  const [slotReserved, setSlotReserved] = useState(false);

  const handleReserveSlot = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'No slot selected for reservation');
      return;
    }

    setReserving(true);
    try {
      // Reserve the slot temporarily (15 minutes expiry)
      const reservationResponse = await professionalSlotService.reserveSlot({
        slot_id: selectedSlot.id,
        professional_id: professional.id,
        user_id: 'user_123', // Replace with actual user ID
        reservation_expiry: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      });

      if (reservationResponse.success) {
        setSlotReserved(true);
        Alert.alert(
          'Slot Reserved!',
          'Your slot has been reserved for 15 minutes. Please complete your booking.',
          [
            {
              text: 'Continue',
              onPress: () => {
                // Navigate to consultation mode selection with reserved slot
                (navigation as any).navigate(ROUTES.BOOK_CONSULTATION, {
                  professional,
                  selectedDate,
                  selectedTime,
                  selectedSlot,
                  reservedSlotId: reservationResponse.data.reservation_id,
                });
              },
            },
          ]
        );
      } else {
        throw new Error(reservationResponse.message || 'Failed to reserve slot');
      }
    } catch (error: any) {
      console.error('Slot reservation error:', error);
      Alert.alert('Reservation Failed', error.message || 'Could not reserve slot. Please try again.');
    } finally {
      setReserving(false);
    }
  };

  const handleGoBack = () => {
    (navigation as any).goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reserve Your Slot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Info */}
        <View style={styles.professionalInfo}>
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="account-circle" size={60} color={colors.primaryGreen} />
          </View>
          <Text style={styles.professionalName}>{professional?.name || 'Professional'}</Text>
          <Text style={styles.professionalSpecialty}>{professional?.speciality || 'Consultation'}</Text>
        </View>

        {/* Slot Details */}
        <View style={styles.slotDetails}>
          <Text style={styles.sectionTitle}>Selected Slot Details</Text>
          
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="calendar" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{selectedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailLabel}>Time:</Text>
            <Text style={styles.detailValue}>{selectedTime}</Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={colors.primaryGreen} />
            <Text style={styles.detailLabel}>Mode:</Text>
            <Text style={styles.detailValue}>Online</Text>
          </View>
        </View>

        {/* Reservation Info */}
        <View style={styles.reservationInfo}>
          <Text style={styles.sectionTitle}>Reservation Information</Text>
          <Text style={styles.reservationText}>
            • Your slot will be reserved for 15 minutes
          </Text>
          <Text style={styles.reservationText}>
            • Complete your booking within this time
          </Text>
          <Text style={styles.reservationText}>
            • Slot will be automatically released if not confirmed
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.reserveButton, reserving && styles.reserveButtonDisabled]}
            disabled={reserving}
            onPress={handleReserveSlot}
            activeOpacity={0.8}
          >
            {reserving ? (
              <ActivityIndicator color={colors.offWhite} />
            ) : (
              <>
                <MaterialCommunityIcons name="clock-check" size={20} color={colors.offWhite} />
                <Text style={styles.reserveButtonText}>Reserve This Slot</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
            <Text style={styles.cancelButtonText}>Choose Different Time</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  professionalInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 24,
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
  slotDetails: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.primaryText,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 60,
  },
  detailValue: {
    fontSize: 16,
    color: colors.secondaryText,
    flex: 1,
  },
  reservationInfo: {
    backgroundColor: colors.lightSage,
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  reservationText: {
    fontSize: 14,
    color: colors.secondaryText,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionContainer: {
    gap: 16,
  },
  reserveButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  reserveButtonDisabled: {
    backgroundColor: colors.border,
  },
  reserveButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.secondaryText,
    fontSize: 16,
    fontWeight: '500' as const,
  },
});

export default SlotReservationScreen;
