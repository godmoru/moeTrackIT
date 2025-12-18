import nodemailer from 'nodemailer';
import logger from '../../config/v1/logger.js';

// Create a test account for development
const createTestAccount = async () => {
  // In production, use real SMTP credentials
  if (process.env.NODE_ENV === 'production') {
    return {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    };
  }

  // For development, use ethereal.email
  const testAccount = await nodemailer.createTestAccount();
  return {
    user: testAccount.user,
    pass: testAccount.pass,
  };
};

// Create transporter
const createTransporter = async () => {
  const account = await createTestAccount();
  
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
};

class EmailService {
  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string|Array<string>} options.to - Recipient email address(es)
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text version of the email
   * @param {string} options.html - HTML version of the email
   * @param {Object} options.template - Template name and context for the email
   * @returns {Promise<Object>} Email sending result
   */
  async sendEmail(options) {
    try {
      const transporter = await createTransporter();
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Government Expenditure Tracker'}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      const info = await transporter.sendMail(mailOptions);
      
      // Log the preview URL for development
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info),
      };
    } catch (error) {
      logger.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send a welcome email
   * @param {string} to - Recipient email address
   * @param {string} name - Recipient name
   * @param {string} token - Verification token
   * @returns {Promise<Object>} Email sending result
   */
  async sendWelcomeEmail(to, name, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    return this.sendEmail({
      to,
      subject: 'Welcome to Government Expenditure Tracker',
      text: `Hello ${name},\n\nWelcome to Government Expenditure Tracker! Please verify your email by clicking the following link:\n\n${verificationUrl}\n\nThanks,\nThe GET Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Welcome to Government Expenditure Tracker, ${name}!</h2>
          <p>We're excited to have you on board. Please verify your email address to get started.</p>
          <p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
              Verify Email Address
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <p>Thanks,<br>The GET Team</p>
        </div>
      `,
    });
  }

  /**
   * Send a password reset email
   * @param {string} to - Recipient email address
   * @param {string} name - Recipient name
   * @param {string} token - Password reset token
   * @returns {Promise<Object>} Email sending result
   */
  async sendPasswordResetEmail(to, name, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    return this.sendEmail({
      to,
      subject: 'Password Reset Request',
      text: `Hello ${name},\n\nYou requested to reset your password. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request a password reset, please ignore this email.\n\nThanks,\nThe GET Team`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>You requested to reset your password. Please click the button below to reset your password:</p>
          <p>
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
              Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <p>Thanks,<br>The GET Team</p>
        </div>
      `,
    });
  }
}

const emailService = new EmailService();
export default emailService;
