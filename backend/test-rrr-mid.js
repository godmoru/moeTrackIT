require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');

async function testMerchantInBody() {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const orderId = "MID-" + Date.now();
    const amount = 1000;

    const apiHash = crypto.createHash('sha512')
        .update(`${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`)
        .digest('hex');

    const url = 'https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';

    const payload = {
        merchantId: merchantId,
        serviceTypeId: serviceTypeId,
        amount: amount,
        orderId: orderId,
        payerName: "Test User",
        payerEmail: "test@example.com",
        payerPhone: "08012345678",
        description: "Test Payment Merchant In Body"
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
    };

    try {
        console.log("Sending payload with merchantId in body...");
        const res = await axios.post(url, payload, { headers });
        console.log("Response:", res.data);
    } catch (e) {
        console.error("Error Response:", e.response?.data || e.message);
    }
}

testMerchantInBody();
