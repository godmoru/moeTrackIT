
const path = require('path');
// No need to require dotenv here if we use node -r dotenv/config
const remitaService = require('./src/services/remitaService');

const testRRR = '160799594503';

async function testVerify() {
    console.log(`Test Environment: NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`MerchantID: ${process.env.REMITA_MERCHANT_ID}`);
    console.log('Testing Remita Verification for RRR:', testRRR);
    
    try {
        const result = await remitaService.verifyPayment(testRRR);
        console.log('Verification Request Sent!');
        console.log('Result:', JSON.stringify(result, null, 2));
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
