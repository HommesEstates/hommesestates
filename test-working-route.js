// Test script to verify the correct working route
const axios = require('axios');

async function testWorkingRoute() {
  try {
    console.log('Testing the working route...');
    
    const odooUrl = 'http://localhost:8069';
    const db = 'odoo_18';
    
    // Test the route that we know works: /odoo/api/properties?limit=50&db=odoo_18
    console.log(`Testing working route: ${odooUrl}/odoo/api/properties`);
    
    const response = await axios.get(`${odooUrl}/odoo/api/properties`, {
      params: { limit: 50, db: db },
      withCredentials: false,
      maxRedirects: 0, // Don't follow redirects
      validateStatus: (status) => status < 400
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (response.status === 200) {
      console.log('✅ Direct access successful!');
      console.log('Response data:', JSON.stringify(response.data, null, 2));
    } else if (response.status === 302 || response.status === 301) {
      console.log('❌ Being redirected to:', response.headers.location);
    }
    
  } catch (error) {
    console.error('❌ Error testing working route:');
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

testWorkingRoute();