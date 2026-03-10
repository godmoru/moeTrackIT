require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

async function testRRRGeneration() {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const publicKey = process.env.REMITA_PUBLIC_KEY;
    const baseUrl = process.env.REMITA_BASE_URL || 'https://api-demo.remita.net';

    console.log('--- Remita RRR Generation Test ---');
    console.log('Merchant ID:', merchantId);
    console.log('Service Type ID:', serviceTypeId);
    console.log('Public Key:', publicKey ? 'PRESENT' : 'MISSING');

    const orderId = 'TEST' + Date.now();
    const amount = '500';

    // Hash = SHA512(merchantId + serviceTypeId + orderId + amount + apiKey)
    const apiHash = crypto.createHash('sha512')
        .update(`${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`)
        .digest('hex');

    const payload = {
        serviceTypeId: serviceTypeId,
        amount: amount,
        orderId: orderId,
        payerName: "Test Payer",
        payerEmail: "test@example.com",
        payerPhone: "08012345678",
        description: "Test RRR Generation"
    };

    const headers = {
        'Content-Type': 'application/json',
        'publicKey': publicKey,
        'transactionHash': apiHash
    };

    try {
        console.log(`Sending request to ${baseUrl}/payment/v1/payment/generate-rrr ...`);
        const response = await axios.post(`${baseUrl}/payment/v1/payment/generate-rrr`, payload, { headers });
        console.log('Response Status:', response.status);
        console.log('Response Body:', JSON.stringify(response.data, null, 2));

        if (response.data.RRR) {
            console.log('✅ SUCCESS: RRR Generated:', response.data.RRR);
        } else {
            console.log('❌ FAILURE: RRR not found in response');
        }
    } catch (error) {
        console.error('❌ ERROR:', error.response?.data || error.message);
    }
}

testRRRGeneration();
