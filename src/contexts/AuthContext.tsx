import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { signInAsync, signOutAsync, updateUserAsync, rehydrateAuthAsync, rehydrateAuth } from '../store/authSlice';
import { apiService } from '../services/api';

import { User } from '../types/auth';

type AuthContextData = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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
    }, 3000); // 3 second timeout (reduced for faster testing)
    
    return () => clearTimeout(timeout);
  }, [dispatch]);

  useEffect(() => {
    // Update API service token when token changes
    if (token) {
      apiService.setAuthToken(token);
    } else {
      apiService.setAuthToken(null);
    }
  }, [token]);

  async function signIn({ user, token }: { user: User; token: string }) {
    try {
      await dispatch(signInAsync({ user, token }) as any);
    } catch (error) {
      console.error('Failed to sign in', error);
      throw error;
    }
  }

  async function signOut() {
    try {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
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
