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

  const fromName = process.env.EMAIL_FROM_NAME || 'MOETrackIT';
  const fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@moetrackIT.gov.ng';

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
    return { messageId: 'console-log', accepted: [to] };
  }

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send email:', err);
    throw err;
  }
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
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
};
