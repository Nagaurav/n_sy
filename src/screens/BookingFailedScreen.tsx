import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  Dimensions,
  StatusBar,
  Alert,
  Linking,
  ScrollView
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// Define the navigation and route prop types
type BookingFailedScreenNavigationProp = StackNavigationProp<RootStackParamList, 'BookingFailed'>;
type BookingFailedScreenRouteProp = RouteProp<RootStackParamList, 'BookingFailed'>;

// Define the component's props interface
interface BookingFailedScreenProps {
  route: BookingFailedScreenRouteProp;
}

const BookingFailedScreen = ({ route }: BookingFailedScreenProps) => {
  const navigation = useNavigation<BookingFailedScreenNavigationProp>();
  const { bookingId, error } = route.params || {};
  
  // Animation values
  const [scaleValue] = useState(new Animated.Value(0));
  const [fadeValue] = useState(new Animated.Value(0));
  const [shakeValue] = useState(new Animated.Value(0));
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Start animations when component mounts
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Shake animation for error icon
      Animated.sequence([
        Animated.timing(shakeValue, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: -10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: 10, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeValue, { toValue: 0, duration: 100, useNativeDriver: true }),
      ]),
    ]).start();
  }, [scaleValue, fadeValue, shakeValue]);

  const handleRetry = () => {
    console.log(' User wants to retry payment for booking:', bookingId);
    // Navigate back to payment screen or booking confirmation
    navigation.goBack();
  };

  const handleContactSupport = () => {
    setShowHelp(!showHelp);
  };

  const handleCallSupport = () => {
    // Open phone dialer with support number
    Linking.openURL('tel:1800-123-4567').catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer');
    });
  };

  const handleEmailSupport = () => {
    // Open email client with support email
    Linking.openURL('mailto:support@samyayog.com?subject=Payment Issue - Booking ' + (bookingId || 'Unknown')).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleViewBookings = () => {
    // Navigate to appointments screen to check booking status
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'HomeStack',
      params: {
        screen: 'Home',
        params: {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Error Icon with Animation */}
          <Animated.View 
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: scaleValue },
                  { translateX: shakeValue }
                ],
                opacity: fadeValue,
              },
            ]}
          >
            <View style={styles.iconBackground}>
              <Ionicons name="close-circle" size={width > 380 ? 100 : 80} color="#FFFFFF" />
            </View>
          </Animated.View>
          
          {/* Error Messages */}
          <Animated.View 
            style={[
              styles.textContainer,
              {
                opacity: fadeValue,
              },
            ]}
          >
            <Text style={styles.title}>Payment Failed</Text>
            <Text style={styles.subtitle}>
              {error || 'There was an issue processing your payment. Please try again.'}
            </Text>
            
            {bookingId && (
              <View style={styles.referenceContainer}>
                <Ionicons name="receipt-outline" size={16} color="#6b7280" />
                <Text style={styles.referenceText}>Reference: #{bookingId}</Text>
              </View>
            )}
          </Animated.View>
          
          {/* Error Details Card */}
          <Animated.View 
            style={[
              styles.detailsContainer,
              {
                opacity: fadeValue,
              },
            ]}
          >
            <View style={styles.detailsHeader}>
              <Ionicons name="alert-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.detailsTitle}>What Happened?</Text>
            </View>
            
            <Text style={styles.detailsText}>
              {error || 'The payment could not be completed. This could be due to insufficient funds, network issues, or a temporary problem with the payment gateway.'}
            </Text>
            
            <View style={styles.suggestionsList}>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.suggestionText}>Check your account balance</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.suggestionText}>Ensure stable internet connection</Text>
              </View>
              <View style={styles.suggestionItem}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.suggestionText}>Try a different payment method</Text>
              </View>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View 
            style={[
              styles.buttonsContainer,
              {
                opacity: fadeValue,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleRetry}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleContactSupport}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={20} color="#DC2626" />
              <Text style={styles.secondaryButtonText}>Get Help</Text>
            </TouchableOpacity>

            {/* Expandable Help Section */}
            {showHelp && (
              <Animated.View style={styles.helpContainer}>
                <TouchableOpacity
                  style={styles.helpOption}
                  onPress={handleCallSupport}
                >
                  <Ionicons name="call-outline" size={18} color="#059669" />
                  <Text style={styles.helpOptionText}>Call Support: 1800-123-4567</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.helpOption}
                  onPress={handleEmailSupport}
                >
                  <Ionicons name="mail-outline" size={18} color="#059669" />
                  <Text style={styles.helpOptionText}>Email Support</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.helpOption}
                  onPress={handleViewBookings}
                >
                  <Ionicons name="calendar-outline" size={18} color="#059669" />
                  <Text style={styles.helpOptionText}>Check Booking Status</Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View style={styles.secondaryButtonsRow}>
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleViewBookings}
                activeOpacity={0.8}
              >
                <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                <Text style={styles.tertiaryButtonText}>My Bookings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.tertiaryButton}
                onPress={handleBackToHome}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={16} color="#6b7280" />
                <Text style={styles.tertiaryButtonText}>Home</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef2f2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: width > 380 ? 24 : 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  // Icon styles
  iconContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  iconBackground: {
    width: width > 380 ? 160 : 120,
    height: width > 380 ? 160 : 120,
    borderRadius: width > 380 ? 80 : 60,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
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
    fontSize: width > 380 ? 28 : 24,
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
    marginBottom: 16,
  },
  referenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  referenceText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
    marginLeft: 8,
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
    borderColor: '#fecaca',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  detailsText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  suggestionsList: {
    gap: 12,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 12,
    flex: 1,
  },
  // Button styles
  buttonsContainer: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#DC2626',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#DC2626',
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
  secondaryButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DC2626',
  },
  secondaryButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  helpContainer: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  helpOptionText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tertiaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tertiaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default BookingFailedScreen;