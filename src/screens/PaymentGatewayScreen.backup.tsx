import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { HomeStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

type PaymentGatewayRouteProp = RouteProp<HomeStackParamList, 'PaymentGateway'>;
type PaymentGatewayNavigationProp = StackNavigationProp<HomeStackParamList, 'PaymentGateway'>;

const PaymentGatewayScreen = () => {
  const navigation = useNavigation<PaymentGatewayNavigationProp>();
  const route = useRoute<PaymentGatewayRouteProp>();
  const { paymentUrl, bookingId } = route.params;
  const { user } = useAuth();
  
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentVerified, setPaymentVerified] = useState<boolean | null>(null);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (webViewRef.current) {
        Alert.alert(
          'Cancel Payment',
          'Are you sure you want to cancel the payment? Your booking will not be confirmed.',
          [
            {
              text: 'Continue Payment',
              style: 'cancel',
            },
            {
              text: 'Cancel Payment',
              onPress: () => navigation.goBack(),
              style: 'destructive',
            },
          ]
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Handle navigation state changes in WebView
  const handleNavigationStateChange = async (navState: any) => {
    const { url } = navState;
    
    // Check if the navigation is to a success or failure URL
    if (url.includes('/payment/success') || url.includes('/payment/failure')) {
      // Hide the WebView and verify payment status with the backend
      setIsLoading(true);
      await verifyPaymentStatus();
    }
  };

  // Verify payment status with the backend
  const verifyPaymentStatus = async () => {
    if (!bookingId) {
      setError('Invalid booking reference');
      return;
    }

    try {
      const response = await apiService.getPaymentStatus(bookingId);
      
      if (response.success && response.data) {
        setPaymentVerified(response.data.status === 'SUCCESS');
        
        // Navigate to success or failure screen based on payment status
        if (response.data.status === 'SUCCESS') {
          navigation.replace('BookingSuccess', {
            bookingId,
            amount: response.data.amount,
            bookingDetails: response.data.bookingDetails
          });
        } else {
          navigation.replace('BookingFailed', {
            bookingId,
            error: response.data.message || 'Payment failed. Please try again.'
          });
        }
      } else {
        throw new Error(response.error || 'Failed to verify payment status');
      }
    } catch (err) {
      console.error('Payment verification error:', err);
      setError('Unable to verify payment status. Please check your bookings.');
      
      // Still navigate to failed screen with error
      navigation.replace('BookingFailed', {
        bookingId,
        error: 'Unable to verify payment. Please check your bookings or contact support.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    if (webViewRef.current) {
      webViewRef.current.reload();
    }
  };

  if (!paymentUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Payment URL is missing</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={styles.headerRight} />
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Processing your payment...</Text>
        </View>
      )}
      
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={handleRefresh}
          >
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.homeButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={[styles.buttonText, { color: '#4F46E5' }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: paymentUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            setError('Failed to load payment page. Please check your internet connection.');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView HTTP error: ', nativeEvent);
            setError('Failed to load payment page. Please try again.');
          }}
          onNavigationStateChange={handleNavigationStateChange}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading payment gateway...</Text>
            </View>
          )}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          bounces={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
  },
  headerRight: {
    width: 40,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
    fontFamily: 'Inter-Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
    marginVertical: 16,
    fontFamily: 'Inter-Regular',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: '#4F46E5',
  },
  homeButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});

export default PaymentGatewayScreen;
