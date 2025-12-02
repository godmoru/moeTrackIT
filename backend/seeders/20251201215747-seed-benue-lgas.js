'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const benueLgas = [
      { name: 'Ado', state: 'Benue', code: 'BEN-ADO-001' },
      { name: 'Agatu', state: 'Benue', code: 'BEN-AGT-002' },
      { name: 'Apa', state: 'Benue', code: 'BEN-APA-003' },
      { name: 'Buruku', state: 'Benue', code: 'BEN-BUR-004' },
      { name: 'Gboko', state: 'Benue', code: 'BEN-GBK-005' },
      { name: 'Guma', state: 'Benue', code: 'BEN-GUM-006' },
      { name: 'Gwer East', state: 'Benue', code: 'BEN-GWE-007' },
      { name: 'Gwer West', state: 'Benue', code: 'BEN-GWW-008' },
      { name: 'Katsina-Ala', state: 'Benue', code: 'BEN-KAL-009' },
      { name: 'Konshisha', state: 'Benue', code: 'BEN-KON-010' },
      { name: 'Kwande', state: 'Benue', code: 'BEN-KWA-011' },
      { name: 'Logo', state: 'Benue', code: 'BEN-LOG-012' },
      { name: 'Makurdi', state: 'Benue', code: 'BEN-MAK-013' },
      { name: 'Obi', state: 'Benue', code: 'BEN-OBI-014' },
      { name: 'Ogbadibo', state: 'Benue', code: 'BEN-OGB-015' },
      { name: 'Ohimini', state: 'Benue', code: 'BEN-OHM-016' },
      { name: 'Oju', state: 'Benue', code: 'BEN-OJU-017' },
      { name: 'Okpokwu', state: 'Benue', code: 'BEN-OKP-018' },
      { name: 'Otukpo', state: 'Benue', code: 'BEN-OTU-019' },
      { name: 'Tarka', state: 'Benue', code: 'BEN-TAR-020' },
      { name: 'Ukum', state: 'Benue', code: 'BEN-UKU-021' },
      { name: 'Ushongo', state: 'Benue', code: 'BEN-USH-022' },
      { name: 'Vandeikya', state: 'Benue', code: 'BEN-VAN-023' },
    ].map(lga => ({
      ...lga,
      createdAt: now,
      updatedAt: now,
    }));

    await queryInterface.bulkInsert('Lgas', benueLgas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Lgas', { state: 'Benue' }, {});
  },
};