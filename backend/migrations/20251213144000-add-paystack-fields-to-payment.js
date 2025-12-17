'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Payments');

    // Paystack transaction reference
    if (!tableInfo.paystackReference) {
      await queryInterface.addColumn('Payments', 'paystackReference', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Paystack access code for checkout
    if (!tableInfo.paystackAccessCode) {
      await queryInterface.addColumn('Payments', 'paystackAccessCode', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Payment channel (card, bank, ussd, etc.)
    if (!tableInfo.channel) {
      await queryInterface.addColumn('Payments', 'channel', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Payer email
    if (!tableInfo.payerEmail) {
      await queryInterface.addColumn('Payments', 'payerEmail', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Payer name
    if (!tableInfo.payerName) {
      await queryInterface.addColumn('Payments', 'payerName', {
        type: Sequelize.STRING,
        allowNull: true,
      });
    }

    // Payment gateway response metadata
    if (!tableInfo.gatewayResponse) {
      await queryInterface.addColumn('Payments', 'gatewayResponse', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    // Payment type: manual or online
    if (!tableInfo.paymentType) {
      await queryInterface.addColumn('Payments', 'paymentType', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: 'manual',
      });
    }

    // Add index for paystack reference lookups
    await queryInterface.addIndex('Payments', ['paystackReference'], {
      unique: true,
      where: { paystackReference: { [Sequelize.Op.ne]: null } },
    }).catch(() => {
      // Index might already exist
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Payments', 'paystackReference');
    await queryInterface.removeColumn('Payments', 'paystackAccessCode');
    await queryInterface.removeColumn('Payments', 'channel');
    await queryInterface.removeColumn('Payments', 'payerEmail');
    await queryInterface.removeColumn('Payments', 'payerName');
    await queryInterface.removeColumn('Payments', 'gatewayResponse');
    await queryInterface.removeColumn('Payments', 'paymentType');
  },
};
