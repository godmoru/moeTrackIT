const axios = require('axios');
require('dotenv').config();

async function run() {
  try {
    // 1. Get token
    const loginRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
      email: 'officer@example.com', // Need to find a valid user or just bypass auth for testing
      password: 'password'
    }).catch(() => null);

    let token = '';
    
    if (loginRes && loginRes.data.token) {
        token = loginRes.data.token;
    } else {
        // Find a token from DB manually or just trigger the error to see logs
    }

    // Trigger without token might give 401, let's see if we can trigger the 500
    // Try to login as super admin to get a token
    const tokenRes = await axios.post('http://localhost:5000/api/v1/auth/login', {
        email: 'superadmin@moekm.be.gov.ng', 
        password: 'password'
    });
    
    console.log("Got token");

    const res = await axios.post('http://localhost:5000/api/v1/payments/remita/initialize', {
      assessmentId: 1,
      amount: 1000,
      email: 'test@example.com',
      name: 'Test Payer',
      phone: '08012345678'
    }, {
      headers: {
        Authorization: `Bearer ${tokenRes.data.token}`
      }
    });
    console.log(res.data);
  } catch (error) {
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}
run();
