"use strict";

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const { Op } = require('sequelize');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../services/emailService');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // If passwords are not yet hashed, you can temporarily compare plain text.
    const isMatch = await bcrypt.compare(password, user.passwordHash || '');
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
}

async function logout(req, res) {
  try {
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Logout failed' });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const payload = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
      });

      res.json({ token });
    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Refresh token failed' });
  }
}

/**
 * Admin-only: Reset a user's password directly (no token required)
 */
async function adminResetPassword(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset failed' });
  }
}

/**
 * Public: Reset password using a valid token (from forgot password email)
 */
async function resetPasswordWithToken(req, res) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'token and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid, non-expired token
    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset token
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    // Send confirmation email
    try {
      await sendPasswordChangedEmail(user.email, user.name);
    } catch (emailErr) {
      console.error('Failed to send password changed email:', emailErr);
      // Don't fail the request if email fails
    }

    res.json({ message: 'Password reset successful. You can now log in with your new password.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset failed' });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user && req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword || '', user.passwordHash || '');
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password change failed' });
  }
}

/**
 * Public: Request a password reset email
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'email is required' });
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Check if user is active
    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing (for security)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    await user.save();

    // Send reset email with the unhashed token
    try {
      await sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
      // Clear the token if email fails
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();
      return res.status(500).json({ message: 'Failed to send password reset email. Please try again.' });
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset request failed' });
  }
}

/**
 * Public: Verify if a reset token is valid (for frontend validation)
 */
async function verifyResetToken(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ valid: false, message: 'Token is required' });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
      attributes: ['id', 'email', 'name'],
    });

    if (!user) {
      return res.status(400).json({ valid: false, message: 'Invalid or expired reset token' });
    }

    res.json({
      valid: true,
      email: user.email,
      message: 'Token is valid'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ valid: false, message: 'Token verification failed' });
  }
}

async function getMe(req, res) {
  try {
    const user = req.user; // User is attached by authMiddleware
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Refresh user from DB to ensure latest role/status
    const freshUser = await User.findByPk(user.id);
    if (!freshUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: freshUser.id,
      name: freshUser.name,
      email: freshUser.email,
      role: freshUser.role,
      entityId: freshUser.entityId,
      lgaId: freshUser.lgaId,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch user details' });
  }
}

module.exports = {
  login,
  logout,
  refreshToken,
  adminResetPassword,
  resetPasswordWithToken,
  changePassword,
  forgotPassword,
  verifyResetToken,
  getMe,
};
