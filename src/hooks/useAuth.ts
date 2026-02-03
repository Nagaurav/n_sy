import { useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { signInAsync, signOutAsync, updateUserAsync, rehydrateAuthAsync } from '../store/authSlice';
import type { User } from '../types/user';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, token, isLoading, isAuthenticated } = useAppSelector((state) => state.auth);

  // ✅ FIX: Wrap in useCallback to prevent infinite useEffect loops
  const initializeAuth = useCallback(() => {
    dispatch(rehydrateAuthAsync() as any);
  }, [dispatch]);

  const signIn = useCallback(async (userData: { user: User; token: string }) => {
    try {
      await dispatch(signInAsync({ user: userData.user, token: userData.token }) as any);
    } catch (error) {
      console.error('Failed to sign in', error);
      throw error;
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    try {
      await dispatch(signOutAsync() as any);
    } catch (error) {
      console.error('Failed to sign out', error);
      throw error;
    }
  }, [dispatch]);

  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      await dispatch(updateUserAsync(userData) as any);
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  }, [dispatch]);

  // isAuthReady indicates that auth rehydration is complete and API calls can proceed
  const isAuthReady = !isLoading;

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAuthReady,
    signIn,
    signOut,
    updateUser,
    initializeAuth,
  };
}
