// Test script to follow redirects and see final result
const axios = require('axios');

async function testWithRedirects() {
  try {
    console.log('Testing with redirect following...');
    
    const odooUrl = 'http://localhost:8069';
    const db = 'odoo_18';
    
    // Test the route with redirect following enabled
    console.log(`Testing: ${odooUrl}/odoo/api/properties`);
    
    const response = await axios.get(`${odooUrl}/odoo/api/properties`, {
      params: { limit: 50, db: db },
      withCredentials: false,
      maxRedirects: 5, // Allow redirects
      validateStatus: (status) => true // Accept any status
    });
    
    console.log('Final response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.status === 200) {
      console.log('✅ Successfully accessed API!');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Final status:', response.status);
      console.log('Response data:', response.data);
    }
    
  } catch (error) {
    console.error('❌ Error testing with redirects:');
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testWithRedirects();