import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Define the navigation and route prop types
type BookingSuccessScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BookingSuccess'>;
type BookingSuccessScreenRouteProp = RouteProp<HomeStackParamList, 'BookingSuccess'>;

// Define the component's props interface
interface BookingSuccessScreenProps {
  route: BookingSuccessScreenRouteProp;
}

const BookingSuccessScreen = ({ route }: BookingSuccessScreenProps) => {
  const navigation = useNavigation<BookingSuccessScreenNavigationProp>();
  const { bookingId, amount, bookingDetails } = route.params;

  const handleViewAppointments = () => {
    // Navigate to Home first, then to the Appointments screen in the drawer
    navigation.reset({
      index: 0,
      routes: [{ 
        name: 'Home', 
        params: { 
          screen: 'Appointments' // This tells the drawer to show the Appointments screen
        } 
      }],
    });
  };

  const handleBackToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        </View>
        
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>Your booking has been confirmed</Text>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>Booking ID: {bookingId}</Text>
          <Text style={styles.detailText}>Amount: ₹{amount}</Text>
          
          {bookingDetails?.professionalName && (
            <Text style={styles.detailText}>
              Professional: {bookingDetails.professionalName}
            </Text>
          )}
          
          {bookingDetails?.serviceName && (
            <Text style={styles.detailText}>
              Service: {bookingDetails.serviceName}
            </Text>
          )}
          
          {bookingDetails?.date && bookingDetails?.time && (
            <Text style={styles.detailText}>
              Scheduled: {bookingDetails.date} at {bookingDetails.time}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewAppointments}
        >
          <Text style={styles.primaryButtonText}>View My Appointments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToHome}
        >
          <Text style={styles.secondaryButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
    textAlign: 'center',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  detailText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingSuccessScreen;

