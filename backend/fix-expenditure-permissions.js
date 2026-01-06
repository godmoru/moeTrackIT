const { Role, Permission } = require('./models');
const { Sequelize } = require('sequelize');
const queryInterface = require('sequelize-cli/lib/migrator').getMigrationContext('development').queryInterface;
const now = new Date();

async function fixExpenditurePermissions() {
  console.log('Fixing expenditure permissions for existing roles...');
  
  try {
    // Get all existing roles
    const roles = await Role.findAll();
    console.log('Found roles:', roles.map(r => ({ id: r.id, slug: r.slug, name: r.name, isSystem: r.isSystem })));
    
    // Create expenditure permissions if they don't exist
    const permissions = [
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
      }
    ];

    try {
      await queryInterface.bulkInsert('Permissions', permissions);
      console.log('Expenditure permissions created successfully');
    } catch (error) {
      console.log('Permissions might already exist:', error.message);
    }

    // Get permissions
    const [createdPermissions] = await queryInterface.sequelize.query(
      `SELECT id, code FROM Permissions WHERE code IN ('${permissions.map(p => p.code).join("','")}')`
    );

    const permMap = {};
    createdPermissions.forEach(p => { permMap[p.code] = p.id; });

    const rolePermissions = [];
    const expenditurePermCodes = ['expenditure:read', 'expenditure:create', 'expenditure:update', 'expenditure:trash', 'expenditure:approve'];

    roles.forEach(role => {
      // Give all system roles and officers full expenditure access
      if (role.isSystem || ['officer', 'principal', 'area_education_officer'].includes(role.slug)) {
        console.log(`Adding expenditure permissions to role: ${role.name} (${role.slug})`);
        expenditurePermCodes.forEach(code => {
          if (permMap[code]) {
            rolePermissions.push({
              roleId: role.id,
              permissionId: permMap[code],
              createdAt: now,
              updatedAt: now,
            });
          }
        });
      }
    });

    if (rolePermissions.length > 0) {
      try {
        await queryInterface.bulkInsert('RolePermissions', rolePermissions);
        console.log(`Created ${rolePermissions.length} role-permission mappings`);
      } catch (error) {
        console.log('Role permissions might already exist:', error.message);
      }
    }

    console.log('Expenditure permissions fix completed!');
  } catch (error) {
    console.error('Error fixing permissions:', error);
  }
}

fixExpenditurePermissions().then(() => process.exit(0)).catch(console.error);
