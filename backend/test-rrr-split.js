require('dotenv').config();
const remitaService = require('./src/services/remitaService');

async function test() {
    try {
        console.log("Testing RRR generation with valid-looking line items...");
        const result = await remitaService.initializePayment({
            payerName: "Test User",
            payerEmail: "test@example.com",
            payerPhone: "08012345678",
            description: "Test Payment Fee Bearer",
            amount: 1000,
            orderId: "TEST-" + Date.now()
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

// I need to modify remitaService.js temporarily to use a better lineItems payload or use a different test.
// Let's just create a standalone test that calls the Remita API directly.
const axios = require('axios');
const crypto = require('crypto');

async function testDirect() {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const orderId = "DIR-" + Date.now();
    const amount = 1000;

    const apiHash = crypto.createHash('sha512')
        .update(`${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`)
        .digest('hex');

    const url = 'https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';

    // Attempt 1: Just top-level payerPaysFee if it exists (hypothetical)
    // Attempt 2: Minimal lineItems with valid-looking account

    const payload = {
        serviceTypeId: serviceTypeId,
        amount: amount,
        orderId: orderId,
        payerName: "Test User",
        payerEmail: "test@example.com",
        payerPhone: "08012345678",
        description: "Test Payment Direct",
        lineItems: [
            {
                lineItemId: "1",
                beneficiaryName: "Merchant Account",
                beneficiaryAccount: "0123456789", // 10 digits
                bankCode: "011", // First Bank
                beneficiaryAmount: 1000,
                deductFeeFrom: "0"
            }
        ]
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
    };

    try {
        console.log("Sending payload:", JSON.stringify(payload, null, 2));
        const res = await axios.post(url, payload, { headers });
        console.log("Response:", res.data);
    } catch (e) {
        console.error("Error Response:", e.response?.data || e.message);
    }
}

testDirect();
