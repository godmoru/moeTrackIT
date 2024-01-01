const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const merchantId = "2547916";
const serviceTypeId = "4430731";
const apiKey = "1946";
const orderId = Date.now().toString();
const amount = "1000";

// Standard Invoice Hash: SHA512 (merchantId + serviceTypeId + orderId + amount + apiKey)
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
    description: "Assessment Payment"
};

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
};

// Trying the standard /echannelsvc/merchant/api/paymentinit endpoint
const url = "https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit";

async function testInvoice() {
    console.log("Testing POST to", url);
    console.log("Payload:", payload);
    console.log("Headers:", headers);
    try {
        const response = await axios.post(url, payload, { headers });
        console.log("SUCCESS:", response.data);
    } catch (error) {
        if (error.response) {
            console.log("FAILED HTTP STATUS:", error.response.status);
            console.log("FAILED DATA:", error.response.data);
        } else {
            console.log("FAILED:", error.message);
        }
    }
}
testInvoice();
