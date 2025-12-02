"use strict";

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../models');

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

async function resetPassword(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password reset successful' });
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

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a random token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    // Send reset email
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);

    res.json({ message: 'Password reset email sent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Password reset email failed' });
  }
}

async function sendPasswordResetEmail(email, resetLink) {
  try {
    // Implement email sending logic here
    console.log(`Sending password reset email to ${email}`);
    console.log(`Reset link: ${resetLink}`);
  } catch (err) {
    console.error(err);
    throw new Error('Failed to send password reset email');
  }
}

module.exports = {
  login,
  logout,
  refreshToken,
  resetPassword,
  changePassword,
  forgotPassword,
  sendPasswordResetEmail,
};
