// Test script to verify property loading works
const axios = require('axios');

async function testPropertyLoading() {
  try {
    console.log('Testing property loading...');
    
    // Test direct Odoo API call
    const odooUrl = 'http://localhost:8069';
    const db = 'odoo_18';
    
    console.log(`Making request to: ${odooUrl}/api/properties`);
    
    const response = await axios.get(`${odooUrl}/api/properties`, {
      params: { limit: 50, db: db },
      withCredentials: false
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.records) {
      console.log(`✅ Success! Found ${response.data.records.length} properties`);
    } else {
      console.log('❌ No properties found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing property loading:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testPropertyLoading();