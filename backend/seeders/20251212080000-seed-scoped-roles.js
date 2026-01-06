'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Insert roles for principal and area_education_officer
    await queryInterface.bulkInsert('Roles', [
      {
        name: 'System Super Admin',
        slug: 'super_admin',
        description: 'System Admin with full access on the system',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'System Admin',
        slug: 'system_admin',
        description: 'Admin with access to state-wide access on the system',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Admin',
        slug: 'admin',
        description: 'Admin wiht access to the technical administrative functions',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Hon. Commissioner',
        slug: 'hon_commissioner',
        description: 'Hon. Communissoiner with access to the full features of the system',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Permanent Secretary',
        slug: 'perm_secretary',
        description: 'Permanent secretary with admin functions on the system',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Director Finance Administration',
        slug: 'dfa',
        description: 'Director of finance with admin function on the system without control panel functions ',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Director',
        slug: 'director',
        description: 'A director with viewing poweer without any write power on the system',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Officer',
        slug: 'officer',
        description: 'Finance Officer with access to state wide information',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'HQ-Cashier',
        slug: 'hq_cashier',
        description: 'Ministry Cashier with access to state wide information',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Principal',
        slug: 'principal',
        description: 'School principal with access limited to their own institution',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Area Education Officer',
        slug: 'area_education_officer',
        description: 'AEO with access limited to entities within their assigned LGA',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Cashier',
        slug: 'cashier',
        description: 'School Cashiere with access limited to their own institution',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Insert permissions for scoped roles
    await queryInterface.bulkInsert('Permissions', [
      {
        name: 'View Own Entity',
        code: 'entity:view_own',
        module: 'entities',
        description: 'View own institution details',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'View LGA Entities',
        code: 'entity:view_lga',
        module: 'entities',
        description: 'View all entities in assigned LGA',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'View Own Assessments',
        code: 'assessment:view_own',
        module: 'assessments',
        description: 'View assessments for own institution',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'View LGA Assessments',
        code: 'assessment:view_lga',
        module: 'assessments',
        description: 'View assessments for entities in assigned LGA',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'View Own Payments',
        code: 'payment:view_own',
        module: 'payments',
        description: 'View payments for own institution',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'View LGA Payments',
        code: 'payment:view_lga',
        module: 'payments',
        description: 'View payments for entities in assigned LGA',
        createdAt: now,
        updatedAt: now,
      },
      {
        name: 'Record LGA Payments',
        code: 'payment:record_lga',
        module: 'payments',
        description: 'Record payments for entities in assigned LGA',
        createdAt: now,
        updatedAt: now,
      },
      // Expenditures
      {
        name: 'View Expenditures',
        code: 'expenditure:read',
        module: 'expenditure',
        description: 'view all expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Create Expenditures',
        code: 'expenditure:create',
        module: 'expenditure',
        description: 'create new expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Update Expenditures',
        code: 'expenditure:update',
        module: 'expenditure',
        description: 'update expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Delete Expenditures',
        code: 'expenditure:trash',
        module: 'expenditure',
        description: 'trash expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Approve Expenditures',
        code: 'expenditure:approve',
        module: 'expenditure',
        description: 'approve expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'View Expenditures',
        code: 'expenditure:read',
        module: 'expenditure',
        description: 'view all expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Create Expenditures',
        code: 'expenditure:create',
        module: 'expenditure',
        description: 'create new expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Update Expenditures',
        code: 'expenditure:update',
        module: 'expenditure',
        description: 'update expenditures',
        createdAt: now,
        updatedAt: now,
      },

      {
        name: 'Delete Expenditures',
        code: 'expenditure:trash',
        module: 'expenditure',
        description: 'trash expenditures',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Fetch role and permission IDs to link them
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id, slug FROM "Roles" WHERE slug IN ('super_admin', 'system_admin', 'admin', 'hon_commissioner', 'perm_secretary', 'director', 'hq_cashier', 'officer', 'principal', 'area_education_officer')`
    );
    const [permissions] = await queryInterface.sequelize.query(
      `SELECT id, code FROM "Permissions" WHERE code IN (
        'entity:view_own', 'entity:view_lga',
        'assessment:view_own', 'assessment:view_lga',
        'payment:view_own', 'payment:view_lga', 'payment:record_lga',
        'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'
      )`
    );

    const roleMap = {};
    roles.forEach((r) => { roleMap[r.slug] = r.id; });

    const permMap = {};
    permissions.forEach((p) => { permMap[p.code] = p.id; });

    const rolePermissions = [];

    // Super Admin gets all permissions
    if (roleMap.super_admin) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.super_admin,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // System Admin gets all permissions
    if (roleMap.system_admin) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.system_admin,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Admin gets all permissions
    if (roleMap.admin) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.admin,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Hon. Commissioner gets all permissions
    if (roleMap.hon_commissioner) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.hon_commissioner,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Permanent Secretary gets all permissions
    if (roleMap.perm_secretary) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.perm_secretary,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Director gets all permissions
    if (roleMap.director) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.director,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // HQ Cashier gets all permissions
    if (roleMap.hq_cashier) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.hq_cashier,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Officer gets all permissions
    if (roleMap.officer) {
      ['entity:view_own', 'entity:view_lga',
       'assessment:view_own', 'assessment:view_lga',
       'payment:view_own', 'payment:view_lga', 'payment:record_lga',
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.officer,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // Principal permissions
    if (roleMap.principal) {
      ['entity:view_own', 'assessment:view_own', 'payment:view_own', 
       'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:approve',
       'expenditure-category:read', 'expenditure-category:create', 'expenditure-category:update'].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.principal,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    // AEO permissions
    if (roleMap.area_education_officer) {
      [
        'entity:view_lga',
        'assessment:view_lga',
        'payment:view_lga',
        'payment:record_lga',
        'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:approve',
        'expenditure-category:read', 'expenditure-category:create', 'expenditure-category:update'
      ].forEach((code) => {
        if (permMap[code]) {
          rolePermissions.push({
            roleId: roleMap.area_education_officer,
            permissionId: permMap[code],
            createdAt: now,
            updatedAt: now,
          });
        }
      });
    }

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('RolePermissions', rolePermissions);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
    await queryInterface.bulkDelete('Permissions', {
      code: [
        'entity:view_own',
        'entity:view_lga',
        'assessment:view_own',
        'assessment:view_lga',
        'payment:view_own',
        'payment:view_lga',
        'payment:record_lga',
        'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'
      ],
    });
    await queryInterface.bulkDelete('Roles', {
      slug: ['super_admin', 'system_admin', 'admin', 'hon_commissioner', 'perm_secretary', 'director', 'hq_cashier', 'officer', 'principal', 'area_education_officer'],
    });
  },
};
