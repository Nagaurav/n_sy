import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';

import { colors } from '../theme/colors';
import { ROUTES } from '../navigation/constants';
import { PaymentMethodSelector } from '../components/yoga';
import { consultationBookingService } from '../services/consultationBookingService';
import { useAuth } from '../utils/AuthContext';

interface RouteParams {
  professional?: {
    id: string;
    name?: string;
    title?: string;
    rating?: number;
    totalStudents?: number;
    price?: number;
    specializations?: string[];
  };
  selectedDate?: string;
  selectedTime?: string;
  mode: 'online' | 'offline';
  duration?: number;
  location?: any;
}

const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { user } = useAuth();

  const professional = params.professional;
  const [selectedDate, setSelectedDate] = useState(params.selectedDate || '');
  const [selectedTime, setSelectedTime] = useState(params.selectedTime || '');
  const [selectedDuration, setSelectedDuration] = useState(params.duration || 60);
  const [selectedClassType, setSelectedClassType] = useState<'one_on_one' | 'group'>('one_on_one');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  // Generate next 7 days
  const availableDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);
      return {
        id: i.toString(),
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      };
    });
  }, []);

  // Generate default hourly slots (6 AM – 10 PM)
  const availableSlots = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const hour = i + 6;
      const label = `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'}`;
      return { id: `${i}`, time: label };
    });
  }, []);

  /** ✅ Calculate total amount dynamically */
  const calculatePrice = useMemo(() => {
    let basePrice = professional?.price || 800;
    if (selectedClassType === 'one_on_one') basePrice *= 1.5;
    return Math.round(basePrice * (selectedDuration / 60));
  }, [selectedDuration, selectedClassType, professional?.price]);

  /** ✅ Handle Booking + Payment Navigation */
  const handleBooking = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please sign in to book a session.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      Alert.alert('Select Time', 'Please choose a date and time before proceeding.');
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        user_id: user.id || user.userId,
        professional_id: professional?.id,
        consultation_date: selectedDate,
        consultation_time: selectedTime,
        duration: selectedDuration,
        consultation_type: params.mode,
        payment_method: selectedPaymentMethod,
        class_type: selectedClassType,
        total_amount: calculatePrice,
        is_urgent: false,
        location: params.location?.city || 'Online',
      };

      const response = await consultationBookingService.createConsultationBooking(bookingData);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create booking.');
      }

      const bookingId = response.data.booking_id || response.data.id;
      const paymentUrl = response.data.payment_url || response.data.paymentUrl;

      navigation.navigate(ROUTES.PAYMENT, {
        amount: calculatePrice,
        bookingDetails: {
          bookingId,
          selectedDate,
          selectedTime,
          selectedDuration,
          selectedClassType,
          mode: params.mode,
          location: params.location,
        },
        professional,
        paymentUrl,
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.offWhite} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Professional Info */}
        {professional && (
          <View style={styles.instructorCard}>
            <View style={styles.instructorInfo}>
              <View style={styles.instructorAvatar}>
                <MaterialCommunityIcons name="account" size={32} color={colors.offWhite} />
              </View>
              <View style={styles.instructorDetails}>
                <Text style={styles.instructorName}>{professional.name || 'Professional'}</Text>
                <Text style={styles.instructorTitle}>{professional.title || 'Expert Instructor'}</Text>
                <View style={styles.instructorStats}>
                  <Text style={styles.instructorStat}>⭐ {professional.rating || '4.8'}</Text>
                  <Text style={styles.instructorStat}>
                    👥 {professional.totalStudents || '200+'} students
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Date Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {availableDates.map((date) => (
              <TouchableOpacity
                key={date.id}
                style={[styles.dateButton, selectedDate === date.date && styles.dateButtonSelected]}
                onPress={() => setSelectedDate(date.date)}
              >
                <Text
                  style={[
                    styles.dateButtonText,
                    selectedDate === date.date && styles.dateButtonTextSelected,
                  ]}
                >
                  {date.day}
                </Text>
                <Text
                  style={[
                    styles.dateButtonDate,
                    selectedDate === date.date && styles.dateButtonTextSelected,
                  ]}
                >
                  {new Date(date.date).getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeGrid}>
            {availableSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.timeButton, selectedTime === slot.time && styles.timeButtonSelected]}
                onPress={() => setSelectedTime(slot.time)}
              >
                <Text
                  style={[
                    styles.timeButtonText,
                    selectedTime === slot.time && styles.timeButtonTextSelected,
                  ]}
                >
                  {slot.time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Class Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Type</Text>
          <View style={styles.classTypeContainer}>
            {['one_on_one', 'group'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.classTypeButton,
                  selectedClassType === type && styles.classTypeButtonSelected,
                ]}
                onPress={() => setSelectedClassType(type as 'one_on_one' | 'group')}
              >
                <MaterialCommunityIcons
                  name={type === 'one_on_one' ? 'account' : 'account-group'}
                  size={24}
                  color={
                    selectedClassType === type ? colors.offWhite : colors.primaryGreen
                  }
                />
                <Text
                  style={[
                    styles.classTypeText,
                    selectedClassType === type && styles.classTypeTextSelected,
                  ]}
                >
                  {type === 'one_on_one' ? 'One-on-One' : 'Group'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.durationContainer}>
            {[30, 60, 90].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.durationButton, selectedDuration === d && styles.durationButtonSelected]}
                onPress={() => setSelectedDuration(d)}
              >
                <Text
                  style={[
                    styles.durationText,
                    selectedDuration === d && styles.durationTextSelected,
                  ]}
                >
                  {d} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <PaymentMethodSelector
            selectedMethod={selectedPaymentMethod}
            onSelectMethod={setSelectedPaymentMethod}
          />
        </View>

        {/* Price Summary */}
        <View style={styles.priceCard}>
          <Text style={styles.priceTitle}>Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Session Fee</Text>
            <Text style={styles.priceValue}>₹{professional?.price || 800}</Text>
          </View>
          {selectedClassType === 'one_on_one' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>One-on-One Premium</Text>
              <Text style={styles.priceValue}>+50%</Text>
            </View>
          )}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelTotal}>Total Amount</Text>
            <Text style={styles.priceValueTotal}>₹{calculatePrice}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleBooking}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.offWhite} />
              <Text style={styles.buttonText}>Processing...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Pay ₹{calculatePrice}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  .../* same styles as your version for visual parity */
});

export default BookingConfirmationScreen;
