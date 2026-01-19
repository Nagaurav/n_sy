import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  Dimensions,
  StatusBar,
  Share,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { apiService } from '../services';
import { apiClient } from '../services/apiClient';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

// Define the navigation and route prop types
type BookingSuccessScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingSuccess'>;
type BookingSuccessScreenRouteProp = RouteProp<RootStackParamList, 'BookingSuccess'>;

// Define the component's props interface
interface BookingSuccessScreenProps {
  route: BookingSuccessScreenRouteProp & {
    params: {
      transactionId?: string; // Add this
      paymentId?: string;     // Add this (PhonePe might send different keys)
    }
  };
}

const BookingSuccessScreen = ({ route }: BookingSuccessScreenProps) => {
  const navigation = useNavigation<BookingSuccessScreenNavigationProp>();
  const { user } = useAuth();
  const { bookingId, amount, bookingDetails, status, message, transactionId, paymentId } = route.params;
  
  // Use available ID (some flows might name it differently)
  const activeTransactionId = transactionId || paymentId;
  
  // Debug: Log transaction ID to confirm it exists
  console.log('Transaction ID:', activeTransactionId);
  
  // Animation values
  const [scaleValue] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));
  const [slideValue] = useState(new Animated.Value(50));
  const [pulseValue] = useState(new Animated.Value(1));
  const [showConfetti, setShowConfetti] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  // Refs for animation sequencing
  const contentAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Debug: Log when screen receives deep link parameters
  console.log('🎉 BookingSuccessScreen received params:', { bookingId, amount, bookingDetails, status, message });

  useEffect(() => {
    // Enhanced animation sequence
    const runAnimations = () => {
      // Pulse animation for success icon
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      // Main animation sequence
      contentAnimationRef.current = Animated.sequence([
        // Scale and fade in success icon
        Animated.parallel([
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
        ]),
        // Slide up content
        Animated.timing(slideValue, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]);

      contentAnimationRef.current.start(() => {
        // Start pulse animation after main sequence
        pulseAnimation.start();
        setBookingSuccess(true);
      });
    };

    runAnimations();

    // Hide confetti after 4 seconds
    const confettiTimer = setTimeout(() => {
      setShowConfetti(false);
    }, 4000);

    // If this was opened via deep link, we might need to fetch booking details
    if (bookingId && !bookingDetails) {
      console.log('📱 BookingSuccessScreen opened via deep link for booking:', bookingId);
      // TODO: Fetch booking details if needed
    }

    return () => {
      clearTimeout(confettiTimer);
      if (contentAnimationRef.current) {
        contentAnimationRef.current.stop();
      }
    };
  }, []);

  // ✅ FIX: Poll if we have a Transaction ID, regardless of status string
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; 

    const syncPaymentStatus = async () => {
      if (!activeTransactionId) return;

      try {
        console.log(`🔄 [Attempt ${attempts + 1}] Syncing payment: ${activeTransactionId}`);
        console.log(`📡 Calling manual sync endpoint to convert PENDING -> SUCCESS`);
        
        // Manual sync endpoint to force status update
        const response = await apiService.syncPaymentStatus(activeTransactionId);
        
        console.log(`📊 Sync response:`, response.data);
        
        // Enhanced success detection
        const isSuccess = 
             response.data?.msg?.includes('SUCCESS') || 
             response.data?.msg?.includes('updated to SUCCESS') ||
             response.data?.current_status === 'SUCCESS' ||
             response.data?.status === 'SUCCESS';

        const isPending = 
             response.data?.current_status === 'PENDING' ||
             response.data?.status === 'PENDING';

        if (isSuccess) {
          console.log('✅ Payment status successfully converted to SUCCESS!');
          clearInterval(intervalId);
          
          // Optional: Show success feedback to user
          console.log('🎉 Manual sync completed - payment confirmed');
        } else if (isPending) {
          console.log('⏳ Payment still PENDING, will retry sync...');
          // Continue polling
        } else {
          console.log('❓ Unexpected status:', response.data);
        }
      } catch (error) {
        console.error('⚠️ Sync attempt failed:', error);
        // Continue trying even on error, as payment might still be processing
      }
      
      attempts++;
      if (attempts >= MAX_ATTEMPTS) {
        console.log('🛑 Max sync attempts reached. Payment status will be updated by webhook.');
        clearInterval(intervalId);
      }
    };

    // 🚀 CHANGED CONDITION: Run if we have an ID, don't wait for 'status' param
    if (activeTransactionId) {
      syncPaymentStatus(); // Run once immediately
      intervalId = setInterval(syncPaymentStatus, 3000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTransactionId]); // Remove 'status' from dependency array

  const handleViewAppointments = () => {
    // Navigate directly to Appointments screen in drawer
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'Appointments'
    });
  };

  const handleBackToHome = () => {
    // Navigate back to Home screen
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'HomeStack',
      params: {
        screen: 'Home'
      }
    });
  };

  const handleShareBooking = async () => {
    try {
      const isYogaClass = bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga');
      const shareMessage = `${isYogaClass ? '🧘‍♀️ Yoga Class Enrollment Confirmed!' : '🧘‍♀️ Consultation Booking Confirmed!'}\n\n📅 Booking ID: #${bookingId}\n💰 Amount: ₹${amount}\n👨‍⚕️ Professional: ${bookingDetails?.professionalName || 'Expert'}\n📝 Service: ${bookingDetails?.serviceName || 'Yoga Session'}\n⏰ Time: ${bookingDetails?.date || 'Scheduled'} at ${bookingDetails?.time || 'To be confirmed'}\n\nBooked via Samyayog App!`;
      
      await Share.share({
        message: shareMessage,
        title: 'Yoga Booking Confirmation'
      });
    } catch (error) {
      console.error('Error sharing booking:', error);
      Alert.alert('Share Failed', 'Unable to share booking details. Please try again.');
    }
  };

  const handleAddToCalendar = () => {
    // Create calendar event details
    const isYogaClass = bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga');
    const eventTitle = `${isYogaClass ? 'Yoga Class' : 'Consultation'} with ${bookingDetails?.professionalName || 'Expert'}`;
    const eventDetails = `Booking ID: #${bookingId}\nService: ${bookingDetails?.serviceName || 'Yoga Session'}\nAmount: ₹${amount}`;
    
    // Try to open calendar app (basic implementation)
    const calendarUrl = `calendar://event?title=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDetails)}`;
    
    Linking.canOpenURL(calendarUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(calendarUrl);
        } else {
          // Fallback: Show details for manual calendar entry
          Alert.alert(
            'Calendar Event Details',
            `Please add this event to your calendar manually:\n\nTitle: ${eventTitle}\nDate: ${bookingDetails?.date || 'TBD'}\nTime: ${bookingDetails?.time || 'TBD'}\n\n${eventDetails}`,
            [{ text: 'OK', style: 'default' }]
          );
        }
      })
      .catch((error) => {
        console.error('Error opening calendar:', error);
        Alert.alert('Calendar Error', 'Unable to open calendar app. Please check your calendar settings.');
      });
  };

  const handleViewProfile = () => {
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'Profile'
    });
  };

  const handleBookAnother = () => {
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'HomeStack',
      params: {
        screen: 'ProfessionalsList'
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      
      {/* Gradient Background */}
      <View style={styles.gradientBackground}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      
      {/* Enhanced Confetti Animation */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(8)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#DDA0DD', '#90EE90'][index],
                  left: `${10 + (index * 12)}%`,
                  transform: [
                    { translateY: slideValue },
                    { rotate: slideValue.interpolate({
                      inputRange: [0, 50],
                      outputRange: ['0deg', '360deg'],
                    })},
                    { scale: slideValue.interpolate({
                      inputRange: [0, 50],
                      outputRange: [1, 0.5],
                    })},
                  ],
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        {/* Enhanced Success Icon with Animation */}
        <Animated.View 
          style={[
            styles.iconContainer,
            {
              transform: [
                { scale: scaleValue },
                { scale: pulseValue }
              ],
              opacity: fadeValue,
            },
          ]}
        >
          <View style={styles.iconBackground}>
            <Ionicons name="checkmark-circle" size={60} color="#FFFFFF" />
          </View>
          {bookingSuccess && (
            <View style={styles.successRings}>
              <View style={[styles.ring, styles.ring1]} />
            </View>
          )}
        </Animated.View>
        
        {/* Enhanced Success Messages */}
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
            {status === 'success' 
              ? (bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga') 
                ? '🎉 Enrollment Successful!' 
                : '🎉 Payment Successful!')
              : (bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga')
                ? '✨ Class Enrolled!' 
                : '✨ Booking Confirmed!')
            }
          </Text>
          <Text style={styles.subtitle}>
            {message || (
              bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga')
                ? 'Your yoga class enrollment has been confirmed successfully'
                : 'Your consultation session has been confirmed successfully'
            )}
          </Text>
          <View style={styles.userGreeting}>
            <Ionicons name="heart" size={16} color="#FF6B6B" style={styles.heartIcon} />
            <Text style={styles.greetingText}>
              Thank you for choosing Samyayog, {user?.first_name || 'Yogi'}!
            </Text>
          </View>
        </Animated.View>
        
        {/* Enhanced Booking Details Card */}
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
            <View style={styles.detailsHeaderIcon}>
              <Ionicons name="checkmark-done" size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.detailsTitle}>Booking Confirmation</Text>
          </View>
          
          <View style={styles.detailsContent}>
            <View style={styles.detailsRow}>
              <View style={styles.detailsLabelContainer}>
                <Ionicons name="keypad" size={16} color="#4CAF50" style={styles.rowIcon} />
                <Text style={styles.detailsLabel}>Booking ID</Text>
              </View>
              <View style={styles.detailsValueContainer}>
                <Text style={styles.detailsValue}>#{bookingId}</Text>
              </View>
            </View>
            
            <View style={styles.detailsRow}>
              <View style={styles.detailsLabelContainer}>
                <Ionicons name="cash" size={16} color="#4CAF50" style={styles.rowIcon} />
                <Text style={styles.detailsLabel}>Amount Paid</Text>
              </View>
              <View style={styles.detailsValueContainer}>
                <Text style={styles.amountValue}>₹{amount}</Text>
              </View>
            </View>
            
            {bookingDetails?.professionalName && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsLabelContainer}>
                  <Ionicons name="person" size={16} color="#4CAF50" style={styles.rowIcon} />
                  <Text style={styles.detailsLabel}>Professional</Text>
                </View>
                <View style={styles.detailsValueContainer}>
                  <Text style={styles.detailsValue}>{bookingDetails.professionalName}</Text>
                </View>
              </View>
            )}
            
            {bookingDetails?.serviceName && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsLabelContainer}>
                  <Ionicons name="fitness" size={16} color="#4CAF50" style={styles.rowIcon} />
                  <Text style={styles.detailsLabel}>Service</Text>
                </View>
                <View style={styles.detailsValueContainer}>
                  <Text style={styles.detailsValue}>{bookingDetails.serviceName}</Text>
                </View>
              </View>
            )}
            
            {bookingDetails?.date && bookingDetails?.time && (
              <View style={styles.detailsRow}>
                <View style={styles.detailsLabelContainer}>
                  <Ionicons name="time" size={16} color="#4CAF50" style={styles.rowIcon} />
                  <Text style={styles.detailsLabel}>Schedule</Text>
                </View>
                <View style={styles.detailsValueContainer}>
                  <Text style={styles.detailsValue}>{bookingDetails.date} at {bookingDetails.time}</Text>
                </View>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Enhanced Action Buttons */}
        <Animated.View 
          style={[
            styles.buttonsContainer,
            {
              opacity: fadeValue,
              transform: [{ translateY: slideValue }],
            },
          ]}
        >
          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewAppointments}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="calendar-outline" size={22} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>View My Appointments</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" style={styles.buttonArrow} />
          </TouchableOpacity>

          {/* Secondary Actions Row */}
          <View style={styles.secondaryButtonsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleAddToCalendar}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons name="calendar" size={20} color="#4CAF50" />
                <Text style={styles.secondaryButtonText}>Add to Calendar</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleShareBooking}
              activeOpacity={0.8}
            >
              <View style={styles.secondaryButtonContent}>
                <Ionicons name="share-outline" size={20} color="#4CAF50" />
                <Text style={styles.secondaryButtonText}>Share</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tertiary Actions */}
          <View style={styles.tertiaryButtonsRow}>
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleBookAnother}
              activeOpacity={0.8}
            >
              <View style={styles.tertiaryButtonContent}>
                <Ionicons name="add-circle-outline" size={18} color="#666666" />
                <Text style={styles.tertiaryButtonText}>Book Another Session</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleViewProfile}
              activeOpacity={0.8}
            >
              <View style={styles.tertiaryButtonContent}>
                <Ionicons name="person-outline" size={18} color="#666666" />
                <Text style={styles.tertiaryButtonText}>My Profile</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Home Button */}
          <TouchableOpacity
            style={styles.homeButton}
            onPress={handleBackToHome}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color="#4CAF50" style={styles.buttonIcon} />
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  // Gradient background
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: '#4CAF50',
    opacity: 0.08,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: 20,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  // Enhanced confetti styles
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
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Enhanced icon styles
  iconContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    position: 'relative',
  },
  iconBackground: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  successRings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 100,
    opacity: 0.2,
  },
  ring1: {
    width: 120,
    height: 120,
  },
  // Enhanced text styles
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  heartIcon: {
    marginRight: 8,
  },
  greetingText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '600',
  },
  // Enhanced details card styles
  detailsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  detailsHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailsContent: {
    padding: 20,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  detailsValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  detailsValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
    textAlign: 'right',
  },
  // Enhanced button styles
  buttonsContainer: {
    width: '100%',
    gap: 10,
    paddingBottom: 20,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonArrow: {
    marginLeft: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#4CAF50',
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tertiaryButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  tertiaryButton: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tertiaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  homeButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  homeButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default BookingSuccessScreen;

