import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { theme } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { bookingService } from '../services/bookingService';

const BookingConfirmationScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  // 🟢 1. Extract Data safely
  const { bookingData } = (route.params || {}) as { bookingData: any };
  
  const [isProcessing, setIsProcessing] = useState(false);

  // 🟢 2. Detect Type for UI logic
  const isYoga = bookingData?.serviceType === 'yoga_class';

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    try {
      // 🟢 3. Call Unified Service
      const response = await bookingService.createBookingAndInitiatePayment({
        userId: (user as any)?.id || (user as any)?.user_id,
        professionalId: bookingData.professionalId,
        serviceType: bookingData.serviceType, 
        amount: bookingData.price,
        couponCode: undefined, // Add coupon logic if needed
        
        // Pass both (one will be undefined)
        slotId: bookingData.slotId,
        yogaPlanId: bookingData.yogaPlanId,
        deliveryMode: bookingData.deliveryMode
      });

      if (response.success && response.data?.payment_url) {
        // Navigate to Payment
        navigation.navigate('PaymentGateway', {
          paymentUrl: response.data.payment_url,
          redirectUrl: "https://samyayog.com/payment-status", 
          bookingId: response.data.booking_id,
          bookingType: bookingData.serviceType
        } as any);
      } else {
        Alert.alert("Booking Failed", response.error || "Could not initiate payment.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Network error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!bookingData) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Booking</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 🟢 4. Dynamic Summary Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          
          {/* Service Name */}
          <View style={styles.row}>
            <Text style={styles.label}>{isYoga ? "Class Name" : "Consultation"}</Text>
            {/* ✅ FIXED: Use serviceName instead of planTitle */}
            <Text style={styles.value}>{bookingData.serviceName}</Text>
          </View>

          {/* Professional Name */}
          <View style={styles.row}>
            <Text style={styles.label}>{isYoga ? "Instructor" : "Doctor"}</Text>
            <Text style={styles.value}>{bookingData.professionalName || 'Samyayog Professional'}</Text>
          </View>

          {/* Date & Time */}
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
               {bookingData.date ? new Date(bookingData.date).toDateString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{bookingData.time}</Text>
          </View>

          {/* Mode (Yoga Specific) */}
          {isYoga && (
            <View style={styles.row}>
              <Text style={styles.label}>Mode</Text>
              <Text style={styles.value}>{(bookingData.deliveryMode || 'Online').replace(/_/g, ' ')}</Text>
            </View>
          )}
        </View>

        {/* 🟢 5. Price Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payment Details</Text>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹ {bookingData.price}</Text>
          </View>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.infoText}>
            You will be redirected to PhonePe to complete your payment securely.
          </Text>
        </View>

      </ScrollView>

      {/* Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirmBooking}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmButtonText}>Pay ₹ {bookingData.price}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', elevation: 2 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  content: { padding: 16 },
  
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 12 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  label: { fontSize: 14, color: '#666' },
  value: { fontSize: 14, fontWeight: '600', color: '#333', textAlign: 'right', flex: 1, marginLeft: 20 },
  
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: theme.colors.primary },

  infoBox: { flexDirection: 'row', backgroundColor: '#E3F2FD', padding: 12, borderRadius: 8, gap: 10, alignItems: 'center' },
  infoText: { fontSize: 12, color: '#1565C0', flex: 1, lineHeight: 18 },

  footer: { padding: 16, backgroundColor: '#fff', elevation: 10 },
  confirmButton: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default BookingConfirmationScreen;
