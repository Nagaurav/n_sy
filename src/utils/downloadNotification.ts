import { Platform, Alert } from 'react-native';

/**
 * Download notification utilities
 */

interface NotificationOptions {
  title: string;
  message: string;
  fileName?: string;
}

/**
 * Show download notification (Android only for now)
 */
export const showDownloadNotification = async (
  options: NotificationOptions
): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      // For React Native, we'll use a simple approach
      // In a production app, you might want to use react-native-push-notification
      // or @react-native-community/push-notification-ios for better control
      
      // Show a toast-like alert for immediate feedback
      Alert.alert(
        '📥 Download Started',
        `${options.message}\n\nFile: ${options.fileName || 'PDF Document'}`,
        [
          { text: 'OK', style: 'default' }
        ],
        { cancelable: true }
      );
      
      // Log for debugging
      console.log('📥 Download notification:', options);
      
    } catch (error) {
      console.error('Failed to show download notification:', error);
    }
  } else {
    // iOS: Show a simple alert
    Alert.alert(
      '📥 Download Started',
      options.message,
      [{ text: 'OK' }]
    );
  }
};

/**
 * Show download completion notification
 */
export const showDownloadCompleteNotification = async (
  fileName: string,
  filePath?: string
): Promise<void> => {
  if (Platform.OS === 'android') {
    try {
      const message = `Your PDF has been downloaded successfully!\n\n📁 Check your Downloads folder`;
      
      Alert.alert(
        '✅ Download Complete',
        message,
        [
          { 
            text: 'Got it', 
            style: 'default' 
          }
        ],
        { cancelable: false }
      );
      
      console.log('✅ Download complete notification:', { fileName, filePath });
      
    } catch (error) {
      console.error('Failed to show download complete notification:', error);
    }
  } else {
    Alert.alert(
      '✅ Download Complete',
      'Your PDF has been saved to the Documents folder.',
      [{ text: 'OK' }]
    );
  }
};

/**
 * Show download error notification
 */
export const showDownloadErrorNotification = async (
  error: string
): Promise<void> => {
  Alert.alert(
    '❌ Download Failed',
    error,
    [{ text: 'OK' }]
  );
};
