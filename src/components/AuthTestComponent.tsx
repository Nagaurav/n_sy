import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authService, testAuthFlow } from '../services/authService';

const AuthTestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const handleTestAuthFlow = async () => {
    setIsLoading(true);
    try {
      const results = await testAuthFlow();
      setTestResults(results);
      Alert.alert('Test Complete', 'Check console for detailed results');
    } catch (error: any) {
      Alert.alert('Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await authService.sendOTP({ phone: '9999999999' });
      Alert.alert('Send OTP Test', `Success: ${response.success}\nMessage: ${response.message}`);
    } catch (error: any) {
      Alert.alert('Send OTP Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnectivity = async () => {
    setIsLoading(true);
    try {
      const connectivity = await authService.testAPIConnectivity();
      setTestResults({ connectivity });
      Alert.alert('Connectivity Test', `Base URL: ${connectivity.baseUrl}\nStatus: ${connectivity.message}`);
    } catch (error: any) {
      Alert.alert('Connectivity Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Authentication API Test</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleTestConnectivity}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test API Connectivity'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleTestSendOTP}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Send OTP'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.button} 
        onPress={handleTestAuthFlow}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Full Auth Flow'}
        </Text>
      </TouchableOpacity>

      {testResults && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Test Results:</Text>
          <Text style={styles.resultsText}>
            {JSON.stringify(testResults, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  resultsText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default AuthTestComponent;
