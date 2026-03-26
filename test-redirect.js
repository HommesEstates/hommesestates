// Test script to check redirect behavior
const axios = require('axios');

async function testRedirectBehavior() {
  try {
    console.log('Testing redirect behavior...');
    
    const odooUrl = 'http://localhost:8069';
    const db = 'odoo_18';
    
    console.log(`Making request to: ${odooUrl}/odoo/api/properties`);
    
    // Make request without following redirects
    const response = await axios.get(`${odooUrl}/odoo/api/properties`, {
      params: { limit: 50, db: db },
      withCredentials: false,
      maxRedirects: 0, // Don't follow redirects
      validateStatus: (status) => status < 400 // Accept redirects as valid
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.status === 302 || response.status === 301) {
      console.log('Redirect location:', response.headers.location);
      console.log('❌ Being redirected to login page');
    } else if (response.status === 200) {
      console.log('✅ Direct access successful');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing redirect behavior:');
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
      if (error.response.status === 302 || error.response.status === 301) {
        console.log('Redirect location:', error.response.headers.location);
      }
    } else {
      console.error('Error message:', error.message);
    }
  }
}

testRedirectBehavior();