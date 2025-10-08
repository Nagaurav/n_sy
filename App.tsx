// App.tsx
import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

// Import your screens
import SplashScreen from './src/screens/SplashScreen';
import PhoneNumberScreen from './src/screens/PhoneNumberScreen';
import OTPScreen from './src/screens/OTPScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';

export type RootStackParamList = {
  Splash: undefined;
  PhoneNumber: undefined;
  OTP: { phoneNumber: string };
  Signup: { phoneNumber: string };
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize any required services here
    const init = async () => {
      try {
        // Add any async initialization here
        await new Promise<void>(resolve => setTimeout(() => resolve(), 2000)); // Simulate loading
      } catch (error) {
        console.error('Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'none', // Use 'none' instead of animationEnabled
            gestureEnabled: false
          }}
        >
          {isLoading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : (
            <>
              <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
              <Stack.Screen name="OTP" component={OTPScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
              <Stack.Screen 
                name="Home" 
                component={HomeScreen}
                options={{ title: 'SAMYAYOG' }}
              />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;