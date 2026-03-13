
const path = require('path');
const remitaService = require('./src/services/remitaService');

// Manually setting env for demo test
process.env.REMITA_MERCHANT_ID = '2547916';
process.env.REMITA_API_KEY = '1946';
process.env.REMITA_BASE_URL = 'https://demo.remita.net'; // This will trigger the demo URL logic in remitaService
process.env.NODE_ENV = 'development';

const testRRR = '160799594503';

async function testVerify() {
    console.log(`Test Environment: NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`MerchantID: ${process.env.REMITA_MERCHANT_ID}`);
    console.log(`Base URL: ${process.env.REMITA_BASE_URL}`);
    console.log('Testing Remita Verification for RRR:', testRRR);
    
    try {
        const result = await remitaService.verifyPayment(testRRR);
        console.log('Verification Request Sent!');
        console.log('Result Status:', result.status);
        console.log('Result Message:', result.message);
        console.log('Full Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Verification Request Failed!');
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testVerify();
