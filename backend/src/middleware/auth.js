'use strict';

const jwt = require('jsonwebtoken');
const { User, Role, Permission } = require('../../models');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach basic token info first
    req.user = decoded;

    // Load roles and permissions for the user so permission checks can work
    if (decoded.id) {
      try {
        const user = await User.findByPk(decoded.id, {
          include: [
            {
              model: Role,
              as: 'roles',
              include: [{ model: Permission, as: 'permissions' }],
            },
          ],
        });

        const permissionCodes = new Set();
        if (user && user.roles) {
          user.roles.forEach((role) => {
            if (role.permissions) {
              role.permissions.forEach((perm) => {
                if (perm && perm.code) {
                  permissionCodes.add(perm.code);
                }
              });
            }
          });
        }

        req.user.permissions = Array.from(permissionCodes);
      } catch (loadErr) {
        console.error('Failed to load user roles/permissions in authMiddleware:', loadErr);
        // Continue without permissions; permission checks will fail closed
        req.user.permissions = [];
      }
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthenticated' });
    }

    const userPerms = req.user.permissions || [];
    const hasPermission = requiredPermissions.some((p) => userPerms.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  requirePermission,
};
