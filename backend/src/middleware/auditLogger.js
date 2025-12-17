'use strict';

const { AuditLog } = require('../../models');

// Simple in-memory cache for IP geolocation to avoid repeated API calls
const geoCache = new Map();
const GEO_CACHE_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Get geolocation data from IP address using free ip-api.com service
 * Returns null if lookup fails (non-blocking)
 */
async function getGeoLocation(ip) {
  // Skip private/local IPs
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: 'Local', city: 'Local', region: null, latitude: null, longitude: null, timezone: null, isp: null };
  }

  // Check cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < GEO_CACHE_TTL) {
    return cached.data;
  }

  try {
    // Using ip-api.com (free, no API key required, 45 requests/minute limit)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone,isp`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 'success') {
      return null;
    }

    const geoData = {
      country: data.country || null,
      region: data.regionName || null,
      city: data.city || null,
      latitude: data.lat || null,
      longitude: data.lon || null,
      timezone: data.timezone || null,
      isp: data.isp || null,
    };

    // Cache the result
    geoCache.set(ip, { data: geoData, timestamp: Date.now() });

    return geoData;
  } catch (err) {
    // Don't let geolocation errors block the audit log
    console.error('Geolocation lookup failed:', err.message);
    return null;
  }
}

// Map HTTP methods and paths to human-readable actions
function getActionFromRequest(method, path) {
  const methodMap = {
    GET: 'VIEW',
    POST: 'CREATE',
    PUT: 'UPDATE',
    PATCH: 'UPDATE',
    DELETE: 'DELETE',
  };

  // Special cases for specific endpoints
  if (path.includes('/auth/login')) return 'LOGIN';
  if (path.includes('/auth/logout')) return 'LOGOUT';
  if (path.includes('/auth/register')) return 'REGISTER';
  if (path.includes('/reset-password')) return 'RESET_PASSWORD';
  if (path.includes('/bulk-annual-license')) return 'BULK_ASSESSMENT';
  if (path.includes('/export')) return 'EXPORT';

  return methodMap[method] || 'ACCESS';
}

// Extract resource name from path
function getResourceFromPath(path) {
  // Remove /api/v1 prefix and get first segment
  const cleanPath = path.replace(/^\/api\/v[0-9]+\//, '');
  const segments = cleanPath.split('/').filter(Boolean);
  
  if (segments.length === 0) return 'system';
  
  // Convert kebab-case to readable format
  const resource = segments[0]
    .replace(/-/g, '_')
    .replace(/s$/, ''); // Remove trailing 's' for singular form
  
  return resource;
}

// Extract resource ID from path if present
function getResourceIdFromPath(path) {
  const segments = path.split('/').filter(Boolean);
  // Look for numeric ID in path
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segments[i])) {
      return segments[i];
    }
  }
  return null;
}

// Sanitize request body to remove sensitive data
function sanitizeRequestBody(body) {
  if (!body || typeof body !== 'object') return null;
  
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
  
  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  try {
    return JSON.stringify(sanitized);
  } catch {
    return null;
  }
}

// Paths to skip logging (high-frequency or non-important)
const skipPaths = [
  '/api/v1/health',
  '/api/v1/audit-logs', // Don't log audit log views
  '/favicon.ico',
];

// Only log mutating operations by default
const logMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Audit logging middleware
 * Logs user activities for super admin review
 */
function auditLogger(req, res, next) {
  // Skip certain paths
  if (skipPaths.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // Only log mutating operations (POST, PUT, PATCH, DELETE) and login
  const isLogin = req.path.includes('/auth/login');
  if (!logMethods.includes(req.method) && !isLogin) {
    return next();
  }

  // Capture original response methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  let responseMessage = null;
  let logged = false;

  const logAudit = async (statusCode) => {
    if (logged) return;
    logged = true;

    try {
      const user = req.user || {};
      const ipAddress = req.ip || req.connection?.remoteAddress || null;
      
      // Get geolocation data (non-blocking, returns null on failure)
      const geo = await getGeoLocation(ipAddress);
      
      await AuditLog.create({
        userId: user.id || null,
        userName: user.name || null,
        userEmail: user.email || null,
        userRole: user.role || null,
        action: getActionFromRequest(req.method, req.path),
        resource: getResourceFromPath(req.path),
        resourceId: getResourceIdFromPath(req.path) || req.body?.id || null,
        method: req.method,
        path: req.path,
        statusCode,
        ipAddress,
        country: geo?.country || null,
        region: geo?.region || null,
        city: geo?.city || null,
        latitude: geo?.latitude || null,
        longitude: geo?.longitude || null,
        timezone: geo?.timezone || null,
        isp: geo?.isp || null,
        userAgent: req.headers['user-agent'] || null,
        requestBody: sanitizeRequestBody(req.body),
        responseMessage,
        details: null,
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  };

  // Override res.json to capture response
  res.json = function (data) {
    if (data && typeof data === 'object') {
      responseMessage = data.message || null;
    }
    logAudit(res.statusCode);
    return originalJson(data);
  };

  // Override res.send to capture response
  res.send = function (data) {
    logAudit(res.statusCode);
    return originalSend(data);
  };

  // Also log on response finish in case json/send aren't called
  res.on('finish', () => {
    logAudit(res.statusCode);
  });

  next();
}

/**
 * Manual audit log helper for custom logging
 */
async function logAuditEvent({
  userId,
  userName,
  userEmail,
  userRole,
  action,
  resource,
  resourceId,
  details,
  ipAddress,
}) {
  try {
    await AuditLog.create({
      userId,
      userName,
      userEmail,
      userRole,
      action,
      resource,
      resourceId: resourceId ? String(resourceId) : null,
      method: 'SYSTEM',
      path: 'N/A',
      statusCode: 200,
      ipAddress,
      userAgent: null,
      requestBody: null,
      responseMessage: null,
      details: details ? JSON.stringify(details) : null,
    });
  } catch (err) {
    console.error('Failed to create manual audit log:', err);
  }
}

module.exports = {
  auditLogger,
  logAuditEvent,
};
