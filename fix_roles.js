const { Role, UserRole, RolePermission, sequelize, Sequelize } = require('./backend/models');
const { Op } = Sequelize;

async function deduplicateRoles() {
  const t = await sequelize.transaction();
  try {
    const roles = await Role.findAll({ order: [['slug', 'ASC'], ['id', 'ASC']] });
    
    // Group by slug
    const grouped = roles.reduce((acc, r) => {
      if (!acc[r.slug]) acc[r.slug] = [];
      acc[r.slug].push(r);
      return acc;
    }, {});

    for (const slug in grouped) {
      const slugRoles = grouped[slug];
      if (slugRoles.length > 1) {
        console.log(`Processing duplicate slug: ${slug}`);
        const [master, ...slaves] = slugRoles;
        const removeIds = slaves.map(s => s.id);
        
        console.log(`  Keeping ID: ${master.id}`);
        console.log(`  Removing IDs: ${removeIds.join(', ')}`);

        // Repoint UserRoles
        for (const slaveId of removeIds) {
          // Check if User already has the master role to avoid constraint violations if any
          const existingUserRoles = await UserRole.findAll({ where: { roleId: slaveId } });
          for (const ur of existingUserRoles) {
            const hasMaster = await UserRole.findOne({ where: { userId: ur.userId, roleId: master.id } });
            if (hasMaster) {
              await ur.destroy({ transaction: t });
            } else {
              await ur.update({ roleId: master.id }, { transaction: t });
            }
          }
        }

        // Repoint RolePermissions
        for (const slaveId of removeIds) {
          const existingRPs = await RolePermission.findAll({ where: { roleId: slaveId } });
          for (const rp of existingRPs) {
            const hasMaster = await RolePermission.findOne({ where: { roleId: master.id, permissionId: rp.permissionId } });
            if (hasMaster) {
              await rp.destroy({ transaction: t });
            } else {
              await rp.update({ roleId: master.id }, { transaction: t });
            }
          }
        }

        // Delete slave roles
        await Role.destroy({ where: { id: { [Op.in]: removeIds } }, transaction: t });
      }
    }

    await t.commit();
    console.log('--- De-duplication complete ---');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Error during de-duplication:', err);
    process.exit(1);
  }
}

deduplicateRoles();
