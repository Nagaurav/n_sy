import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Define the navigation and route prop types
type BookingFailedScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'BookingFailed'>;
type BookingFailedScreenRouteProp = RouteProp<HomeStackParamList, 'BookingFailed'>;

// Define the component's props interface
interface BookingFailedScreenProps {
  route: BookingFailedScreenRouteProp;
}

const BookingFailedScreen = ({ route }: BookingFailedScreenProps) => {
  const navigation = useNavigation<BookingFailedScreenNavigationProp>();
  const { bookingId, error } = route.params;

  const handleRetry = () => {
    // Navigate back to payment screen or any other appropriate screen
    navigation.goBack();
  };

  const handleContactSupport = () => {
    // Implement contact support functionality
    Alert.alert(
      'Contact Support',
      'Please contact our support team for assistance.',
      [{ text: 'OK' }]
    );
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
          <Ionicons name="close-circle" size={80} color="#FF3B30" />
        </View>
        
        <Text style={styles.title}>Payment Failed</Text>
        <Text style={styles.subtitle}>
          {error || 'There was an issue processing your payment. Please try again.'}
        </Text>
        
        {bookingId && (
          <View style={styles.detailsContainer}>
            <Text style={styles.detailText}>Reference: {bookingId}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleRetry}
        >
          <Text style={styles.primaryButtonText}>Retry Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleContactSupport}
        >
          <Text style={styles.secondaryButtonText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tertiaryButton}
          onPress={handleBackToHome}
        >
          <Text style={styles.tertiaryButtonText}>Back to Home</Text>
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
    paddingHorizontal: 20,
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
    textAlign: 'center',
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
    marginBottom: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    padding: 16,
  },
  tertiaryButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BookingFailedScreen;