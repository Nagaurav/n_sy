import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  _id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  // Add other user fields as needed
};

type AuthContextData = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signIn: (userData: { user: User; token: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('@Auth:user'),
        AsyncStorage.getItem('@Auth:token'),
      ]);

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        setToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load auth data', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn({ user, token }: { user: User; token: string }) {
    try {
      await AsyncStorage.multiSet([
        ['@Auth:user', JSON.stringify(user)],
        ['@Auth:token', token],
      ]);
      setUser(user);
      setToken(token);
    } catch (error) {
      console.error('Failed to sign in', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      await AsyncStorage.multiRemove(['@Auth:user', '@Auth:token']);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Failed to sign out', error);
      throw error;
    }
  }

  function updateUser(userData: Partial<User>) {
    if (!user) return;
    
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    AsyncStorage.setItem('@Auth:user', JSON.stringify(updatedUser)).catch(console.error);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
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
