// BookingConfirmationScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { makeApiRequest, API_CONFIG } from '../config/api';
import { useAuth } from '../utils/AuthContext';

interface RouteParams {
  instructor?: any;
  professional?: any;
  selectedDate?: string;
  selectedTime?: string;
  mode: 'online' | 'offline';
  duration?: number;
  service?: string;
  category?: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  location?: any;
}

const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;
  const { user } = useAuth();
  
  // Handle both instructor and professional params
  const professional = params.instructor || params.professional;
  const { mode, category, categoryName, categoryIcon, categoryColor, location } = params;

  const [selectedDate, setSelectedDate] = useState(params.selectedDate || '');
  const [selectedTime, setSelectedTime] = useState(params.selectedTime || '');
  const [selectedDuration, setSelectedDuration] = useState(params.duration || 60);
  const [selectedClassType, setSelectedClassType] = useState<'one_on_one' | 'group'>('one_on_one');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  // Mock available time slots
  const availableTimeSlots = [
    { id: '1', time: '06:00 AM', available: true },
    { id: '2', time: '07:00 AM', available: true },
    { id: '3', time: '08:00 AM', available: true },
    { id: '4', time: '09:00 AM', available: true },
    { id: '5', time: '06:00 PM', available: true },
    { id: '6', time: '07:00 PM', available: true },
    { id: '7', time: '08:00 PM', available: true },
  ];

  // Mock available dates (next 7 days)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return {
      id: i.toString(),
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      available: true,
    };
  });

  const calculatePrice = () => {
    let basePrice = professional?.price || 800;
    
    // Adjust price based on class type
    if (selectedClassType === 'one_on_one') {
      basePrice = basePrice * 1.5; // 50% premium for one-on-one
    }
    
    // Adjust price based on duration
    const durationMultiplier = selectedDuration / 60;
    basePrice = basePrice * durationMultiplier;
    
    return Math.round(basePrice);
  };

  const handlePayment = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time for your session.');
      return;
    }

    if (!user) {
      Alert.alert('Not Logged In', 'You must be logged in to make a booking.');
      return;
    }

    setLoading(true);
    try {
      console.log('BookingConfirmationScreen - Starting booking process...');

      // This is the data for your API 4
      const bookingData = {
        user_id: user.id || user.userId,
        professional_id: professional?.id,
        slot_id: (params as any).selectedSlot?.id,
        duration: selectedDuration,
        coupon_code: "", // Add coupon code logic later
      };

      // This is the endpoint you provided for API 4
      const bookingEndpoint = '/user/consultation-booking/create';

      console.log('BookingConfirmationScreen - Creating booking with data:', bookingData);

      // Call the real API
      const response = await makeApiRequest(bookingEndpoint, 'POST', bookingData);
      console.log('BookingConfirmationScreen - Booking API response:', response);

      if (response.success && response.data?.booking_id) {
        console.log('BookingConfirmationScreen - Booking created successfully, proceeding to payment.');

        const bookingId = response.data.booking_id;
        const amountToPay = calculatePrice();

        // Check if we have a payment URL in the response
        const paymentUrl = response.data.payment_url || response.data.paymentUrl;

        // Navigate to the PaymentScreen with the real booking ID and amount
        (navigation as any).navigate(ROUTES.PAYMENT, {
          amount: amountToPay,
          bookingDetails: {
            ...params,
            bookingId: bookingId, // Pass the REAL booking ID
            selectedDate,
            selectedTime,
            selectedDuration,
            selectedClassType,
            mode,
            location,
          },
          professional: professional,
          paymentUrl: paymentUrl, // Pass the payment URL if it exists
        });
      } else {
        throw new Error(response.message || 'Failed to create booking. API did not return a booking ID.');
      }
    } catch (error: unknown) {
      console.error('BookingConfirmationScreen - Booking error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      Alert.alert('Booking Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderDateSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
        {availableDates.map((date) => (
          <TouchableOpacity
            key={date.id}
            style={[
              styles.dateButton,
              selectedDate === date.date && styles.dateButtonSelected
            ]}
            onPress={() => setSelectedDate(date.date)}
          >
            <Text style={[
              styles.dateButtonText,
              selectedDate === date.date && styles.dateButtonTextSelected
            ]}>
              {date.day}
            </Text>
            <Text style={[
              styles.dateButtonDate,
              selectedDate === date.date && styles.dateButtonTextSelected
            ]}>
              {new Date(date.date).getDate()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Select Time</Text>
      <View style={styles.timeGrid}>
        {availableTimeSlots.map((slot) => (
          <TouchableOpacity
            key={slot.id}
            style={[
              styles.timeButton,
              selectedTime === slot.time && styles.timeButtonSelected
            ]}
            onPress={() => setSelectedTime(slot.time)}
          >
            <Text style={[
              styles.timeButtonText,
              selectedTime === slot.time && styles.timeButtonTextSelected
            ]}>
              {slot.time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderClassTypeSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Class Type</Text>
      <View style={styles.classTypeContainer}>
        <TouchableOpacity
          style={[
            styles.classTypeButton,
            selectedClassType === 'one_on_one' && styles.classTypeButtonSelected
          ]}
          onPress={() => setSelectedClassType('one_on_one')}
        >
          <MaterialCommunityIcons
            name="account"
            size={24}
            color={selectedClassType === 'one_on_one' ? colors.offWhite : colors.primaryGreen}
          />
          <Text style={[
            styles.classTypeText,
            selectedClassType === 'one_on_one' && styles.classTypeTextSelected
          ]}>
            One-on-One
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.classTypeButton,
            selectedClassType === 'group' && styles.classTypeButtonSelected
          ]}
          onPress={() => setSelectedClassType('group')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={24}
            color={selectedClassType === 'group' ? colors.offWhite : colors.primaryGreen}
          />
          <Text style={[
            styles.classTypeText,
            selectedClassType === 'group' && styles.classTypeTextSelected
          ]}>
            Group Class
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDurationSelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Duration</Text>
      <View style={styles.durationContainer}>
        {[30, 60, 90].map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.durationButton,
              selectedDuration === duration && styles.durationButtonSelected
            ]}
            onPress={() => setSelectedDuration(duration)}
          >
            <Text style={[
              styles.durationText,
              selectedDuration === duration && styles.durationTextSelected
            ]}>
              {duration} min
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.offWhite} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Session</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructor Info */}
        <View style={styles.instructorCard}>
          <View style={styles.instructorInfo}>
            <View style={styles.instructorAvatar}>
              <MaterialCommunityIcons name="account" size={32} color={colors.primaryGreen} />
            </View>
            <View style={styles.instructorDetails}>
              <Text style={styles.instructorName}>{professional?.name}</Text>
              <Text style={styles.instructorTitle}>{professional?.title}</Text>
              <View style={styles.instructorStats}>
                <Text style={styles.instructorStat}>⭐ {professional?.rating}</Text>
                <Text style={styles.instructorStat}>👥 {professional?.totalStudents}+ students</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Options */}
        {renderDateSelector()}
        {renderTimeSelector()}
        {renderClassTypeSelector()}
        {renderDurationSelector()}

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
            <Text style={styles.priceValue}>₹{professional?.price}</Text>
          </View>
          {selectedClassType === 'one_on_one' && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>One-on-One Premium</Text>
              <Text style={styles.priceValue}>+₹{Math.round(professional?.price * 0.5)}</Text>
            </View>
          )}
          {selectedDuration !== 60 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Duration ({selectedDuration} min)</Text>
              <Text style={styles.priceValue}>×{(selectedDuration / 60).toFixed(1)}</Text>
            </View>
          )}
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceLabelTotal}>Total Amount</Text>
            <Text style={styles.priceValueTotal}>₹{calculatePrice()}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          style={[
            styles.button,
            loading && styles.buttonDisabled
          ]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.offWhite} />
              <Text style={styles.buttonText}>Processing Payment...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Pay ₹{calculatePrice()}</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructorCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  instructorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instructorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  instructorDetails: {
    flex: 1,
  },
  instructorName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  instructorTitle: {
    fontSize: 14,
    color: colors.secondaryText,
    marginTop: 4,
  },
  instructorStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  instructorStat: {
    fontSize: 14,
    color: colors.primaryGreen,
    marginRight: 10,
  },
  section: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 15,
  },
  dateScrollView: {
    flexDirection: 'row',
  },
  dateButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.border,
    marginRight: 10,
    alignItems: 'center',
  },
  dateButtonSelected: {
    backgroundColor: colors.primaryGreen,
  },
  dateButtonText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  dateButtonTextSelected: {
    color: colors.offWhite,
  },
  dateButtonDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  timeButtonSelected: {
    backgroundColor: colors.primaryGreen,
  },
  timeButtonText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  timeButtonTextSelected: {
    color: colors.offWhite,
  },
  classTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  classTypeButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  classTypeButtonSelected: {
    backgroundColor: colors.primaryGreen,
  },
  classTypeText: {
    fontSize: 12,
    color: colors.primaryText,
    marginTop: 5,
  },
  classTypeTextSelected: {
    color: colors.offWhite,
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  durationButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: colors.border,
  },
  durationButtonSelected: {
    backgroundColor: colors.primaryGreen,
  },
  durationText: {
    fontSize: 14,
    color: colors.primaryText,
  },
  durationTextSelected: {
    color: colors.offWhite,
  },
  priceCard: {
    backgroundColor: colors.offWhite,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
    marginBottom: 15,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.secondaryText,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  priceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },
  priceLabelTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.primaryText,
  },
  priceValueTotal: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primaryGreen,
  },
  bottomAction: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  button: {
    backgroundColor: colors.primaryGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.offWhite,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default BookingConfirmationScreen;
