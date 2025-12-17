'use strict';

/**
 * Paystack Payment Service
 * Handles payment initialization and verification with Paystack API
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Initialize a payment transaction with Paystack
 * @param {Object} params
 * @param {string} params.email - Customer email
 * @param {number} params.amount - Amount in Naira (will be converted to kobo)
 * @param {string} params.reference - Unique transaction reference
 * @param {string} params.callbackUrl - URL to redirect after payment
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Paystack initialization response
 */
async function initializePayment({ email, amount, reference, callbackUrl, metadata = {} }) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // Convert to kobo
      reference,
      callback_url: callbackUrl,
      metadata,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to initialize payment with Paystack');
  }

  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

/**
 * Verify a payment transaction with Paystack
 * @param {string} reference - Transaction reference
 * @returns {Promise<Object>} Verification result
 */
async function verifyPayment(reference) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured');
  }

  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();

  if (!response.ok || !data.status) {
    throw new Error(data.message || 'Failed to verify payment with Paystack');
  }

  const txn = data.data;

  return {
    status: txn.status, // 'success', 'failed', 'abandoned'
    reference: txn.reference,
    amount: txn.amount / 100, // Convert from kobo to Naira
    paidAt: txn.paid_at,
    channel: txn.channel,
    currency: txn.currency,
    customerEmail: txn.customer?.email,
    customerName: `${txn.customer?.first_name || ''} ${txn.customer?.last_name || ''}`.trim(),
    gatewayResponse: txn.gateway_response,
    metadata: txn.metadata,
    raw: txn,
  };
}

/**
 * Validate Paystack webhook signature
 * @param {string} signature - X-Paystack-Signature header
 * @param {string} body - Raw request body
 * @returns {boolean} Whether signature is valid
 */
function validateWebhookSignature(signature, body) {
  if (!PAYSTACK_SECRET_KEY) {
    return false;
  }

  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex');

  return hash === signature;
}

/**
 * Generate a unique payment reference
 * @param {number} assessmentId
 * @returns {string}
 */
function generatePaymentReference(assessmentId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MOE-${assessmentId}-${timestamp}-${random}`;
}

module.exports = {
  initializePayment,
  verifyPayment,
  validateWebhookSignature,
  generatePaymentReference,
};
