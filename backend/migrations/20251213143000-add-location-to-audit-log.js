'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('AuditLogs');

    if (!tableInfo.country) {
      await queryInterface.addColumn('AuditLogs', 'country', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.region) {
      await queryInterface.addColumn('AuditLogs', 'region', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.city) {
      await queryInterface.addColumn('AuditLogs', 'city', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.latitude) {
      await queryInterface.addColumn('AuditLogs', 'latitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }

    if (!tableInfo.longitude) {
      await queryInterface.addColumn('AuditLogs', 'longitude', {
        type: Sequelize.FLOAT,
        allowNull: true,
      });
    }

    if (!tableInfo.timezone) {
      await queryInterface.addColumn('AuditLogs', 'timezone', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    if (!tableInfo.isp) {
      await queryInterface.addColumn('AuditLogs', 'isp', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('AuditLogs', 'country');
    await queryInterface.removeColumn('AuditLogs', 'region');
    await queryInterface.removeColumn('AuditLogs', 'city');
    await queryInterface.removeColumn('AuditLogs', 'latitude');
    await queryInterface.removeColumn('AuditLogs', 'longitude');
    await queryInterface.removeColumn('AuditLogs', 'timezone');
    await queryInterface.removeColumn('AuditLogs', 'isp');
  },
};
