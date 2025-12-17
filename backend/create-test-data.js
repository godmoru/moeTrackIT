const { sequelize, User, Role, Lga, Entity, UserLga } = require('./src/models');
const bcrypt = require('bcryptjs');

async function createTestData() {
  try {
    console.log('Creating test data for AEO functionality...');

    // Create roles
    const roles = await Role.bulkCreate([
      { name: 'Super Admin', slug: 'super_admin', description: 'System admin', isSystem: true },
      { name: 'Area Education Officer', slug: 'area_education_officer', description: 'AEO', isSystem: true },
      { name: 'Principal', slug: 'principal', description: 'School principal', isSystem: true },
    ]);

    // Create LGAs
    const lgas = await Lga.bulkCreate([
      { name: 'Guma', code: 'GUMA', stateId: 1 },
      { name: 'Makurdi', code: 'MAK', stateId: 1 },
      { name: 'Otukpo', code: 'OTU', stateId: 1 },
    ]);

    // Create AEO user
    const aeoPassword = await bcrypt.hash('AEO@123', 10);
    const aeo = await User.create({
      name: 'John AEO',
      email: 'aeo@test.com',
      passwordHash: aeoPassword,
      role: 'area_education_officer',
      status: 'active',
    });

    // Assign AEO to Guma LGA
    await UserLga.create({
      userId: aeo.id,
      lgaId: lgas[0].id, // Guma
      assignedAt: new Date(),
      assignedBy: 1,
      isCurrent: true,
    });

    // Create entities in different LGAs
    const entities = await Entity.bulkCreate([
      {
        name: 'Guma Secondary School',
        contactPerson: 'Principal John',
        contactEmail: 'principal@guma.edu.ng',
        contactPhone: '08012345678',
        lgaId: lgas[0].id, // Guma - AEO should see this
        status: 'active',
      },
      {
        name: 'Makurdi High School',
        contactPerson: 'Principal Mary',
        contactEmail: 'principal@makurdi.edu.ng',
        contactPhone: '08023456789',
        lgaId: lgas[1].id, // Makurdi - AEO should NOT see this
        status: 'active',
      },
      {
        name: 'Otukpo Academy',
        contactPerson: 'Principal James',
        contactEmail: 'principal@otukpo.edu.ng',
        contactPhone: '08034567890',
        lgaId: lgas[2].id, // Otukpo - AEO should NOT see this
        status: 'active',
      },
    ]);

    console.log('Test data created successfully!');
    console.log('AEO User:', { email: 'aeo@test.com', password: 'AEO@123' });
    console.log('AEO assigned to LGA:', lgas[0].name);
    console.log('Entities created:', entities.map(e => ({ name: e.name, lga: e.lgaId })));

    await sequelize.close();
  } catch (error) {
    console.error('Error creating test data:', error);
    await sequelize.close();
  }
}

createTestData();
