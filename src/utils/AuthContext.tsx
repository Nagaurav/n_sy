import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

// Types
export type AuthContextType = {
  hasCompletedOnboarding: boolean;
  isLoggedIn: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isNewUser: boolean;
  phoneNumber: string;
  authStep: 'onboarding' | 'login' | 'otp' | 'signup' | 'success' | 'main';
  setHasCompletedOnboarding: (v: boolean) => void;
  setIsLoggedIn: (v: boolean) => void;
  setIsAuthenticated: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setIsNewUser: (v: boolean) => void;
  setPhoneNumber: (v: string) => void;
  setAuthStep: (v: 'onboarding' | 'login' | 'otp' | 'signup' | 'success' | 'main') => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authStep, setAuthStep] = useState<'onboarding' | 'login' | 'otp' | 'signup' | 'success' | 'main'>('onboarding');

  // Check authentication status on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has completed onboarding
      const onboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      setHasCompletedOnboarding(onboarding === 'true');
      
      // Check if user is logged in
      const loggedIn = await AsyncStorage.getItem('isLoggedIn');
      const phone = await AsyncStorage.getItem('phoneNumber');
      const step = await AsyncStorage.getItem('authStep');
      
      setPhoneNumber(phone || '');
      setAuthStep((step as any) || 'onboarding');
      
      if (loggedIn === 'true') {
        // Verify if the stored token is still valid
        const isTokenValid = await authService.isAuthenticated();
        if (isTokenValid) {
          setIsLoggedIn(true);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear stored data
          await logout();
        }
      } else {
        setIsLoggedIn(false);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On error, assume not authenticated
      setIsLoggedIn(false);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setIsLoggedIn(false);
      setIsAuthenticated(false);
      setPhoneNumber('');
      setAuthStep('onboarding');
      await AsyncStorage.multiRemove(['isLoggedIn', 'phoneNumber', 'authStep']);
    }
  };

  // Update isAuthenticated when isLoggedIn changes
  useEffect(() => {
    setIsAuthenticated(isLoggedIn);
  }, [isLoggedIn]);

  useEffect(() => {
    AsyncStorage.setItem('hasCompletedOnboarding', hasCompletedOnboarding ? 'true' : 'false');
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    AsyncStorage.setItem('isLoggedIn', isLoggedIn ? 'true' : 'false');
  }, [isLoggedIn]);

  useEffect(() => {
    AsyncStorage.setItem('phoneNumber', phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    AsyncStorage.setItem('authStep', authStep);
  }, [authStep]);

  return (
    <AuthContext.Provider value={{
      hasCompletedOnboarding,
      isLoggedIn,
      isAuthenticated,
      isLoading,
      isNewUser,
      phoneNumber,
      authStep,
      setHasCompletedOnboarding,
      setIsLoggedIn,
      setIsAuthenticated,
      setIsLoading,
      setIsNewUser,
      setPhoneNumber,
      setAuthStep,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};