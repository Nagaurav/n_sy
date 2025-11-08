import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiPost } from '../services/apiService';

export const storeAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('@auth_token', token);
  } catch (error) {
    console.error('Error storing auth token:', error);
    throw error;
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('@auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('@auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getAuthToken();
  return !!token;
};

/**
 * Refreshes the authentication token using the refresh token
 * @returns Promise that resolves to the new access token or null if refresh fails
 */
export const refreshAuthToken = async (): Promise<string | null> => {
  try {
    // Get the refresh token from storage
    const refreshToken = await AsyncStorage.getItem('@refresh_token');
    if (!refreshToken) {
      console.log('No refresh token available');
      return null;
    }

    // Call your refresh token endpoint
    const response = await apiPost<{ access_token: string; refresh_token: string }>(
      '/auth/refresh-token',
      { refresh_token: refreshToken }
    );

    if (response && response.access_token) {
      // Store the new tokens
      await storeAuthToken(response.access_token);
      if (response.refresh_token) {
        await AsyncStorage.setItem('@refresh_token', response.refresh_token);
      }
      return response.access_token;
    }
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    // Clear tokens on refresh failure
    await removeAuthToken();
    await AsyncStorage.removeItem('@refresh_token');
    return null;
  }
};
