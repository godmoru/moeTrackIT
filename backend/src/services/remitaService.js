'use strict';

/**
 * Remita Payment Service
 * Handles payment initialization and verification with Remita API
 */

const crypto = require('crypto');
const axios = require('axios');

const REMITA_MERCHANT_ID = process.env.REMITA_MERCHANT_ID;
const REMITA_API_KEY = process.env.REMITA_API_KEY;
const REMITA_SERVICE_TYPE_ID = process.env.REMITA_SERVICE_TYPE_ID;
const REMITA_BASE_URL = process.env.REMITA_BASE_URL || 'https://remitademo.net/remita/exapp/api/v1/send/api'; // Demo URL default

/**
 * Generate Remita Hash
 * hash = SHA512(merchantId + serviceTypeId + orderId + amount + apiKey)
 */
function generateHash(orderId, amount) {
    const data = `${REMITA_MERCHANT_ID}${REMITA_SERVICE_TYPE_ID}${orderId}${amount}${REMITA_API_KEY}`;
    return crypto.createHash('sha512').update(data).digest('hex');
}

/**
 * Initialize a payment transaction with Remita to generate RRR
 * @param {Object} params
 * @param {string} params.payerName - Payer's name
 * @param {string} params.payerEmail - Payer's email
 * @param {string} params.payerPhone - Payer's phone
 * @param {string} params.description - Payment description
 * @param {number} params.amount - Amount in Naira
 * @param {string} params.orderId - Unique order ID
 * @returns {Promise<Object>} Remita initialization response
 */
async function initializePayment({ payerName, payerEmail, payerPhone, description, amount, orderId }) {
    if (!REMITA_MERCHANT_ID || !REMITA_API_KEY || !REMITA_SERVICE_TYPE_ID) {
        throw new Error('Remita configuration is missing (Merchant ID, API Key, or Service Type ID)');
    }

    const apiHash = generateHash(orderId, amount);

    const payload = {
        serviceTypeId: REMITA_SERVICE_TYPE_ID,
        amount: amount.toString(),
        orderId: orderId,
        payerName: payerName,
        payerEmail: payerEmail,
        payerPhone: payerPhone,
        description: description,
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${REMITA_MERCHANT_ID},remitaConsumerToken=${apiHash}`
    };

    try {
        console.log('Initializing Remita Payment:', { url: `${REMITA_BASE_URL}/echannelsvc/merchant/api/paymentinit`, payload });
        const response = await axios.post(`${REMITA_BASE_URL}/echannelsvc/merchant/api/paymentinit`, payload, { headers });

        let data = response.data;
        // Handle JSONP-like response if necessary
        if (typeof data === 'string' && data.startsWith('jsonp (')) {
            data = JSON.parse(data.substring(7, data.length - 1));
        }

        console.log('Remita Init Response:', data);

        // Remita success code usually '025' for RRR generated
        if (data.statuscode === '025' && data.RRR) {
            return {
                rrr: data.RRR,
                status: data.statuscode,
                statusMessage: data.status,
                orderId: data.orderId
            };
        } else {
            throw new Error(data.status || 'Failed to generate RRR');
        }

    } catch (error) {
        console.error('Remita Initialization Error:', error.response?.data || error.message);
        throw new Error('Failed to initialize payment with Remita');
    }
}

/**
 * Verify a payment transaction with Remita
 * @param {string} rrr - Remita Retrieval Reference
 * @returns {Promise<Object>} Verification result
 */
async function verifyPayment(rrr) {
    if (!REMITA_MERCHANT_ID || !REMITA_API_KEY) {
        throw new Error('Remita configuration is missing');
    }

    // Hash for status check: SHA512(rrr + apiKey + merchantId)
    const apiHash = crypto.createHash('sha512').update(`${rrr}${REMITA_API_KEY}${REMITA_MERCHANT_ID}`).digest('hex');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${REMITA_MERCHANT_ID},remitaConsumerToken=${apiHash}`
    };

    try {
        console.log(`Verifying Remita Payment: ${rrr}`);
        // Endpoint structure: /echannelsvc/{merchantId}/{rrr}/{hash}/status.reg
        const url = `${REMITA_BASE_URL}/echannelsvc/${REMITA_MERCHANT_ID}/${rrr}/${apiHash}/status.reg`;
        const response = await axios.get(url, { headers });
        const data = response.data;

        console.log('Remita Verify Response:', data);

        return {
            status: data.status, // '00' or '01' usually means success/approved
            message: data.message,
            rrr: data.RRR,
            amount: data.amount,
            orderId: data.orderId,
            transactionTime: data.transactiontime,
            paymentDate: data.paymentDate,
            raw: data
        };

    } catch (error) {
        console.error('Remita Verification Error:', error.response?.data || error.message);
        throw new Error('Failed to verify payment with Remita');
    }
}

module.exports = {
    initializePayment,
    verifyPayment
};
