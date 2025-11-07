import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { API_CONFIG, getEndpointUrl } from '../config/api';

const ExactAPITest: React.FC = () => {
  const [phone, setPhone] = useState('9999999999');
  const [otp, setOtp] = useState('123456');
  const [isLoading, setIsLoading] = useState(false);

  const testExactAPI = async () => {
    setIsLoading(true);
    try {
      const url = 'http://88.222.241.179:7000/api/v1/user/otp/verifyotp';
      
      console.log('🧪 Testing EXACT API endpoint:', url);
      console.log('📤 Request body:', { phone, code: otp });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }), // Backend expects 'code' not 'otp'
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log('📡 Response data:', responseData);
      } catch (parseError) {
        const textResponse = await response.text();
        console.log('📡 Response text:', textResponse);
        responseData = { text: textResponse };
      }

      if (response.ok) {
        Alert.alert('✅ Success', `Status: ${response.status}\nData: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        Alert.alert('❌ Error', `Status: ${response.status}\nError: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      Alert.alert('❌ Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIConfigURL = async () => {
    setIsLoading(true);
    try {
      // Test the URL that API config generates
      const configUrl = getEndpointUrl(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP);
      const hardcodedUrl = 'http://88.222.241.179:7000/api/v1/user/otp/verifyotp';
      
      console.log('🔍 URL Comparison:');
      console.log('📡 API Config URL:', configUrl);
      console.log('📡 Hardcoded URL:', hardcodedUrl);
      console.log('🔍 URLs Match:', configUrl === hardcodedUrl);
      
      // Test both URLs
      const configResponse = await fetch(configUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
      });
      
      const hardcodedResponse = await fetch(hardcodedUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ phone, code: otp }),
      });
      
      console.log('📡 Config URL Response Status:', configResponse.status);
      console.log('📡 Hardcoded URL Response Status:', hardcodedResponse.status);
      
      Alert.alert('🔍 URL Test Results', 
        `Config URL: ${configUrl}\n` +
        `Hardcoded URL: ${hardcodedUrl}\n` +
        `URLs Match: ${configUrl === hardcodedUrl}\n` +
        `Config Response: ${configResponse.status}\n` +
        `Hardcoded Response: ${hardcodedResponse.status}`
      );
      
    } catch (error: any) {
      console.error('❌ URL Test failed:', error);
      Alert.alert('❌ URL Test Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const testDifferentFormats = async () => {
    const formats = [
      { name: '10 digits', phone: '9999999999', otp: '123456' },
      { name: 'with +91', phone: '+919999999999', otp: '123456' },
      { name: 'with 91', phone: '919999999999', otp: '123456' },
      { name: 'with 0091', phone: '00919999999999', otp: '123456' }
    ];

    console.log('🧪 Testing different phone number formats...');
    
    for (const format of formats) {
      try {
        console.log(`\n📱 Testing format: ${format.name} (${format.phone})`);
        
        const response = await fetch('http://88.222.241.179:7000/api/v1/user/otp/verifyotp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({ phone: format.phone, code: format.otp }), // Backend expects 'code' not 'otp'
        });

        console.log(`📡 ${format.name} - Status: ${response.status}`);
        
        if (response.ok) {
          console.log(`✅ ${format.name} - Success!`);
          Alert.alert('✅ Format Found!', `Working format: ${format.name}\nPhone: ${format.phone}`);
          return;
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log(`❌ ${format.name} - Failed:`, errorData);
        }
      } catch (error: any) {
        console.log(`❌ ${format.name} - Error:`, error.message);
      }
    }
    
    Alert.alert('❌ All Formats Failed', 'None of the phone number formats worked');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Exact API Test</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Phone Number:</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>OTP:</Text>
        <TextInput
          style={styles.input}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter OTP"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={testExactAPI}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test Exact API'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#FF9500' }]} 
        onPress={testAPIConfigURL}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test API Config URL'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#34C759' }]} 
        onPress={testDifferentFormats}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Testing...' : 'Test All Phone Formats'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        This will test the exact API endpoint: http://88.222.241.179:7000/api/v1/user/otp/verifyotp
      </Text>
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
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
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
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ExactAPITest;
