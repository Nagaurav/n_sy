import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute } from '@react-navigation/native';
import { useTypedNavigation } from '../hooks/useTypedNavigation';
import { colors } from '../theme/colors';
import { ScreenContainer, ScreenHeader, EmptyState } from '../components/common';
import { YogaClass, yogaClassService } from '../services/yogaClassService';
import { ProfessionalService } from '../services/professional/ProfessionalService';
import { ROUTES } from '../navigation/constants';

interface RouteParams {
  yogaClass?: YogaClass;
  yogaClassId?: string;
  mode: 'online' | 'offline';
}

const YogaClassProfessionalScreen: React.FC = () => {
  const navigation = useTypedNavigation();
  const route = useRoute();
  const { yogaClass, yogaClassId, mode } = route.params as RouteParams;

  const [classData, setClassData] = useState<YogaClass | null>(yogaClass || null);
  const [loading, setLoading] = useState(!yogaClass);
  const [error, setError] = useState<string | null>(null);

  const professionalService = ProfessionalService.getInstance();

  const fetchClassDetails = useCallback(async () => {
    try {
      if (!yogaClassId) return;
      setLoading(true);
      const response = await yogaClassService.getYogaClassById(yogaClassId);
      if (response.success && response.data) {
        setClassData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load class details');
      }
    } catch (err) {
      console.error('Error fetching class details:', err);
      setError('Unable to load class details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [yogaClassId]);

  useEffect(() => {
    if (!yogaClass && yogaClassId) {
      fetchClassDetails();
    }
  }, [fetchClassDetails]);

  const handleBookClass = async () => {
    try {
      if (!classData?.professionalId) {
        throw new Error('No professional ID found for this class.');
      }

      const profResponse = await professionalService.getProfessionalById(classData.professionalId);
      if (!profResponse.success || !profResponse.data) {
        throw new Error('Professional not available for booking.');
      }

      navigation.navigate(ROUTES.BOOK_CONSULTATION, {
        professional: profResponse.data,
        mode,
      });
    } catch (err: any) {
      console.error('Booking error:', err);
      setError(err.message || 'Failed to proceed with booking.');
    }
  };

  const formatPrice = (price?: number | null) =>
    price ? `₹${price}` : 'Price not available';

  const formatDuration = (duration?: string) =>
    duration ? duration.replace('_', ' ').toLowerCase() : 'Not specified';

  const formatDays = (days?: string) =>
    days ? days.split(',').join(', ') : 'Not specified';

  if (loading) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Yoga Class Details" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primaryGreen} />
          <Text style={styles.loadingText}>Loading class details...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Yoga Class Details" />
        <EmptyState
          icon="alert-circle-outline"
          title="Error"
          subtitle={error}
          iconColor={colors.error}
        />
      </ScreenContainer>
    );
  }

  if (!classData) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Yoga Class Details" />
        <EmptyState
          icon="information-outline"
          title="No Data Found"
          subtitle="Yoga class details are unavailable."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Yoga Class Details" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Class Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Details</Text>

          {[
            { icon: 'yoga', label: 'Title', value: classData.title },
            { icon: 'text', label: 'Description', value: classData.description },
            { icon: 'calendar', label: 'Duration', value: formatDuration(classData.duration) },
            { icon: 'clock', label: 'Schedule', value: formatDays(classData.days) },
            {
              icon: 'clock-outline',
              label: 'Time',
              value:
                classData.start_time && classData.end_time
                  ? `${new Date(classData.start_time).toLocaleTimeString()} - ${new Date(
                      classData.end_time
                    ).toLocaleTimeString()}`
                  : 'Not specified',
            },
            { icon: 'map-marker', label: 'Location', value: classData.location || 'Not specified' },
            {
              icon: 'currency-inr',
              label: `Price (${mode})`,
              value:
                mode === 'online'
                  ? formatPrice(classData.price_group_online)
                  : formatPrice(classData.price_group_offline),
            },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.infoRow}>
              <MaterialCommunityIcons name={icon} size={20} color={colors.primaryGreen} />
              <Text style={styles.infoLabel}>{label}:</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}

          {classData.max_participants_online && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={colors.primaryGreen} />
              <Text style={styles.infoLabel}>Max Participants:</Text>
              <Text style={styles.infoValue}>
                {mode === 'online'
                  ? classData.max_participants_online
                  : classData.max_participants_offline}
              </Text>
            </View>
          )}

          {classData.languages && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="translate" size={20} color={colors.primaryGreen} />
              <Text style={styles.infoLabel}>Languages:</Text>
              <Text style={styles.infoValue}>{classData.languages}</Text>
            </View>
          )}
        </View>

        {/* Booking Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book This Class</Text>
          <TouchableOpacity style={styles.bookButton} onPress={handleBookClass}>
            <MaterialCommunityIcons name="bookmark-plus" size={20} color={colors.white} />
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
          <Text style={styles.bookingNote}>
            You'll be able to select specific dates and time slots during the booking process.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: colors.secondaryText, marginTop: 12 },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 6,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' },
  infoLabel: { fontSize: 16, fontWeight: '600', color: colors.primaryText, marginLeft: 8 },
  infoValue: { fontSize: 16, color: colors.secondaryText, marginLeft: 6, flex: 1 },
  bookButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  bookButtonText: { color: colors.white, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  bookingNote: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default YogaClassProfessionalScreen;
