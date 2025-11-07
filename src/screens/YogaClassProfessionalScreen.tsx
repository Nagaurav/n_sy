// YogaClassProfessionalScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { ScreenContainer, ScreenHeader, EmptyState } from '../components/common';
import { YogaClass } from '../services/yogaClassService';
import { ROUTES } from '../navigation/constants';

interface RouteParams {
  yogaClass: YogaClass;
  mode: 'online' | 'offline';
}

const YogaClassProfessionalScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { yogaClass, mode } = route.params as RouteParams;

  const handleBookClass = () => {
    // Navigate to booking screen
    (navigation as any).navigate(ROUTES.BOOKING_DETAILS, {
      yogaClass,
      mode,
    });
  };

  const formatPrice = (price: number | null) => {
    return price ? `₹${price}` : 'Price not available';
  };

  const formatDuration = (duration: string) => {
    return duration.replace('_', ' ').toLowerCase();
  };

  const formatDays = (days: string) => {
    return days.split(',').join(', ');
  };

  const renderYogaClassInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Class Details</Text>
      
      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="yoga" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Title:</Text>
        <Text style={styles.infoValue}>{yogaClass.title}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="text" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Description:</Text>
        <Text style={styles.infoValue}>{yogaClass.description}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="calendar" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Duration:</Text>
        <Text style={styles.infoValue}>{formatDuration(yogaClass.duration)}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Schedule:</Text>
        <Text style={styles.infoValue}>{formatDays(yogaClass.days)}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="clock-outline" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Time:</Text>
        <Text style={styles.infoValue}>
          {new Date(yogaClass.start_time).toLocaleTimeString()} - {new Date(yogaClass.end_time).toLocaleTimeString()}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="map-marker" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Location:</Text>
        <Text style={styles.infoValue}>{yogaClass.location}</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons name="currency-inr" size={20} color={colors.primaryGreen} />
        <Text style={styles.infoLabel}>Price ({mode}):</Text>
        <Text style={styles.infoValue}>
          {mode === 'online' 
            ? formatPrice(yogaClass.price_group_online)
            : formatPrice(yogaClass.price_group_offline)
          }
        </Text>
      </View>

      {yogaClass.max_participants_online && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-group" size={20} color={colors.primaryGreen} />
          <Text style={styles.infoLabel}>Max Participants:</Text>
          <Text style={styles.infoValue}>
            {mode === 'online' 
              ? yogaClass.max_participants_online
              : yogaClass.max_participants_offline
            }
          </Text>
        </View>
      )}

      {yogaClass.languages && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="translate" size={20} color={colors.primaryGreen} />
          <Text style={styles.infoLabel}>Languages:</Text>
          <Text style={styles.infoValue}>{yogaClass.languages}</Text>
        </View>
      )}

      {yogaClass.is_disease_specific && yogaClass.disease && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="medical-bag" size={20} color={colors.primaryGreen} />
          <Text style={styles.infoLabel}>Specialization:</Text>
          <Text style={styles.infoValue}>{yogaClass.disease}</Text>
        </View>
      )}

      {yogaClass.allow_mid_month_entry && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-plus" size={20} color={colors.primaryGreen} />
          <Text style={styles.infoLabel}>Mid-month Entry:</Text>
          <Text style={styles.infoValue}>Allowed</Text>
        </View>
      )}

      {yogaClass.gender_focus && yogaClass.gender_focus !== 'all' && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account" size={20} color={colors.primaryGreen} />
          <Text style={styles.infoLabel}>Gender Focus:</Text>
          <Text style={styles.infoValue}>{yogaClass.gender_focus}</Text>
        </View>
      )}
    </View>
  );

  const renderBookingSection = () => (
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
  );

  if (!yogaClass || !mode) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Yoga Class Details" />
        <EmptyState
          icon="alert-circle"
          title="Missing Information"
          subtitle="Required yoga class details are missing. Please go back and try again."
          iconSize={80}
          iconColor={colors.error}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Yoga Class Details" />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {renderYogaClassInfo()}
        {renderBookingSection()}
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 16,
    color: colors.secondaryText,
    flex: 1,
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: colors.primaryGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 16,
  },
  bookButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookingNote: {
    fontSize: 14,
    color: colors.secondaryText,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default YogaClassProfessionalScreen;
