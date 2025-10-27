/**
 * Test utility to check the slots API endpoint
 * Usage: Import and call testSlotsAPI(professionalId) to test the endpoint
 */

import { apiService } from '../services/apiService';

export const testSlotsAPI = async (professionalId: string | number) => {
  console.log('='.repeat(60));
  console.log('🧪 Testing Slots API Endpoint');
  console.log('='.repeat(60));
  console.log(`📍 Endpoint: /professional/slot/get/${professionalId}`);
  console.log(`🆔 Professional ID: ${professionalId}`);
  console.log('-'.repeat(60));

  try {
    const response = await apiService.getProfessionalSlots(professionalId);
    
    console.log('✅ API Response Status: SUCCESS');
    console.log('-'.repeat(60));
    console.log('📦 Response Data:');
    console.log(JSON.stringify(response, null, 2));
    console.log('-'.repeat(60));
    
    // Check response structure
    if (response && typeof response === 'object') {
      console.log('📊 Response Structure Analysis:');
      console.log(`  - Has 'success' field: ${response.hasOwnProperty('success')}`);
      console.log(`  - Has 'data' field: ${response.hasOwnProperty('data')}`);
      console.log(`  - Has 'slots' field: ${response.hasOwnProperty('slots')}`);
      
      if (response.data) {
        console.log(`  - Data type: ${typeof response.data}`);
        if (Array.isArray(response.data)) {
          console.log(`  - Data is array with ${response.data.length} items`);
          if (response.data.length > 0) {
            console.log('  - First slot sample:', JSON.stringify(response.data[0], null, 2));
          }
        } else if (response.data.slots && Array.isArray(response.data.slots)) {
          console.log(`  - Data.slots is array with ${response.data.slots.length} items`);
          if (response.data.slots.length > 0) {
            console.log('  - First slot sample:', JSON.stringify(response.data.slots[0], null, 2));
          }
        }
      }
    }
    
    console.log('='.repeat(60));
    return response;
  } catch (error: any) {
    console.log('❌ API Response Status: ERROR');
    console.log('-'.repeat(60));
    console.log('🔴 Error Details:');
    console.log(`  - Message: ${error.message}`);
    console.log(`  - Code: ${error.code}`);
    if (error.response) {
      console.log(`  - HTTP Status: ${error.response.status}`);
      console.log(`  - Response Data:`, JSON.stringify(error.response.data, null, 2));
    }
    console.log('='.repeat(60));
    throw error;
  }
};

// Example usage:
// import { testSlotsAPI } from './utils/testSlotsAPI';
// testSlotsAPI(1); // Test with professional ID 1
