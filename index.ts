/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

console.log('📱 [index.ts] Registering app:', appName);

try {
  AppRegistry.registerComponent(appName, () => {
    console.log('✅ [index.ts] App component registered successfully');
    return App;
  });
  console.log('✅ [index.ts] App registration completed');
} catch (error) {
  console.error('❌ [index.ts] Failed to register app:', error);
  throw error;
}
