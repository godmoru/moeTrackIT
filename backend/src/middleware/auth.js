'use strict';

const jwt = require('jsonwebtoken');
const { User, Role, Permission, UserLga } = require('../../models');

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
      console.log('Authenticating User ID:', decoded.id);
      try {
        let user = await User.findByPk(decoded.id, {
          include: [
            {
              model: Role,
              as: 'Roles',
              include: [{ model: Permission, as: 'permissions' }],
            },
          ],
        });

        if (!user) {
          console.warn('User not found in DB for ID:', decoded.id);
        } else {
          console.log('User loaded from DB:', user.id, 'Role:', user.role);
        }

        const permissionCodes = new Set();
        
        // Use associated Roles first (Many-to-Many)
        if (user && user.Roles && user.Roles.length > 0) {
          user.Roles.forEach((role) => {
            if (role.permissions) {
              role.permissions.forEach((perm) => {
                if (perm && perm.code) {
                  permissionCodes.add(perm.code);
                }
              });
            }
          });
        } 
        // Fallback: If no associated UserRoles, but the User table has a role slug
        else if (user && user.role) {
          console.log(`Fallback: Loading permissions for legacy role slug "${user.role}"`);
          const legacyRole = await Role.findOne({
            where: { slug: user.role },
            include: [{ model: Permission, as: 'permissions' }]
          });
          
          if (legacyRole && legacyRole.permissions) {
            legacyRole.permissions.forEach(perm => {
              if (perm && perm.code) {
                permissionCodes.add(perm.code);
              }
            });
          }
        }

        req.user.permissions = Array.from(permissionCodes);

        // Attach scope fields for principal / AEO filtering
        req.user.lgaId = user?.lgaId || null;
        req.user.entityId = user?.entityId || null;

        if (user?.role === 'area_education_officer') {
          try {
            // AEO must have exactly one LGA.
            // We use user.lgaId as primary, or fallback to first active assignment in UserLga
            if (!req.user.lgaId) {
              const userLga = await UserLga.findOne({
                where: { userId: user.id, isCurrent: true },
                attributes: ['lgaId'],
              });
              if (userLga) {
                req.user.lgaId = userLga.lgaId;
              }
            }
            console.log(`AEO Scope for User ${user.id}: LGA ${req.user.lgaId}`);
          } catch (lgaErr) {
            console.error('Failed to load user LGA assignment:', lgaErr);
          }
        }
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
