import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { signInAsync, signOutAsync, updateUserAsync, rehydrateAuthAsync, rehydrateAuth } from '../store/authSlice';
import { apiService } from '../services/apiService';

import { User } from '../types/auth';

type AuthContextData = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  // Critical flag to prevent premature API calls - true when auth state is ready
  isAuthReady: boolean;
  signIn: (userData: { user: User; token: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useAppDispatch();
  const { user, token, isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

  console.log('🔍 AuthProvider state:', { 
    isLoading, 
    isAuthenticated, 
    hasUser: !!user,
    hasToken: !!token 
  });

  useEffect(() => {
    console.log('🚀 AuthProvider mounting, starting rehydration...');
    
    // Rehydrate auth state from AsyncStorage on app start
    dispatch(rehydrateAuthAsync() as any);
    
    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log('⚠️ Auth rehydration timeout, forcing loading to false');
      dispatch(rehydrateAuth(null));
    }, 10000); // 10 second timeout for AsyncStorage rehydration
    
    return () => clearTimeout(timeout);
  }, [dispatch]);

  // Token is now managed entirely by Redux - the interceptor reads it automatically
  // No need to manually sync token with apiService

  async function signIn({ user, token }: { user: User; token: string }) {
    try {
      // Token is stored in Redux, and the interceptor will automatically use it
      await dispatch(signInAsync({ user, token }) as any);
    } catch (error) {
      console.error('Failed to sign in', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      // Token is cleared from Redux, and the interceptor will automatically stop using it
      await dispatch(signOutAsync() as any);
    } catch (error) {
      console.error('Failed to sign out', error);
      throw error;
    }
  }

  async function updateUser(userData: Partial<User>) {
    try {
      await dispatch(updateUserAsync(userData) as any);
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  }

  // isAuthReady indicates that auth rehydration is complete and API calls can proceed
  // This prevents premature API calls before the token is loaded from storage
  const isAuthReady = !isLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAuthReady,
        signIn,
        signOut,
        updateUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
