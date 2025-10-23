import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  user_id: number; // API returns user_id as number
  _id?: string; // Keep for backward compatibility
  phone: string;
  first_name: string; // API uses snake_case
  last_name: string; // API uses snake_case
  firstName?: string; // Keep for backward compatibility
  lastName?: string; // Keep for backward compatibility
  email: string;
  password?: string;
  dob?: string;
  gender?: string;
  city?: string;
  location_latitude?: string;
  location_longitude?: string;
  profileImage?: string;
  profile_picture_url?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    signInSuccess: (state: AuthState, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
    },
    signOut: (state: AuthState) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
    },
    updateUser: (state: AuthState, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    rehydrateAuth: (state: AuthState, action: PayloadAction<{ user: User; token: string } | null>) => {
      if (action.payload) {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      }
      state.isLoading = false;
    },
  },
});

export const { setLoading, signInSuccess, signOut, updateUser, rehydrateAuth } = authSlice.actions;

// Async thunks for handling AsyncStorage operations
export const signInAsync = (userData: { user: User; token: string }) => async (dispatch: any) => {
  try {
    await AsyncStorage.multiSet([
      ['@Auth:user', JSON.stringify(userData.user)],
      ['@Auth:token', userData.token],
    ]);
    dispatch(signInSuccess(userData));
  } catch (error) {
    console.error('Failed to sign in', error);
    throw error;
  }
};

export const signOutAsync = () => async (dispatch: any) => {
  try {
    await AsyncStorage.multiRemove(['@Auth:user', '@Auth:token']);
    dispatch(signOut());
  } catch (error) {
    console.error('Failed to sign out', error);
    throw error;
  }
};

export const updateUserAsync = (userData: Partial<User>) => async (dispatch: any, getState: any) => {
  const { auth } = getState();
  if (!auth.user) return;

  const updatedUser = { ...auth.user, ...userData };
  try {
    await AsyncStorage.setItem('@Auth:user', JSON.stringify(updatedUser));
    dispatch(updateUser(userData));
  } catch (error) {
    console.error('Failed to update user', error);
    throw error;
  }
};

export const rehydrateAuthAsync = () => async (dispatch: any) => {
  console.log('🔄 Starting auth rehydration...');
  try {
    const [storedUser, storedToken] = await Promise.all([
      AsyncStorage.getItem('@Auth:user'),
      AsyncStorage.getItem('@Auth:token'),
    ]);

    console.log('📱 Stored data check:', { 
      hasUser: !!storedUser, 
      hasToken: !!storedToken 
    });

    if (storedUser && storedToken) {
      const user = JSON.parse(storedUser);
      console.log('✅ Rehydrating with user:', user.first_name || user.firstName);
      dispatch(rehydrateAuth({ user, token: storedToken }));
    } else {
      console.log('❌ No stored auth data, staying logged out');
      dispatch(rehydrateAuth(null));
    }
  } catch (error) {
    console.error('❌ Failed to rehydrate auth', error);
    dispatch(rehydrateAuth(null));
  }
};

export default authSlice.reducer;
