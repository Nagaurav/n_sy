import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Animated, 
  StatusBar,
  ScrollView,
  Share,
  Alert,
  Linking,
  Dimensions
} from 'react-native';
import { useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { apiService } from '../services';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../theme';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

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
  const appTheme = useTheme();
  const { bookingId, amount, bookingDetails, status, message, transactionId, paymentId } = route.params;
  
  // Use available ID (some flows might name it differently)
  const activeTransactionId = transactionId || paymentId;
  
  // Debug: Log transaction ID to confirm it exists
  console.log('Transaction ID:', activeTransactionId);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  // Helper component for consistent detail rows
  const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailIconContainer}>
        <Ionicons name={icon as any} size={20} color={appTheme.theme.colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );

  // Debug: Log when screen receives deep link parameters
  console.log('🎉 BookingSuccessScreen received params:', { bookingId, amount, bookingDetails, status, message });

  useEffect(() => {
    // Enhanced animation sequence
    const runAnimations = () => {
      // Main animation sequence
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    };

    runAnimations();
  }, []);

  const handleViewAppointments = () => {
    // Navigate to Appointments screen through MainDrawer
    navigation.getParent()?.navigate('MainDrawer', {
      screen: 'Appointments'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#008272" barStyle="light-content" />
      
      {/* Header - Matching ProfessionalHomeHeader */}
      <LinearGradient 
        colors={['#008272', '#4C7360', '#2F5233']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>
              Booking Confirmed
            </Text>
            <Text style={styles.headerSubtitle}>
              Your appointment has been scheduled
            </Text>
          </View>
          
          <View style={styles.placeholderButton} />
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Card - Enhanced Modern Design */}
        <Animated.View style={[
          styles.card,
          styles.successCard,
          { 
            opacity: fadeAnim, 
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          }
        ]}>
          {/* Success Icon with Animation */}
          <View style={styles.successIconContainer}>
            <Animated.View 
              style={[
                styles.successIcon,
                { 
                  transform: [{ scale: scaleAnim }],
                }
              ]}
            >
              <Ionicons name="checkmark" size={32} color="#FFFFFF" />
            </Animated.View>
          </View>
          
          {/* Success Content */}
          <View style={styles.successContent}>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>
              {bookingDetails?.serviceName?.includes('Class') || bookingDetails?.serviceName?.includes('Yoga')
                ? 'Your yoga class has been enrolled successfully'
                : 'Your consultation has been booked successfully'
              }
            </Text>
          </View>
          
          {/* Status Badge - Centered */}
          <View style={styles.successBadgeContainer}>
            <View style={[styles.statusBadge, styles.successBadge]}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.successBadgeText}>CONFIRMED</Text>
            </View>
          </View>
          
          {/* Success Message */}
          <View style={styles.successMessage}>
            <Text style={styles.successText}>
              Thank you for choosing Samyayog, {user?.first_name || 'Yogi'}!{'\n'}
              Your booking confirmation has been sent to your registered email.
            </Text>
          </View>
          
          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>#{bookingId}</Text>
              <Text style={styles.statLabel}>Booking ID</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{amount}</Text>
              <Text style={styles.statLabel}>Amount Paid</Text>
            </View>
          </View>
        </Animated.View>

      </ScrollView>

      {/* Footer - Matching ProfessionalHomeScreen Style */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleViewAppointments}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#008272', '#4C7360']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <View style={styles.buttonContent}>
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View My Appointments</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F2ED'
  },
  header: {
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.m,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.s,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  placeholderButton: {
    width: 44,
    height: 44,
  },

  // Modern Card Styles matching ProfessionalHomeScreen
  scrollContent: {
    padding: theme.spacing.m,
    paddingBottom: 120,
  },
  card: { 
    width: '100%',
    backgroundColor: theme.colors.background.surface,
    borderRadius: theme.borderRadius.l,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    ...theme.shadows.card,
  },
  
  // Card Type Styles
  successCard: {
    borderWidth: 1,
    borderColor: theme.colors.feedback.success,
  },

  // Card Header Styles
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#008272',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  cardHeaderSubtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 4,
    textTransform: 'uppercase',
  },

  // Success Message
  successMessage: {
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Enhanced Success Card Styles
  successIconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  successContent: {
    alignItems: 'center',
    marginBottom: theme.spacing.m,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  successBadgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.m,
  },
  successBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.5,
  },

  // Quick Stats Styles
  quickStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    marginTop: theme.spacing.m,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: theme.spacing.l,
  },

  // Enhanced Details Card Styles
  detailsBadge: {
    backgroundColor: '#008272',
  },
  detailsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  detailsGrid: {
    gap: theme.spacing.m,
  },
  detailCard: {
    backgroundColor: '#F8FAFB',
    borderRadius: 12,
    padding: theme.spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00827215',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  detailSubValue: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  detailsContainer: {
    paddingTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.s,
  },
  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.s,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.m,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },

  // Footer
  footer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.m,
    backgroundColor: theme.colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  primaryButton: { 
    borderRadius: theme.borderRadius.m,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.m,
    paddingHorizontal: theme.spacing.l,
    borderRadius: theme.borderRadius.m,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s,
  },
  primaryButtonText: { 
    color: '#FFFFFF', 
    fontSize: 16, 
    fontWeight: 'bold'
  }
});

export default BookingSuccessScreen;

