'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const rolesData = [
      { name: 'System Super Admin', slug: 'super_admin', description: 'System Admin with full access on the system', isSystem: true },
      { name: 'System Admin', slug: 'system_admin', description: 'Admin with access to state-wide access on the system', isSystem: true },
      { name: 'Admin', slug: 'admin', description: 'Admin wiht access to the technical administrative functions', isSystem: true },
      { name: 'Hon. Commissioner', slug: 'hon_commissioner', description: 'Hon. Communissoiner with access to the full features of the system', isSystem: true },
      { name: 'Permanent Secretary', slug: 'perm_secretary', description: 'Permanent secretary with admin functions on the system', isSystem: true },
      { name: 'Director Finance Administration', slug: 'dfa', description: 'Director of finance with admin function on the system without control panel functions ', isSystem: true },
      { name: 'Director', slug: 'director', description: 'A director with viewing poweer without any write power on the system', isSystem: true },
      { name: 'Officer', slug: 'officer', description: 'Finance Officer with access to state wide information', isSystem: true },
      { name: 'HQ-Cashier', slug: 'hq_cashier', description: 'Ministry Cashier with access to state wide information', isSystem: true },
      { name: 'Principal', slug: 'principal', description: 'School principal with access limited to their own institution', isSystem: true },
      { name: 'Area Education Officer', slug: 'area_education_officer', description: 'AEO with access limited to entities within their assigned LGA', isSystem: true },
      { name: 'Cashier', slug: 'cashier', description: 'School Cashiere with access limited to their own institution', isSystem: true },
      { name: 'Account Officer', slug: 'account_officer', description: 'Account officer with access to expenditures and financial reports', isSystem: true },
    ];

    for (const role of rolesData) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "Roles" WHERE slug = '${role.slug}' LIMIT 1`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('Roles', [{
          ...role,
          createdAt: now,
          updatedAt: now
        }]);
      }
    }

    const permissionsData = [
      { name: 'View Own Entity', code: 'entity:view_own', module: 'entities', description: 'View own institution details' },
      { name: 'View LGA Entities', code: 'entity:view_lga', module: 'entities', description: 'View all entities in assigned LGA' },
      { name: 'View Own Assessments', code: 'assessment:view_own', module: 'assessments', description: 'View assessments for own institution' },
      { name: 'View LGA Assessments', code: 'assessment:view_lga', module: 'assessments', description: 'View assessments for entities in assigned LGA' },
      { name: 'View Own Payments', code: 'payment:view_own', module: 'payments', description: 'View payments for own institution' },
      { name: 'View LGA Payments', code: 'payment:view_lga', module: 'payments', description: 'View payments for entities in assigned LGA' },
      { name: 'Record LGA Payments', code: 'payment:record_lga', module: 'payments', description: 'Record payments for entities in assigned LGA' },
      { name: 'View Expenditures', code: 'expenditure:read', module: 'expenditure', description: 'view all expenditures' },
      { name: 'Create Expenditures', code: 'expenditure:create', module: 'expenditure', description: 'create new expenditures' },
      { name: 'Update Expenditures', code: 'expenditure:update', module: 'expenditure', description: 'update expenditures' },
      { name: 'Delete Expenditures', code: 'expenditure:trash', module: 'expenditure', description: 'trash expenditures' },
      { name: 'Approve Expenditures', code: 'expenditure:approve', module: 'expenditure', description: 'approve expenditures' },
      { name: 'View Retirements', code: 'retirement:read', module: 'retirement', description: 'view all expenditures retirements' },
      { name: 'Create Retirements', code: 'retirement:create', module: 'retirement', description: 'create new retirements' },
      { name: 'Review Retirements', code: 'retirement:review', module: 'retirement', description: 'review submitted retirements' },
      { name: 'Approve Retirements', code: 'retirement:approve', module: 'retirement', description: 'approve or reject retirements' },
      { name: 'Upload Attachments', code: 'attachment:create', module: 'attachments', description: 'upload documents and evidence' },
      { name: 'View Attachments', code: 'attachment:read', module: 'attachments', description: 'view or download documents' },
      { name: 'Delete Attachments', code: 'attachment:delete', module: 'attachments', description: 'delete uploaded documents' },
    ];

    for (const perm of permissionsData) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM "Permissions" WHERE code = '${perm.code}' LIMIT 1`
      );
      if (existing.length === 0) {
        await queryInterface.bulkInsert('Permissions', [{
          ...perm,
          createdAt: now,
          updatedAt: now
        }]);
      }
    }

    // Fetch IDs
    const [roles] = await queryInterface.sequelize.query(`SELECT id, slug FROM "Roles"`);
    const [permissions] = await queryInterface.sequelize.query(`SELECT id, code FROM "Permissions"`);

    const roleMap = {};
    roles.forEach((r) => { roleMap[r.slug] = r.id; });

    const permMap = {};
    permissions.forEach((p) => { permMap[p.code] = p.id; });

    const rolePermissions = [];

    const adminSlugs = ['super_admin', 'system_admin', 'admin', 'hon_commissioner', 'perm_secretary', 'director', 'hq_cashier', 'officer', 'account_officer'];
    const adminPerms = permissionsData.map(p => p.code);

    for (const slug of adminSlugs) {
      if (roleMap[slug]) {
        for (const code of adminPerms) {
          if (permMap[code]) {
            const [existing] = await queryInterface.sequelize.query(
              `SELECT * FROM "RolePermissions" WHERE "roleId" = ${roleMap[slug]} AND "permissionId" = ${permMap[code]}`
            );
            if (existing.length === 0) {
              rolePermissions.push({
                roleId: roleMap[slug],
                permissionId: permMap[code],
                createdAt: now,
                updatedAt: now
              });
            }
          }
        }
      }
    }

    // Principal permissions
    if (roleMap.principal) {
      const principalPerms = ['entity:view_own', 'assessment:view_own', 'payment:view_own', 'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:approve', 'retirement:read', 'retirement:create', 'attachment:create', 'attachment:read'];
      for (const code of principalPerms) {
        if (permMap[code]) {
          const [existing] = await queryInterface.sequelize.query(
            `SELECT * FROM "RolePermissions" WHERE "roleId" = ${roleMap.principal} AND "permissionId" = ${permMap[code]}`
          );
          if (existing.length === 0) {
            rolePermissions.push({ roleId: roleMap.principal, permissionId: permMap[code], createdAt: now, updatedAt: now });
          }
        }
      }
    }

    // AEO permissions
    if (roleMap.area_education_officer) {
      const aeoPerms = ['entity:view_lga', 'assessment:view_lga', 'payment:view_lga', 'payment:record_lga', 'expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:approve', 'retirement:read', 'retirement:create', 'attachment:create', 'attachment:read'];
      for (const code of aeoPerms) {
        if (permMap[code]) {
          const [existing] = await queryInterface.sequelize.query(
            `SELECT * FROM "RolePermissions" WHERE "roleId" = ${roleMap.area_education_officer} AND "permissionId" = ${permMap[code]}`
          );
          if (existing.length === 0) {
            rolePermissions.push({ roleId: roleMap.area_education_officer, permissionId: permMap[code], createdAt: now, updatedAt: now });
          }
        }
      }
    }

    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('RolePermissions', rolePermissions);
    }
  },

  async down(queryInterface) {
    // No easy way to selectively undo without risk, leave as is
  },
};
