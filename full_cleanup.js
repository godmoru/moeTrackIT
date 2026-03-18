const { Role, Permission, UserRole, RolePermission, sequelize, Sequelize } = require('./backend/models');
const { Op } = Sequelize;

async function cleanupDb() {
  const t = await sequelize.transaction();
  try {
    // 1. Deduplicate Roles
    const roles = await Role.findAll({ order: [['slug', 'ASC'], ['id', 'ASC']] });
    const groupedRoles = roles.reduce((acc, r) => {
      if (!acc[r.slug]) acc[r.slug] = [];
      acc[r.slug].push(r);
      return acc;
    }, {});

    for (const slug in groupedRoles) {
      const slugRoles = groupedRoles[slug];
      if (slugRoles.length > 1) {
        console.log(`Processing duplicate Role slug: ${slug}`);
        const [master, ...slaves] = slugRoles;
        const removeIds = slaves.map(s => s.id);
        
        for (const slaveId of removeIds) {
          // Repoint UserRoles
          const existingURs = await UserRole.findAll({ where: { roleId: slaveId } });
          for (const ur of existingURs) {
            const hasMaster = await UserRole.findOne({ where: { userId: ur.userId, roleId: master.id } });
            if (hasMaster) await ur.destroy({ transaction: t });
            else await ur.update({ roleId: master.id }, { transaction: t });
          }
          // Repoint RolePermissions
          const existingRPs = await RolePermission.findAll({ where: { roleId: slaveId } });
          for (const rp of existingRPs) {
            const hasMaster = await RolePermission.findOne({ where: { roleId: master.id, permissionId: rp.permissionId } });
            if (hasMaster) await rp.destroy({ transaction: t });
            else await rp.update({ roleId: master.id }, { transaction: t });
          }
        }
        await Role.destroy({ where: { id: { [Op.in]: removeIds } }, transaction: t });
      }
    }

    // 2. Deduplicate Permissions
    const perms = await Permission.findAll({ order: [['code', 'ASC'], ['id', 'ASC']] });
    const groupedPerms = perms.reduce((acc, p) => {
      if (!acc[p.code]) acc[p.code] = [];
      acc[p.code].push(p);
      return acc;
    }, {});

    for (const code in groupedPerms) {
      const codePerms = groupedPerms[code];
      if (codePerms.length > 1) {
        console.log(`Processing duplicate Permission code: ${code}`);
        const [master, ...slaves] = codePerms;
        const removeIds = slaves.map(s => s.id);

        for (const slaveId of removeIds) {
          // Repoint RolePermissions (Permissions are only in RolePermissions)
          const existingRPs = await RolePermission.findAll({ where: { permissionId: slaveId } });
          for (const rp of existingRPs) {
            const hasMaster = await RolePermission.findOne({ where: { roleId: rp.roleId, permissionId: master.id } });
            if (hasMaster) await rp.destroy({ transaction: t });
            else await rp.update({ permissionId: master.id }, { transaction: t });
          }
        }
        await Permission.destroy({ where: { id: { [Op.in]: removeIds } }, transaction: t });
      }
    }

    await t.commit();
    console.log('--- Cleanup complete ---');
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanupDb();
