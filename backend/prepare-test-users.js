const { sequelize, User, Role, Permission, UserLga } = require('./src/models');
const bcrypt = require('bcryptjs');

async function prepareTestUsers() {
    try {
        console.log('🔄 Connecting to database...');
        // await sequelize.authenticate(); // models/index.js might auto-connect

        const passwordHash = await bcrypt.hash('Test@1234', 10);

        // 1. Ensure Permission Exists
        const [viewDashPerm] = await Permission.findOrCreate({
            where: { code: 'dashboard:view' },
            defaults: {
                name: 'View Dashboard',
                description: 'Can view dashboard',
                resource: 'dashboard',
                action: 'view'
            }
        });

        // 2. Assign Permission to Roles
        const roles = await Role.findAll({
            where: { slug: ['principal', 'area_education_officer'] }
        });

        for (const role of roles) {
            // Check if permission already assigned to avoid duplication if running multiple times
            const hasPerm = await role.hasPermission(viewDashPerm);
            if (!hasPerm) {
                await role.addPermission(viewDashPerm);
                console.log(`✅ Assigned 'dashboard:view' to role: ${role.name}`);
            }
        }

        // 1. Prepare Principal
        const [principal, createdP] = await User.findOrCreate({
            where: { email: 'principal-test@example.com' },
            defaults: {
                name: 'Test Principal',
                passwordHash: passwordHash,
                role: 'principal',
                status: 'active'
            }
        });

        if (!createdP) {
            principal.passwordHash = passwordHash;
            principal.role = 'principal';
            await principal.save();
            console.log('✅ Updated Principal User: principal-test@example.com');
        } else {
            console.log('✅ Created Principal User: principal-test@example.com');
        }

        // 2. Prepare AEO
        let [aeo, createdA] = await User.findOrCreate({
            where: { email: 'aeo-test@example.com' },
            defaults: {
                name: 'Test AEO',
                passwordHash: passwordHash,
                role: 'area_education_officer',
                status: 'active'
            }
        });

        if (!createdA) {
            aeo.passwordHash = passwordHash;
            aeo.role = 'area_education_officer';
            await aeo.save();
            console.log('✅ Updated AEO User: aeo-test@example.com');
        } else {
            console.log('✅ Created AEO User: aeo-test@example.com');
        }

        // 3. Assign AEO to LGA (assuming LGA ID 1 exists)
        // We'll try to find an LGA first to be safe
        const { Lga } = require('./src/models');
        const lga = await Lga.findOne({ where: { id: 1 } });
        
        if (lga) {
             const [assignment, createdAssign] = await UserLga.findOrCreate({
                where: { userId: aeo.id, lgaId: lga.id },
                defaults: {
                    assignedAt: new Date(),
                    assignedBy: 1, // System admin or similar
                    isCurrent: true
                }
            });
            if (createdAssign) {
                console.log(`✅ Assigned AEO to LGA: ${lga.name} (ID: ${lga.id})`);
            } else {
                console.log(`ℹ️ AEO already assigned to LGA: ${lga.name} (ID: ${lga.id})`);
            }
        } else {
            console.warn('⚠️ LGA with ID 1 not found. Creating one for test...');
             const newLga = await Lga.create({ name: 'Test LGA', code: 'TEST', stateId: 1 });
             await UserLga.create({
                userId: aeo.id,
                lgaId: newLga.id,
                assignedAt: new Date(),
                assignedBy: 1,
                isCurrent: true
            });
             console.log(`✅ Created LGA and Assigned AEO to LGA: ${newLga.name} (ID: ${newLga.id})`);
        }


    } catch (error) {
        console.error('❌ Error preparing users:', error);
    } finally {
        // await sequelize.close();
        process.exit(0);
    }
}

prepareTestUsers();
