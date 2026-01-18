import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  BackHandler,
  Alert,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services';
import { RootStackParamList } from '../../App';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Define the route and navigation types
type PaymentGatewayRouteProp = RouteProp<RootStackParamList, 'PaymentGateway'>;
type PaymentGatewayNavigationProp = StackNavigationProp<RootStackParamList, 'PaymentGateway'>;

// Define the API response type
interface PaymentStatusResponse {
  success: boolean;
  data?: {
    status: string;
    amount: number;
    bookingDetails?: {
      professionalName?: string;
      serviceName?: string;
      date?: string;
      time?: string;
    };
  };
  error?: string;
}

const PaymentGatewayScreen = () => {
  const navigation = useNavigation<PaymentGatewayNavigationProp>();
  const route = useRoute<PaymentGatewayRouteProp>();
  const { paymentUrl, bookingId, paymentId } = route.params;
  
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [verifyingText, setVerifyingText] = useState('Verifying Payment...');
  
  const maxRetries = 10; // Try for 30 seconds (10 retries x 3 seconds)
  const retryInterval = 3000; // 3 seconds

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
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
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);

  // Handle navigation state changes in WebView
  const handleNavigationStateChange = async (navState: WebViewNavigation) => {
    const { url } = navState;
    
    // Skip processing if URL is undefined or about:blank
    if (!url || url === 'about:blank') return;
    
    console.log('WebView navigation:', { url });
    
    // 1. INTERCEPT: Check for the Callback URL (Localhost or your Success URL)
    // This catches the moment PhonePe tries to redirect you back
    const isCallback = 
      url.includes('localhost') || 
      url.includes('127.0.0.1') || 
      url.includes('payment/callback') || 
      url.includes('payment/success');

    if (isCallback) {
      console.log(' Payment callback detected. Intercepting and Verifying:', url);
      
      // A. Stop the WebView from trying to load the page (which might fail on localhost)
      webViewRef.current?.stopLoading();
      
      // B. Show the "Verifying..." overlay
      setIsVerifying(true);
      setVerifyingText('Confirming payment with bank...');

      // C. TRIGGER BACKEND VERIFICATION
      // We wait 2 seconds to give the bank time to sync, then we ask your Backend to check.
      setTimeout(() => {
        verifyPaymentStatus(); 
      }, 2000);
      
      return; // Stop execution here
    }
    
    // Check if the navigation is to the payment completion callback URL
    const isPaymentCompletionUrl = [
      'samyayog.com/payment-complete',
      '/payment/failure',
      'payment-complete',
      'payment/failure'
    ].some(pattern => url.includes(pattern));
    
    if (isPaymentCompletionUrl) {
      console.log('Payment completion detected, verifying status...', { url });
      setIsVerifying(true);
      // Small delay to ensure the page has fully loaded
      setTimeout(() => {
        verifyPaymentStatus();
      }, 1000);
    }
  };

  // Verify payment status with backend
  const verifyPaymentStatus = async (currentRetry = 0) => {
    if (!bookingId) {
      setError('Invalid booking reference');
      setIsVerifying(false);
      return;
    }

    try {
      console.log(`Calling getBookingPaymentStatus for booking: ${bookingId} (attempt ${currentRetry + 1}/${maxRetries})`);

      // Call the booking payment status endpoint (returns backend wrapper)
      const wrapped = await apiService.getBookingPaymentStatus(bookingId);

      console.log('Payment status response:', wrapped);

      const response: PaymentStatusResponse = wrapped as any;

      // Debug: Log the actual response structure
      console.log(' Full response structure:', {
        response: wrapped,
        responseData: wrapped.data,
        responseDataKeys: wrapped.data ? Object.keys(wrapped.data) : 'no data',
        bookingDetails: wrapped.data?.bookingDetails,
        bookingDetailsKeys: wrapped.data?.bookingDetails ? Object.keys(wrapped.data.bookingDetails) : 'no booking details'
      });

      // Accept response even if success field is missing, as long as data is present
      if (response.data || (response.success && response.data)) {
        const { status, amount, bookingDetails } = response.data || {};
        
        console.log(' Payment status response processed:', {
          hasSuccess: !!response.success,
          hasData: !!response.data,
          status,
          amount,
          hasBookingDetails: !!bookingDetails
        });
        
        // Navigate to success or failure screen based on payment status
        if (status === 'SUCCESS' || status === 'COMPLETED') {
          console.log(' Payment successful, performing manual sync before navigation');
          
          try {
            // Perform manual sync to ensure status is updated from PENDING to SUCCESS
            console.log(`📡 Manual sync for booking: ${bookingId}, payment: ${paymentId}`);
            const syncResponse = await apiService.syncPaymentStatus(paymentId || bookingId);
            console.log('📊 Manual sync response:', syncResponse.data);
            
            // Check if sync was successful
            const isSuccess = 
              syncResponse.data?.msg?.includes('SUCCESS') || 
              syncResponse.data?.msg?.includes('updated to SUCCESS') ||
              syncResponse.data?.current_status === 'SUCCESS' ||
              syncResponse.data?.status === 'SUCCESS';
            
            if (isSuccess) {
              console.log('✅ Payment sync successful - status updated to SUCCESS');
            } else {
              console.log('⚠️ Payment sync completed but status still pending - webhook will handle final update');
            }
          } catch (syncError) {
            console.warn('⚠️ Manual sync failed, but continuing to success screen:', syncError);
            // Don't block navigation if sync fails
          }
          
          console.log('🎉 Navigating to success screen');
          navigation.replace('BookingSuccess', {
            bookingId,
            paymentId,
            amount: amount || 0,
            bookingDetails: bookingDetails || {},
            status: 'success',
            message: 'Payment completed successfully'
          });
        } else if (status === 'FAILED' || status === 'CANCELLED') {
          console.log('❌ Payment failed, navigating to failure screen');
          navigation.replace('BookingFailed', {
            bookingId,
            error: response.error || 'Payment was not completed successfully.'
          });
        } else {
          // Handle pending or other statuses with retry logic
          console.log(`⏳ Status is ${status} (attempt ${currentRetry + 1}/${maxRetries})`);
          
          // 🚀 ADD THIS: Force backend to check with PhonePe immediately
          // instead of waiting for webhook.
          if (paymentId) {
              try {
                  console.log(`📡 Force syncing status with PhonePe for payment: ${paymentId}...`);
                  await apiService.syncPaymentStatus(paymentId);
              } catch (err) {
                  console.log(`⚠️ Force sync failed for payment: ${paymentId}, but continuing retry loop`);
              }
          }

          console.log(`⏳ Payment status: ${status} (attempt ${currentRetry + 1}/${maxRetries})`);
          
          if (currentRetry < maxRetries - 1) {
            // Update retry count and message
            const newRetryCount = currentRetry + 1;
            setRetryCount(newRetryCount);
            setVerifyingText(`Verifying Payment... (${newRetryCount}/${maxRetries})`);
            
            // Schedule next retry
            setTimeout(() => {
              verifyPaymentStatus(newRetryCount);
            }, retryInterval);
          } else {
            // Max retries reached, navigate to failed screen
            console.log('⏰ Max retries reached, navigating to failed screen');
            navigation.replace('BookingFailed', {
              bookingId,
              error: `Verification timed out. Status: ${status}`
            });
          }
        }
      } else {
        // No data in response, treat as failure
        console.log('❌ No payment data received in response:', response);
        throw new Error(response.error || 'No payment status data received');
      }
    } catch (err: any) {
      console.error(`Payment verification error (attempt ${currentRetry + 1}/${maxRetries}):`, err);
      
      if (currentRetry < maxRetries - 1) {
        // Retry on network errors as well
        const newRetryCount = currentRetry + 1;
        setRetryCount(newRetryCount);
        setVerifyingText(`Verifying Payment... (${newRetryCount}/${maxRetries})`);
        
        setTimeout(() => {
          verifyPaymentStatus(newRetryCount);
        }, retryInterval);
      } else {
        // Max retries reached, show error and navigate to failed screen
        setError(err.message || 'Failed to verify payment status');
        navigation.replace('BookingFailed', {
          bookingId,
          error: `Unable to verify payment status after ${maxRetries} attempts. ${err.message || 'Please check your bookings or contact support.'}`
        });
      }
    }
  };

  const handleError = () => {
    setError('Failed to load payment page. Please check your internet connection and try again.');
    setIsLoading(false);
  };

  const handleLoadStart = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView load started:', {
      url: nativeEvent.url,
      loading: nativeEvent.loading,
      title: nativeEvent.title || 'No title'
    });
    setIsLoading(true);
  };

  const handleLoadEnd = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView load finished:', {
      url: nativeEvent.url,
      loading: nativeEvent.loading,
      title: nativeEvent.title || 'No title'
    });
    setIsLoading(false);
  };

  const handleLoad = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView loaded successfully:', {
      url: nativeEvent.url,
      title: nativeEvent.title || 'No title'
    });
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              'Cancel Payment',
              'Are you sure you want to cancel the payment? Your booking will not be confirmed.',
              [
                { text: 'No', style: 'cancel' },
                { 
                  text: 'Yes', 
                  onPress: () => navigation.goBack(),
                  style: 'destructive'
                }
              ]
            );
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Secure Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setIsLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Full-screen loading overlay while WebView initially loads */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.loadingText}>Loading payment gateway...</Text>
            </View>
          )}
          
          {/* Full-screen verifying overlay after payment completion */}
          {isVerifying && (
            <View style={styles.verifyingContainer}>
              <ActivityIndicator size="large" color="#4A90E2" />
              <Text style={styles.verifyingText}>{verifyingText}</Text>
              <Text style={styles.verifyingSubtext}>Please wait while we confirm your payment</Text>
            </View>
          )}
          
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={handleLoadStart}
            onLoad={handleLoad}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading payment gateway...</Text>
              </View>
            )}
            scalesPageToFit={true}
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled={true}
            allowsBackForwardNavigationGestures={true}
            cacheEnabled={false}
            incognito={false}
            onContentProcessDidTerminate={() => {
              console.log('WebView process terminated, reloading...');
              webViewRef.current?.reload();
            }}
          />
        </>
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
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  verifyingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default PaymentGatewayScreen;