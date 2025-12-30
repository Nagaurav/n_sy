import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  Dimensions,
  StatusBar
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// Define the navigation and route prop types
type BookingSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type BookingSuccessScreenRouteProp = RouteProp<RootStackParamList, 'BookingSuccess'>;

// Define the component's props interface
interface BookingSuccessScreenProps {
  route: BookingSuccessScreenRouteProp;
}

const BookingSuccessScreen = ({ route }: BookingSuccessScreenProps) => {
  const navigation = useNavigation<BookingSuccessScreenNavigationProp>();
  const { bookingId, amount, bookingDetails, status, message } = route.params;
  
  // Animation values
  const [scaleValue] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));
  const [slideValue] = useState(new Animated.Value(50));
  const [showConfetti, setShowConfetti] = useState(true);

  // Debug: Log when screen receives deep link parameters
  console.log('🎉 BookingSuccessScreen received params:', { bookingId, amount, bookingDetails, status, message });

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideValue, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Hide confetti after 3 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);

    // If this was opened via deep link, we might need to fetch booking details
    if (bookingId && !bookingDetails) {
      console.log('📱 BookingSuccessScreen opened via deep link for booking:', bookingId);
      // TODO: Fetch booking details if needed
    }

    return () => clearTimeout(confettiTimer);
  }, [bookingId, bookingDetails, scaleValue, fadeValue, slideValue]);

  const handleViewAppointments = () => {
    // Navigate to MainDrawer -> HomeStack -> Appointments
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'HomeStack',
      params: {
        screen: 'Home',
        params: {
          // Navigate to Appointments in drawer after Home loads
          openDrawer: 'Appointments'
        }
      }
    });
  };

  const handleBackToHome = () => {
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'HomeStack',
      params: {
        screen: 'Home'
      }
    });
  };

  const handleShareBooking = () => {
    // TODO: Implement share functionality
    console.log('Share booking details');
  };

  const handleAddToCalendar = () => {
    // TODO: Implement calendar functionality
    console.log('Add to calendar');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(6)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'][index],
                  transform: [
                    { translateY: slideValue },
                    { rotate: slideValue.interpolate({
                      inputRange: [0, 50],
                      outputRange: ['0deg', '360deg'],
                    })},
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      <View style={styles.content}>
        {/* Success Icon with Animation */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: scaleValue }],
              opacity: fadeValue,
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <Ionicons name="checkmark-circle" size={100} color="#FFFFFF" />
          </View>
        </Animated.View>
        
        {/* Success Messages */}
        <Animated.View 
          style={[
            styles.textContainer,
            {
              opacity: fadeValue,
              transform: [{ translateY: slideValue }],
            },
          ]}
        >
          <Text style={styles.title}>
            {status === 'success' ? 'Payment Successful!' : 'Booking Confirmed!'}
          </Text>
          <Text style={styles.subtitle}>
            {message || 'Your booking has been confirmed successfully'}
          </Text>
        </Animated.View>
        
        {/* Booking Details Card */}
        <Animated.View 
          style={[
            styles.detailsContainer,
            {
              opacity: fadeValue,
              transform: [{ translateY: slideValue }],
            },
          ]}
        >
          <View style={styles.detailsHeader}>
            <Ionicons name="calendar-check" size={20} color="#4CAF50" />
            <Text style={styles.detailsTitle}>Booking Details</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Booking ID</Text>
            <Text style={styles.detailsValue}>#{bookingId}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Text style={styles.detailsLabel}>Amount Paid</Text>
            <Text style={styles.detailsValue}>₹{amount}</Text>
          </View>
          
          {bookingDetails?.professionalName && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Professional</Text>
              <Text style={styles.detailsValue}>{bookingDetails.professionalName}</Text>
            </View>
          )}
          
          {bookingDetails?.serviceName && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Service</Text>
              <Text style={styles.detailsValue}>{bookingDetails.serviceName}</Text>
            </View>
          )}
          
          {bookingDetails?.date && bookingDetails?.time && (
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Schedule</Text>
              <Text style={styles.detailsValue}>{bookingDetails.date} at {bookingDetails.time}</Text>
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeValue,
              transform: [{ translateY: slideValue }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewAppointments}
            activeOpacity={0.8}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.primaryButtonText}>View My Appointments</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAddToCalendar}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-add-outline" size={18} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShareBooking}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={18} color="#666666" style={styles.buttonIcon} />
            <Text style={styles.tertiaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Confetti styles
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Icon styles
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  // Text styles
  textContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // Details card styles
  detailsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsLabel: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  // Button styles
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  tertiaryButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default BookingSuccessScreen;

