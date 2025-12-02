'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const [typeRows] = await queryInterface.sequelize.query(
      "SELECT id, code FROM \"EntityTypes\" WHERE code IN ('SEC','PRI')"
    );
    const [ownRows] = await queryInterface.sequelize.query(
      "SELECT id, name FROM \"EntityOwnerships\" WHERE name IN ('Public','Private')"
    );

    const secType = typeRows.find((t) => t.code === 'SEC');
    const priType = typeRows.find((t) => t.code === 'PRI');
    const publicOwn = ownRows.find((o) => o.name === 'Public');
    const privateOwn = ownRows.find((o) => o.name === 'Private');

    await queryInterface.bulkInsert(
      'Entities',
      [
        {
          name: 'Makurdi Government Secondary School',
          entityTypeId: secType ? secType.id : null,
          type: 'school',
          subType: 'secondary',
          ownership: 'public',
          entityOwnershipId: publicOwn ? publicOwn.id : null,
          state: 'Benue',
          lga: 'Makurdi',
          contactPerson: 'Principal Makurdi GSS',
          contactPhone: '08030000001',
          contactEmail: 'principal.makgss@example.com',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
        {
          name: 'Gboko Star Academy',
          entityTypeId: secType ? secType.id : null,
          type: 'school',
          subType: 'secondary',
          ownership: 'private',
          entityOwnershipId: privateOwn ? privateOwn.id : null,
          state: 'Benue',
          lga: 'Gboko',
          contactPerson: 'Director Gboko Star',
          contactPhone: '08030000002',
          contactEmail: 'info@gbokostaracademy.example.com',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        },
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete(
      'Entities',
      { name: ['Makurdi Government Secondary School', 'Gboko Star Academy'] },
      {}
    );
  },
};
