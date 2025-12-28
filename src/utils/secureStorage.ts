import * as Keychain from 'react-native-keychain';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ID: 'user_id',
  APPOINTMENT_TOKEN: 'appointment_token_', // Prefix with appointment_id
  CHAT_TOKEN: 'chat_token_', // Prefix with appointment_id
} as const;

// Generic secure storage functions
export const secureSetItem = async (key: string, value: string): Promise<boolean> => {
  try {
    await Keychain.setInternetCredentials(key, key, value);
    return true;
  } catch (error) {
    console.error(`Error storing secure item ${key}:`, error);
    return false;
  }
};

export const secureGetItem = async (key: string): Promise<string | null> => {
  try {
    const credentials = await Keychain.getInternetCredentials(key);
    if (credentials && 'password' in credentials) {
      return credentials.password;
    }
    return null;
  } catch (error) {
    console.error(`Error retrieving secure item ${key}:`, error);
    return null;
  }
};

export const secureRemoveItem = async (key: string): Promise<boolean> => {
  try {
    await Keychain.resetInternetCredentials(key);
    return true;
  } catch (error) {
    console.error(`Error removing secure item ${key}:`, error);
    return false;
  }
};

// Auth token management
export const setAuthToken = async (token: string): Promise<boolean> => {
  return secureSetItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getAuthToken = async (): Promise<string | null> => {
  return secureGetItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const removeAuthToken = async (): Promise<boolean> => {
  return secureRemoveItem(STORAGE_KEYS.AUTH_TOKEN);
};

// Refresh token management
export const setRefreshToken = async (token: string): Promise<boolean> => {
  return secureSetItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return secureGetItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Appointment-specific token management
export const setAppointmentToken = async (appointmentId: string, token: string): Promise<boolean> => {
  const key = `${STORAGE_KEYS.APPOINTMENT_TOKEN}${appointmentId}`;
  return secureSetItem(key, token);
};

export const getAppointmentToken = async (appointmentId: string): Promise<string | null> => {
  const key = `${STORAGE_KEYS.APPOINTMENT_TOKEN}${appointmentId}`;
  return secureGetItem(key);
};

export const removeAppointmentToken = async (appointmentId: string): Promise<boolean> => {
  const key = `${STORAGE_KEYS.APPOINTMENT_TOKEN}${appointmentId}`;
  return secureRemoveItem(key);
};

// Chat token management
export const setChatToken = async (appointmentId: string, token: string): Promise<boolean> => {
  const key = `${STORAGE_KEYS.CHAT_TOKEN}${appointmentId}`;
  return secureSetItem(key, token);
};

export const getChatToken = async (appointmentId: string): Promise<string | null> => {
  const key = `${STORAGE_KEYS.CHAT_TOKEN}${appointmentId}`;
  return secureGetItem(key);
};

export const removeChatToken = async (appointmentId: string): Promise<boolean> => {
  const key = `${STORAGE_KEYS.CHAT_TOKEN}${appointmentId}`;
  return secureRemoveItem(key);
};

// Clear all secure storage
export const clearAllSecureStorage = async (): Promise<boolean> => {
  try {
    // Remove known keys
    await Promise.all([
      secureRemoveItem(STORAGE_KEYS.AUTH_TOKEN),
      secureRemoveItem(STORAGE_KEYS.REFRESH_TOKEN),
      secureRemoveItem(STORAGE_KEYS.USER_ID),
    ]);
    
    // Note: We can't easily remove all appointment/chat tokens without tracking them
    // In a real app, you might want to maintain a list of active appointment tokens
    
    return true;
  } catch (error) {
    console.error('Error clearing secure storage:', error);
    return false;
  }
};

// Check if biometric authentication is available
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const supportedTypes = await Keychain.getSupportedBiometryType();
    return supportedTypes !== null;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

// Authenticate with biometrics
export const authenticateWithBiometrics = async (
  reason: string = 'Authenticate to access secure data'
): Promise<boolean> => {
  try {
    const options = {
      accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
      authenticatePrompt: reason,
      authenticateReason: reason,
    };
    
    // This will trigger biometric authentication
    const result = await Keychain.getInternetCredentials('biometric_test', options);
    return result !== false;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
};
