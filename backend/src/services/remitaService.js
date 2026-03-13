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
const REMITA_BASE_URL = process.env.REMITA_BASE_URL || 'https://demo.remita.net'; // Demo URL default
const REMITA_INVOICE_URL = 'https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';

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
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;
    const serviceTypeId = process.env.REMITA_SERVICE_TYPE_ID;
    const publicKey = process.env.REMITA_PUBLIC_KEY;
    const baseUrl = process.env.REMITA_BASE_URL || 'https://demo.remita.net';

    if (!merchantId || !apiKey || !serviceTypeId || !publicKey) {
        throw new Error('Remita configuration is incomplete (MerchantID, APIKey, ServiceTypeID, or PublicKey missing)');
    }

    // Hash = SHA512(merchantId + serviceTypeId + orderId + amount + apiKey)
    const apiHash = crypto.createHash('sha512')
        .update(`${merchantId}${serviceTypeId}${orderId}${amount}${apiKey}`)
        .digest('hex');

    const payload = {
        serviceTypeId: serviceTypeId,
        amount: amount,
        orderId: orderId,
        payerName: payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim(),
        payerEmail: payerEmail,
        payerPhone: payerPhone || '08012345678',
        description: description.replace(/[^a-zA-Z0-9 ]/g, '')
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `remitaConsumerKey=${merchantId},remitaConsumerToken=${apiHash}`
    };

    try {
        console.log(`Generating Remita RRR Invoice for Order: ${orderId}`);
        const url = process.env.NODE_ENV === 'production'
            ? 'https://login.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit'
            : 'https://demo.remita.net/remita/exapp/api/v1/send/api/echannelsvc/merchant/api/paymentinit';

        const jsonpStr = await axios.post(url, payload, { headers }).then(res => res.data);

        // Remita standard invoice sometimes returns JSONP string: "jsonp ({\"statuscode\":\"025\",\"RRR\":\"190799556442\",\"status\":\"Payment Reference generated\"})"
        let data = jsonpStr;
        if (typeof jsonpStr === 'string' && jsonpStr.startsWith('jsonp (')) {
            const jsonStr = jsonpStr.replace('jsonp (', '').replace(')$', '').replace(/\)$/, '');
            data = JSON.parse(jsonStr);
        }

        console.log('Remita RRR Generation Response:', data);

        if (data.statuscode !== '025' && data.statuscode !== '00') {
            throw new Error(data.status || 'Failed to generate RRR');
        }

        return {
            rrr: data.RRR,
            orderId: orderId, // Our internal orderId
            amount: Number(amount),
            firstName: payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ')[0],
            lastName: payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ').slice(1).join(' ') || payerName.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(' ')[0],
            email: payerEmail,
            phone: payerPhone,
            narration: description.replace(/[^a-zA-Z0-9 ]/g, ''),
            publicKey: publicKey,
            merchantId: merchantId,
            serviceTypeId: serviceTypeId
        };

    } catch (error) {
        console.error('Remita RRR Generation Error:', error.response?.data || error.message);
        throw new Error(`Failed to initialize payment with Remita: ${error.response?.data?.status || error.message}`);
    }
}

/**
 * Verify a payment transaction with Remita
 * @param {string} transactionId - The transactionId (orderId or RRR) to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyPayment(transactionId) {
    const merchantId = process.env.REMITA_MERCHANT_ID;
    const apiKey = process.env.REMITA_API_KEY;

    // Explicit production base URL if not in demo mode
    const isProduction = process.env.NODE_ENV === 'production';
    let baseUrl = process.env.REMITA_BASE_URL;

    // Default if not provided in .env
    if (!baseUrl) {
        baseUrl = isProduction ? 'https://login.remita.net' : 'https://remitademo.net';
    }

    // Fix for Remita API url mismatch. The API URL returning 404 when it's api.remita.net
    if (baseUrl.includes('api.remita.net')) {
        baseUrl = 'https://login.remita.net';
    }

    if (!merchantId || !apiKey) {
        throw new Error('Remita MerchantID or APIKey configuration is missing');
    }

    // Hash = SHA512(transactionId + apiKey + merchantId)
    // Works for both RRR and OrderId status checks in Remita standard integration
    const transactionHash = crypto.createHash('sha512')
        .update(`${transactionId}${apiKey}${merchantId}`)
        .digest('hex');

    const headers = {
        'Content-Type': 'application/json'
    };

    try {
        console.log(`Verifying Remita Payment for TransactionId/RRR: ${transactionId}`);
        // Endpoint: /remita/exapp/api/v1/send/api/echannelsvc/{merchantId}/{transactionId}/{hash}/status.reg
        const url = `${baseUrl}/remita/exapp/api/v1/send/api/echannelsvc/${merchantId}/${transactionId}/${transactionHash}/status.reg`;

        console.log(`Verification URL: ${url}`);

        const response = await axios.get(url, { headers });
        const data = response.data;

        console.log('Remita Verify Response Detail:', JSON.stringify(data, null, 2));

        // Note: For this endpoint, '00' or '01' is typically success
        return {
            status: String(data.status),
            message: data.message,
            rrr: data.rrr || data.RRR || transactionId,
            amount: data.amount,
            orderId: data.orderId,
            paymentDate: data.paymentDate || new Date(),
            raw: data
        };

    } catch (error) {
        console.error('Remita Verification Error:', error.response?.data || error.message);
        throw new Error(`Failed to verify payment with Remita: ${error.message}`);
    }
}

module.exports = {
    initializePayment,
    verifyPayment
};
