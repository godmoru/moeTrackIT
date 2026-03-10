const axios = require('axios');
require('dotenv').config();

async function run() {
  try {
    const res = await axios.post('http://localhost:5000/api/v1/payments/remita/initialize', {
      assessmentId: 1,
      amount: 1000,
      email: 'test@example.com',
      name: 'Test Payer',
      phone: '08012345678'
    }, {
      headers: {
        Authorization: 'Bearer ' // Assuming we might need a token, but let's see if it throws 500 or 401
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
