'use strict';

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on environment configuration.
 * Supports SMTP configuration via environment variables.
 */
function createTransporter() {
  // Use environment variables for SMTP configuration
  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  // If no SMTP credentials, use a test account or log to console
  if (!config.auth.user || !config.auth.pass) {
    console.warn('SMTP credentials not configured. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport(config);
}

const fs = require('fs');
const path = require('path');

// ... existing code ...

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body (optional)
 */
async function sendEmail({ to, subject, text, html }) {
  const transporter = createTransporter();

  const fromName = process.env.EMAIL_FROM_NAME || 'MOEKMRemit';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'remit@moekm.be.gov.ng';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  if (!transporter) {
    // Log email to console if no transporter configured
    console.log('=== EMAIL (not sent - no SMTP configured) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Body:', text);
    console.log('==============================================');

    // Also log to file for verification
    if (process.env.NODE_ENV !== 'production') {
      logEmailToFile(to, subject, text);
    }

    return { messageId: 'console-log', accepted: [to] };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    // Log to file for verification in dev
    if (process.env.NODE_ENV !== 'production') {
      logEmailToFile(to, subject, text);
    }

    return info;
  } catch (err) {
    console.error('Failed to send email:', err);
    throw err;
  }
}

/**
 * Helper to log emails to a file
 */
function logEmailToFile(to, subject, body) {
  const logPath = path.join(__dirname, '../../email.log');
  const logEntry = `
=== EMAIL LOGGED AT ${new Date().toISOString()} ===
To: ${to}
Subject: ${subject}
Body:
${body}
================================================
`;
  fs.appendFile(logPath, logEntry, (err) => {
    if (err) console.error('Failed to write email to log file:', err);
  });
}

/**
 * Send welcome email to new user
 * @param {Object} user - User object
 * @param {string} password - The raw password
 * @param {string} roleDisplay - Display name for the role
 * @param {string} [additionalInfo] - Extra info like assigned LGA or Entity
 */
async function sendWelcomeEmail(user, password, roleDisplay, additionalInfo = '') {
  const loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login';
  const subject = 'Welcome to MOETrackIT - Your Account Details';

  const text = `
Hello ${user.name},

Welcome to MOETrackIT! Your account has been created successfully.

Here are your account details:
Role: ${roleDisplay}
${additionalInfo ? additionalInfo + '\n' : ''}
Email: ${user.email}
Password: ${password}

Please log in at: ${loginUrl}

IMPORTANT: We recommend changing your password after your first login.

Best regards,
Benue State Ministry of Education
Education Revenue Management System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #15803d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .details { background: #fff; padding: 15px; border-left: 4px solid #15803d; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to MOETrackIT</h1>
      <p>Education Revenue Management System</p>
    </div>
    <div class="content">
      <h2>Hello ${user.name},</h2>
      <p>Welcome to MOETrackIT! Your account has been created successfully.</p>
      
      <div class="details">
        <p><strong>Role:</strong> ${roleDisplay}</p>
        ${additionalInfo ? `<p>${additionalInfo.replace(/\n/g, '<br>')}</p>` : ''}
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>

      <p>Please click the button below to log in:</p>
      <p style="text-align: center;">
        <a href="${loginUrl}" class="button">Log In to Dashboard</a>
      </p>
      
      <p><strong>IMPORTANT:</strong> We recommend changing your password after your first login.</p>
    </div>
    <div class="footer">
      <p>Benue State Ministry of Education & Knowledge Management</p>
      <p>Education Revenue Management System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: user.email, subject, text, html });
}

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetToken - The reset token
 * @param {string} userName - User's name for personalization
 */
async function sendPasswordResetEmail(email, resetToken, userName = 'User') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request - MOETrackIT';

  const text = `
Hello ${userName},

You requested a password reset for your MOETrackIT account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email or contact support if you have concerns.

Best regards,
Benue State Ministry of Education
Education Revenue Management System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #15803d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; background: #15803d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MOETrackIT</h1>
      <p>Education Revenue Management System</p>
    </div>
    <div class="content">
      <h2>Password Reset Request</h2>
      <p>Hello ${userName},</p>
      <p>You requested a password reset for your MOETrackIT account.</p>
      <p>Click the button below to reset your password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="button">Reset Password</a>
      </p>
      <p>Or copy and paste this link into your browser:</p>
      <p style="word-break: break-all; font-size: 12px; color: #666;">${resetLink}</p>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you did not request this password reset, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>Benue State Ministry of Education & Knowledge Management</p>
      <p>Education Revenue Management System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}

/**
 * Send password changed confirmation email
 * @param {string} email - Recipient email
 * @param {string} userName - User's name for personalization
 */
async function sendPasswordChangedEmail(email, userName = 'User') {
  const subject = 'Password Changed Successfully - MOETrackIT';

  const text = `
Hello ${userName},

Your MOETrackIT account password has been changed successfully.

If you did not make this change, please contact support immediately.

Best regards,
Benue State Ministry of Education
Education Revenue Management System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #15803d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MOETrackIT</h1>
      <p>Education Revenue Management System</p>
    </div>
    <div class="content">
      <h2>Password Changed Successfully</h2>
      <p>Hello ${userName},</p>
      <p>Your MOETrackIT account password has been changed successfully.</p>
      <p><strong>If you did not make this change, please contact support immediately.</strong></p>
    </div>
    <div class="footer">
      <p>Benue State Ministry of Education & Knowledge Management</p>
      <p>Education Revenue Management System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendPaymentReceiptEmail,
};

/**
 * Send payment receipt email
 * @param {string} email - Recipient email
 * @param {string} name - Payer name
 * @param {Object} paymentDetails - Payment details (amount, reference, date, purpose, status)
 */
async function sendPaymentReceiptEmail(email, name, paymentDetails) {
  const subject = 'Payment Receipt - MOETrackIT';

  const { amount, reference, date, purpose, status } = paymentDetails;
  const formattedAmount = Number(amount).toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  const formattedDate = date ? new Date(date).toLocaleDateString() : new Date().toLocaleDateString();

  const text = `
Hello ${name},

This is a receipt for your payment to the Benue State Ministry of Education.

Payment Details:
----------------
Amount: ${formattedAmount}
Reference: ${reference}
Date: ${formattedDate}
Purpose: ${purpose}
Status: ${status.toUpperCase()}

Thank you for your payment.

Best regards,
Benue State Ministry of Education
Education Revenue Management System
  `.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #15803d; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .details { background: #fff; padding: 15px; border-left: 4px solid #15803d; margin: 15px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .amount { font-size: 24px; font-weight: bold; color: #15803d; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment Receipt</h1>
      <p>MOETrackIT</p>
    </div>
    <div class="content">
      <p>Hello ${name},</p>
      <p>This is a receipt for your payment to the Benue State Ministry of Education.</p>
      
      <div class="details">
        <p><strong>Amount Paid:</strong> <span class="amount">${formattedAmount}</span></p>
        <p><strong>Reference:</strong> ${reference}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Purpose:</strong> ${purpose}</p>
        <p><strong>Status:</strong> ${status.toUpperCase()}</p>
      </div>

      <p>Thank you for your payment.</p>
    </div>
    <div class="footer">
      <p>Benue State Ministry of Education & Knowledge Management</p>
      <p>Education Revenue Management System</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return sendEmail({ to: email, subject, text, html });
}
