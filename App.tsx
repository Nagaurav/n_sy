/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { UserProvider } from './src/utils/UserContext';
import { AuthProvider } from './src/utils/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <AppNavigator />
      </UserProvider>
    </AuthProvider>
  );
}

export default App;
