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
  const { paymentUrl, bookingId, paymentId, transactionId, bookingType = 'consultation' } = route.params;
  
  // Extract IDs from URL if not provided in params (fallback mechanism)
  const extractIdFromUrl = (url: string, paramName: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(paramName);
    } catch {
      return null;
    }
  };
  
  const fallbackBookingId = bookingId || extractIdFromUrl(paymentUrl, 'booking_id') || extractIdFromUrl(paymentUrl, 'bookingId');
  const fallbackTransactionId = transactionId || extractIdFromUrl(paymentUrl, 'transaction_id') || extractIdFromUrl(paymentUrl, 'transactionId');
  
  // Debug: Log received parameters
  console.log('🔍 [PaymentGateway] Received params:', {
    paymentUrl: paymentUrl ? 'Present' : 'Missing',
    bookingId: bookingId || 'MISSING',
    paymentId: paymentId || 'Missing',
    transactionId: transactionId || 'Missing',
    bookingType: bookingType || 'consultation',
    fallbackBookingId: fallbackBookingId || 'NOT_FOUND_IN_URL',
    fallbackTransactionId: fallbackTransactionId || 'NOT_FOUND_IN_URL',
    allParams: route.params,
    paymentUrlPreview: paymentUrl ? paymentUrl.substring(0, 100) + '...' : 'NO_URL'
  });
  
  // Log URL extraction details
  console.log('🔍 [PaymentGateway] URL extraction details:', {
    originalBookingId: bookingId,
    originalTransactionId: transactionId,
    urlBookingId: extractIdFromUrl(paymentUrl, 'booking_id'),
    urlBookingIdAlt: extractIdFromUrl(paymentUrl, 'bookingId'),
    urlTransactionId: extractIdFromUrl(paymentUrl, 'transaction_id'),
    urlTransactionIdAlt: extractIdFromUrl(paymentUrl, 'transactionId'),
    finalFallbackBookingId: fallbackBookingId,
    finalFallbackTransactionId: fallbackTransactionId
  });
  
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
    // For yoga bookings, use transactionId; for consultations, use bookingId
    const referenceId = bookingType === 'yoga_class' 
      ? (transactionId || bookingId) // Yoga expects transactionId
      : (bookingId || transactionId); // Consultation expects bookingId

    if (!referenceId) {
      console.error('❌ [PaymentGateway] No reference ID found for verification');
      setError('Session reference lost. Please check your appointments.');
      setIsVerifying(false);
      return;
    }
    
    const idType = bookingType === 'yoga_class' ? 'transactionId' : 'bookingId';
    console.log(`✅ [PaymentGateway] Verifying for ${bookingType} using ${idType}: ${referenceId} (attempt ${currentRetry + 1}/${maxRetries})`);

    try {
      // Update your API call to use the referenceId and bookingType
      const wrapped = await apiService.getBookingPaymentStatus(referenceId, bookingType);

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
          
          // Add safety guard - only attempt sync if we have a valid transactionId
          if (transactionId && transactionId !== 'Missing' && transactionId !== 'Missing') {
            try {
              // Perform manual sync to ensure status is updated from PENDING to SUCCESS
              console.log(`📡 Performing manual sync for TXN: ${transactionId}`);
              const syncResponse = await apiService.syncPaymentStatus(transactionId, bookingType);
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
          } else {
            console.log('⚠️ Skipping manual sync - no valid transactionId available');
          }

          console.log('🎉 Navigating to success screen');
          navigation.replace('BookingSuccess', {
            bookingId,
            paymentId,
            amount: response.data?.amount || 0,
            status: status,
            message: 'Payment completed successfully',
            bookingDetails: response.data?.bookingDetails,
          });
        } else if (status === 'PENDING') {
          console.log(` Status is PENDING (attempt ${currentRetry + 1}/10)`);

          // 1. Force the backend to sync with PhonePe using the transactionId
          if (transactionId && transactionId !== 'Missing') {
            try {
              console.log(` Forcing backend sync for: ${transactionId}`);
              await apiService.syncPaymentStatus(transactionId, bookingType); 
            } catch (err) {
              console.log("Manual sync request failed, waiting for next poll...");
            }
          }

          // 2. RETRY loop: Wait 3 seconds and check again
          if (currentRetry < 9) {
            setTimeout(() => {
              verifyPaymentStatus(currentRetry + 1);
            }, 3000); 
            return; // Exit current execution to wait for the timeout
          } else {
            // Only fail if it's still pending after 10 attempts (30 seconds)
            navigation.replace('BookingFailed', {
              bookingId,
              error: 'Payment verification is taking longer than expected. Please check your appointments list.'
            });
            return;
          }
        } else {
          // Payment not successful, navigate to failed screen
          console.log(' Payment not successful, navigating to failed screen');
          navigation.replace('BookingFailed', {
            bookingId,
            error: `Payment not successful. Status: ${status || 'UNKNOWN'}`
          });
        }
      } else {
        // No data in response, navigate to failed screen
        console.log('⏰ No data in response, navigating to failed screen');
        navigation.replace('BookingFailed', {
          bookingId,
          error: 'No payment data received'
        });
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

  const handleError = () => {
    setError('Failed to load payment page. Please check your internet connection and try again.');
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