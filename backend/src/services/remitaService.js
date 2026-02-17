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
const REMITA_BASE_URL = process.env.REMITA_BASE_URL || 'https://api-demo.remita.net'; // Demo URL default

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
/**
 * Initialize a payment transaction with Remita
 * For Inline integration, we just need to generate a unique orderId
 * and return it along with the public key to the frontend.
 */
async function initializePayment({ payerName, payerEmail, payerPhone, description, amount, orderId }) {
    // For Inline, we don't need to call Remita API to initialize.
    // We just return the necessary data for the frontend to call RmPaymentEngine.

    return {
        orderId: orderId,
        amount: Number(amount),
        firstName: payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ')[0],
        lastName: payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ').slice(1).join(' ') || payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ')[0],
        email: payerEmail,
        phone: payerPhone,
        narration: description.replace(/[^a-zA-Z0-9 ]/g, '')
    };
}

/**
 * Verify a payment transaction with Remita (v2)
 * @param {string} transactionId - The Order ID or Transaction ID to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyPayment(transactionId) {
    const publicKey = process.env.REMITA_PUBLIC_KEY;
    const privateKey = process.env.REMITA_PRIVATE_KEY;
    const baseUrl = process.env.REMITA_BASE_URL || 'https://api-demo.remita.net';

    if (!publicKey || !privateKey) {
        throw new Error('Remita Public/Private Key configuration is missing');
    }

    // Hash = SHA512(transactionId + privateKey)
    const transactionHash = crypto.createHash('sha512')
        .update(`${transactionId}${privateKey}`)
        .digest('hex');

    const headers = {
        'Content-Type': 'application/json',
        'publicKey': publicKey,
        'transactionHash': transactionHash
    };

    try {
        console.log(`Verifying Remita Payment (v2): ${transactionId}`);
        // Endpoint: /payment/v1/payment/query/{transactionId}
        // Note: URL structure might need adjustment based on specific Remita env (demo/live)
        // Usually: https://remitademo.net/payment/v1/payment/query/{id}
        const url = `${baseUrl}/payment/v1/payment/query/${transactionId}`;

        const response = await axios.get(url, { headers });
        const data = response.data;

        console.log('Remita Verify Response:', data);

        // Map response to standard format
        return {
            status: data.responseCode, // '00' is success
            message: data.responseMsg,
            rrr: data.RRR || data.paymentReference,
            amount: data.amount,
            orderId: data.orderId,
            transactionTime: data.paymentDate,
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
