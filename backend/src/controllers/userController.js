'use strict';

const bcrypt = require('bcryptjs');
const { User } = require('../../models');

async function createUser(req, res) {
  try {
    const { name, email, password, role = 'officer', status = 'active' } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'name, email, password and role are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role,
      status,
    });

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

module.exports = {
  createUser,
};
